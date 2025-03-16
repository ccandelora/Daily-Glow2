const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create a simple splash screen SVG (square this time)
const width = 1242; // Standard splash screen width for iOS
const height = 1242; // Making it square
const splashSvg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="black"/>
  <text x="50%" y="50%" font-family="Arial" font-size="72" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">Daily Glow</text>
</svg>
`;

const splashSvgPath = path.join(__dirname, '..', 'splash-square.svg');
const splashPngPath = path.join(__dirname, '..', 'splash-square.png');

// Save the SVG
fs.writeFileSync(splashSvgPath, splashSvg);
console.log(`Generated splash SVG at ${splashSvgPath}`);

// Convert to PNG
sharp(splashSvgPath)
  .resize(1242, 1242)
  .png()
  .toFile(splashPngPath)
  .then(() => {
    console.log(`Converted splash SVG to PNG at ${splashPngPath}`);
  })
  .catch(err => {
    console.error('Error converting splash SVG to PNG:', err);
  }); 