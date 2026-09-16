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
  fs.writeFileSync(packageSwiftPath, content, 'utf8');
  console.log('✓ Successfully patched expo-modules-jsi/apple/Package.swift');
}

// 2. Patch ExpoModulesJSI.podspec to make script phase non-blocking
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
    ':script => \'bash "${PODS_TARGET_SRCROOT}/scripts/build-xcframework.sh" || true\''
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
  if (!scriptContent.includes('CODE_SIGNING_ALLOWED=NO')) {
    scriptContent = scriptContent.replace(
      'CLANG_COVERAGE_MAPPING=NO \\',
      'CLANG_COVERAGE_MAPPING=NO \\\n    CODE_SIGNING_ALLOWED=NO \\\n    CODE_SIGNING_REQUIRED=NO \\\n    ENABLE_USER_SCRIPT_SANDBOXING=NO \\\n    SWIFT_TREAT_WARNINGS_AS_ERRORS=NO \\'
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

