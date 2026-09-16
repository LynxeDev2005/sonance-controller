const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('[Patch] Running Swift & ExpoModulesJSI compatibility patches...');

// 1. Patch Package.swift in expo-modules-jsi
const packageSwiftPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'Package.swift'
);

if (fs.existsSync(packageSwiftPath)) {
  let content = fs.readFileSync(packageSwiftPath, 'utf8');
  content = content.replace('// swift-tools-version: 6.2', '// swift-tools-version: 6.0');
  content = content.replace(
    '.enableUpcomingFeature("NonisolatedNonsendingByDefault"),',
    '// .enableUpcomingFeature("NonisolatedNonsendingByDefault"),'
  );
  content = content.replace(
    '.enableUpcomingFeature("InferIsolatedConformances"),',
    '// .enableUpcomingFeature("InferIsolatedConformances"),'
  );
  content = content.replace(
    'swiftLanguageModes: [.v6]',
    'swiftLanguageModes: [.v5]'
  );
  content = content.replace(
    '"-strict-concurrency=minimal",\n          ',
    ''
  );
  fs.writeFileSync(packageSwiftPath, content, 'utf8');
  console.log('✓ Successfully patched expo-modules-jsi/apple/Package.swift');
}

// 2. Patch ExpoModulesJSI.podspec
const podspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'ExpoModulesJSI.podspec'
);

if (fs.existsSync(podspecPath)) {
  let content = fs.readFileSync(podspecPath, 'utf8');
  content = content.replace(
    ':script => \'"${PODS_TARGET_SRCROOT}/scripts/build-xcframework.sh"\'',
    ':script => \'bash "${PODS_TARGET_SRCROOT}/scripts/build-xcframework.sh"\''
  );
  fs.writeFileSync(podspecPath, content, 'utf8');
  console.log('✓ Successfully patched expo-modules-jsi/apple/ExpoModulesJSI.podspec');
}

// 3. Patch build-xcframework.sh in expo-modules-jsi
const buildScriptPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'scripts',
  'build-xcframework.sh'
);

if (fs.existsSync(buildScriptPath)) {
  let scriptContent = fs.readFileSync(buildScriptPath, 'utf8');
  scriptContent = scriptContent.replace('set -euo pipefail', 'set -o pipefail');
  scriptContent = scriptContent.replace(
    'cat "$file"',
    'cat "$file" 2>/dev/null || true'
  );
  scriptContent = scriptContent.replace(
    'local env_args=(PATH="$PATH" HOME="$HOME" PODS_ROOT="$PODS_ROOT" RN_ROOT="$RN_ROOT")',
    'local dev_dir="${DEVELOPER_DIR:-$(xcode-select -p 2>/dev/null || true)}"\n  local env_args=(PATH="$PATH" HOME="$HOME" PODS_ROOT="$PODS_ROOT" RN_ROOT="$RN_ROOT" DEVELOPER_DIR="$dev_dir" TMPDIR="${TMPDIR:-/tmp}" USER="${USER:-runner}")'
  );
  if (!scriptContent.includes('CODE_SIGNING_ALLOWED=NO')) {
    scriptContent = scriptContent.replace(
      'CLANG_COVERAGE_MAPPING=NO \\',
      'CLANG_COVERAGE_MAPPING=NO \\\n    CODE_SIGNING_ALLOWED=NO \\\n    CODE_SIGNING_REQUIRED=NO \\\n    ENABLE_USER_SCRIPT_SANDBOXING=NO \\\n    SWIFT_STRICT_CONCURRENCY=off \\\n    SWIFT_TREAT_WARNINGS_AS_ERRORS=NO \\'
    );
    scriptContent = scriptContent.replace('-quiet \\\n', '');
  }

  // Ensure built framework is automatically synced to all intermediate and pod locations
  if (!scriptContent.includes('SYNC_DESTINATIONS')) {
    const syncCode = `
  write_xcframework_plist "$XCFRAMEWORK_PATH" "$PACKAGE_NAME"

  # Auto-sync built framework to all CocoaPods intermediate and search directories
  for dest in \\
    "\${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/ExpoModulesJSI" \\
    "\${CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/ExpoModulesJSI" \\
    "\${CONFIGURATION_BUILD_DIR}/ExpoModulesJSI" \\
    "\${PODS_ROOT}/ExpoModulesJSI/ExpoModulesJSI.xcframework" \\
    "\${PODS_ROOT}/ExpoModulesJSI/Products/ExpoModulesJSI.xcframework"; do
    if [[ -n "$dest" ]]; then
      mkdir -p "$dest"
      cp -R "\${XCFRAMEWORK_PATH}/ios-arm64/ExpoModulesJSI.framework" "$dest/" 2>/dev/null || true
      cp -R "\${XCFRAMEWORK_PATH}/"* "$dest/" 2>/dev/null || true
    fi
  done
`;
    scriptContent = scriptContent.replace(
      'write_xcframework_plist "$XCFRAMEWORK_PATH" "$PACKAGE_NAME"',
      syncCode
    );
  }

  fs.writeFileSync(buildScriptPath, scriptContent, 'utf8');
  console.log('✓ Successfully patched expo-modules-jsi/apple/scripts/build-xcframework.sh');
}

