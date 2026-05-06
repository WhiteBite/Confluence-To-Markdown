import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Read package.json (single source of truth)
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version;

// Read manifest template
const templatePath = resolve(rootDir, 'src', 'manifest.template.json');
const manifestPath = resolve(rootDir, 'src', 'manifest.json');

const template = JSON.parse(readFileSync(templatePath, 'utf-8'));
template.version = version;

// Write manifest.json
writeFileSync(manifestPath, JSON.stringify(template, null, 4) + '\n');

console.log(`[sync-version] Synced manifest.json to version ${version}`);
