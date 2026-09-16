const fs = require('fs');
const path = require('path');

const plistPath = path.join(__dirname, '..', 'ios', 'PCControl', 'Expo.plist');
const supportingPlistPath = path.join(__dirname, '..', 'ios', 'PCControl', 'Supporting', 'Expo.plist');

const targetPath = fs.existsSync(plistPath) ? plistPath : (fs.existsSync(supportingPlistPath) ? supportingPlistPath : null);

if (targetPath) {
  console.log(`Found Expo.plist at: ${targetPath}`);
} else {
  console.log('Expo.plist not found, skipping patch.');
}
