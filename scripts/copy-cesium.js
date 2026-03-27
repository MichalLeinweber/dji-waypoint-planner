/**
 * copy-cesium.js
 * Copies Cesium static assets (Workers, Assets, ThirdParty, Widgets)
 * from node_modules into public/cesium/ so they are served at /cesium/.
 *
 * Runs automatically via the "postinstall" npm script, which means
 * Vercel will execute it after every `npm install` before the build.
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'cesium', 'Build', 'Cesium');
const dest = path.join(__dirname, '..', 'public', 'cesium');

if (!fs.existsSync(src)) {
  console.log('Cesium not found in node_modules, skipping copy.');
  process.exit(0);
}

/** Recursively copies a directory from `from` to `to`. */
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const item of fs.readdirSync(from)) {
    const srcPath = path.join(from, item);
    const destPath = path.join(to, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying Cesium assets to public/cesium/...');
copyDir(src, dest);
console.log('Done.');
