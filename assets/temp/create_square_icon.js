// Script to create a square icon
const fs = require('fs');
const path = require('path');

// Create a simple JSON file that represents a square SVG
const svgContent = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#000000"/>
  <text x="512" y="512" font-family="Arial" font-size="100" text-anchor="middle" fill="white">Daily Glow</text>
</svg>
`;

// Write the SVG to a file
fs.writeFileSync(path.join(__dirname, '../square-icon.svg'), svgContent);

console.log('Generated square icon at assets/square-icon.svg'); 