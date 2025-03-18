const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '..', 'square-icon.svg');
const pngPath = path.join(__dirname, '..', 'icon-square.png');

// Convert SVG to PNG
sharp(svgPath)
  .resize(1024, 1024) // Ensure it's 1024x1024
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log(`Converted SVG to PNG at ${pngPath}`);
  })
  .catch(err => {
    console.error('Error converting SVG to PNG:', err);
  }); 