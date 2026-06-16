import TurndownService from 'turndown';
import type { ConvertOptions } from '../converter';

export function applyConfluenceRules(turndown: TurndownService, options?: ConvertOptions): void {
    const useObsidian = options?.useObsidianCallouts ?? false;

    // Rule: Confluence info/note/warning/tip macros
    if (useObsidian) {
        // Obsidian callout format: > [!type] Title
        turndown.addRule('confluenceMacrosObsidian', {
            filter: node => {
                if (!(node instanceof HTMLElement)) return false;
                return (
                    node.classList.contains('confluence-information-macro') ||
                    (node.tagName === 'DIV' && node.dataset.macroName === 'panel')
                );
            },
            replacement: (_content, node) => {
                const el = node as HTMLElement;
                let type = 'info';

                const macroName = el.dataset.macroName || '';
                if (
                    macroName.includes('note') ||
                    el.classList.contains('confluence-information-macro-note')
                ) {
                    type = 'note';
                } else if (
                    macroName.includes('tip') ||
                    el.classList.contains('confluence-information-macro-tip')
                ) {
                    type = 'tip';
                } else if (
                    macroName.includes('warning') ||
                    el.classList.contains('confluence-information-macro-warning')
                ) {
                    type = 'warning';
                }

                const titleEl = el.querySelector(
                    '.confluence-information-macro-title, .panelHeader'
                );
                const title = titleEl?.textContent?.trim() || '';

                const bodyEl = el.querySelector(
                    '.confluence-information-macro-body, .panelContent'
                );
                const body = bodyEl?.textContent?.trim() || el.textContent?.trim() || '';

                const header = title ? `> [!${type}] ${title}` : `> [!${type}]`;
                const lines = body
                    .split('\n')
                    .map(line => `> ${line}`)
                    .join('\n');

                return `\n${header}\n${lines}\n\n`;
            },
        });
    } else {
        // Standard blockquote format
        turndown.addRule('confluenceMacros', {
            filter: node => {
                if (!(node instanceof HTMLElement)) return false;
                return (
                    node.classList.contains('confluence-information-macro') ||
                    (node.tagName === 'DIV' && node.dataset.macroName === 'panel')
                );
            },
            replacement: (_content, node) => {
                const el = node as HTMLElement;
                let type = 'Info';

                const macroName = el.dataset.macroName || '';
                if (
                    macroName.includes('note') ||
                    el.classList.contains('confluence-information-macro-note')
                ) {
                    type = 'Note';
                } else if (
                    macroName.includes('tip') ||
                    el.classList.contains('confluence-information-macro-tip')
                ) {
                    type = 'Tip';
                } else if (
                    macroName.includes('warning') ||
                    el.classList.contains('confluence-information-macro-warning')
                ) {
                    type = 'Warning';
                }

                const titleEl = el.querySelector(
                    '.confluence-information-macro-title, .panelHeader'
                );
                const title = titleEl?.textContent?.trim() || '';

                const bodyEl = el.querySelector(
                    '.confluence-information-macro-body, .panelContent'
                );
                const body = bodyEl?.textContent?.trim() || el.textContent?.trim() || '';

                const header = title ? `**${type}: ${title}**` : `**${type}**`;
                const lines = body
                    .split('\n')
                    .map(line => `> ${line}`)
                    .join('\n');

                return `\n${header}\n${lines}\n\n`;
            },
        });
    }

    // Rule: Expand/collapse sections -> HTML details
    turndown.addRule('expandCollapse', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.classList.contains('expand-container') ||
                node.classList.contains('aui-expander-container')
            );
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const titleEl = el.querySelector('.expand-control-text, .aui-expander-trigger');
            const title = titleEl?.textContent?.trim() || 'Details';

            const contentEl = el.querySelector('.expand-content, .aui-expander-content');
            const content = contentEl?.textContent?.trim() || '';

            return `\n<details>\n<summary>${title}</summary>\n\n${content}\n\n</details>\n\n`;
        },
    });

    // Rule: AUI lozenges (status badges) -> inline text
    turndown.addRule('auiLozenge', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return node.classList.contains('aui-lozenge');
        },
        replacement: content => {
            return content ? `[${content.trim()}]` : '';
        },
    });

    // Rule: Task lists
    turndown.addRule('taskList', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return node.classList.contains('task-list-item');
        },
        replacement: (content, node) => {
            const el = node as HTMLElement;
            const isComplete = el.dataset.taskStatus === 'complete';
            const checkbox = isComplete ? '[x]' : '[ ]';
            return `- ${checkbox} ${content.trim()}\n`;
        },
    });

    // Rule: Code blocks with language
    // Confluence wraps code in: <div class="code"><div class="codeContent"><pre>...</pre></div></div>
    // We must only match the innermost element to avoid triple-wrapping in backticks.
    turndown.addRule('codeBlock', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            if (node.tagName === 'PRE') {
                // Skip if this <pre> is inside a .code/.codeContent container
                // (the container will handle it)
                return !node.closest('.code, .codeContent, .code-panel');
            }
            if (node.classList.contains('code') || node.classList.contains('codeContent')) {
                // Only match if this element is the OUTERMOST code wrapper
                // (no parent is also a .code/.codeContent)
                const parent = node.parentElement;
                return !parent || !(
                    parent.classList.contains('code') ||
                    parent.classList.contains('codeContent') ||
                    parent.classList.contains('code-panel')
                );
            }
            return false;
        },
        replacement: (content, node) => {
            const el = node as HTMLElement;
            // Try to find language from the element or nested <pre>
            const pre = el.tagName === 'PRE' ? el : el.querySelector('pre');
            const lang = el.dataset.language
                || pre?.dataset.language
                || pre?.className.match(/language-(\w+)/)?.[1]
                || el.className.match(/language-(\w+)/)?.[1]
                || '';
            // Strip any nested backticks that Turndown may have added for inner <pre>
            const code = content.replace(/^```[\s\S]*?```$/gm, (match) => {
                // Extract content from inner fences
                const inner = match.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
                return inner;
            }).trim();
            return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
        },
    });

    // Remove empty links
    turndown.addRule('emptyLinks', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return node.tagName === 'A' && !node.textContent?.trim();
        },
        replacement: () => '',
    });

    // Rule: Confluence tables
    turndown.addRule('confluenceTable', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return node.tagName === 'TABLE' && node.classList.contains('confluenceTable');
        },
        replacement: (_content, node) => {
            const el = node as HTMLTableElement;
            const rows = Array.from(el.querySelectorAll('tr'));
            if (rows.length === 0) return '';

            const result: string[] = [];
            let hasHeader = false;

            rows.forEach((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                const isHeaderRow = cells.some(c => c.tagName === 'TH');

                const cellContents = cells.map(cell => {
                    return (cell.textContent || '')
                        .replace(/\n/g, ' ')
                        .replace(/\|/g, '\\|')
                        .trim();
                });

                result.push(`| ${cellContents.join(' | ')} |`);

                if (isHeaderRow && !hasHeader) {
                    hasHeader = true;
                    result.push(`| ${cells.map(() => '---').join(' | ')} |`);
                } else if (rowIndex === 0 && !hasHeader) {
                    hasHeader = true;
                    result.push(`| ${cells.map(() => '---').join(' | ')} |`);
                }
            });

            return `\n\n${result.join('\n')}\n\n`;
        },
    });
}