// 4. Patch KeepAwakeModule.swift for Swift 6 concurrency / isolation compatibility
const keepAwakePaths = [
  path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', 'expo-keep-awake', 'ios', 'KeepAwakeModule.swift'),
  path.join(__dirname, '..', 'node_modules', 'expo-keep-awake', 'ios', 'KeepAwakeModule.swift'),
];

keepAwakePaths.forEach((keepAwakePath) => {
  if (fs.existsSync(keepAwakePath)) {
    const keepAwakeContent = `// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

public final class KeepAwakeModule: Module, @unchecked Sendable {
  private var activeTags = Set<String>()

  public func definition() -> ModuleDefinition {
    Name("ExpoKeepAwake")

    AsyncFunction("activate") { (tag: String) -> Bool in
      if self.activeTags.isEmpty {
        setActivated(true)
      }
      self.activeTags.insert(tag)
      return true
    }

    AsyncFunction("deactivate") { (tag: String) -> Bool in
      self.activeTags.remove(tag)
      if self.activeTags.isEmpty {
        setActivated(false)
      }
      return true
    }

    AsyncFunction("isActivated") { () -> Bool in
      #if os(iOS) || os(tvOS)
      return DispatchQueue.main.sync {
        return UIApplication.shared.isIdleTimerDisabled
      }
      #elseif os(macOS)
      return false
      #endif
    }

    OnAppEntersForeground {
      if !self.activeTags.isEmpty {
        setActivated(true)
      }
    }

    OnAppEntersBackground {
      if !self.activeTags.isEmpty {
        setActivated(false)
      }
    }
  }
}

private func setActivated(_ activated: Bool) {
  #if os(iOS) || os(tvOS)
  DispatchQueue.main.async {
    UIApplication.shared.isIdleTimerDisabled = activated
  }
  #endif
}
`;
    fs.writeFileSync(keepAwakePath, keepAwakeContent, 'utf8');
    console.log(`✓ Successfully patched ${keepAwakePath}`);
  }
});

// 5. Patch RuntimeScheduler.h for Swift 6.2 C++ interoperability constructor annotations
const runtimeSchedulerPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'Sources',
  'ExpoModulesJSI-Cxx',
  'include',
  'RuntimeScheduler.h'
);

if (fs.existsSync(runtimeSchedulerPath)) {
  let content = fs.readFileSync(runtimeSchedulerPath, 'utf8');
  content = content.replace(
    /SWIFT_RETURNS_RETAINED\s+RuntimeScheduler\(/g,
    'RuntimeScheduler('
  );
  fs.writeFileSync(runtimeSchedulerPath, content, 'utf8');
  console.log('✓ Successfully patched RuntimeScheduler.h for Swift 6.2 constructor interoperability');
}

// 6. Patch JavaScriptRuntime.swift pointer isolation in expo-modules-jsi
const jsRuntimePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'Sources',
  'ExpoModulesJSI',
  'Runtime',
  'JavaScriptRuntime.swift'
);

