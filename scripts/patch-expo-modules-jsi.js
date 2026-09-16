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

  // Relax strict error exit in the wrapper script
  scriptContent = scriptContent.replace('set -euo pipefail', 'set -o pipefail');

  // Handle missing or dangling header files in compute_hash safely
  scriptContent = scriptContent.replace(
    'cat "$file"',
    'cat "$file" 2>/dev/null || true'
  );

  // Add build flags for unsigned build in nested xcodebuild
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
