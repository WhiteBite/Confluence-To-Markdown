import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist-extension');

// Ensure dist exists
if (!existsSync(dist)) {
    mkdirSync(dist, { recursive: true });
}

// Copy and update manifest
const manifest = JSON.parse(readFileSync(join(root, 'src/manifest.json'), 'utf-8'));
writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

// Create icons directory
const iconsDir = join(dist, 'icons');
if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
}

// Generate PNG icons using canvas-like approach (simple colored squares as placeholder)
// In production, replace these with proper icons
function createPngIcon(size) {
    // Simple PNG header + IDAT for a blue square
    // This is a minimal valid PNG - replace with real icons!
    const png = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, size, // width
        0x00, 0x00, 0x00, size, // height
        0x08, 0x02, // bit depth, color type (RGB)
        0x00, 0x00, 0x00, // compression, filter, interlace
        0x00, 0x00, 0x00, 0x00, // CRC placeholder
        0x00, 0x00, 0x00, 0x00, // IDAT length placeholder
        0x49, 0x44, 0x41, 0x54, // IDAT
        // Minimal compressed data for blue pixels
        0x78, 0x9C, 0x62, 0x60, 0x60, 0xF8, 0x0F, 0x00, 0x01, 0x01, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x00, // CRC placeholder
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ]);
    return png;
}

// Create placeholder icons (these won't display correctly - need real PNGs)
// For now, create empty files so manifest doesn't error
const sizes = [16, 48, 128];
sizes.forEach(size => {
    const iconPath = join(iconsDir, `icon${size}.png`);
    // Write a 1x1 blue PNG as placeholder
    const bluePng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
    );
    writeFileSync(iconPath, bluePng);
});

console.log('✓ Manifest copied');
console.log('✓ Placeholder icons created (replace with real icons)');
console.log('');
console.log('Extension built to: dist-extension/');
console.log('');
console.log('To install in Chrome:');
console.log('1. Go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select the dist-extension folder');
