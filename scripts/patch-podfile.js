const fs = require('fs');
const path = require('path');

const podfilePath = path.join(__dirname, '..', 'ios', 'Podfile');

if (fs.existsSync(podfilePath)) {
  let content = fs.readFileSync(podfilePath, 'utf8');

  // Inject post_install settings if not already present
  const swiftSettings = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'off'
        config.build_settings['SWIFT_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
      end
    end
`;

  if (!content.includes('SWIFT_STRICT_CONCURRENCY')) {
    if (content.includes('post_install do |installer|')) {
      content = content.replace(
        'post_install do |installer|',
        `post_install do |installer|\n${swiftSettings}`
      );
      fs.writeFileSync(podfilePath, content, 'utf8');
      console.log('Successfully patched ios/Podfile with Swift build settings.');
    } else {
      content += `\npost_install do |installer|\n${swiftSettings}\nend\n`;
      fs.writeFileSync(podfilePath, content, 'utf8');
      console.log('Appended post_install hook to ios/Podfile.');
    }
  } else {
    console.log('ios/Podfile already patched.');
  }
} else {
  console.log('No ios/Podfile found to patch (will run after expo prebuild).');
}
