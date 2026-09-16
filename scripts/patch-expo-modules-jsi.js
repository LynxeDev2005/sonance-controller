const fs = require('fs');
const path = require('path');

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
  if (!content.includes('"-strict-concurrency=minimal"')) {
    content = content.replace(
      '"-no-verify-emitted-module-interface",',
      '"-no-verify-emitted-module-interface",\n          "-strict-concurrency=minimal",'
    );
  }
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
      'CLANG_COVERAGE_MAPPING=NO \\\n    CODE_SIGNING_ALLOWED=NO \\\n    CODE_SIGNING_REQUIRED=NO \\\n    ENABLE_USER_SCRIPT_SANDBOXING=NO \\\n    SWIFT_STRICT_CONCURRENCY=off \\\n    OTHER_SWIFT_FLAGS="-no-warn-concurrency -strict-concurrency=minimal" \\\n    SWIFT_TREAT_WARNINGS_AS_ERRORS=NO \\'
    );
    scriptContent = scriptContent.replace('-quiet \\\n', '');
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

public final class KeepAwakeModule: Module {
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
      if #available(iOS 13.0, tvOS 13.0, *) {
        return MainActor.assumeIsolated {
          UIApplication.shared.isIdleTimerDisabled
        }
      } else {
        return UIApplication.shared.isIdleTimerDisabled
      }
      #else
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



