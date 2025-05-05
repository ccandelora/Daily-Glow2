const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_ICON = path.join(__dirname, 'assets/icon-square.png');
const OUTPUT_DIR = path.join(__dirname, 'ios/DailyGlow/Images.xcassets/AppIcon.appiconset');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define all required icon sizes for iOS
const iosIcons = [
  { name: 'Icon-App-20x20@1x.png', size: 20 },
  { name: 'Icon-App-20x20@2x.png', size: 40 },
  { name: 'Icon-App-20x20@3x.png', size: 60 },
  { name: 'Icon-App-29x29@1x.png', size: 29 },
  { name: 'Icon-App-29x29@2x.png', size: 58 },
  { name: 'Icon-App-29x29@3x.png', size: 87 },
  { name: 'Icon-App-40x40@1x.png', size: 40 },
  { name: 'Icon-App-40x40@2x.png', size: 80 },
  { name: 'Icon-App-40x40@3x.png', size: 120 },
  { name: 'Icon-App-60x60@2x.png', size: 120 },
  { name: 'Icon-App-60x60@3x.png', size: 180 },
  { name: 'Icon-App-76x76@1x.png', size: 76 },
  { name: 'Icon-App-76x76@2x.png', size: 152 },
  { name: 'Icon-App-83.5x83.5@2x.png', size: 167 },
  { name: 'ItunesArtwork@2x.png', size: 1024 }
];

// Generate each icon size
async function generateIcons() {
  try {
    console.log(`Generating iOS app icons from: ${SOURCE_ICON}`);
    
    for (const icon of iosIcons) {
      const outputPath = path.join(OUTPUT_DIR, icon.name);
      
      await sharp(SOURCE_ICON)
        .resize(icon.size, icon.size)
        .toFile(outputPath);
      
      console.log(`Generated: ${icon.name} (${icon.size}x${icon.size})`);
    }
    
    console.log('All iOS app icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 