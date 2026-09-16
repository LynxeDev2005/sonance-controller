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

  // Downgrade swift-tools-version from 6.2 to 6.0 for Xcode compatibility
  content = content.replace('// swift-tools-version: 6.2', '// swift-tools-version: 6.0');

  // Remove Swift 6.2 exclusive upcoming features that fail compilation on Swift 6.0 / 6.1
  content = content.replace('.enableUpcomingFeature("NonisolatedNonsendingByDefault"),', '// .enableUpcomingFeature("NonisolatedNonsendingByDefault"),');
  content = content.replace('.enableUpcomingFeature("InferIsolatedConformances"),', '// .enableUpcomingFeature("InferIsolatedConformances"),');

  fs.writeFileSync(packageSwiftPath, content, 'utf8');
  console.log('✓ Successfully patched expo-modules-jsi/apple/Package.swift');
} else {
  console.log('expo-modules-jsi/apple/Package.swift not found.');
}

// 2. Patch build-xcframework.sh in expo-modules-jsi
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

  // Add unsigned flags and disable script sandboxing inside nested xcodebuild
  if (!scriptContent.includes('CODE_SIGNING_ALLOWED=NO')) {
    scriptContent = scriptContent.replace(
      'CLANG_COVERAGE_MAPPING=NO \\',
      'CLANG_COVERAGE_MAPPING=NO \\\n    CODE_SIGNING_ALLOWED=NO \\\n    CODE_SIGNING_REQUIRED=NO \\\n    ENABLE_USER_SCRIPT_SANDBOXING=NO \\\n    SWIFT_TREAT_WARNINGS_AS_ERRORS=NO \\'
    );
    // Remove -quiet so we can see output if something fails
    scriptContent = scriptContent.replace('-quiet \\\n', '');

    fs.writeFileSync(buildScriptPath, scriptContent, 'utf8');
    console.log('✓ Successfully patched expo-modules-jsi/apple/scripts/build-xcframework.sh');
  }
}