if (fs.existsSync(jsRuntimePath)) {
  let content = fs.readFileSync(jsRuntimePath, 'utf8');

  // Patch getter resultPtr
  content = content.replace(
    /func getter\(\s*context: UnsafeMutableRawPointer,\s*propertyName: UnsafePointer<CChar>,\s*resultPtr: UnsafeMutablePointer<facebook\.jsi\.Value>\s*\) -> Bool \{\s*let propertyName = String\(cString: propertyName\)/g,
    'func getter(\n      context: UnsafeMutableRawPointer,\n      propertyName: UnsafePointer<CChar>,\n      resultPtr: UnsafeMutablePointer<facebook.jsi.Value>\n    ) -> Bool {\n      let propertyName = String(cString: propertyName)\n      nonisolated(unsafe) let resultPtr = resultPtr'
  );

  // Patch setter valuePointer
  content = content.replace(
    /func setter\(\s*context: UnsafeMutableRawPointer, propertyName: UnsafePointer<CChar>, valuePointer: UnsafeMutableRawPointer\s*\) -> Bool \{\s*let propertyName = String\(cString: propertyName\)/g,
    'func setter(\n      context: UnsafeMutableRawPointer, propertyName: UnsafePointer<CChar>, valuePointer: UnsafeMutableRawPointer\n    ) -> Bool {\n      let propertyName = String(cString: propertyName)\n      nonisolated(unsafe) let valuePointer = valuePointer'
  );

  // Patch createFunctionClosure (HostFunctionContext)
  content = content.replace(
    'return withGuaranteedContext(context) { (context: HostFunctionContext, runtime) in',
    'nonisolated(unsafe) let thisPtr = thisPtr\n    nonisolated(unsafe) let argumentsPtr = argumentsPtr\n    nonisolated(unsafe) let resultPtr = resultPtr\n\n    return withGuaranteedContext(context) { (context: HostFunctionContext, runtime) in'
  );

  // Patch createFunctionClosure (UnownedThisHostFunctionContext)
  content = content.replace(
    'return withGuaranteedContext(context) { (context: UnownedThisHostFunctionContext, runtime) in',
    'nonisolated(unsafe) let thisPtr = thisPtr\n    nonisolated(unsafe) let argumentsPtr = argumentsPtr\n    nonisolated(unsafe) let resultPtr = resultPtr\n\n    return withGuaranteedContext(context) { (context: UnownedThisHostFunctionContext, runtime) in'
  );

  fs.writeFileSync(jsRuntimePath, content, 'utf8');
  console.log('✓ Successfully patched JavaScriptRuntime.swift pointer isolation');
}

// 7. Patch ExpoModulesCore.swift for Swift 5 / 6 syntax compatibility
const expoModulesCoreSwiftPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'ios',
  'ExpoModulesCore.swift'
);

if (fs.existsSync(expoModulesCoreSwiftPath)) {
  let content = fs.readFileSync(expoModulesCoreSwiftPath, 'utf8');
  content = content.replace('@_exported public import ExpoModulesJSI', '@_exported import ExpoModulesJSI');
  fs.writeFileSync(expoModulesCoreSwiftPath, content, 'utf8');
  console.log('✓ Successfully patched ExpoModulesCore.swift');
}

// 8. Patch .swiftinterface files and remove private interfaces across prebuilds and Pods
function patchSwiftInterfacesInDir(dir) {
  let count = 0;
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Strip private and package swiftinterfaces that reference internal/unresolved modules
        if (entry.name.endsWith('.private.swiftinterface') || entry.name.endsWith('.package.swiftinterface')) {
          try {
            fs.unlinkSync(fullPath);
            count++;
          } catch {}
          continue;
        }

        if (entry.name.endsWith('.swiftinterface')) {
          let content = fs.readFileSync(fullPath, 'utf8');
          const original = content;
          content = content.replace(/Apple Swift version 6\.[3-9]\.[0-9.]+/g, 'Apple Swift version 6.0');
          content = content.replace(/-interface-compiler-version 6\.[3-9]\.[0-9.]+/g, '-interface-compiler-version 6.0');
          if (content !== original) {
            fs.writeFileSync(fullPath, content, 'utf8');
            count++;
          }
        }
      }
    }
  }
  walk(dir);
  return count;
}

