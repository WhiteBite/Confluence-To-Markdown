#!/usr/bin/env node
/**
 * Fix ZIP files with paths too long for Windows Explorer (>260 chars).
 * 
 * ZERO DEPENDENCIES — just copy this file and run:
 *   node fix-zip.mjs <input.zip>
 * 
 * Requires: npm init -y && npm i fflate (one-time setup in any folder)
 * OR: run from the confluence-to-markdown project folder (has fflate)
 */

const input = process.argv[2];
if (!input) {
    console.log('Usage: node fix-zip.mjs <input.zip> [output.zip]');
    console.log('');
    console.log('Quick setup (run once in any folder):');
    console.log('  npm init -y && npm i fflate');
    console.log('  node fix-zip.mjs your-file.zip');
    process.exit(1);
}

const output = process.argv[3] || input.replace(/\.zip$/i, '_fixed.zip');
const MAX_PATH = 240;

async function main() {
    const fs = await import('fs');
    let fflate;
    try {
        fflate = await import('fflate');
    } catch {
        console.error('fflate not found. Run: npm init -y && npm i fflate');
        process.exit(1);
    }

    console.log(`Reading: ${input}`);
    const buf = fs.readFileSync(input);
    console.log(`Size: ${(buf.length / 1024 / 1024).toFixed(1)} MB`);

    let entries;
    try {
        entries = fflate.unzipSync(new Uint8Array(buf));
    } catch (e) {
        console.error('Failed to unzip:', e.message);
        process.exit(1);
    }

    const keys = Object.keys(entries);
    console.log(`Entries: ${keys.length}`);

    const fixed = {};
    let truncated = 0;
    const seen = new Set();

    for (const [path, data] of Object.entries(entries)) {
        let fixedPath = path;

        if (path.length > MAX_PATH) {
            const parts = path.split('/');
            const filename = parts[parts.length - 1].substring(0, 80);
            const firstDir = parts[0]?.substring(0, 60) || '';
            fixedPath = firstDir ? `${firstDir}/${filename}` : filename;
            truncated++;
        }

        // Dedupe
        let finalPath = fixedPath;
        let n = 2;
        while (seen.has(finalPath)) {
            const dot = fixedPath.lastIndexOf('.');
            if (dot > 0) {
                finalPath = fixedPath.substring(0, dot) + `_${n}` + fixedPath.substring(dot);
            } else {
                finalPath = fixedPath + `_${n}`;
            }
            n++;
        }
        seen.add(finalPath);
        fixed[finalPath] = data;
    }

    console.log(`Truncated: ${truncated} paths (>${MAX_PATH} chars)`);
    console.log(`Writing: ${output}`);

    const zipped = fflate.zipSync(fixed);
    fs.writeFileSync(output, zipped);
    console.log(`Done! ${(zipped.length / 1024 / 1024).toFixed(1)} MB → opens in Windows Explorer`);
}

main().catch(e => { console.error(e); process.exit(1); });
