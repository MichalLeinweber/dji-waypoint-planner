/**
 * copy-cesium.js
 * Copies entire Build/Cesium/ from node_modules into public/cesium/
 * so Cesium Workers, Assets, ThirdParty and Widgets are served at /cesium/.
 *
 * Runs automatically via "postinstall" in package.json,
 * which means Vercel executes it after npm install before the build.
 */

const fs = require('fs');
const path = require('path');

const src = path.join(
  __dirname, '..',
  'node_modules', 'cesium', 'Build', 'Cesium'
);
const dest = path.join(__dirname, '..', 'public', 'cesium');

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const item of fs.readdirSync(from)) {
    const s = path.join(from, item);
    const d = path.join(to, item);
    fs.statSync(s).isDirectory()
      ? copyDir(s, d)
      : fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(src)) {
  console.log('Cesium not built, skipping');
  process.exit(0);
}

console.log('Copying Cesium assets...');
copyDir(src, dest);
console.log('Done!');
