/**
 * Live test script for Confluence with manual auth
 * 
 * Usage:
 * 1. Run: node test-live.js auth
 * 2. Login manually in the browser
 * 3. Press Enter in terminal when done
 * 4. Run: node test-live.js test
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_FILE = path.join(__dirname, 'auth-state.json');
const CONFLUENCE_URL = 'https://confluence.ittds.tech/pages/viewpage.action?pageId=130520250';
const USERSCRIPT_PATH = path.join(__dirname, 'dist/confluence-to-markdown.user.js');

function waitForEnter(message) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(message, () => {
            rl.close();
            resolve();
        });
    });
}

async function saveAuth() {
    console.log('🚀 Starting browser for authentication...');
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('📖 Opening Confluence...');
    await page.goto(CONFLUENCE_URL);

    console.log('\n✋ Please login manually in the browser');
    await waitForEnter('⏳ Press Enter when you are logged in and see the page content...\n');

    console.log('💾 Saving authentication state...');
    await context.storageState({ path: AUTH_FILE });

    console.log(`✅ Auth saved to ${AUTH_FILE}`);
    console.log('🎯 Now run: node test-live.js test');

    await browser.close();
}

async function runTest() {
    if (!fs.existsSync(AUTH_FILE)) {
        console.error('❌ Auth file not found. Run: node test-live.js auth');
        process.exit(1);
    }

    console.log('🚀 Starting browser with saved auth...');
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    const context = await browser.newContext({
        storageState: AUTH_FILE
    });

    const page = await context.newPage();

    console.log('📖 Opening Confluence...');
    await page.goto(CONFLUENCE_URL, { waitUntil: 'networkidle' });

    console.log('💉 Injecting updated userscript...');
    await page.addScriptTag({ path: USERSCRIPT_PATH });

    console.log('⏳ Waiting for export button...');
    await page.waitForTimeout(2000);

    const exportBtn = await page.$('#md-export-trigger');
    if (!exportBtn) {
        console.error('❌ Export button not found. Script injection failed?');
        await browser.close();
        process.exit(1);
    }

    console.log('✅ Export button found!');
    console.log('🖱️  Clicking export button...');
    await exportBtn.click();

    console.log('⏳ Waiting for modal...');
    await page.waitForSelector('#md-export-modal', { timeout: 5000 });

    console.log('✅ Modal opened!');
    console.log('🖱️  Clicking "Copy to Clipboard" button...');

    const copyBtn = await page.$('button:has-text("Copy to Clipboard")');
    if (!copyBtn) {
        console.error('❌ Copy button not found');
        await browser.close();
        process.exit(1);
    }

    await copyBtn.click();
    console.log('⏳ Waiting for copy to complete...');
    await page.waitForTimeout(2000);

    console.log('📋 Reading clipboard...');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    console.log('\n' + '='.repeat(80));
    console.log('📄 COPIED MARKDOWN:');
    console.log('='.repeat(80));
    console.log(clipboardText);
    console.log('='.repeat(80));

    const hasMermaidBlocks = clipboardText.includes('```mermaid\nflowchart TB\n```');
    const hasWikilinks = clipboardText.match(/!\[\[\d+\.png\]\]/);
    const hasDrawioComments = clipboardText.match(/%% Editable source: \d+\.drawio %%/);

    console.log('\n🔍 VALIDATION:');
    console.log(`  Empty mermaid blocks: ${hasMermaidBlocks ? '❌ FOUND (BUG!)' : '✅ NOT FOUND'}`);
    console.log(`  Wikilinks (![[N.png]]): ${hasWikilinks ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`  Drawio comments: ${hasDrawioComments ? '✅ FOUND' : '❌ NOT FOUND'}`);

    if (!hasMermaidBlocks && hasWikilinks && hasDrawioComments) {
        console.log('\n🎉 SUCCESS! Diagrams are copied correctly!');
    } else {
        console.log('\n⚠️  ISSUE DETECTED! Check the output above.');
    }

    await waitForEnter('\n✋ Browser will stay open. Press Enter to close...');
    await browser.close();
}

const command = process.argv[2];

if (command === 'auth') {
    saveAuth().catch(console.error);
} else if (command === 'test') {
    runTest().catch(console.error);
} else {
    console.log('Usage:');
    console.log('  node test-live.js auth  - Save authentication');
    console.log('  node test-live.js test  - Run test with saved auth');
}
