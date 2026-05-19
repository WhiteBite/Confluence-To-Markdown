/**
 * Capture screenshots of all UI states of the extension.
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const userscriptPath = path.join(repoRoot, 'dist', 'confluence-to-markdown.user.js');
const outDir = __dirname;

const CONFLUENCE_URL = 'http://localhost:8090';

async function main() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    // Login
    await page.goto(`${CONFLUENCE_URL}/login.action`);
    const loginVisible = await page.locator('#os_username').isVisible({ timeout: 3000 }).catch(() => false);
    if (loginVisible) {
        await page.fill('#os_username', 'admin');
        await page.fill('#os_password', 'admin');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => null),
            page.click('#loginButton'),
        ]);
    }

    // Find a page with content
    const result = await page.evaluate(async (baseUrl) => {
        const res = await fetch(`${baseUrl}/rest/api/content?type=page&limit=10&expand=children.attachment`, { credentials: 'include' });
        const json = await res.json();
        const pages = json.results || [];
        const withAttachments = pages.find(p => p.children?.attachment?.size > 0);
        return withAttachments ? withAttachments.id : pages[0]?.id;
    }, CONFLUENCE_URL);

    if (!result) {
        console.error('No pages found!');
        await browser.close();
        return;
    }

    // Navigate to page
    await page.goto(`${CONFLUENCE_URL}/pages/viewpage.action?pageId=${result}`, { waitUntil: 'domcontentloaded' });

    // Inject userscript
    const userscript = fs.readFileSync(userscriptPath, 'utf-8');
    await page.addScriptTag({ content: userscript });
    await page.waitForTimeout(2500);

    // Screenshot 1: Buttons injected in page header
    await page.screenshot({ path: path.join(outDir, '01-buttons-injected.png'), fullPage: false });
    console.log('✓ 01-buttons-injected.png');

    // Click Export to Markdown
    const exportBtn = page.locator('#md-export-trigger');
    if (await exportBtn.isVisible({ timeout: 3000 })) {
        await exportBtn.click();
        await page.waitForTimeout(1500);

        // Screenshot 2: Export modal open
        await page.screenshot({ path: path.join(outDir, '02-export-modal.png'), fullPage: false });
        console.log('✓ 02-export-modal.png');

        // Change platform to Obsidian
        const platformSelect = page.locator('#setting-platform');
        if (await platformSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
            await platformSelect.selectOption('obsidian');
            await page.waitForTimeout(500);

            // Screenshot 3: Obsidian settings visible
            await page.screenshot({ path: path.join(outDir, '03-obsidian-settings.png'), fullPage: false });
            console.log('✓ 03-obsidian-settings.png');
        }

        // Switch to dark theme
        const themeBtn = page.locator('[data-action="toggle-theme"]');
        if (await themeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await themeBtn.click();
            await page.waitForTimeout(300);

            // Screenshot 4: Dark theme
            await page.screenshot({ path: path.join(outDir, '04-dark-theme.png'), fullPage: false });
            console.log('✓ 04-dark-theme.png');

            // Switch back to light
            await themeBtn.click();
            await page.waitForTimeout(300);
        }

        // Close modal
        const closeBtn = page.locator('[data-action="cancel"]');
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeBtn.click();
            await page.waitForTimeout(500);
        }
    }

    // Click Import Backup
    const importBtn = page.locator('#md-import-trigger');
    if (await importBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(800);

        // Screenshot 5: Import modal (file picker)
        await page.screenshot({ path: path.join(outDir, '05-import-modal.png'), fullPage: false });
        console.log('✓ 05-import-modal.png');

        // Close import modal
        const importClose = page.locator('#md-import-close');
        if (await importClose.isVisible({ timeout: 1000 }).catch(() => false)) {
            await importClose.click();
            await page.waitForTimeout(300);
        }
    }

    // Screenshot 6: Full page with all buttons visible
    await page.screenshot({ path: path.join(outDir, '06-full-page.png'), fullPage: true });
    console.log('✓ 06-full-page.png');

    await page.waitForTimeout(1000);
    await browser.close();
    console.log('\nAll screenshots saved to:', outDir);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