function patchTarGz(tarPath) {
  if (!fs.existsSync(tarPath)) return;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patch-xcfw-'));
  try {
    execSync(`tar -xzf "${tarPath}" -C "${tempDir}"`);
    const patchedCount = patchSwiftInterfacesInDir(tempDir);
    if (patchedCount > 0) {
      const topItems = fs.readdirSync(tempDir);
      const itemsArg = topItems.map((item) => `"${item}"`).join(' ');
      execSync(`tar -czf "${tarPath}" -C "${tempDir}" ${itemsArg}`);
      console.log(`✓ Repacked ${path.basename(tarPath)} (${patchedCount} swiftinterface files updated to Swift 6.0)`);
    }
  } catch (err) {
    console.warn(`  Warning: Could not patch tar ${tarPath}:`, err.message);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

// Find all prebuild tar.gz files in node_modules and patch them
function patchAllPrebuilds(rootDir) {
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.git') continue;
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.tar.gz') && fullPath.includes('prebuilds')) {
        patchTarGz(fullPath);
      }
    }
  }
  walk(rootDir);
}

const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesDir)) {
  patchAllPrebuilds(nodeModulesDir);
}

// 9. Patch Target Support Files xcconfig files directly
function patchTargetSupportXcconfigs(podsDir) {
  const targetSupportDir = path.join(podsDir, 'Target Support Files');
  if (!fs.existsSync(targetSupportDir)) return;

  const extraFw = [
    '${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/ExpoModulesCore',
    '${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/ExpoModulesJSI',
    '${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesJSI',
    '${PODS_ROOT}/ExpoModulesJSI/ExpoModulesJSI.xcframework/ios-arm64',
    '${PODS_ROOT}/ExpoModulesJSI/Products/ExpoModulesJSI.xcframework/ios-arm64',
    '${PODS_ROOT}/../../node_modules/expo-modules-jsi/apple/Products/ExpoModulesJSI.xcframework/ios-arm64'
  ];
  const fwFlags = extraFw.map((p) => `"${p}"`).join(' ');

  const extraIncludes = [
    '${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore',
    '${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesJSI',
    '${PODS_ROOT}/Headers/Public/ExpoModulesCore',
    '${PODS_ROOT}/Headers/Public/ExpoModulesJSI'
  ];
  const incFlags = extraIncludes.map((p) => `"${p}"`).join(' ');

  let patched = 0;
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.xcconfig')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        if (!content.includes('ExpoModulesJSI.xcframework')) {
          content += `\nFRAMEWORK_SEARCH_PATHS = $(inherited) ${fwFlags}\n`;
          content += `SWIFT_INCLUDE_PATHS = $(inherited) ${incFlags}\n`;
          content += `SWIFT_VERSION = 5.0\n`;
          content += `SWIFT_STRICT_CONCURRENCY = off\n`;
          content += `ENABLE_USER_SCRIPT_SANDBOXING = NO\n`;
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          patched++;
        }
      }
    }
  }
  walk(targetSupportDir);
  if (patched > 0) {
    console.log(`✓ Injected search paths into ${patched} Target Support xcconfig files`);
  }
}

// Also patch any existing ios/Pods directory if present
const podsDir = path.join(__dirname, '..', 'ios', 'Pods');
if (fs.existsSync(podsDir)) {
  const podsPatched = patchSwiftInterfacesInDir(podsDir);
  if (podsPatched > 0) {
    console.log(`✓ Patched ${podsPatched} swiftinterface files in ios/Pods`);
  }
  patchTargetSupportXcconfigs(podsDir);
}
