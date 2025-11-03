const fs = require('fs-extra');
const path = require('path');

const buildDir = path.join(__dirname, '../dist');
const targetDir = path.join(__dirname, '../../server/public');

console.log('📦 Copying build files to server...');
console.log(`Source: ${buildDir}`);
console.log(`Target: ${targetDir}`);

try {
  // Check if build directory exists
  if (!fs.existsSync(buildDir)) {
    console.error('✗ Build directory not found! Run "npm run build" first.');
    process.exit(1);
  }

  // Remove old build if exists
  if (fs.existsSync(targetDir)) {
    fs.removeSync(targetDir);
    console.log('✓ Removed old build');
  }

  // Copy new build
  fs.copySync(buildDir, targetDir);
  console.log('✓ Build files copied successfully!');
  console.log(`✓ Frontend build is ready at: ${targetDir}`);
  
  // List copied files
  const files = fs.readdirSync(targetDir);
  console.log(`✓ Copied ${files.length} items:`, files.join(', '));
} catch (err) {
  console.error('✗ Error copying build files:', err);
  process.exit(1);
}
