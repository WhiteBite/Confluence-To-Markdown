import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const userscriptPath = path.join(__dirname, '../../dist/confluence-to-markdown.user.js');
const mockHtmlPath = path.join(__dirname, '../fixtures/confluence-server-mock.html');

test.describe('Confluence Server 8.5.x compatibility', () => {
    test.beforeEach(async ({ page }) => {
        // Read the built userscript
        const userscript = fs.readFileSync(userscriptPath, 'utf-8');
        
        // Load mock page
        await page.goto('file://' + mockHtmlPath);
        
        // Inject userscript
        await page.addScriptTag({ content: userscript });
        
        // Wait a bit for script initialization and retries
        await page.waitForTimeout(3000);
    });

    test('should detect pageId from AJS.Meta on Server', async ({ page }) => {
        // Check console logs for pageId detection
        const logs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[CTM]')) logs.push(text);
        });

        // Reload to trigger logs
        await page.reload();
        const userscript = fs.readFileSync(userscriptPath, 'utf-8');
        await page.addScriptTag({ content: userscript });
        await page.waitForTimeout(3000);

        const pageIdLog = logs.find(l => l.includes('getCurrentPageId'));
        expect(pageIdLog).toBeTruthy();
        
        // Should detect pageId=12345678 from AJS.Meta
        expect(logs.some(l => l.includes('12345678'))).toBe(true);
    });

    test('should detect spaceKey from /display/ path on Server', async ({ page }) => {
        const logs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[CTM]')) logs.push(text);
        });

        await page.reload();
        const userscript = fs.readFileSync(userscriptPath, 'utf-8');
        await page.addScriptTag({ content: userscript });
        await page.waitForTimeout(3000);

        // Should detect spaceKey=SPC from URL path /display/SPC/
        expect(logs.some(l => l.includes('SPC'))).toBe(true);
    });

    test('should add Export Space button on Server', async ({ page }) => {
        // Look for the button
        const spaceButton = page.locator('#md-space-export-trigger');
        await expect(spaceButton).toBeVisible({ timeout: 5000 });
        await expect(spaceButton).toHaveText(/Export Space/);
    });

    test('should add Export to Markdown button on Server', async ({ page }) => {
        const pageButton = page.locator('#md-export-trigger');
        await expect(pageButton).toBeVisible({ timeout: 5000 });
        await expect(pageButton).toHaveText(/Export to Markdown/);
    });

    test('should log initialization diagnostics', async ({ page }) => {
        const logs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[CTM]')) logs.push(text);
        });

        await page.reload();
        const userscript = fs.readFileSync(userscriptPath, 'utf-8');
        await page.addScriptTag({ content: userscript });
        await page.waitForTimeout(3000);

        // Should have init logs
        expect(logs.some(l => l.includes('init() called'))).toBe(true);
        expect(logs.some(l => l.includes('addExportButton'))).toBe(true);
        
        // Should have container detection logs
        expect(logs.some(l => l.includes('container found')) || logs.some(l => l.includes('NO container'))).toBe(true);
    });

    test('should handle missing AJS gracefully', async ({ page }) => {
        // Remove AJS from page
        await page.evaluate(() => {
            (window as any).AJS = undefined;
        });

        const logs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[CTM]')) logs.push(text);
        });

        await page.reload();
        // Don't inject AJS this time
        const userscript = fs.readFileSync(userscriptPath, 'utf-8');
        await page.addScriptTag({ content: userscript });
        await page.waitForTimeout(3000);

        // Should still detect spaceKey from URL
        expect(logs.some(l => l.includes('getSpaceKey from /display/'))).toBe(true);
        
        // PageId should be null (no AJS, and URL doesn't have it)
        expect(logs.some(l => l.includes('getCurrentPageId: NOT FOUND'))).toBe(true);
    });
});
