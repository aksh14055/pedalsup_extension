const fs = require('fs');
const path = require('path');

const filesToCopy = [
  'manifest.json',
  'background.js',
  'icon16.png',
  'icon48.png',
  'icon128.png'
];

const distDir = path.join(__dirname, 'dist');

for (const file of filesToCopy) {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file}`);
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
  // postbuild.js


fs.copyFileSync(
  path.join(__dirname, "contentScript.js"),
  path.join(__dirname, "dist", "contentScript.js")
);

console.log("✅ contentScript.js copied to dist/");

}
