const fs = require('fs');
const path = require('path');
let png2icons = null;
try {
  png2icons = require('png2icons');
} catch (e) {
  // png2icons may not be installed in all environments (e.g. cloud build)
}

const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'build');
const publicDir = path.join(root, 'public');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// 1. Sync transparent logo if available
const transparentIconSource = path.join(publicDir, 'icons', '메케줄 아이콘(투명).png');
if (fs.existsSync(transparentIconSource)) {
  try {
    fs.copyFileSync(transparentIconSource, path.join(publicDir, 'app-logo-transparent.png'));
    fs.copyFileSync(transparentIconSource, path.join(publicDir, 'icon-transparent.png'));
  } catch (e) {}
}

// 2. Find suitable png icon for Windows .ico conversion
const candidatePngs = [
  path.join(publicDir, 'icons', '메케줄 앱 아이콘256.png'),
  path.join(publicDir, 'icons', '메케줄 아이콘(투명).png'),
  path.join(publicDir, 'icon.png'),
  path.join(publicDir, 'icons', '메케줄 앱 아이콘.png'),
];

let sourcePng = candidatePngs.find((p) => fs.existsSync(p));

if (sourcePng && png2icons) {
  try {
    const pngBuf = fs.readFileSync(sourcePng);
    // Create standard Windows ICO format (BMP-based) using HERMITE algorithm
    const icoBuf = png2icons.createICO(pngBuf, png2icons.HERMITE, 0, false);
    
    if (icoBuf) {
      fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuf);
      fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);
      fs.writeFileSync(path.join(buildDir, 'icon.png'), pngBuf);
      console.log('[prepare-build] Successfully generated Windows standard icon.ico');
    }
  } catch (err) {
    console.error('[prepare-build] Error creating icon.ico:', err);
  }
}

console.log('[prepare-build] Build assets preparation complete.');
