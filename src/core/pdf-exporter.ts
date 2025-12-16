import { getBaseUrl } from '@/api/confluence';
import type { PageContentData, PageTreeNode } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import { flattenTree } from './tree-processor';

/** Generate printable HTML and trigger print dialog */
export function exportToPdf(
  pages: PageContentData[],
  rootNode: PageTreeNode,
  exportTitle: string,
  settings: ExportSettings
): void {
  const flatTree = flattenTree(rootNode);
  const treeMap = new Map(flatTree.map((n) => [n.id, n]));
  const baseUrl = getBaseUrl();
  const baseLevel = rootNode.level;

  const html = buildPrintableHtml(pages, treeMap, baseUrl, baseLevel, exportTitle, settings);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };
}

function buildPrintableHtml(
  pages: PageContentData[],
  treeMap: Map<string, PageTreeNode>,
  baseUrl: string,
  baseLevel: number,
  exportTitle: string,
  settings: ExportSettings
): string {
  const styles = getPrintStyles();

  let content = '';

  // Title page
  content += `
    <div class="title-page">
      <h1>${escapeHtml(exportTitle)}</h1>
      <div class="meta">
        <p><strong>Всего страниц:</strong> ${pages.length}</p>
        <p><strong>Дата экспорта:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
      </div>
    </div>
    <div class="page-break"></div>
  `;

  // Table of Contents
  content += `
    <div class="toc">
      <h2>Содержание</h2>
      <ul>
  `;

  for (const page of pages) {
    if (page.error) continue;
    const node = treeMap.get(page.id);
    const relativeLevel = node ? node.level - baseLevel : 0;
    const indent = relativeLevel * 20;
    content += `<li style="margin-left: ${indent}px;"><a href="#page-${page.id}">${escapeHtml(page.title)}</a></li>`;
  }

  content += `
      </ul>
    </div>
    <div class="page-break"></div>
  `;

  // Page contents
  for (const page of pages) {
    const node = treeMap.get(page.id);
    const relativeLevel = node ? node.level - baseLevel : 0;
    const headingTag = `h${Math.min(relativeLevel + 1, 6)}`;
    const pageUrl = `${baseUrl}/pages/viewpage.action?pageId=${page.id}`;

    content += `<article class="page-content" id="page-${page.id}">`;
    content += `<${headingTag} class="page-title">${escapeHtml(page.title)}</${headingTag}>`;

    if (settings.includeSourceLinks) {
      content += `<p class="source-link">Источник: <a href="${pageUrl}">${pageUrl}</a></p>`;
    }

    if (settings.includeMetadata && page.version) {
      const date = new Date(page.version.when).toLocaleDateString('ru-RU');
      content += `<p class="meta-info">Обновлено: ${date}</p>`;
    }

    if (page.error) {
      content += `<p class="error">Ошибка загрузки содержимого страницы</p>`;
    } else {
      // Process HTML content to fix encoding issues
      const processedContent = processHtmlContent(page.htmlContent, settings);
      content += `<div class="content-body">${processedContent}</div>`;
    }

    content += `</article><div class="page-break"></div>`;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(exportTitle)} - PDF Export</title>
  <style>${styles}</style>
</head>
<body>
  <div class="print-controls no-print">
    <button onclick="window.print()">🖨️ Печать / Сохранить как PDF</button>
    <button onclick="window.close()">✕ Закрыть</button>
    <span class="hint">Совет: В диалоге печати выберите "Сохранить как PDF"</span>
  </div>
  <main>${content}</main>
</body>
</html>`;
}

/** Process HTML content - fix images, special chars */
function processHtmlContent(html: string, settings: ExportSettings): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove images if disabled
  if (!settings.includeImages) {
    doc.querySelectorAll('img').forEach((img) => img.remove());
  } else {
    // Fix image sources - make absolute
    doc.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('/')) {
        img.setAttribute('src', getBaseUrl() + src);
      }
      // Add loading lazy and max-width
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });
  }

  // Fix links - make absolute
  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('/')) {
      a.setAttribute('href', getBaseUrl() + href);
    }
  });

  // Decode HTML entities that might be double-encoded
  return doc.body.innerHTML;
}

function getPrintStyles(): string {
  return `
    /* Reset and base */
    *, *::before, *::after {
      box-sizing: border-box;
    }

    /* Font stack with good Unicode support */
    body {
      font-family: 
        "Segoe UI", 
        -apple-system, 
        BlinkMacSystemFont, 
        "Noto Sans", 
        "Liberation Sans",
        Roboto, 
        "Helvetica Neue", 
        Arial, 
        sans-serif,
        "Apple Color Emoji", 
        "Segoe UI Emoji", 
        "Noto Color Emoji";
      font-size: 14px;
      line-height: 1.6;
      color: #172B4D;
      margin: 0;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Cyrillic and special characters support */
    @font-face {
      font-family: 'Fallback';
      src: local('Segoe UI'), local('Noto Sans'), local('Arial Unicode MS');
      unicode-range: U+0400-04FF, U+0500-052F; /* Cyrillic */
    }

    /* Print controls */
    .print-controls {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #fff;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .print-controls button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .print-controls button:first-of-type {
      background: #0052CC;
      color: white;
    }

    .print-controls button:first-of-type:hover {
      background: #0065FF;
    }

    .print-controls button:last-of-type {
      background: #DFE1E6;
      color: #172B4D;
    }

    .print-controls .hint {
      font-size: 12px;
      color: #5E6C84;
      width: 100%;
      margin-top: 5px;
    }

    /* Title page */
    .title-page {
      text-align: center;
      padding: 120px 20px;
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .title-page h1 {
      font-size: 2.5em;
      color: #0052CC;
      margin-bottom: 30px;
      word-wrap: break-word;
    }

    .title-page .meta {
      color: #5E6C84;
      font-size: 1.1em;
    }

    .title-page .meta p {
      margin: 8px 0;
    }

    /* Table of Contents */
    .toc {
      padding: 20px 0;
    }

    .toc h2 {
      color: #0052CC;
      border-bottom: 2px solid #0052CC;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .toc ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .toc li {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .toc a {
      color: #0052CC;
      text-decoration: none;
      display: block;
    }

    .toc a:hover {
      text-decoration: underline;
    }

    /* Page content */
    .page-content {
      margin-bottom: 40px;
      padding-top: 20px;
    }

    .page-title {
      color: #0052CC;
      border-bottom: 1px solid #DFE1E6;
      padding-bottom: 12px;
      margin-top: 0;
      margin-bottom: 16px;
      word-wrap: break-word;
    }

    h1.page-title { font-size: 2em; }
    h2.page-title { font-size: 1.75em; }
    h3.page-title { font-size: 1.5em; }
    h4.page-title { font-size: 1.25em; }
    h5.page-title { font-size: 1.1em; }
    h6.page-title { font-size: 1em; }

    .source-link {
      font-size: 0.85em;
      color: #5E6C84;
      margin-bottom: 8px;
      word-break: break-all;
    }

    .source-link a {
      color: #0052CC;
    }

    .meta-info {
      font-size: 0.85em;
      color: #5E6C84;
      font-style: italic;
      margin-bottom: 16px;
    }

    .error {
      color: #DE350B;
      font-style: italic;
      padding: 20px;
      background: #FFEBE6;
      border-radius: 4px;
    }

    /* Content body */
    .content-body {
      margin-top: 20px;
    }

    .content-body h1, .content-body h2, .content-body h3,
    .content-body h4, .content-body h5, .content-body h6 {
      color: #172B4D;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    .content-body p {
      margin: 12px 0;
    }

    .content-body img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 16px 0;
      border: 1px solid #DFE1E6;
      border-radius: 4px;
    }

    .content-body pre,
    .content-body .code,
    .content-body .codeContent {
      background: #f4f5f7;
      border: 1px solid #DFE1E6;
      border-radius: 4px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 13px;
      padding: 16px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .content-body code {
      background: #f4f5f7;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.9em;
    }

    .content-body pre code {
      background: none;
      padding: 0;
    }

    .content-body table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
      font-size: 13px;
    }

    .content-body th,
    .content-body td {
      border: 1px solid #DFE1E6;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }

    .content-body th {
      background: #f4f5f7;
      font-weight: 600;
    }

    .content-body tr:nth-child(even) {
      background: #fafbfc;
    }

    .content-body blockquote {
      border-left: 4px solid #0052CC;
      margin: 16px 0;
      padding: 12px 20px;
      background: #DEEBFF;
      border-radius: 0 4px 4px 0;
    }

    .content-body ul, .content-body ol {
      padding-left: 24px;
      margin: 12px 0;
    }

    .content-body li {
      margin: 6px 0;
    }

    .content-body a {
      color: #0052CC;
      text-decoration: none;
    }

    .content-body a:hover {
      text-decoration: underline;
    }

    /* Confluence specific */
    .confluence-information-macro {
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
      border-left: 4px solid;
    }

    .confluence-information-macro-note {
      background: #EAE6FF;
      border-color: #6554C0;
    }

    .confluence-information-macro-tip {
      background: #E3FCEF;
      border-color: #00875A;
    }

    .confluence-information-macro-warning {
      background: #FFFAE6;
      border-color: #FF991F;
    }

    .confluence-information-macro-info {
      background: #DEEBFF;
      border-color: #0052CC;
    }

    /* Page breaks */
    .page-break {
      page-break-after: always;
      break-after: page;
      height: 0;
      margin: 0;
      border: 0;
    }

    /* Print styles */
    @media print {
      .no-print {
        display: none !important;
      }

      body {
        padding: 0;
        max-width: none;
        font-size: 12px;
      }

      .title-page {
        min-height: auto;
        padding: 60px 20px;
      }

      .page-content {
        page-break-inside: avoid;
      }

      .content-body pre,
      .content-body table,
      .content-body img {
        page-break-inside: avoid;
      }

      a {
        color: inherit !important;
        text-decoration: none !important;
      }

      /* Show URLs after links */
      .source-link a::after {
        content: none;
      }

      @page {
        margin: 15mm 12mm;
        size: A4;
      }

      @page :first {
        margin-top: 20mm;
      }
    }

    /* Fix for special characters */
    .content-body * {
      unicode-bidi: embed;
    }
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
