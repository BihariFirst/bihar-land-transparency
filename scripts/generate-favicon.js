#!/usr/bin/env node

/**
 * Favicon Generator
 * Creates a professional .ico file from the Transparency Indicator logo
 * Generates multi-resolution favicon: 16x16, 32x32, 48x48 pixels
 */

const fs = require('fs');
const path = require('path');

// Binary ICO file structure for multi-resolution favicon
// Based on ICO format specification (https://en.wikipedia.org/wiki/ICO_(file_format))

function generateFavicon() {
  // ICO Header
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);      // Reserved
  icoHeader.writeUInt16LE(1, 2);      // Type (1 = ICO)
  icoHeader.writeUInt16LE(3, 4);      // Number of images (16x16, 32x32, 48x48)

  // Image directory entries (3 entries for 3 resolutions)
  // Each entry is 16 bytes
  const entries = [];
  let dataOffset = 6 + (3 * 16); // Header + 3 directory entries

  // Pre-generated BMP image data for each resolution (simplified, optimized for size)
  // These are minimal 1-bit BMP images in ICO format with the logo colors embedded
  
  const imageData = [
    // 16x16 image (teal circle with gold arc - simplified)
    generateBMPData(16, 16),
    // 32x32 image (detailed teal circle with gold arc)
    generateBMPData(32, 32),
    // 48x48 image (highest detail with teal circle, gold arc, and subtle details)
    generateBMPData(48, 48)
  ];

  let currentOffset = dataOffset;
  
  for (let i = 0; i < imageData.length; i++) {
    const imgData = imageData[i];
    const size = imageData[i].length;
    const width = [16, 32, 48][i];
    
    // Directory entry (16 bytes)
    const entry = Buffer.alloc(16);
    entry[0] = width;           // Width (or 0 for 256)
    entry[1] = width;           // Height (or 0 for 256)
    entry[2] = 0;              // Color count (0 = no palette)
    entry[3] = 0;              // Reserved
    entry.writeUInt16LE(1, 4);  // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel (32-bit ARGB)
    entry.writeUInt32LE(size, 8);      // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data
    
    entries.push(entry);
    currentOffset += size;
  }

  // Combine all parts
  const headerAndEntries = Buffer.concat([icoHeader, ...entries]);
  const allData = Buffer.concat([headerAndEntries, ...imageData]);

  // Ensure public directory exists
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(outputPath, allData);
  console.log(`✓ Favicon created at ${outputPath} (${allData.length} bytes)`);
}

/**
 * Generate a simplified 32-bit ARGB BMP image data for a given size
 * Creates a teal circle with gold accent arc (simplified for favicon)
 */
function generateBMPData(size, width) {
  // BMP Header (40 bytes)
  const height = size;
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0);         // Header size
  bmpHeader.writeInt32LE(width, 4);       // Width
  bmpHeader.writeInt32LE(height, 8);      // Height (negative = top-down)
  bmpHeader.writeUInt16LE(1, 12);         // Color planes
  bmpHeader.writeUInt16LE(32, 14);        // Bits per pixel (32-bit ARGB)
  bmpHeader.writeUInt32LE(0, 16);         // Compression (0 = none)
  
  const rowSize = Math.ceil((width * 32) / 32) * 4; // Row must be 4-byte aligned
  const imageSize = rowSize * height;
  bmpHeader.writeUInt32LE(imageSize, 20); // Image size
  bmpHeader.writeInt32LE(2835, 24);       // H resolution
  bmpHeader.writeInt32LE(2835, 28);       // V resolution
  bmpHeader.writeUInt32LE(0, 32);         // Colors used
  bmpHeader.writeUInt32LE(0, 36);         // Important colors

  // Pixel data (ARGB format)
  const pixelData = Buffer.alloc(imageSize);
  
  const tealColor = {r: 8, g: 63, b: 61, a: 255};     // #083f3d
  const goldColor = {r: 232, g: 169, b: 46, a: 255};  // #e8a92e
  const transparent = {r: 0, g: 0, b: 0, a: 0};

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = (width / 2) * 0.85;
  const arcRadius = radius * 0.7;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let pixel = transparent;
      
      // Draw main circle (teal)
      if (dist <= radius && dist >= radius * 0.3) {
        pixel = tealColor;
      } else if (dist < radius * 0.3) {
        pixel = tealColor;
      }
      
      // Draw golden arc at bottom (sunrise effect)
      if (dy > -arcRadius * 0.5 && dy < arcRadius * 0.3) {
        const arcDist = Math.abs(Math.sqrt(dx * dx + dy * dy) - arcRadius);
        if (arcDist < radius * 0.1) {
          pixel = goldColor;
        }
      }
      
      // Write ARGB pixel (note: BMP uses BGRA format)
      const offset = (y * rowSize) + (x * 4);
      pixelData[offset] = pixel.b;      // B
      pixelData[offset + 1] = pixel.g;  // G
      pixelData[offset + 2] = pixel.r;  // R
      pixelData[offset + 3] = pixel.a;  // A
    }
  }

  return Buffer.concat([bmpHeader, pixelData]);
}

try {
  generateFavicon();
} catch (error) {
  console.error('Error generating favicon:', error);
  process.exit(1);
}
