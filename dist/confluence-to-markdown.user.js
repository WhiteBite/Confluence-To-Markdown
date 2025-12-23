// ==UserScript==
// @name         Confluence to Markdown Exporter
// @namespace    https://github.com/WhiteBite/confluence-to-markdown
// @version      2.3.1
// @author       WhiteBite
// @description  Export Confluence pages to clean Markdown for LLM consumption
// @icon         https://www.atlassian.com/favicon.ico
// @homepage     https://github.com/WhiteBite/Confluence-To-Markdown
// @supportURL   https://github.com/WhiteBite/Confluence-To-Markdown/issues
// @downloadURL  https://raw.githubusercontent.com/WhiteBite/Confluence-To-Markdown/main/dist/confluence-to-markdown.user.js
// @updateURL    https://raw.githubusercontent.com/WhiteBite/Confluence-To-Markdown/main/dist/confluence-to-markdown.user.js
// @match        https://*.atlassian.net/wiki/*
// @match        https://*/wiki/*
// @match        https://*/display/*
// @match        https://*/pages/*
// @connect      *
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(r=>{if(typeof GM_addStyle=="function"){GM_addStyle(r);return}const e=document.createElement("style");e.textContent=r,document.head.append(e)})(' :root{--md-primary: #0052CC;--md-primary-hover: #0065FF;--md-primary-light: #DEEBFF;--md-success: #00875A;--md-success-light: #E3FCEF;--md-danger: #DE350B;--md-danger-light: #FFEBE6;--md-warning: #FF991F;--md-text: #172B4D;--md-text-subtle: #5E6C84;--md-text-muted: #97A0AF;--md-bg: #FFFFFF;--md-bg-subtle: #F4F5F7;--md-bg-hover: #EBECF0;--md-border: #DFE1E6;--md-shadow: 0 8px 32px rgba(9, 30, 66, .25);--md-shadow-sm: 0 1px 3px rgba(9, 30, 66, .12);--md-radius: 6px;--md-radius-lg: 12px;--md-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;--md-transition: .15s ease}#md-export-modal{position:fixed;top:0;right:0;bottom:0;left:0;background-color:#091e428a;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);z-index:10000;display:flex;justify-content:center;align-items:center;padding:24px;box-sizing:border-box;font-family:var(--md-font);animation:fadeIn .2s ease}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}.md-modal-content{background-color:var(--md-bg);border-radius:var(--md-radius-lg);width:100%;max-width:780px;max-height:90vh;display:flex;flex-direction:column;box-shadow:var(--md-shadow);overflow:hidden;position:relative;animation:slideUp .25s ease}@media (max-width: 768px){#md-export-modal{padding:12px}.md-modal-content{max-width:100%;max-height:95vh;border-radius:var(--md-radius)}}@media (max-width: 480px){#md-export-modal{padding:8px}.md-modal-content{max-height:98vh;border-radius:8px}}@media (max-height: 600px){.md-modal-content{max-height:98vh}}@keyframes slideUp{0%{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.md-modal-header{padding:20px 24px 16px;border-bottom:1px solid var(--md-border);flex-shrink:0}.md-header-row{display:flex;justify-content:space-between;align-items:flex-start}.md-header-title{display:flex;align-items:center;gap:8px}.md-header-actions{display:flex;align-items:center;gap:4px}.md-modal-header h3{margin:0;color:var(--md-text);font-size:20px;font-weight:600}.md-modal-header .subtitle{color:var(--md-text-subtle);font-size:14px;margin:8px 0 0;display:flex;align-items:center;gap:6px}.md-modal-header .subtitle svg{width:16px;height:16px;fill:var(--md-text-muted)}.md-page-count{background:var(--md-bg-subtle);padding:2px 8px;border-radius:10px;font-size:12px;color:var(--md-text-muted);margin-left:8px}.md-close-btn{margin:0}.md-btn-icon{width:32px;height:32px;padding:0;border:none;background:transparent;border-radius:var(--md-radius);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-subtle);transition:all var(--md-transition)}.md-btn-icon:hover{background:var(--md-bg-subtle);color:var(--md-text)}.md-btn-icon svg{width:20px;height:20px;fill:currentColor}.md-btn-icon.spinning svg{animation:spin 1s linear infinite}@keyframes spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.md-search-bar{display:flex;align-items:center;padding:8px 24px;background:var(--md-bg);border-bottom:1px solid var(--md-border);gap:8px}.md-search-icon{color:var(--md-text-muted);display:flex}.md-search-icon svg{width:18px;height:18px;fill:currentColor}.md-search-bar input{flex:1;border:none;outline:none;font-size:14px;font-family:var(--md-font);color:var(--md-text);background:transparent}.md-search-bar input::placeholder{color:var(--md-text-muted)}.md-search-clear{width:24px;height:24px;padding:0;border:none;background:var(--md-bg-subtle);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);transition:all var(--md-transition)}.md-search-clear:hover{background:var(--md-bg-hover);color:var(--md-text)}.md-search-clear svg{width:14px;height:14px;fill:currentColor}.md-controls{display:flex;gap:6px;padding:10px 24px;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);flex-shrink:0;flex-wrap:wrap;align-items:center}.md-controls-divider{width:1px;height:20px;background:var(--md-border);margin:0 4px}.md-tree-container{flex:1;overflow-y:auto;padding:8px 16px;min-height:200px;max-height:400px}.md-tree ul{list-style:none;padding:0;margin:0}.md-tree ul ul{margin-left:20px;padding-left:12px;border-left:1px solid var(--md-border)}.md-tree li{margin:0;transition:opacity var(--md-transition)}.md-tree li.hidden{display:none}.md-tree li.highlight>.md-tree-item{background:var(--md-primary-light)}.md-tree-item{display:flex;align-items:center;padding:6px 10px;margin:1px 0;border-radius:var(--md-radius);cursor:pointer;transition:background-color var(--md-transition);gap:6px}.md-tree-item:hover{background-color:var(--md-bg-hover)}.md-tree-toggler{width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);flex-shrink:0;transition:transform var(--md-transition);border-radius:4px}.md-tree-toggler:hover{background:var(--md-bg-subtle)}.md-tree-toggler.expanded{transform:rotate(90deg)}.md-tree-toggler svg{width:16px;height:16px;fill:currentColor}.md-tree-toggler.empty{visibility:hidden}.md-tree-checkbox{width:16px;height:16px;margin:0;cursor:pointer;accent-color:var(--md-primary);flex-shrink:0}.md-tree-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.md-tree-icon svg{width:16px;height:16px}.md-tree-icon.folder svg{fill:#ffab00}.md-tree-icon.page svg{fill:var(--md-primary)}.md-tree-label{flex:1;color:var(--md-text);font-size:13px;line-height:1.4;-webkit-user-select:none;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.md-tree-label.error{color:var(--md-danger)}.md-child-count{font-size:11px;color:var(--md-text-muted);background:var(--md-bg-subtle);padding:1px 6px;border-radius:8px;margin-left:4px}.md-error-badge{font-size:10px;color:var(--md-danger);background:var(--md-danger-light);padding:2px 6px;border-radius:4px;font-weight:500}.md-tree ul.collapsed{display:none}.md-tree ul{overflow:hidden}.md-settings-panel{border-top:1px solid var(--md-border);flex-shrink:0}.md-settings-toggle{width:100%;padding:12px 24px;border:none;background:var(--md-bg-subtle);cursor:pointer;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:var(--md-text-subtle);font-family:var(--md-font);transition:background-color var(--md-transition)}.md-settings-toggle:hover{background:var(--md-bg-hover)}.md-settings-toggle svg{width:18px;height:18px;fill:currentColor}.md-settings-toggle .md-chevron{margin-left:auto;transition:transform .2s ease}.md-settings-toggle .md-chevron.expanded{transform:rotate(90deg)}.md-settings-content{padding:16px 24px;background:var(--md-bg);display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.md-checkbox-label{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;color:var(--md-text)}.md-checkbox-label input[type=checkbox]{width:16px;height:16px;accent-color:var(--md-primary);cursor:pointer}.md-progress-section{padding:16px 24px;background:var(--md-bg-subtle);border-top:1px solid var(--md-border);flex-shrink:0}.md-progress-label{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:var(--md-text-subtle)}.md-progress-bar{height:6px;background:var(--md-border);border-radius:3px;overflow:hidden}.md-progress-fill{height:100%;background:linear-gradient(90deg,var(--md-primary),var(--md-primary-hover));border-radius:3px;transition:width .3s ease;width:0%}.md-progress-fill.indeterminate{width:30%;animation:indeterminate 1.5s ease-in-out infinite}@keyframes indeterminate{0%{transform:translate(-100%)}to{transform:translate(400%)}}.md-toast{position:absolute;bottom:80px;left:50%;transform:translate(-50%) translateY(20px);background:var(--md-success);color:#fff;padding:12px 20px;border-radius:var(--md-radius);display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;box-shadow:var(--md-shadow-sm);opacity:0;transition:all .3s ease;z-index:10}.md-toast.show{opacity:1;transform:translate(-50%) translateY(0)}.md-toast svg{width:18px;height:18px;fill:currentColor}.md-modal-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 24px;border-top:1px solid var(--md-border);background:var(--md-bg);flex-shrink:0}.md-footer-left,.md-footer-right{display:flex;gap:8px;align-items:center}.md-hint{font-size:12px;color:var(--md-text-muted)}.md-btn{padding:8px 14px;border-radius:var(--md-radius);border:none;cursor:pointer;font-size:13px;font-weight:500;font-family:var(--md-font);transition:all var(--md-transition);display:inline-flex;align-items:center;gap:6px;position:relative}.md-btn svg{width:16px;height:16px;fill:currentColor}.md-btn-primary{background-color:var(--md-primary);color:#fff}.md-btn-primary:hover:not(:disabled){background-color:var(--md-primary-hover)}.md-btn-primary:disabled{background-color:#b3d4ff;cursor:not-allowed}.md-btn-secondary{background-color:var(--md-bg);color:var(--md-text);border:1px solid var(--md-border)}.md-btn-secondary:hover:not(:disabled){background-color:var(--md-bg-subtle);border-color:var(--md-text-muted)}.md-btn-secondary:disabled{opacity:.6;cursor:not-allowed}.md-btn-link{background:none;color:var(--md-text-subtle);padding:8px 12px}.md-btn-link:hover{color:var(--md-text);background-color:var(--md-bg-subtle)}.md-btn-sm{padding:5px 10px;font-size:12px}.md-btn-badge{background:#fff3;padding:1px 6px;border-radius:8px;font-size:11px;min-width:18px;text-align:center}.md-btn-badge.has-count{background:#ffffff4d}.md-selection-count{font-size:12px;color:var(--md-text-subtle);padding:5px 10px;background:var(--md-bg);border-radius:var(--md-radius);border:1px solid var(--md-border);margin-left:auto;transition:all var(--md-transition)}@keyframes shake{0%,to{transform:translate(0)}20%,60%{transform:translate(-5px)}40%,80%{transform:translate(5px)}}.shake{animation:shake .5s ease;background:var(--md-danger-light)!important;border-color:var(--md-danger)!important;color:var(--md-danger)!important}#md-export-status{margin-left:12px;color:var(--md-text-subtle);font-size:13px;font-family:var(--md-font)}#md-export-trigger{margin-left:10px}.md-tree-container::-webkit-scrollbar{width:8px}.md-tree-container::-webkit-scrollbar-track{background:var(--md-bg-subtle);border-radius:4px}.md-tree-container::-webkit-scrollbar-thumb{background:var(--md-border);border-radius:4px}.md-tree-container::-webkit-scrollbar-thumb:hover{background:var(--md-text-muted)}.md-preset-buttons{display:flex;gap:8px;margin-bottom:16px}.md-preset-btn{flex:1;padding:12px 16px;border:2px solid var(--md-border);border-radius:var(--md-radius);background:var(--md-bg);cursor:pointer;font-size:13px;font-weight:500;font-family:var(--md-font);color:var(--md-text-subtle);transition:all var(--md-transition);text-align:center}.md-preset-btn:hover{border-color:var(--md-primary);color:var(--md-primary);background:var(--md-primary-light)}.md-preset-btn.active{border-color:var(--md-primary);background:var(--md-primary);color:#fff}.md-obsidian-options{padding-top:8px;border-top:1px solid var(--md-border);margin-top:8px}.md-option-group{display:flex;align-items:center;gap:12px;margin:8px 0}.md-option-label{font-size:13px;color:var(--md-text-subtle);white-space:nowrap}.md-preset-mini{display:flex;gap:6px}.md-btn-xs{padding:4px 8px;font-size:11px;border-radius:4px;background:var(--md-bg-subtle);border:1px solid var(--md-border);color:var(--md-text-subtle);cursor:pointer;font-family:var(--md-font);transition:all var(--md-transition)}.md-btn-xs:hover{background:var(--md-primary-light);border-color:var(--md-primary);color:var(--md-primary)}.md-checkbox-label.md-indent{margin-left:26px}.md-radio-group{display:flex;gap:16px}.md-radio-group label{display:flex;align-items:center;gap:4px;font-size:13px;color:var(--md-text);cursor:pointer}.md-radio-group input[type=radio]{accent-color:var(--md-primary);cursor:pointer}.md-settings-content.md-single-column{grid-template-columns:1fr}#md-diagrams-content{display:block}#md-diagrams-content .md-checkbox-label{margin-bottom:8px}#md-diagrams-content .md-option-group{margin-left:26px}#md-format-content{display:block}#md-format-content .md-checkbox-label{margin-bottom:8px}.md-settings-toggle svg[viewBox="0 0 24 24"] path[d*="L2 7"]{fill:#7c3aed}.md-stats-section{padding:12px 24px;background:linear-gradient(135deg,var(--md-bg-subtle) 0%,var(--md-bg) 100%);border-bottom:1px solid var(--md-border)}.md-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.md-stat-item{display:flex;flex-direction:column;align-items:center;padding:8px;background:var(--md-bg);border-radius:var(--md-radius);border:1px solid var(--md-border);transition:all var(--md-transition)}.md-stat-item:hover{border-color:var(--md-primary);box-shadow:0 2px 8px #0052cc1a}.md-stat-icon{font-size:20px;margin-bottom:4px}.md-stat-value{font-size:18px;font-weight:600;color:var(--md-text)}.md-stat-label{font-size:11px;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:.5px}#md-export-modal[data-theme=dark]{--md-primary: #4C9AFF;--md-primary-hover: #79B8FF;--md-primary-light: #1C2B41;--md-success: #36B37E;--md-success-light: #1C3829;--md-danger: #FF5630;--md-danger-light: #3D1F1F;--md-warning: #FFAB00;--md-text: #E6E6E6;--md-text-subtle: #A6A6A6;--md-text-muted: #6B6B6B;--md-bg: #1E1E1E;--md-bg-subtle: #252526;--md-bg-hover: #2D2D2D;--md-border: #3C3C3C}#md-export-modal[data-theme=dark]{background-color:#000000b3}.md-shortcuts-hint{display:flex;gap:12px;font-size:11px;color:var(--md-text-muted)}.md-shortcut{display:flex;align-items:center;gap:4px}.md-shortcut kbd{background:var(--md-bg-subtle);border:1px solid var(--md-border);border-radius:3px;padding:1px 5px;font-family:monospace;font-size:10px}.md-progress-details{margin-top:12px;max-height:120px;overflow-y:auto;font-size:12px}.md-progress-item{display:flex;align-items:center;gap:8px;padding:4px 0;color:var(--md-text-subtle)}.md-progress-item.done{color:var(--md-success)}.md-progress-item.active{color:var(--md-primary);font-weight:500}.md-progress-item.error{color:var(--md-danger)}.md-progress-item .status-icon{width:16px;text-align:center}.md-modal-content.with-preview{max-width:1200px}.md-split-view{display:flex;flex:1;min-height:0;overflow:hidden}.md-split-left{flex:1;display:flex;flex-direction:column;border-right:1px solid var(--md-border);min-width:0}.md-split-right{flex:1;display:flex;flex-direction:column;min-width:0}.md-preview-header{padding:12px 16px;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);font-size:13px;font-weight:500;color:var(--md-text-subtle);display:flex;align-items:center;gap:8px}.md-preview-content{flex:1;overflow-y:auto;padding:16px;font-family:SF Mono,Monaco,Cascadia Code,monospace;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word;background:var(--md-bg);color:var(--md-text)}.md-preview-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--md-text-muted);text-align:center;padding:24px}.md-preview-placeholder .icon{font-size:48px;margin-bottom:12px;opacity:.5}.md-preview-content .mermaid-block{background:var(--md-bg-subtle);border:1px solid var(--md-border);border-radius:var(--md-radius);padding:12px;margin:8px 0}.md-preview-content .mermaid-header{color:var(--md-primary);font-weight:500;margin-bottom:8px}.md-history-section{padding:8px 24px;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border)}.md-history-title{font-size:11px;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}.md-history-list{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}.md-history-item{flex-shrink:0;padding:6px 12px;background:var(--md-bg);border:1px solid var(--md-border);border-radius:var(--md-radius);font-size:12px;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);display:flex;align-items:center;gap:6px}.md-history-item:hover{border-color:var(--md-primary);color:var(--md-primary)}.md-history-item .date{color:var(--md-text-muted);font-size:10px}.md-filter-chips{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}.md-filter-chip{padding:4px 10px;background:var(--md-bg);border:1px solid var(--md-border);border-radius:12px;font-size:11px;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);display:flex;align-items:center;gap:4px}.md-filter-chip:hover{border-color:var(--md-primary);color:var(--md-primary)}.md-filter-chip.active{background:var(--md-primary);border-color:var(--md-primary);color:#fff}.md-filter-chip .count{background:#0000001a;padding:1px 5px;border-radius:8px;font-size:10px}.md-filter-chip.active .count{background:#fff3}.md-skeleton{background:linear-gradient(90deg,var(--md-bg-subtle) 25%,var(--md-bg-hover) 50%,var(--md-bg-subtle) 75%);background-size:200% 100%;animation:skeleton-loading 1.5s infinite;border-radius:var(--md-radius)}@keyframes skeleton-loading{0%{background-position:200% 0}to{background-position:-200% 0}}.md-skeleton-text{height:14px;margin:8px 0}.md-skeleton-text.short{width:60%}.md-skeleton-text.medium{width:80%}@media (max-width: 800px){.md-stats-grid{grid-template-columns:repeat(2,1fr)}.md-split-view{flex-direction:column}.md-split-left,.md-split-right{border-right:none;border-bottom:1px solid var(--md-border)}.md-settings-content{grid-template-columns:1fr}}.md-progress-current{display:flex;align-items:center;gap:8px;margin-top:8px;padding:6px 10px;background:var(--md-bg);border-radius:var(--md-radius);border:1px solid var(--md-border);font-size:12px;color:var(--md-text-subtle);overflow:hidden}.md-progress-page-icon{flex-shrink:0}.md-progress-page-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--md-text)}@media (max-width: 768px){.md-modal-header{padding:16px 16px 12px}.md-modal-header h3{font-size:18px}.md-modal-header .subtitle{font-size:13px}.md-controls{padding:12px 16px;gap:6px;flex-wrap:wrap}.md-btn-sm{padding:6px 10px;font-size:12px}.md-tree-container{padding:12px 16px}.md-settings-panel{margin:0 16px 12px}.md-settings-toggle{padding:10px 12px;font-size:13px}.md-settings-content{padding:12px}.md-modal-footer{padding:12px 16px;flex-direction:column;gap:12px}.md-footer-left,.md-footer-right{width:100%;justify-content:center}.md-shortcuts-hint{flex-wrap:wrap;justify-content:center}.md-footer-right{flex-direction:column;gap:8px}.md-footer-right .md-btn{width:100%;justify-content:center}}@media (max-width: 480px){.md-modal-header{padding:12px 12px 10px}.md-modal-header h3{font-size:16px}.md-modal-header .subtitle{font-size:12px;flex-wrap:wrap}.md-page-count{font-size:11px;padding:1px 6px}.md-search-bar{margin:8px 12px}.md-search-bar input{font-size:14px;padding:8px 32px 8px 36px}.md-controls{padding:8px 12px;gap:4px}.md-btn-sm{padding:5px 8px;font-size:11px}.md-filter-chip{padding:4px 8px;font-size:11px}.md-selection-count{font-size:11px}.md-stats-section{margin:8px 12px;padding:10px}.md-stats-grid{gap:8px}.md-stat-item{padding:8px}.md-stat-icon{font-size:18px}.md-stat-value{font-size:16px}.md-stat-label{font-size:10px}.md-tree-container{padding:8px 12px}.md-tree-item{padding:6px 8px;font-size:13px}.md-tree-toggler{width:20px;height:20px}.md-tree-toggler svg{width:14px;height:14px}.md-tree-checkbox{width:16px;height:16px}.md-tree-icon svg{width:16px;height:16px}.md-child-count{font-size:10px;padding:1px 5px}.md-settings-panel{margin:0 12px 10px}.md-settings-toggle{padding:8px 10px;font-size:12px}.md-settings-content{padding:10px;font-size:12px}.md-checkbox-label{font-size:12px}.md-option-label{font-size:11px}.md-radio-group label{font-size:12px}.md-preset-btn{padding:8px 12px;font-size:12px}.md-modal-footer{padding:10px 12px}.md-shortcuts-hint{display:none}.md-btn{font-size:13px;padding:8px 14px}.md-btn-badge{width:18px;height:18px;font-size:11px}}@media (max-width: 360px){.md-modal-header h3{font-size:15px}.md-btn-sm{padding:4px 6px;font-size:10px}.md-tree-item{font-size:12px}.md-settings-toggle{font-size:11px}}@media (max-height: 500px) and (orientation: landscape){.md-modal-content{max-height:98vh}.md-modal-header{padding:10px 16px 8px}.md-modal-header h3{font-size:16px}.md-stats-section{display:none}.md-controls,.md-tree-container,.md-modal-footer{padding:8px 16px}.md-shortcuts-hint{display:none}} ');

(function () {
  'use strict';

  const MAX_CONCURRENCY = 6;
  const PAGE_LIMIT = 50;
  const DEBUG = false;
  const EXPAND_CONTENT = "body.view,ancestors,version";
  async function runWithConcurrency(items, fn, options) {
    const { concurrency, onProgress } = options;
    const results = new Array(items.length);
    let completed = 0;
    let currentIndex = 0;
    async function worker() {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        const item = items[index];
        try {
          results[index] = await fn(item, index);
        } catch (error) {
          throw error;
        }
        completed++;
        onProgress == null ? void 0 : onProgress(completed, items.length);
      }
    }
    const workers = [];
    const workerCount = Math.min(concurrency, items.length);
    for (let i = 0; i < workerCount; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    return results;
  }
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function withRetry(fn, maxRetries = 3, baseDelay = 1e3) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.message.includes("429")) {
          const waitTime = baseDelay * Math.pow(2, attempt);
          await delay(waitTime);
          continue;
        }
        if (attempt < maxRetries) {
          await delay(baseDelay * (attempt + 1));
        }
      }
    }
    throw lastError;
  }
  function getEnvironment() {
    var _a;
    if (typeof GM_xmlhttpRequest !== "undefined") {
      return "tampermonkey";
    }
    if (typeof chrome !== "undefined" && ((_a = chrome.runtime) == null ? void 0 : _a.id)) {
      return "extension";
    }
    return "browser";
  }
  const ENV = getEnvironment();
  const IS_TAMPERMONKEY = ENV === "tampermonkey";
  function getBaseUrl() {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }
  function gmFetch(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        headers: { Accept: "application/json" },
        onload(response) {
          if (response.status >= 200 && response.status < 300) {
            try {
              resolve(JSON.parse(response.responseText));
            } catch (e) {
              reject(new Error(`JSON parse error: ${e}`));
            }
          } else if (response.status === 429) {
            reject(new Error("429 Rate Limited"));
          } else {
            reject(new Error(`API error ${response.status}: ${response.statusText}`));
          }
        },
        onerror(response) {
          reject(new Error(`Network error: ${response.statusText || "Unknown"}`));
        }
      });
    });
  }
  async function browserFetch(url) {
    var _a;
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (response.ok) {
        return response.json();
      }
      if (response.status === 429) {
        throw new Error("429 Rate Limited");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (typeof chrome !== "undefined" && ((_a = chrome.runtime) == null ? void 0 : _a.sendMessage)) {
        const result = await chrome.runtime.sendMessage({
          type: "FETCH",
          url
        });
        if (result.success) {
          return result.data;
        }
        if (result.status === 429) {
          throw new Error("429 Rate Limited");
        }
        throw new Error(result.error || "Background fetch failed");
      }
      throw error;
    }
  }
  function fetchJson$1(url) {
    return withRetry(async () => {
      if (IS_TAMPERMONKEY) {
        return gmFetch(url);
      }
      return browserFetch(url);
    });
  }
  async function fetchPage(pageId) {
    const url = `${getBaseUrl()}/rest/api/content/${pageId}`;
    return fetchJson$1(url);
  }
  async function fetchPageWithContent(pageId) {
    const url = `${getBaseUrl()}/rest/api/content/${pageId}?expand=${EXPAND_CONTENT}`;
    return fetchJson$1(url);
  }
  async function fetchChildren(pageId) {
    var _a, _b;
    const baseUrl = getBaseUrl();
    const children = [];
    let start = 0;
    let hasMore = true;
    while (hasMore) {
      const url = `${baseUrl}/rest/api/content/${pageId}/child/page?limit=${PAGE_LIMIT}&start=${start}`;
      const response = await fetchJson$1(url);
      if ((_a = response.results) == null ? void 0 : _a.length) {
        children.push(...response.results);
      }
      hasMore = ((_b = response.results) == null ? void 0 : _b.length) === PAGE_LIMIT;
      start += PAGE_LIMIT;
    }
    return children;
  }
  const TREE_CONCURRENCY = 8;
  async function buildPageTree(rootPageId, onStatus) {
    const processedIds = /* @__PURE__ */ new Set();
    let counter = 0;
    async function processNode(pageId, level, parentId) {
      if (processedIds.has(pageId)) {
        return { id: pageId, title: "[Duplicate]", level, parentId, children: [], error: true };
      }
      processedIds.add(pageId);
      counter++;
      onStatus == null ? void 0 : onStatus(`Scanning: ${counter} pages found...`);
      try {
        const [pageInfo, children] = await Promise.all([
          fetchPage(pageId),
          fetchChildren(pageId)
        ]);
        const childNodes = await runWithConcurrency(
          children,
          async (child) => processNode(child.id, level + 1, pageId),
          { concurrency: TREE_CONCURRENCY }
        );
        return {
          id: pageId,
          title: pageInfo.title,
          level,
          parentId,
          children: childNodes,
          error: false
        };
      } catch (error) {
        return {
          id: pageId,
          title: `Error loading (${pageId})`,
          level,
          parentId,
          children: [],
          error: true
        };
      }
    }
    return processNode(rootPageId, 0, null);
  }
  function flattenTree(node) {
    const result = [node];
    for (const child of node.children) {
      result.push(...flattenTree(child));
    }
    return result;
  }
  function extend(destination) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) destination[key] = source[key];
      }
    }
    return destination;
  }
  function repeat(character, count) {
    return Array(count + 1).join(character);
  }
  function trimLeadingNewlines(string) {
    return string.replace(/^\n*/, "");
  }
  function trimTrailingNewlines(string) {
    var indexEnd = string.length;
    while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
    return string.substring(0, indexEnd);
  }
  function trimNewlines(string) {
    return trimTrailingNewlines(trimLeadingNewlines(string));
  }
  var blockElements = [
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "AUDIO",
    "BLOCKQUOTE",
    "BODY",
    "CANVAS",
    "CENTER",
    "DD",
    "DIR",
    "DIV",
    "DL",
    "DT",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "FRAMESET",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HGROUP",
    "HR",
    "HTML",
    "ISINDEX",
    "LI",
    "MAIN",
    "MENU",
    "NAV",
    "NOFRAMES",
    "NOSCRIPT",
    "OL",
    "OUTPUT",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TBODY",
    "TD",
    "TFOOT",
    "TH",
    "THEAD",
    "TR",
    "UL"
  ];
  function isBlock(node) {
    return is(node, blockElements);
  }
  var voidElements = [
    "AREA",
    "BASE",
    "BR",
    "COL",
    "COMMAND",
    "EMBED",
    "HR",
    "IMG",
    "INPUT",
    "KEYGEN",
    "LINK",
    "META",
    "PARAM",
    "SOURCE",
    "TRACK",
    "WBR"
  ];
  function isVoid(node) {
    return is(node, voidElements);
  }
  function hasVoid(node) {
    return has(node, voidElements);
  }
  var meaningfulWhenBlankElements = [
    "A",
    "TABLE",
    "THEAD",
    "TBODY",
    "TFOOT",
    "TH",
    "TD",
    "IFRAME",
    "SCRIPT",
    "AUDIO",
    "VIDEO"
  ];
  function isMeaningfulWhenBlank(node) {
    return is(node, meaningfulWhenBlankElements);
  }
  function hasMeaningfulWhenBlank(node) {
    return has(node, meaningfulWhenBlankElements);
  }
  function is(node, tagNames) {
    return tagNames.indexOf(node.nodeName) >= 0;
  }
  function has(node, tagNames) {
    return node.getElementsByTagName && tagNames.some(function(tagName) {
      return node.getElementsByTagName(tagName).length;
    });
  }
  var rules$1 = {};
  rules$1.paragraph = {
    filter: "p",
    replacement: function(content) {
      return "\n\n" + content + "\n\n";
    }
  };
  rules$1.lineBreak = {
    filter: "br",
    replacement: function(content, node, options) {
      return options.br + "\n";
    }
  };
  rules$1.heading = {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: function(content, node, options) {
      var hLevel = Number(node.nodeName.charAt(1));
      if (options.headingStyle === "setext" && hLevel < 3) {
        var underline = repeat(hLevel === 1 ? "=" : "-", content.length);
        return "\n\n" + content + "\n" + underline + "\n\n";
      } else {
        return "\n\n" + repeat("#", hLevel) + " " + content + "\n\n";
      }
    }
  };
  rules$1.blockquote = {
    filter: "blockquote",
    replacement: function(content) {
      content = trimNewlines(content).replace(/^/gm, "> ");
      return "\n\n" + content + "\n\n";
    }
  };
  rules$1.list = {
    filter: ["ul", "ol"],
    replacement: function(content, node) {
      var parent = node.parentNode;
      if (parent.nodeName === "LI" && parent.lastElementChild === node) {
        return "\n" + content;
      } else {
        return "\n\n" + content + "\n\n";
      }
    }
  };
  rules$1.listItem = {
    filter: "li",
    replacement: function(content, node, options) {
      var prefix = options.bulletListMarker + "   ";
      var parent = node.parentNode;
      if (parent.nodeName === "OL") {
        var start = parent.getAttribute("start");
        var index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + ".  ";
      }
      var isParagraph = /\n$/.test(content);
      content = trimNewlines(content) + (isParagraph ? "\n" : "");
      content = content.replace(/\n/gm, "\n" + " ".repeat(prefix.length));
      return prefix + content + (node.nextSibling ? "\n" : "");
    }
  };
  rules$1.indentedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content, node, options) {
      return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
    }
  };
  rules$1.fencedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content, node, options) {
      var className = node.firstChild.getAttribute("class") || "";
      var language = (className.match(/language-(\S+)/) || [null, ""])[1];
      var code = node.firstChild.textContent;
      var fenceChar = options.fence.charAt(0);
      var fenceSize = 3;
      var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
      var match;
      while (match = fenceInCodeRegex.exec(code)) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1;
        }
      }
      var fence = repeat(fenceChar, fenceSize);
      return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
    }
  };
  rules$1.horizontalRule = {
    filter: "hr",
    replacement: function(content, node, options) {
      return "\n\n" + options.hr + "\n\n";
    }
  };
  rules$1.inlineLink = {
    filter: function(node, options) {
      return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content, node) {
      var href = node.getAttribute("href");
      if (href) href = href.replace(/([()])/g, "\\$1");
      var title = cleanAttribute(node.getAttribute("title"));
      if (title) title = ' "' + title.replace(/"/g, '\\"') + '"';
      return "[" + content + "](" + href + title + ")";
    }
  };
  rules$1.referenceLink = {
    filter: function(node, options) {
      return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content, node, options) {
      var href = node.getAttribute("href");
      var title = cleanAttribute(node.getAttribute("title"));
      if (title) title = ' "' + title + '"';
      var replacement;
      var reference;
      switch (options.linkReferenceStyle) {
        case "collapsed":
          replacement = "[" + content + "][]";
          reference = "[" + content + "]: " + href + title;
          break;
        case "shortcut":
          replacement = "[" + content + "]";
          reference = "[" + content + "]: " + href + title;
          break;
        default:
          var id = this.references.length + 1;
          replacement = "[" + content + "][" + id + "]";
          reference = "[" + id + "]: " + href + title;
      }
      this.references.push(reference);
      return replacement;
    },
    references: [],
    append: function(options) {
      var references = "";
      if (this.references.length) {
        references = "\n\n" + this.references.join("\n") + "\n\n";
        this.references = [];
      }
      return references;
    }
  };
  rules$1.emphasis = {
    filter: ["em", "i"],
    replacement: function(content, node, options) {
      if (!content.trim()) return "";
      return options.emDelimiter + content + options.emDelimiter;
    }
  };
  rules$1.strong = {
    filter: ["strong", "b"],
    replacement: function(content, node, options) {
      if (!content.trim()) return "";
      return options.strongDelimiter + content + options.strongDelimiter;
    }
  };
  rules$1.code = {
    filter: function(node) {
      var hasSiblings = node.previousSibling || node.nextSibling;
      var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
      return node.nodeName === "CODE" && !isCodeBlock;
    },
    replacement: function(content) {
      if (!content) return "";
      content = content.replace(/\r?\n|\r/g, " ");
      var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? " " : "";
      var delimiter = "`";
      var matches = content.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
      return delimiter + extraSpace + content + extraSpace + delimiter;
    }
  };
  rules$1.image = {
    filter: "img",
    replacement: function(content, node) {
      var alt = cleanAttribute(node.getAttribute("alt"));
      var src = node.getAttribute("src") || "";
      var title = cleanAttribute(node.getAttribute("title"));
      var titlePart = title ? ' "' + title + '"' : "";
      return src ? "![" + alt + "](" + src + titlePart + ")" : "";
    }
  };
  function cleanAttribute(attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
  }
  function Rules(options) {
    this.options = options;
    this._keep = [];
    this._remove = [];
    this.blankRule = {
      replacement: options.blankReplacement
    };
    this.keepReplacement = options.keepReplacement;
    this.defaultRule = {
      replacement: options.defaultReplacement
    };
    this.array = [];
    for (var key in options.rules) this.array.push(options.rules[key]);
  }
  Rules.prototype = {
    add: function(key, rule) {
      this.array.unshift(rule);
    },
    keep: function(filter) {
      this._keep.unshift({
        filter,
        replacement: this.keepReplacement
      });
    },
    remove: function(filter) {
      this._remove.unshift({
        filter,
        replacement: function() {
          return "";
        }
      });
    },
    forNode: function(node) {
      if (node.isBlank) return this.blankRule;
      var rule;
      if (rule = findRule(this.array, node, this.options)) return rule;
      if (rule = findRule(this._keep, node, this.options)) return rule;
      if (rule = findRule(this._remove, node, this.options)) return rule;
      return this.defaultRule;
    },
    forEach: function(fn) {
      for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
    }
  };
  function findRule(rules2, node, options) {
    for (var i = 0; i < rules2.length; i++) {
      var rule = rules2[i];
      if (filterValue(rule, node, options)) return rule;
    }
    return void 0;
  }
  function filterValue(rule, node, options) {
    var filter = rule.filter;
    if (typeof filter === "string") {
      if (filter === node.nodeName.toLowerCase()) return true;
    } else if (Array.isArray(filter)) {
      if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
    } else if (typeof filter === "function") {
      if (filter.call(rule, node, options)) return true;
    } else {
      throw new TypeError("`filter` needs to be a string, array, or function");
    }
  }
  function collapseWhitespace(options) {
    var element = options.element;
    var isBlock2 = options.isBlock;
    var isVoid2 = options.isVoid;
    var isPre = options.isPre || function(node2) {
      return node2.nodeName === "PRE";
    };
    if (!element.firstChild || isPre(element)) return;
    var prevText = null;
    var keepLeadingWs = false;
    var prev = null;
    var node = next(prev, element, isPre);
    while (node !== element) {
      if (node.nodeType === 3 || node.nodeType === 4) {
        var text = node.data.replace(/[ \r\n\t]+/g, " ");
        if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
          text = text.substr(1);
        }
        if (!text) {
          node = remove(node);
          continue;
        }
        node.data = text;
        prevText = node;
      } else if (node.nodeType === 1) {
        if (isBlock2(node) || node.nodeName === "BR") {
          if (prevText) {
            prevText.data = prevText.data.replace(/ $/, "");
          }
          prevText = null;
          keepLeadingWs = false;
        } else if (isVoid2(node) || isPre(node)) {
          prevText = null;
          keepLeadingWs = true;
        } else if (prevText) {
          keepLeadingWs = false;
        }
      } else {
        node = remove(node);
        continue;
      }
      var nextNode = next(prev, node, isPre);
      prev = node;
      node = nextNode;
    }
    if (prevText) {
      prevText.data = prevText.data.replace(/ $/, "");
      if (!prevText.data) {
        remove(prevText);
      }
    }
  }
  function remove(node) {
    var next2 = node.nextSibling || node.parentNode;
    node.parentNode.removeChild(node);
    return next2;
  }
  function next(prev, current, isPre) {
    if (prev && prev.parentNode === current || isPre(current)) {
      return current.nextSibling || current.parentNode;
    }
    return current.firstChild || current.nextSibling || current.parentNode;
  }
  var root = typeof window !== "undefined" ? window : {};
  function canParseHTMLNatively() {
    var Parser = root.DOMParser;
    var canParse = false;
    try {
      if (new Parser().parseFromString("", "text/html")) {
        canParse = true;
      }
    } catch (e) {
    }
    return canParse;
  }
  function createHTMLParser() {
    var Parser = function() {
    };
    {
      if (shouldUseActiveX()) {
        Parser.prototype.parseFromString = function(string) {
          var doc = new window.ActiveXObject("htmlfile");
          doc.designMode = "on";
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      } else {
        Parser.prototype.parseFromString = function(string) {
          var doc = document.implementation.createHTMLDocument("");
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      }
    }
    return Parser;
  }
  function shouldUseActiveX() {
    var useActiveX = false;
    try {
      document.implementation.createHTMLDocument("").open();
    } catch (e) {
      if (root.ActiveXObject) useActiveX = true;
    }
    return useActiveX;
  }
  var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
  function RootNode(input, options) {
    var root2;
    if (typeof input === "string") {
      var doc = htmlParser().parseFromString(
        // DOM parsers arrange elements in the <head> and <body>.
        // Wrapping in a custom element ensures elements are reliably arranged in
        // a single element.
        '<x-turndown id="turndown-root">' + input + "</x-turndown>",
        "text/html"
      );
      root2 = doc.getElementById("turndown-root");
    } else {
      root2 = input.cloneNode(true);
    }
    collapseWhitespace({
      element: root2,
      isBlock,
      isVoid,
      isPre: options.preformattedCode ? isPreOrCode : null
    });
    return root2;
  }
  var _htmlParser;
  function htmlParser() {
    _htmlParser = _htmlParser || new HTMLParser();
    return _htmlParser;
  }
  function isPreOrCode(node) {
    return node.nodeName === "PRE" || node.nodeName === "CODE";
  }
  function Node(node, options) {
    node.isBlock = isBlock(node);
    node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node, options);
    return node;
  }
  function isBlank(node) {
    return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
  }
  function flankingWhitespace(node, options) {
    if (node.isBlock || options.preformattedCode && node.isCode) {
      return { leading: "", trailing: "" };
    }
    var edges = edgeWhitespace(node.textContent);
    if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
      edges.leading = edges.leadingNonAscii;
    }
    if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
      edges.trailing = edges.trailingNonAscii;
    }
    return { leading: edges.leading, trailing: edges.trailing };
  }
  function edgeWhitespace(string) {
    var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
    return {
      leading: m[1],
      // whole string for whitespace-only strings
      leadingAscii: m[2],
      leadingNonAscii: m[3],
      trailing: m[4],
      // empty for whitespace-only strings
      trailingNonAscii: m[5],
      trailingAscii: m[6]
    };
  }
  function isFlankedByWhitespace(side, node, options) {
    var sibling;
    var regExp;
    var isFlanked;
    if (side === "left") {
      sibling = node.previousSibling;
      regExp = / $/;
    } else {
      sibling = node.nextSibling;
      regExp = /^ /;
    }
    if (sibling) {
      if (sibling.nodeType === 3) {
        isFlanked = regExp.test(sibling.nodeValue);
      } else if (options.preformattedCode && sibling.nodeName === "CODE") {
        isFlanked = false;
      } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
        isFlanked = regExp.test(sibling.textContent);
      }
    }
    return isFlanked;
  }
  var reduce = Array.prototype.reduce;
  var escapes = [
    [/\\/g, "\\\\"],
    [/\*/g, "\\*"],
    [/^-/g, "\\-"],
    [/^\+ /g, "\\+ "],
    [/^(=+)/g, "\\$1"],
    [/^(#{1,6}) /g, "\\$1 "],
    [/`/g, "\\`"],
    [/^~~~/g, "\\~~~"],
    [/\[/g, "\\["],
    [/\]/g, "\\]"],
    [/^>/g, "\\>"],
    [/_/g, "\\_"],
    [/^(\d+)\. /g, "$1\\. "]
  ];
  function TurndownService(options) {
    if (!(this instanceof TurndownService)) return new TurndownService(options);
    var defaults = {
      rules: rules$1,
      headingStyle: "setext",
      hr: "* * *",
      bulletListMarker: "*",
      codeBlockStyle: "indented",
      fence: "```",
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
      br: "  ",
      preformattedCode: false,
      blankReplacement: function(content, node) {
        return node.isBlock ? "\n\n" : "";
      },
      keepReplacement: function(content, node) {
        return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
      },
      defaultReplacement: function(content, node) {
        return node.isBlock ? "\n\n" + content + "\n\n" : content;
      }
    };
    this.options = extend({}, defaults, options);
    this.rules = new Rules(this.options);
  }
  TurndownService.prototype = {
    /**
     * The entry point for converting a string or DOM node to Markdown
     * @public
     * @param {String|HTMLElement} input The string or DOM node to convert
     * @returns A Markdown representation of the input
     * @type String
     */
    turndown: function(input) {
      if (!canConvert(input)) {
        throw new TypeError(
          input + " is not a string, or an element/document/fragment node."
        );
      }
      if (input === "") return "";
      var output = process$1.call(this, new RootNode(input, this.options));
      return postProcess.call(this, output);
    },
    /**
     * Add one or more plugins
     * @public
     * @param {Function|Array} plugin The plugin or array of plugins to add
     * @returns The Turndown instance for chaining
     * @type Object
     */
    use: function(plugin) {
      if (Array.isArray(plugin)) {
        for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
      } else if (typeof plugin === "function") {
        plugin(this);
      } else {
        throw new TypeError("plugin must be a Function or an Array of Functions");
      }
      return this;
    },
    /**
     * Adds a rule
     * @public
     * @param {String} key The unique key of the rule
     * @param {Object} rule The rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    addRule: function(key, rule) {
      this.rules.add(key, rule);
      return this;
    },
    /**
     * Keep a node (as HTML) that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    keep: function(filter) {
      this.rules.keep(filter);
      return this;
    },
    /**
     * Remove a node that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    remove: function(filter) {
      this.rules.remove(filter);
      return this;
    },
    /**
     * Escapes Markdown syntax
     * @public
     * @param {String} string The string to escape
     * @returns A string with Markdown syntax escaped
     * @type String
     */
    escape: function(string) {
      return escapes.reduce(function(accumulator, escape) {
        return accumulator.replace(escape[0], escape[1]);
      }, string);
    }
  };
  function process$1(parentNode) {
    var self2 = this;
    return reduce.call(parentNode.childNodes, function(output, node) {
      node = new Node(node, self2.options);
      var replacement = "";
      if (node.nodeType === 3) {
        replacement = node.isCode ? node.nodeValue : self2.escape(node.nodeValue);
      } else if (node.nodeType === 1) {
        replacement = replacementForNode.call(self2, node);
      }
      return join(output, replacement);
    }, "");
  }
  function postProcess(output) {
    var self2 = this;
    this.rules.forEach(function(rule) {
      if (typeof rule.append === "function") {
        output = join(output, rule.append(self2.options));
      }
    });
    return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
  }
  function replacementForNode(node) {
    var rule = this.rules.forNode(node);
    var content = process$1.call(this, node);
    var whitespace = node.flankingWhitespace;
    if (whitespace.leading || whitespace.trailing) content = content.trim();
    return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
  }
  function join(output, replacement) {
    var s1 = trimTrailingNewlines(output);
    var s2 = trimLeadingNewlines(replacement);
    var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
    var separator = "\n\n".substring(0, nls);
    return s1 + separator + s2;
  }
  function canConvert(input) {
    return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
  }
  var highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;
  function highlightedCodeBlock(turndownService) {
    turndownService.addRule("highlightedCodeBlock", {
      filter: function(node) {
        var firstChild = node.firstChild;
        return node.nodeName === "DIV" && highlightRegExp.test(node.className) && firstChild && firstChild.nodeName === "PRE";
      },
      replacement: function(content, node, options) {
        var className = node.className || "";
        var language = (className.match(highlightRegExp) || [null, ""])[1];
        return "\n\n" + options.fence + language + "\n" + node.firstChild.textContent + "\n" + options.fence + "\n\n";
      }
    });
  }
  function strikethrough(turndownService) {
    turndownService.addRule("strikethrough", {
      filter: ["del", "s", "strike"],
      replacement: function(content) {
        return "~" + content + "~";
      }
    });
  }
  var indexOf = Array.prototype.indexOf;
  var every = Array.prototype.every;
  var rules = {};
  rules.tableCell = {
    filter: ["th", "td"],
    replacement: function(content, node) {
      return cell(content, node);
    }
  };
  rules.tableRow = {
    filter: "tr",
    replacement: function(content, node) {
      var borderCells = "";
      var alignMap = { left: ":--", right: "--:", center: ":-:" };
      if (isHeadingRow(node)) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var border = "---";
          var align = (node.childNodes[i].getAttribute("align") || "").toLowerCase();
          if (align) border = alignMap[align] || border;
          borderCells += cell(border, node.childNodes[i]);
        }
      }
      return "\n" + content + (borderCells ? "\n" + borderCells : "");
    }
  };
  rules.table = {
    // Only convert tables with a heading row.
    // Tables with no heading row are kept using `keep` (see below).
    filter: function(node) {
      return node.nodeName === "TABLE" && isHeadingRow(node.rows[0]);
    },
    replacement: function(content) {
      content = content.replace("\n\n", "\n");
      return "\n\n" + content + "\n\n";
    }
  };
  rules.tableSection = {
    filter: ["thead", "tbody", "tfoot"],
    replacement: function(content) {
      return content;
    }
  };
  function isHeadingRow(tr) {
    var parentNode = tr.parentNode;
    return parentNode.nodeName === "THEAD" || parentNode.firstChild === tr && (parentNode.nodeName === "TABLE" || isFirstTbody(parentNode)) && every.call(tr.childNodes, function(n) {
      return n.nodeName === "TH";
    });
  }
  function isFirstTbody(element) {
    var previousSibling = element.previousSibling;
    return element.nodeName === "TBODY" && (!previousSibling || previousSibling.nodeName === "THEAD" && /^\s*$/i.test(previousSibling.textContent));
  }
  function cell(content, node) {
    var index = indexOf.call(node.parentNode.childNodes, node);
    var prefix = " ";
    if (index === 0) prefix = "| ";
    return prefix + content + " |";
  }
  function tables(turndownService) {
    turndownService.keep(function(node) {
      return node.nodeName === "TABLE" && !isHeadingRow(node.rows[0]);
    });
    for (var key in rules) turndownService.addRule(key, rules[key]);
  }
  function taskListItems(turndownService) {
    turndownService.addRule("taskListItems", {
      filter: function(node) {
        return node.type === "checkbox" && node.parentNode.nodeName === "LI";
      },
      replacement: function(content, node) {
        return (node.checked ? "[x]" : "[ ]") + " ";
      }
    });
  }
  function gfm(turndownService) {
    turndownService.use([
      highlightedCodeBlock,
      strikethrough,
      tables,
      taskListItems
    ]);
  }
  var MERMAID_ARROW_MAP = {
    // Standard arrows
    "-->": { sourceType: "none", targetType: "arrow", lineType: "solid" },
    "---": { sourceType: "none", targetType: "none", lineType: "solid" },
    "-.->": { sourceType: "none", targetType: "arrow", lineType: "dashed" },
    "-.-": { sourceType: "none", targetType: "none", lineType: "dashed" },
    "..>": { sourceType: "none", targetType: "arrow", lineType: "dotted" },
    "...": { sourceType: "none", targetType: "none", lineType: "dotted" },
    // Thick arrows
    "==>": { sourceType: "none", targetType: "arrow", lineType: "thick" },
    "===": { sourceType: "none", targetType: "none", lineType: "thick" },
    // Bidirectional
    "<-->": { sourceType: "arrow", targetType: "arrow", lineType: "solid" },
    "<-.->": { sourceType: "arrow", targetType: "arrow", lineType: "dashed" },
    "<==>": { sourceType: "arrow", targetType: "arrow", lineType: "thick" },
    // Circle endpoints
    "--o": { sourceType: "none", targetType: "circle", lineType: "solid" },
    "o--": { sourceType: "circle", targetType: "none", lineType: "solid" },
    "o--o": { sourceType: "circle", targetType: "circle", lineType: "solid" },
    // Cross endpoints
    "--x": { sourceType: "none", targetType: "cross", lineType: "solid" },
    "x--": { sourceType: "cross", targetType: "none", lineType: "solid" },
    "x--x": { sourceType: "cross", targetType: "cross", lineType: "solid" }
  };
  function parseMermaidArrow(arrow) {
    const normalized = arrow.trim().toLowerCase();
    if (MERMAID_ARROW_MAP[normalized]) {
      return MERMAID_ARROW_MAP[normalized];
    }
    const config2 = {
      sourceType: "none",
      targetType: "arrow",
      lineType: "solid"
    };
    if (normalized.includes("-.") || normalized.includes(".-")) {
      config2.lineType = "dashed";
    } else if (normalized.includes("..")) {
      config2.lineType = "dotted";
    } else if (normalized.includes("==") || normalized.includes("=")) {
      config2.lineType = "thick";
    }
    if (normalized.startsWith("<") || normalized.startsWith("o") || normalized.startsWith("x")) {
      if (normalized.startsWith("<")) config2.sourceType = "arrow";
      else if (normalized.startsWith("o")) config2.sourceType = "circle";
      else if (normalized.startsWith("x")) config2.sourceType = "cross";
    }
    if (normalized.endsWith(">") || normalized.endsWith("o") || normalized.endsWith("x")) {
      if (normalized.endsWith(">")) config2.targetType = "arrow";
      else if (normalized.endsWith("o")) config2.targetType = "circle";
      else if (normalized.endsWith("x")) config2.targetType = "cross";
    }
    return config2;
  }
  var DRAWIO_ARROW_HEAD_MAP = {
    "none": "none",
    "arrow": "classic",
    "open": "open",
    "diamond": "diamond",
    "diamond-filled": "diamondThin",
    "circle": "oval",
    "circle-filled": "ovalThin",
    "cross": "cross",
    "bar": "dash"
  };
  var DRAWIO_ARROW_HEAD_REVERSE = {
    "none": "none",
    "classic": "arrow",
    "classicThin": "arrow",
    "open": "open",
    "openThin": "open",
    "diamond": "diamond",
    "diamondThin": "diamond-filled",
    "oval": "circle",
    "ovalThin": "circle-filled",
    "cross": "cross",
    "dash": "bar",
    "block": "arrow",
    "blockThin": "arrow"
  };
  function generateDrawioArrowStyle(arrow) {
    const parts = [];
    parts.push(`startArrow=${DRAWIO_ARROW_HEAD_MAP[arrow.sourceType]}`);
    parts.push(`endArrow=${DRAWIO_ARROW_HEAD_MAP[arrow.targetType]}`);
    if (arrow.lineType === "dashed") {
      parts.push("dashed=1");
    } else if (arrow.lineType === "dotted") {
      parts.push("dashed=1");
      parts.push("dashPattern=1 2");
    } else if (arrow.lineType === "thick") {
      parts.push("strokeWidth=3");
    }
    return parts.join(";");
  }
  var EXCALIDRAW_ARROW_HEAD_MAP = {
    "none": null,
    "arrow": "arrow",
    "open": "triangle",
    "diamond": "diamond",
    "diamond-filled": "diamond",
    "circle": "dot",
    "circle-filled": "dot",
    "cross": "bar",
    "bar": "bar"
  };
  function generateExcalidrawArrow(arrow) {
    return {
      startArrowhead: EXCALIDRAW_ARROW_HEAD_MAP[arrow.sourceType],
      endArrowhead: EXCALIDRAW_ARROW_HEAD_MAP[arrow.targetType],
      strokeStyle: arrow.lineType === "thick" ? "solid" : arrow.lineType,
      ...arrow.lineType === "thick" ? { strokeWidth: 4 } : {}
    };
  }
  function generatePlantUMLArrow(arrow) {
    let result = "";
    if (arrow.sourceType === "arrow") result += "<";
    else if (arrow.sourceType === "circle") result += "o";
    else if (arrow.sourceType === "diamond") result += "<|";
    else if (arrow.sourceType === "diamond-filled") result += "*";
    if (arrow.lineType === "dashed") result += "..";
    else if (arrow.lineType === "dotted") result += "..";
    else result += "--";
    if (arrow.targetType === "arrow") result += ">";
    else if (arrow.targetType === "circle") result += "o";
    else if (arrow.targetType === "diamond") result += "|>";
    else if (arrow.targetType === "diamond-filled") result += "*";
    return result || "-->";
  }
  function detectMermaidShape(labelWithBrackets) {
    const trimmed = labelWithBrackets.trim();
    if (trimmed.startsWith("((") && trimmed.endsWith("))")) {
      return { shape: "circle", label: trimmed.slice(2, -2) };
    }
    if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
      return { shape: "hexagon", label: trimmed.slice(2, -2) };
    }
    if (trimmed.startsWith("[(") && trimmed.endsWith(")]")) {
      return { shape: "cylinder", label: trimmed.slice(2, -2) };
    }
    if (trimmed.startsWith("[[") && trimmed.endsWith("]]")) {
      return { shape: "rectangle", label: trimmed.slice(2, -2) };
    }
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      return { shape: "rounded-rectangle", label: trimmed.slice(1, -1) };
    }
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return { shape: "diamond", label: trimmed.slice(1, -1) };
    }
    if (trimmed.startsWith("[/") && trimmed.endsWith("/]")) {
      return { shape: "parallelogram", label: trimmed.slice(2, -2) };
    }
    if (trimmed.startsWith("[\\") && trimmed.endsWith("\\]")) {
      return { shape: "parallelogram", label: trimmed.slice(2, -2) };
    }
    if (trimmed.startsWith("[/") && trimmed.endsWith("\\]")) {
      return { shape: "trapezoid", label: trimmed.slice(2, -2) };
    }
    if (trimmed.startsWith(">") && trimmed.endsWith("]")) {
      return { shape: "note", label: trimmed.slice(1, -1) };
    }
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return { shape: "rectangle", label: trimmed.slice(1, -1) };
    }
    return { shape: "rectangle", label: trimmed };
  }
  function generateMermaidShape(shape, label) {
    switch (shape) {
      case "rectangle":
        return `[${label}]`;
      case "rounded-rectangle":
        return `(${label})`;
      case "circle":
        return `((${label}))`;
      case "ellipse":
        return `([${label}])`;
      case "diamond":
        return `{${label}}`;
      case "hexagon":
        return `{{${label}}}`;
      case "parallelogram":
        return `[/${label}/]`;
      case "trapezoid":
        return `[/${label}\\]`;
      case "cylinder":
        return `[(${label})]`;
      case "note":
        return `>${label}]`;
      default:
        return `[${label}]`;
    }
  }
  var DRAWIO_SHAPE_MAP = {
    "rectangle": "rounded=0",
    "rounded-rectangle": "rounded=1",
    "circle": "ellipse;aspect=fixed",
    "ellipse": "ellipse",
    "diamond": "rhombus",
    "hexagon": "hexagon",
    "parallelogram": "parallelogram",
    "trapezoid": "trapezoid",
    "cylinder": "shape=cylinder3;whiteSpace=wrap;boundedLbl=1",
    "document": "shape=document;whiteSpace=wrap",
    "cloud": "ellipse;shape=cloud",
    "actor": "shape=umlActor;verticalLabelPosition=bottom",
    "note": "shape=note",
    "custom": "rounded=0"
  };
  function parseDrawioShape(style) {
    const styleLower = style.toLowerCase();
    if (styleLower.includes("ellipse") && styleLower.includes("aspect=fixed")) {
      return "circle";
    }
    if (styleLower.includes("ellipse") && styleLower.includes("cloud")) {
      return "cloud";
    }
    if (styleLower.includes("ellipse")) {
      return "ellipse";
    }
    if (styleLower.includes("rhombus")) {
      return "diamond";
    }
    if (styleLower.includes("hexagon")) {
      return "hexagon";
    }
    if (styleLower.includes("parallelogram")) {
      return "parallelogram";
    }
    if (styleLower.includes("trapezoid")) {
      return "trapezoid";
    }
    if (styleLower.includes("cylinder")) {
      return "cylinder";
    }
    if (styleLower.includes("document")) {
      return "document";
    }
    if (styleLower.includes("umlactor")) {
      return "actor";
    }
    if (styleLower.includes("note")) {
      return "note";
    }
    if (styleLower.includes("rounded=1")) {
      return "rounded-rectangle";
    }
    return "rectangle";
  }
  var EXCALIDRAW_SHAPE_MAP = {
    "rectangle": "rectangle",
    "rounded-rectangle": "rectangle",
    // + roundness property
    "circle": "ellipse",
    "ellipse": "ellipse",
    "diamond": "diamond",
    "hexagon": "rectangle",
    // No native hexagon
    "parallelogram": "rectangle",
    "trapezoid": "rectangle",
    "cylinder": "rectangle",
    "document": "rectangle",
    "cloud": "ellipse",
    "actor": "rectangle",
    "note": "rectangle",
    "custom": "rectangle"
  };
  function getExcalidrawRoundness(shape) {
    if (shape === "rounded-rectangle") {
      return { type: 3 };
    }
    if (shape === "circle" || shape === "ellipse") {
      return null;
    }
    return null;
  }
  var PLANTUML_SHAPE_MAP = {
    "rectangle": "rectangle",
    "rounded-rectangle": "card",
    "circle": "circle",
    "ellipse": "usecase",
    "diamond": "agent",
    // Will add <<choice>> stereotype
    "hexagon": "hexagon",
    "parallelogram": "rectangle",
    "trapezoid": "rectangle",
    "cylinder": "database",
    "document": "file",
    "cloud": "cloud",
    "actor": "actor",
    "note": "note",
    "custom": "rectangle"
  };
  function getNodeBounds(node, defaultSize) {
    var _a, _b, _c, _d;
    return {
      x: ((_a = node.position) == null ? void 0 : _a.x) ?? 0,
      y: ((_b = node.position) == null ? void 0 : _b.y) ?? 0,
      width: ((_c = node.size) == null ? void 0 : _c.width) ?? defaultSize.width,
      height: ((_d = node.size) == null ? void 0 : _d.height) ?? defaultSize.height
    };
  }
  function getConnectionPoints(source, target, defaultSize) {
    const sBounds = getNodeBounds(source, defaultSize);
    const tBounds = getNodeBounds(target, defaultSize);
    const sCenter = { x: sBounds.x + sBounds.width / 2, y: sBounds.y + sBounds.height / 2 };
    const tCenter = { x: tBounds.x + tBounds.width / 2, y: tBounds.y + tBounds.height / 2 };
    const dx = tCenter.x - sCenter.x;
    const dy = tCenter.y - sCenter.y;
    let startSide;
    let endSide;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        startSide = "right";
        endSide = "left";
      } else {
        startSide = "left";
        endSide = "right";
      }
    } else {
      if (dy > 0) {
        startSide = "bottom";
        endSide = "top";
      } else {
        startSide = "top";
        endSide = "bottom";
      }
    }
    return {
      start: getConnectionPointOnSide(sBounds, startSide),
      end: getConnectionPointOnSide(tBounds, endSide)
    };
  }
  function getConnectionPointOnSide(bounds, side) {
    switch (side) {
      case "top":
        return { x: bounds.x + bounds.width / 2, y: bounds.y, side };
      case "right":
        return { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, side };
      case "bottom":
        return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, side };
      case "left":
        return { x: bounds.x, y: bounds.y + bounds.height / 2, side };
    }
  }
  function generateOrthogonalPath(start, end, offset = 20) {
    const points = [{ x: start.x, y: start.y }];
    if (start.side === "right" && end.side === "left") {
      const midX = (start.x + end.x) / 2;
      points.push({ x: midX, y: start.y });
      points.push({ x: midX, y: end.y });
    } else if (start.side === "left" && end.side === "right") {
      const midX = (start.x + end.x) / 2;
      points.push({ x: midX, y: start.y });
      points.push({ x: midX, y: end.y });
    } else if (start.side === "bottom" && end.side === "top") {
      const midY = (start.y + end.y) / 2;
      points.push({ x: start.x, y: midY });
      points.push({ x: end.x, y: midY });
    } else if (start.side === "top" && end.side === "bottom") {
      const midY = (start.y + end.y) / 2;
      points.push({ x: start.x, y: midY });
      points.push({ x: end.x, y: midY });
    } else if (start.side === "right" && end.side === "top") {
      points.push({ x: start.x + offset, y: start.y });
      points.push({ x: start.x + offset, y: end.y - offset });
      points.push({ x: end.x, y: end.y - offset });
    } else if (start.side === "bottom" && end.side === "left") {
      points.push({ x: start.x, y: start.y + offset });
      points.push({ x: end.x - offset, y: start.y + offset });
      points.push({ x: end.x - offset, y: end.y });
    } else {
      points.push({ x: end.x, y: start.y });
    }
    points.push({ x: end.x, y: end.y });
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }
  function generateCurvedPath(start, end, curvature = 0.5) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let cp1x, cp1y, cp2x, cp2y;
    if (start.side === "right" || start.side === "left") {
      const offset = Math.abs(dx) * curvature;
      cp1x = start.x + (start.side === "right" ? offset : -offset);
      cp1y = start.y;
      cp2x = end.x + (end.side === "right" ? offset : -offset);
      cp2y = end.y;
    } else {
      const offset = Math.abs(dy) * curvature;
      cp1x = start.x;
      cp1y = start.y + (start.side === "bottom" ? offset : -offset);
      cp2x = end.x;
      cp2y = end.y + (end.side === "bottom" ? offset : -offset);
    }
    return `M${start.x},${start.y} C${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`;
  }
  var FORMAT_TEXT_DEFAULTS = {
    mermaid: {
      quoteUnicode: false,
      escapeSpecial: true,
      transliterate: false,
      preserveNewlines: true
    },
    plantuml: {
      quoteUnicode: true,
      // PlantUML needs quotes for Unicode
      escapeSpecial: true,
      transliterate: false,
      preserveNewlines: true
    },
    dot: {
      quoteUnicode: true,
      // DOT requires quotes for Unicode
      escapeSpecial: true,
      transliterate: false,
      preserveNewlines: true
    },
    drawio: {
      quoteUnicode: false,
      // XML handles Unicode
      escapeSpecial: true,
      // XML entities
      transliterate: false,
      preserveNewlines: true
    },
    excalidraw: {
      quoteUnicode: false,
      // JSON handles Unicode
      escapeSpecial: false,
      transliterate: false,
      preserveNewlines: true
    },
    svg: {
      quoteUnicode: false,
      escapeSpecial: true,
      // XML entities
      transliterate: false,
      preserveNewlines: true
    }
  };
  function hasCyrillic(text) {
    return /[\u0400-\u04FF]/.test(text);
  }
  function encodeText(text, format, options) {
    const defaults = FORMAT_TEXT_DEFAULTS[format] || {};
    const opts = { ...defaults, ...options };
    let result = text;
    if (opts.maxLength && result.length > opts.maxLength) {
      result = result.slice(0, opts.maxLength - 3) + "...";
    }
    if (opts.transliterate && hasCyrillic(result)) {
      result = transliterateCyrillic(result);
    }
    switch (format) {
      case "mermaid":
        result = encodeMermaid(result, opts);
        break;
      case "plantuml":
        result = encodePlantUML(result, opts);
        break;
      case "dot":
        result = encodeDot(result, opts);
        break;
      case "drawio":
      case "svg":
        result = encodeXml(result);
        break;
    }
    return result;
  }
  function encodeMermaid(text, opts) {
    let result = text;
    if (opts.escapeSpecial) {
      result = result.replace(/"/g, "#quot;").replace(/\[/g, "#91;").replace(/\]/g, "#93;").replace(/\{/g, "#123;").replace(/\}/g, "#125;").replace(/\(/g, "#40;").replace(/\)/g, "#41;");
    }
    if (opts.preserveNewlines) {
      result = result.replace(/\n/g, "<br/>");
    }
    return result;
  }
  function encodePlantUML(text, opts) {
    let result = text;
    if (opts.escapeSpecial) {
      result = result.replace(/"/g, '\\"');
    }
    if (opts.preserveNewlines) {
      result = result.replace(/\n/g, "\\n");
    }
    return result;
  }
  function encodeDot(text, opts) {
    let result = text;
    if (opts.escapeSpecial) {
      result = result.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
    if (opts.preserveNewlines) {
      result = result.replace(/\n/g, "\\n");
    }
    return result;
  }
  function encodeXml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var CYRILLIC_MAP = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "yo",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
    "А": "A",
    "Б": "B",
    "В": "V",
    "Г": "G",
    "Д": "D",
    "Е": "E",
    "Ё": "Yo",
    "Ж": "Zh",
    "З": "Z",
    "И": "I",
    "Й": "Y",
    "К": "K",
    "Л": "L",
    "М": "M",
    "Н": "N",
    "О": "O",
    "П": "P",
    "Р": "R",
    "С": "S",
    "Т": "T",
    "У": "U",
    "Ф": "F",
    "Х": "H",
    "Ц": "Ts",
    "Ч": "Ch",
    "Ш": "Sh",
    "Щ": "Sch",
    "Ъ": "",
    "Ы": "Y",
    "Ь": "",
    "Э": "E",
    "Ю": "Yu",
    "Я": "Ya",
    // Ukrainian
    "і": "i",
    "І": "I",
    "ї": "yi",
    "Ї": "Yi",
    "є": "ye",
    "Є": "Ye",
    "ґ": "g",
    "Ґ": "G"
  };
  function transliterateCyrillic(text) {
    return text.split("").map((char) => CYRILLIC_MAP[char] || char).join("");
  }
  function generateId() {
    return `wb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }
  function escapeXml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  var DiagramError = class extends Error {
    constructor(message, code, context) {
      super(message);
      this.code = code;
      this.context = context;
      this.name = "DiagramError";
    }
  };
  var ParseError = class extends DiagramError {
    constructor(message, format, line, column, context) {
      super(
        line ? `${message} (line ${line}${column ? `:${column}` : ""})` : message,
        "PARSE_ERROR",
        { format, line, column, ...context }
      );
      this.format = format;
      this.line = line;
      this.column = column;
      this.name = "ParseError";
    }
  };
  function validateInput(source, format) {
    if (source === null || source === void 0) {
      throw new ParseError(`Source cannot be null or undefined`, format);
    }
    if (typeof source !== "string") {
      throw new ParseError(`Source must be a string, got ${typeof source}`, format);
    }
    if (source.trim().length === 0) {
      throw new ParseError(`Source cannot be empty`, format);
    }
  }
  function validatePattern(source, pattern, format, message) {
    if (!pattern.test(source)) {
      throw new ParseError(message, format);
    }
  }
  function createEmptyDiagram(type = "flowchart", source) {
    return {
      id: generateId(),
      type,
      nodes: [],
      edges: [],
      groups: [],
      metadata: { source }
    };
  }
  function createNode(id, label, options = {}) {
    return {
      id,
      type: "node",
      label,
      shape: options.shape || "rectangle",
      position: options.position,
      size: options.size,
      style: options.style || {},
      metadata: options.metadata
    };
  }
  function createEdge(source, target, options = {}) {
    return {
      id: generateId(),
      type: "edge",
      source,
      target,
      label: options.label,
      arrow: options.arrow || { sourceType: "none", targetType: "arrow", lineType: "solid" },
      style: options.style || {},
      waypoints: options.waypoints,
      metadata: options.metadata
    };
  }
  function createGroup(id, children, options = {}) {
    return {
      id,
      type: "group",
      label: options.label || id,
      children,
      position: options.position,
      size: options.size,
      style: options.style || {},
      metadata: options.metadata
    };
  }
  function parseMermaid(source) {
    validateInput(source, "mermaid");
    const lines = source.trim().split("\n");
    const nodes = [];
    const edges = [];
    const groups = [];
    const nodeMap = /* @__PURE__ */ new Map();
    const groupStack = [];
    let diagramType = "flowchart";
    let direction = "TB";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("%%")) {
        continue;
      }
      const headerMatch = line.match(/^(flowchart|graph)\s+(TB|BT|LR|RL|TD)/i);
      if (headerMatch) {
        diagramType = "flowchart";
        direction = headerMatch[2].toUpperCase();
        continue;
      }
      const subgraphMatch = line.match(/^subgraph\s+(\w+)(?:\s*\[([^\]]+)\])?/i);
      if (subgraphMatch) {
        const [, id, label] = subgraphMatch;
        const group = {
          id,
          type: "group",
          label: label || id,
          children: [],
          style: {}
        };
        groups.push(group);
        groupStack.push(group);
        continue;
      }
      if (line.toLowerCase() === "end") {
        groupStack.pop();
        continue;
      }
      const edgeMatches = parseEdgeLine(line);
      if (edgeMatches && edgeMatches.length > 0) {
        for (const edgeMatch of edgeMatches) {
          const { sourceId, sourceLabel, arrow, targetId, targetLabel, edgeLabel } = edgeMatch;
          if (!nodeMap.has(sourceId)) {
            const node = createNode2(sourceId, sourceLabel);
            nodes.push(node);
            nodeMap.set(sourceId, node);
            addToCurrentGroup(node.id, groupStack);
          } else if (sourceLabel && sourceLabel !== sourceId) {
            const node = nodeMap.get(sourceId);
            const { shape, label } = detectMermaidShape(sourceLabel);
            node.label = label;
            node.shape = shape;
          }
          if (!nodeMap.has(targetId)) {
            const node = createNode2(targetId, targetLabel);
            nodes.push(node);
            nodeMap.set(targetId, node);
            addToCurrentGroup(node.id, groupStack);
          } else if (targetLabel && targetLabel !== targetId) {
            const node = nodeMap.get(targetId);
            const { shape, label } = detectMermaidShape(targetLabel);
            node.label = label;
            node.shape = shape;
          }
          const edge = {
            id: generateId(),
            type: "edge",
            source: sourceId,
            target: targetId,
            label: edgeLabel,
            arrow: parseMermaidArrow(arrow),
            style: {}
          };
          edges.push(edge);
        }
        continue;
      }
      const standalonePattern = /^(\w+)(\(\([^)]+\)\)|{{[^}]+}}|\[\([^)]+\)\]|\[\[[^\]]+\]\]|\[[^\]]+\]|\([^)]+\)|\{[^}]+\})/;
      const nodeMatch = line.match(standalonePattern);
      if (nodeMatch && !nodeMap.has(nodeMatch[1])) {
        const [, id, labelPart] = nodeMatch;
        const node = createNode2(id, labelPart);
        nodes.push(node);
        nodeMap.set(id, node);
        addToCurrentGroup(node.id, groupStack);
        continue;
      }
      const styleMatch = line.match(/^style\s+(\w+)\s+(.+)/i);
      if (styleMatch) {
        const [, nodeId, styleStr] = styleMatch;
        const node = nodeMap.get(nodeId);
        if (node) {
          applyMermaidStyle(node, styleStr);
        }
        continue;
      }
    }
    return {
      id: generateId(),
      type: diagramType,
      nodes,
      edges,
      groups,
      metadata: {
        source: "mermaid",
        direction
      }
    };
  }
  function parseEdgeLine(line) {
    const shapePattern = "\\(\\([^)]+\\)\\)|{{[^}]+}}|\\[\\([^)]+\\)\\]|\\[\\[[^\\]]+\\]\\]|\\[[^\\]]+\\]|\\([^)]+\\)|\\{[^}]+\\}";
    const arrowPattern = "[<>x\\-o=.]+";
    const results = [];
    let remaining = line.trim();
    const firstNodeRegex = new RegExp(`^(\\w+)(${shapePattern})?\\s*`);
    const firstMatch = remaining.match(firstNodeRegex);
    if (!firstMatch) return null;
    let currentId = firstMatch[1];
    let currentLabel = firstMatch[2];
    remaining = remaining.slice(firstMatch[0].length);
    const chainRegex = new RegExp(`^(${arrowPattern})\\s*(?:\\|([^|]*)\\|)?\\s*(\\w+)(${shapePattern})?\\s*`);
    let chainMatch;
    while ((chainMatch = remaining.match(chainRegex)) !== null) {
      const [full, arrow, edgeLabel, targetId, targetLabel] = chainMatch;
      if (!isValidArrow(arrow)) break;
      results.push({
        sourceId: currentId,
        sourceLabel: currentLabel == null ? void 0 : currentLabel.trim(),
        arrow: arrow.trim(),
        targetId,
        targetLabel: targetLabel == null ? void 0 : targetLabel.trim(),
        edgeLabel: edgeLabel == null ? void 0 : edgeLabel.trim()
      });
      currentId = targetId;
      currentLabel = targetLabel;
      remaining = remaining.slice(full.length);
    }
    return results.length > 0 ? results : null;
  }
  function isValidArrow(str) {
    const arrowChars = /^[<>x\-o=.]+$/;
    return arrowChars.test(str) && str.length >= 2;
  }
  function createNode2(id, labelPart) {
    let shape = "rectangle";
    let label = id;
    if (labelPart) {
      const detected = detectMermaidShape(labelPart);
      shape = detected.shape;
      label = detected.label;
    }
    return {
      id,
      type: "node",
      label,
      shape,
      style: {}
    };
  }
  function addToCurrentGroup(nodeId, groupStack) {
    if (groupStack.length > 0) {
      const currentGroup = groupStack[groupStack.length - 1];
      currentGroup.children.push(nodeId);
    }
  }
  function applyMermaidStyle(node, styleStr) {
    const parts = styleStr.split(",").map((p) => p.trim());
    for (const part of parts) {
      const [key, value] = part.split(":").map((s) => s.trim());
      switch (key) {
        case "fill":
          node.style.fill = value;
          break;
        case "stroke":
          node.style.stroke = value;
          break;
        case "stroke-width":
          node.style.strokeWidth = parseInt(value);
          break;
        case "color":
          node.style.fontColor = value;
          break;
        case "font-size":
          node.style.fontSize = parseInt(value);
          break;
      }
    }
  }
  function parseDrawio(source) {
    validateInput(source, "drawio");
    validatePattern(source, /<mxfile|<mxGraphModel/i, "drawio", "Invalid Draw.io XML format");
    const diagram = createEmptyDiagram("flowchart", "drawio");
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "text/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error(`Invalid Draw.io XML: ${parseError.textContent}`);
    }
    const cells = doc.querySelectorAll("mxCell");
    const cellMap = /* @__PURE__ */ new Map();
    const nodeIdMap = /* @__PURE__ */ new Map();
    const groupIdMap = /* @__PURE__ */ new Map();
    cells.forEach((cell2) => {
      const id = cell2.getAttribute("id");
      if (id) {
        cellMap.set(id, cell2);
      }
    });
    cells.forEach((cell2) => {
      if (isGroup(cell2)) {
        const group = parseGroupCell(cell2);
        if (group) {
          diagram.groups.push(group);
          groupIdMap.set(cell2.getAttribute("id"), group.id);
        }
      }
    });
    cells.forEach((cell2) => {
      if (isVertex(cell2) && !isGroup(cell2)) {
        const node = parseNodeCell(cell2);
        if (node) {
          diagram.nodes.push(node);
          nodeIdMap.set(cell2.getAttribute("id"), node.id);
          const parentId = cell2.getAttribute("parent");
          if (parentId && groupIdMap.has(parentId)) {
            const groupIrId = groupIdMap.get(parentId);
            const group = diagram.groups.find((g) => g.id === groupIrId);
            if (group) {
              group.children.push(node.id);
            }
          }
        }
      }
    });
    cells.forEach((cell2) => {
      if (isEdge(cell2)) {
        const edge = parseEdgeCell(cell2, nodeIdMap);
        if (edge) {
          diagram.edges.push(edge);
        }
      }
    });
    const diagramEl = doc.querySelector("diagram");
    if (diagramEl) {
      diagram.name = diagramEl.getAttribute("name") || void 0;
    }
    const graphModel = doc.querySelector("mxGraphModel");
    if (graphModel) {
      const pageWidth = graphModel.getAttribute("pageWidth");
      const pageHeight = graphModel.getAttribute("pageHeight");
      const background = graphModel.getAttribute("background");
      if (pageWidth && pageHeight) {
        diagram.viewport = {
          width: parseInt(pageWidth),
          height: parseInt(pageHeight),
          zoom: 1,
          offsetX: 0,
          offsetY: 0
        };
      }
      if (background && background !== "none") {
        if (!diagram.metadata) diagram.metadata = { source: "drawio" };
        diagram.metadata.backgroundColor = background;
      }
    }
    return diagram;
  }
  function parseStyleString(style) {
    const result = {};
    if (!style) return result;
    const parts = style.split(";").filter(Boolean);
    for (const part of parts) {
      const eqIndex = part.indexOf("=");
      if (eqIndex > 0) {
        const key = part.substring(0, eqIndex).trim();
        const value = part.substring(eqIndex + 1).trim();
        switch (key) {
          case "rounded":
          case "dashed":
          case "shadow":
          case "glass":
          case "startFill":
          case "endFill":
          case "curved":
          case "orthogonal":
          case "swimlane":
          case "group":
          case "container":
          case "collapsible":
            result[key] = value === "1" || value === "true";
            break;
          case "strokeWidth":
          case "fontSize":
          case "fontStyle":
          case "opacity":
          case "spacing":
          case "spacingTop":
          case "spacingBottom":
          case "spacingLeft":
          case "spacingRight":
            result[key] = parseFloat(value);
            break;
          default:
            result[key] = value;
        }
      } else {
        const trimmed = part.trim();
        if (trimmed && !trimmed.includes("=")) {
          result.shape = trimmed;
        }
      }
    }
    return result;
  }
  function isVertex(cell2) {
    return cell2.getAttribute("vertex") === "1";
  }
  function isEdge(cell2) {
    return cell2.getAttribute("edge") === "1";
  }
  function isGroup(cell2) {
    const style = cell2.getAttribute("style") || "";
    const parsed = parseStyleString(style);
    return Boolean(parsed.swimlane || parsed.group || parsed.container);
  }
  function parseNodeCell(cell2) {
    const id = cell2.getAttribute("id");
    if (!id || id === "0" || id === "1") return null;
    const value = cell2.getAttribute("value") || "";
    const styleStr = cell2.getAttribute("style") || "";
    const parsedStyle = parseStyleString(styleStr);
    const geometry = cell2.querySelector("mxGeometry");
    const node = createNode(id, decodeHtmlEntities(value), {
      shape: mapDrawioShapeFromParsed(parsedStyle),
      style: {
        fill: parsedStyle.fillColor !== "none" ? parsedStyle.fillColor : void 0,
        stroke: parsedStyle.strokeColor !== "none" ? parsedStyle.strokeColor : void 0,
        strokeWidth: parsedStyle.strokeWidth,
        fontColor: parsedStyle.fontColor,
        fontSize: parsedStyle.fontSize,
        opacity: parsedStyle.opacity !== void 0 ? parsedStyle.opacity / 100 : void 0
      }
    });
    if (parsedStyle.shadow || parsedStyle.glass || parsedStyle.gradientColor) {
      node.metadata = {
        shadow: parsedStyle.shadow,
        glass: parsedStyle.glass,
        gradientColor: parsedStyle.gradientColor,
        gradientDirection: parsedStyle.gradientDirection,
        fontStyle: parsedStyle.fontStyle
      };
    }
    if (geometry) {
      const x = parseFloat(geometry.getAttribute("x") || "0");
      const y = parseFloat(geometry.getAttribute("y") || "0");
      const width2 = parseFloat(geometry.getAttribute("width") || "120");
      const height = parseFloat(geometry.getAttribute("height") || "60");
      node.position = { x, y };
      node.size = { width: width2, height };
    }
    return node;
  }
  function parseEdgeCell(cell2, nodeIdMap) {
    const sourceId = cell2.getAttribute("source");
    const targetId = cell2.getAttribute("target");
    if (!sourceId || !targetId) return null;
    const source = nodeIdMap.get(sourceId);
    const target = nodeIdMap.get(targetId);
    if (!source || !target) return null;
    const value = cell2.getAttribute("value") || "";
    const styleStr = cell2.getAttribute("style") || "";
    const parsedStyle = parseStyleString(styleStr);
    const edge = createEdge(source, target, {
      label: value ? decodeHtmlEntities(value) : void 0,
      arrow: parseEdgeArrowFromParsed(parsedStyle),
      style: {
        stroke: parsedStyle.strokeColor !== "none" ? parsedStyle.strokeColor : void 0,
        strokeWidth: parsedStyle.strokeWidth,
        opacity: parsedStyle.opacity !== void 0 ? parsedStyle.opacity / 100 : void 0
      }
    });
    if (parsedStyle.edgeStyle || parsedStyle.curved || parsedStyle.orthogonal) {
      edge.metadata = {
        edgeStyle: parsedStyle.edgeStyle,
        curved: parsedStyle.curved,
        orthogonal: parsedStyle.orthogonal
      };
    }
    const geometry = cell2.querySelector("mxGeometry");
    if (geometry) {
      const points = geometry.querySelectorAll("mxPoint");
      const arrayEl = geometry.querySelector("Array");
      if (arrayEl) {
        const arrayPoints = arrayEl.querySelectorAll("mxPoint");
        if (arrayPoints.length > 0) {
          edge.waypoints = Array.from(arrayPoints).map((point) => ({
            x: parseFloat(point.getAttribute("x") || "0"),
            y: parseFloat(point.getAttribute("y") || "0")
          }));
        }
      } else if (points.length > 0) {
        const waypoints = Array.from(points).filter((p) => !p.getAttribute("as")).map((point) => ({
          x: parseFloat(point.getAttribute("x") || "0"),
          y: parseFloat(point.getAttribute("y") || "0")
        }));
        if (waypoints.length > 0) {
          edge.waypoints = waypoints;
        }
      }
    }
    return edge;
  }
  function parseGroupCell(cell2) {
    const id = cell2.getAttribute("id");
    if (!id || id === "0" || id === "1") return null;
    const value = cell2.getAttribute("value") || "";
    const styleStr = cell2.getAttribute("style") || "";
    const parsedStyle = parseStyleString(styleStr);
    const geometry = cell2.querySelector("mxGeometry");
    const group = createGroup(id, [], {
      label: decodeHtmlEntities(value) || id,
      style: {
        fill: parsedStyle.fillColor !== "none" ? parsedStyle.fillColor : void 0,
        stroke: parsedStyle.strokeColor !== "none" ? parsedStyle.strokeColor : void 0,
        strokeDasharray: parsedStyle.dashed ? "5,5" : void 0
      }
    });
    if (parsedStyle.swimlane) {
      group.metadata = { type: "swimlane" };
    }
    if (geometry) {
      group.position = {
        x: parseFloat(geometry.getAttribute("x") || "0"),
        y: parseFloat(geometry.getAttribute("y") || "0")
      };
      group.size = {
        width: parseFloat(geometry.getAttribute("width") || "200"),
        height: parseFloat(geometry.getAttribute("height") || "150")
      };
    }
    return group;
  }
  function mapDrawioShapeFromParsed(style) {
    if (style.shape) {
      return parseDrawioShape(`shape=${style.shape}`);
    }
    const shapeIndicators = [
      ["ellipse", "ellipse"],
      ["rhombus", "diamond"],
      ["triangle", "diamond"],
      ["hexagon", "hexagon"],
      ["cylinder", "cylinder"],
      ["actor", "actor"],
      ["cloud", "cloud"],
      ["parallelogram", "parallelogram"],
      ["trapezoid", "trapezoid"],
      ["document", "document"],
      ["note", "note"],
      ["card", "rounded-rectangle"]
    ];
    for (const [indicator, shape] of shapeIndicators) {
      if (style[indicator]) {
        return shape;
      }
    }
    return style.rounded ? "rounded-rectangle" : "rectangle";
  }
  function parseEdgeArrowFromParsed(style) {
    const config = {
      sourceType: "none",
      targetType: "arrow",
      lineType: "solid"
    };
    if (style.startArrow) {
      config.sourceType = DRAWIO_ARROW_HEAD_REVERSE[style.startArrow] || "none";
    }
    if (style.endArrow) {
      config.targetType = DRAWIO_ARROW_HEAD_REVERSE[style.endArrow] || "arrow";
    } else if (style.endArrow === "none") {
      config.targetType = "none";
    }
    if (style.dashed) {
      config.lineType = "dashed";
      if (style.dashPattern === "1 2" || style.dashPattern === "1 1") {
        config.lineType = "dotted";
      }
    }
    return config;
  }
  function decodeHtmlEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }
  function parseExcalidraw(source) {
    validateInput(source, "excalidraw");
    const data = parseJson(source);
    const diagram = createEmptyDiagram("flowchart", "excalidraw");
    const elementMap = /* @__PURE__ */ new Map();
    const textByContainer = /* @__PURE__ */ new Map();
    const nodeIdMap = /* @__PURE__ */ new Map();
    const frameMap = /* @__PURE__ */ new Map();
    const groupIdMap = /* @__PURE__ */ new Map();
    for (const element of data.elements) {
      elementMap.set(element.id, element);
      if (isTextElement(element) && element.containerId) {
        textByContainer.set(element.containerId, element.text);
      }
      if (element.groupIds && element.groupIds.length > 0) {
        for (const groupId of element.groupIds) {
          if (!groupIdMap.has(groupId)) {
            groupIdMap.set(groupId, []);
          }
          groupIdMap.get(groupId).push(element.id);
        }
      }
    }
    for (const element of data.elements) {
      if (isFrameElement(element)) {
        const group = createGroup(element.id, [], {
          label: element.name || "Frame",
          position: { x: element.x, y: element.y },
          size: { width: element.width, height: element.height },
          style: {
            stroke: element.strokeColor || "#cccccc",
            fill: element.backgroundColor !== "transparent" ? element.backgroundColor : void 0
          }
        });
        frameMap.set(element.id, group);
        diagram.groups.push(group);
      }
    }
    for (const [groupId, memberIds] of groupIdMap) {
      const shapeMembers = memberIds.filter((id) => {
        const el = elementMap.get(id);
        return el && isShapeElement(el);
      });
      if (shapeMembers.length > 1) {
        const group = createGroup(groupId, shapeMembers, {
          label: `Group ${groupId.slice(0, 6)}`
        });
        diagram.groups.push(group);
      }
    }
    for (const element of data.elements) {
      if (isShapeElement(element)) {
        const label = textByContainer.get(element.id) || "";
        const node = parseShapeElement(element, label);
        diagram.nodes.push(node);
        nodeIdMap.set(element.id, node.id);
        if (element.frameId && frameMap.has(element.frameId)) {
          frameMap.get(element.frameId).children.push(node.id);
        }
      }
    }
    for (const element of data.elements) {
      if (isArrowElement(element)) {
        const edge = parseArrowElement(element, nodeIdMap, textByContainer);
        if (edge) {
          diagram.edges.push(edge);
        }
      }
    }
    return diagram;
  }
  function parseJson(source) {
    try {
      const data = JSON.parse(source);
      if (data.type !== "excalidraw") {
        throw new Error("Not an Excalidraw file");
      }
      if (!Array.isArray(data.elements)) {
        throw new Error("Invalid Excalidraw file: missing elements array");
      }
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw error;
    }
  }
  function isShapeElement(element) {
    return ["rectangle", "ellipse", "diamond"].includes(element.type);
  }
  function isTextElement(element) {
    return element.type === "text";
  }
  function isArrowElement(element) {
    return element.type === "arrow" || element.type === "line";
  }
  function isFrameElement(element) {
    return element.type === "frame";
  }
  function parseShapeElement(element, label) {
    return createNode(element.id, label, {
      shape: mapExcalidrawShape(element.type),
      position: { x: element.x, y: element.y },
      size: { width: element.width, height: element.height },
      style: {
        fill: element.backgroundColor !== "transparent" ? element.backgroundColor : void 0,
        stroke: element.strokeColor,
        strokeWidth: element.strokeWidth,
        opacity: element.opacity !== void 0 ? element.opacity / 100 : void 0
      }
    });
  }
  function parseArrowElement(element, nodeIdMap, textByContainer) {
    var _a, _b;
    const sourceExcalidrawId = (_a = element.startBinding) == null ? void 0 : _a.elementId;
    const targetExcalidrawId = (_b = element.endBinding) == null ? void 0 : _b.elementId;
    if (!sourceExcalidrawId || !targetExcalidrawId) {
      return null;
    }
    const source = nodeIdMap.get(sourceExcalidrawId);
    const target = nodeIdMap.get(targetExcalidrawId);
    if (!source || !target) {
      return null;
    }
    const label = textByContainer.get(element.id);
    return createEdge(source, target, {
      label,
      arrow: {
        sourceType: mapExcalidrawArrowhead(element.startArrowhead),
        targetType: mapExcalidrawArrowhead(element.endArrowhead),
        lineType: element.strokeStyle || "solid"
      },
      style: {
        stroke: element.strokeColor,
        strokeWidth: element.strokeWidth,
        opacity: element.opacity !== void 0 ? element.opacity / 100 : void 0
      }
    });
  }
  function mapExcalidrawShape(type) {
    switch (type) {
      case "rectangle":
        return "rectangle";
      case "ellipse":
        return "ellipse";
      case "diamond":
        return "diamond";
      default:
        return "rectangle";
    }
  }
  function mapExcalidrawArrowhead(arrowhead) {
    if (!arrowhead) return "none";
    switch (arrowhead) {
      case "arrow":
      case "triangle":
        return "arrow";
      case "dot":
        return "circle";
      case "bar":
        return "bar";
      case "diamond":
        return "diamond";
      default:
        return "none";
    }
  }
  function parsePlantUML(source) {
    validateInput(source, "plantuml");
    const diagramType = detectDiagramType(source);
    switch (diagramType) {
      case "sequence":
        return parseSequenceDiagram(source);
      case "class":
        return parseClassDiagram(source);
      default:
        return parseComponentDiagram(source);
    }
  }
  function detectDiagramType(source) {
    const lower = source.toLowerCase();
    if (lower.includes("->") && (lower.includes("participant") || lower.includes("actor"))) {
      if (lower.includes("activate") || lower.includes("deactivate") || /\w+\s*->\s*\w+\s*:/.test(source)) {
        return "sequence";
      }
    }
    if (lower.includes("class ") || lower.includes("interface ") || lower.includes("abstract ") || lower.includes("<|--") || lower.includes("--|>") || lower.includes("{field}") || lower.includes("{method}")) {
      return "class";
    }
    if (lower.includes("start") && lower.includes("stop") && (lower.includes(":") && lower.includes(";"))) {
      return "activity";
    }
    if (lower.includes("usecase") || lower.includes("actor") && lower.includes("(")) {
      return "usecase";
    }
    return "component";
  }
  function parseSequenceDiagram(source) {
    const diagram = createEmptyDiagram("sequence", "plantuml");
    const lines = getCleanLines(source);
    const participants = /* @__PURE__ */ new Map();
    const notes = [];
    let noteBuffer = [];
    let inNote = false;
    let currentNoteAttach = {};
    let messageIndex = 0;
    for (const line of lines) {
      const noteStartMatch = line.match(/^note\s+(left|right|over)\s*(?:of\s+)?(\w+)?(?:\s*:\s*(.+))?$/i);
      if (noteStartMatch) {
        const [, position2, target, inlineText] = noteStartMatch;
        if (inlineText) {
          const noteId = `note_${notes.length}`;
          notes.push({
            id: noteId,
            text: inlineText,
            attachTo: target,
            position: position2.toLowerCase()
          });
        } else {
          inNote = true;
          currentNoteAttach = { target, position: position2.toLowerCase() };
          noteBuffer = [];
        }
        continue;
      }
      if (line === "end note" && inNote) {
        const noteId = `note_${notes.length}`;
        notes.push({
          id: noteId,
          text: noteBuffer.join("\n"),
          attachTo: currentNoteAttach.target,
          position: currentNoteAttach.position
        });
        inNote = false;
        noteBuffer = [];
        continue;
      }
      if (inNote) {
        noteBuffer.push(line);
        continue;
      }
      const participantMatch = line.match(/^(participant|actor)\s+"?([^"]+)"?\s+as\s+(\w+)/i) || line.match(/^(participant|actor)\s+(\w+)/i);
      if (participantMatch) {
        const [, type, labelOrId, alias] = participantMatch;
        const id = alias || labelOrId;
        const label = alias ? labelOrId : id;
        if (!participants.has(id)) {
          const node = createNode(id, label, {
            shape: type.toLowerCase() === "actor" ? "actor" : "rectangle"
          });
          participants.set(id, node);
          diagram.nodes.push(node);
        }
        continue;
      }
      const messageMatch = line.match(/^(\w+)\s*(-+>+|<-+|->+x|x<-+|-+>>|<<-+|\.+>|<\.+)\s*(\w+)\s*(?::\s*(.+))?$/);
      if (messageMatch) {
        const [, from, arrow, to, label] = messageMatch;
        ensureParticipant(from, participants, diagram);
        ensureParticipant(to, participants, diagram);
        const edge = createEdge(from, to, {
          label: label == null ? void 0 : label.trim(),
          arrow: parseSequenceArrow(arrow)
        });
        edge.metadata = { order: messageIndex++ };
        diagram.edges.push(edge);
        continue;
      }
      const activateMatch = line.match(/^(activate|deactivate)\s+(\w+)/i);
      if (activateMatch) {
        const [, action, target] = activateMatch;
        ensureParticipant(target, participants, diagram);
        if (!diagram.metadata) diagram.metadata = { source: "plantuml" };
        const meta = diagram.metadata;
        if (!meta.activations) meta.activations = [];
        meta.activations.push({
          action: action.toLowerCase(),
          target,
          order: messageIndex
        });
        continue;
      }
    }
    for (const note of notes) {
      const noteNode = createNode(note.id, note.text, {
        shape: "note"
      });
      noteNode.metadata = {
        isNote: true,
        attachTo: note.attachTo,
        position: note.position
      };
      diagram.nodes.push(noteNode);
    }
    return diagram;
  }
  function parseClassDiagram(source) {
    const diagram = createEmptyDiagram("class", "plantuml");
    const lines = getCleanLines(source);
    const classes = /* @__PURE__ */ new Map();
    const notes = [];
    let currentClass = null;
    let noteBuffer = [];
    let inNote = false;
    let currentNoteAttach;
    for (const line of lines) {
      const noteMatch = line.match(/^note\s+"([^"]+)"\s+as\s+(\w+)/i) || line.match(/^note\s+(left|right|top|bottom)\s+of\s+(\w+)\s*:\s*(.+)/i);
      if (noteMatch) {
        if (noteMatch[3]) {
          notes.push({
            id: `note_${notes.length}`,
            text: noteMatch[3],
            attachTo: noteMatch[2],
            position: noteMatch[1].toLowerCase()
          });
        } else {
          notes.push({
            id: noteMatch[2],
            text: noteMatch[1]
          });
        }
        continue;
      }
      const noteStartMatch = line.match(/^note\s+(left|right|top|bottom)\s+of\s+(\w+)$/i);
      if (noteStartMatch) {
        inNote = true;
        currentNoteAttach = noteStartMatch[2];
        noteBuffer = [];
        continue;
      }
      if (line === "end note" && inNote) {
        notes.push({
          id: `note_${notes.length}`,
          text: noteBuffer.join("\n"),
          attachTo: currentNoteAttach
        });
        inNote = false;
        continue;
      }
      if (inNote) {
        noteBuffer.push(line);
        continue;
      }
      const classMatch = line.match(/^(class|interface|abstract\s+class|abstract|enum)\s+"?([^"{]+)"?\s*(?:<<\s*(\w+)\s*>>)?\s*\{?$/i);
      if (classMatch) {
        const [, type, name, stereotype] = classMatch;
        const id = name.trim();
        currentClass = { id, members: [], methods: [] };
        const node = createNode(id, id, {
          shape: type.toLowerCase().includes("interface") ? "ellipse" : "rectangle"
        });
        node.metadata = {
          classType: type.toLowerCase().replace(/\s+/g, "-"),
          stereotype,
          members: currentClass.members,
          methods: currentClass.methods
        };
        classes.set(id, node);
        diagram.nodes.push(node);
        continue;
      }
      const simpleClassMatch = line.match(/^(class|interface)\s+(\w+)$/i);
      if (simpleClassMatch && !currentClass) {
        const [, type, name] = simpleClassMatch;
        const node = createNode(name, name, {
          shape: type.toLowerCase() === "interface" ? "ellipse" : "rectangle"
        });
        node.metadata = { classType: type.toLowerCase() };
        classes.set(name, node);
        diagram.nodes.push(node);
        continue;
      }
      if (line === "}" && currentClass) {
        const node = classes.get(currentClass.id);
        if (node) {
          node.metadata = {
            ...node.metadata,
            members: currentClass.members,
            methods: currentClass.methods
          };
        }
        currentClass = null;
        continue;
      }
      if (currentClass && line !== "{") {
        const memberMatch = line.match(/^([+\-#~])?\s*(\w+)\s*:\s*(\w+)$/);
        const methodMatch = line.match(/^([+\-#~])?\s*(\w+)\s*\(([^)]*)\)\s*(?::\s*(\w+))?$/);
        if (methodMatch) {
          const [, visibility, name, params, returnType] = methodMatch;
          currentClass.methods.push(`${visibility || "+"}${name}(${params})${returnType ? ": " + returnType : ""}`);
        } else if (memberMatch) {
          const [, visibility, name, type] = memberMatch;
          currentClass.members.push(`${visibility || "+"}${name}: ${type}`);
        } else if (line.trim()) {
          currentClass.members.push(line);
        }
        continue;
      }
      const relationMatch = line.match(/^(\w+)\s*([<>|.*o#x\-]+)\s*(\w+)(?:\s*:\s*(.+))?$/);
      if (relationMatch) {
        const [, from, arrow, to, label] = relationMatch;
        ensureClass(from, classes, diagram);
        ensureClass(to, classes, diagram);
        const edge = createEdge(from, to, {
          label: label == null ? void 0 : label.trim(),
          arrow: parseClassArrow(arrow)
        });
        diagram.edges.push(edge);
      }
    }
    for (const note of notes) {
      const noteNode = createNode(note.id, note.text, { shape: "note" });
      noteNode.metadata = { isNote: true, attachTo: note.attachTo };
      diagram.nodes.push(noteNode);
    }
    return diagram;
  }
  function parseComponentDiagram(source) {
    const diagram = createEmptyDiagram("flowchart", "plantuml");
    const lines = getCleanLines(source);
    const nodeMap = /* @__PURE__ */ new Map();
    const groupStack = [];
    const notes = [];
    let noteBuffer = [];
    let inNote = false;
    let currentNoteAttach;
    for (const line of lines) {
      const noteMatch = line.match(/^note\s+(left|right|top|bottom)(?:\s+of\s+(\w+))?\s*:\s*(.+)$/i);
      if (noteMatch) {
        const [, position2, target, text] = noteMatch;
        notes.push({
          id: `note_${notes.length}`,
          text,
          attachTo: target,
          position: position2.toLowerCase()
        });
        continue;
      }
      const noteStartMatch = line.match(/^note\s+(left|right|top|bottom)(?:\s+of\s+(\w+))?$/i);
      if (noteStartMatch) {
        inNote = true;
        currentNoteAttach = noteStartMatch[2];
        noteBuffer = [];
        continue;
      }
      if (line === "end note" && inNote) {
        notes.push({
          id: `note_${notes.length}`,
          text: noteBuffer.join("\n"),
          attachTo: currentNoteAttach
        });
        inNote = false;
        continue;
      }
      if (inNote) {
        noteBuffer.push(line);
        continue;
      }
      if (line === "left to right direction") {
        diagram.metadata = { source: "plantuml", ...diagram.metadata, direction: "LR" };
        continue;
      }
      if (line === "top to bottom direction") {
        diagram.metadata = { source: "plantuml", ...diagram.metadata, direction: "TB" };
        continue;
      }
      const packageMatch = line.match(/^(package|rectangle|frame|folder|node|namespace)\s+"([^"]+)"\s*(?:as\s+(\w+))?\s*\{?$/i) || line.match(/^(package|rectangle|frame|folder|node|namespace)\s+(\w+)\s*\{?$/i);
      if (packageMatch) {
        const [, , labelOrId, alias] = packageMatch;
        const id = alias || sanitizeId$1(labelOrId);
        const label = labelOrId;
        const group = createGroup(id, [], { label });
        diagram.groups.push(group);
        groupStack.push(group);
        continue;
      }
      if (line === "}") {
        groupStack.pop();
        continue;
      }
      const nodeResult = parseNodeLine(line);
      if (nodeResult && !nodeMap.has(nodeResult.id)) {
        nodeMap.set(nodeResult.id, nodeResult);
        diagram.nodes.push(nodeResult);
        if (groupStack.length > 0) {
          groupStack[groupStack.length - 1].children.push(nodeResult.id);
        }
        continue;
      }
      const edgeResult = parseEdgeLine2(line, nodeMap, diagram);
      if (edgeResult) {
        diagram.edges.push(edgeResult);
      }
    }
    for (const note of notes) {
      const noteNode = createNode(note.id, note.text, { shape: "note" });
      noteNode.metadata = { isNote: true, attachTo: note.attachTo, position: note.position };
      diagram.nodes.push(noteNode);
    }
    return diagram;
  }
  function getCleanLines(source) {
    const lines = source.trim().split("\n");
    const result = [];
    let inDiagram = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("'")) continue;
      if (line.startsWith("@startuml")) {
        inDiagram = true;
        continue;
      }
      if (line.startsWith("@enduml")) {
        inDiagram = false;
        continue;
      }
      if (!inDiagram) continue;
      if (line.startsWith("skinparam") || line.startsWith("!") || line.startsWith("hide")) {
        continue;
      }
      result.push(line);
    }
    return result;
  }
  function ensureParticipant(id, participants, diagram) {
    if (!participants.has(id)) {
      const node = createNode(id, id, { shape: "rectangle" });
      participants.set(id, node);
      diagram.nodes.push(node);
    }
  }
  function ensureClass(id, classes, diagram) {
    if (!classes.has(id)) {
      const node = createNode(id, id, { shape: "rectangle" });
      node.metadata = { classType: "class" };
      classes.set(id, node);
      diagram.nodes.push(node);
    }
  }
  function parseSequenceArrow(arrow) {
    const config = {
      sourceType: "none",
      targetType: "arrow",
      lineType: "solid"
    };
    if (arrow.includes(".")) {
      config.lineType = "dashed";
    }
    if (arrow.includes("x")) {
      config.targetType = "cross";
    }
    if (arrow.includes(">>")) {
      config.targetType = "open";
    }
    if (arrow.startsWith("<") && arrow.endsWith(">")) {
      config.sourceType = "arrow";
    } else if (arrow.startsWith("<")) {
      config.sourceType = "arrow";
      config.targetType = "none";
    }
    return config;
  }
  function parseClassArrow(arrow) {
    const config = {
      sourceType: "none",
      targetType: "arrow",
      lineType: "solid"
    };
    if (arrow.includes(".")) {
      config.lineType = "dashed";
    }
    if (arrow.includes("<|") || arrow.includes("|>")) {
      config.targetType = "diamond";
      if (arrow.includes("<|")) {
        config.sourceType = "diamond";
        config.targetType = "none";
      }
    }
    if (arrow.includes("*")) {
      if (arrow.startsWith("*")) {
        config.sourceType = "diamond-filled";
      } else {
        config.targetType = "diamond-filled";
      }
    }
    if (arrow.includes("o")) {
      if (arrow.startsWith("o")) {
        config.sourceType = "circle";
      } else {
        config.targetType = "circle";
      }
    }
    if (arrow.includes(">") && !arrow.includes("|>")) {
      config.targetType = "arrow";
    }
    return config;
  }
  function parseNodeLine(line) {
    const patterns = [
      // shape "label" as alias [style]
      /^(rectangle|actor|database|cloud|file|circle|diamond|hexagon|card|usecase|component|interface|storage)\s+"([^"]+)"\s+as\s+(\w+)/i,
      // shape alias [style]
      /^(rectangle|actor|database|cloud|file|circle|diamond|hexagon|card|usecase|component|interface|storage)\s+(\w+)/i
    ];
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        if (match.length === 4) {
          const [, shapeStr, label, alias] = match;
          return createNode(alias, label, {
            shape: mapPlantUMLShape(shapeStr.toLowerCase())
          });
        } else {
          const [, shapeStr, alias] = match;
          return createNode(alias, alias, {
            shape: mapPlantUMLShape(shapeStr.toLowerCase())
          });
        }
      }
    }
    return null;
  }
  function parseEdgeLine2(line, nodeMap, diagram) {
    const edgePattern = /^(\w+)\s*([<>o*x|.-]+)\s*(\w+)(?:\s*:\s*(.+))?$/;
    const match = line.match(edgePattern);
    if (!match) return null;
    const [, sourceId, arrowStr, targetId, label] = match;
    ensureNode(sourceId, nodeMap, diagram);
    ensureNode(targetId, nodeMap, diagram);
    const arrow = parsePlantUMLArrow(arrowStr);
    return createEdge(sourceId, targetId, {
      label: label == null ? void 0 : label.trim(),
      arrow
    });
  }
  function ensureNode(id, nodeMap, diagram) {
    if (!nodeMap.has(id)) {
      const node = createNode(id, id);
      nodeMap.set(id, node);
      diagram.nodes.push(node);
    }
  }
  function parsePlantUMLArrow(arrow) {
    const config = {
      sourceType: "none",
      targetType: "arrow",
      lineType: "solid"
    };
    if (arrow.includes("..")) {
      config.lineType = "dashed";
    } else if (arrow.includes("--")) {
      config.lineType = "solid";
    }
    if (arrow.startsWith("<|")) {
      config.sourceType = "diamond";
    } else if (arrow.startsWith("<")) {
      config.sourceType = "arrow";
    } else if (arrow.startsWith("o")) {
      config.sourceType = "circle";
    } else if (arrow.startsWith("*")) {
      config.sourceType = "diamond-filled";
    } else if (arrow.startsWith("x")) {
      config.sourceType = "cross";
    }
    if (arrow.endsWith("|>")) {
      config.targetType = "diamond";
    } else if (arrow.endsWith(">")) {
      config.targetType = "arrow";
    } else if (arrow.endsWith("o")) {
      config.targetType = "circle";
    } else if (arrow.endsWith("*")) {
      config.targetType = "diamond-filled";
    } else if (arrow.endsWith("x")) {
      config.targetType = "cross";
    } else if (!arrow.endsWith(">")) {
      config.targetType = "none";
    }
    return config;
  }
  function mapPlantUMLShape(shape) {
    const shapeMap = {
      "rectangle": "rectangle",
      "actor": "actor",
      "database": "cylinder",
      "storage": "cylinder",
      "cloud": "cloud",
      "file": "document",
      "circle": "circle",
      "diamond": "diamond",
      "hexagon": "hexagon",
      "card": "rounded-rectangle",
      "usecase": "ellipse",
      "component": "rectangle",
      "interface": "circle"
    };
    return shapeMap[shape] || "rectangle";
  }
  function sanitizeId$1(str) {
    return str.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
  }
  function parseDot(source) {
    var _a;
    validateInput(source, "dot");
    const diagram = createEmptyDiagram("flowchart", "dot");
    const nodeMap = /* @__PURE__ */ new Map();
    const graphAttrs2 = parseGraphAttributes(source);
    diagram.metadata = {
      source: "dot",
      direction: ((_a = graphAttrs2.rankdir) == null ? void 0 : _a.toUpperCase()) || "TB",
      ...graphAttrs2
    };
    if (graphAttrs2.bgcolor) {
      diagram.viewport = {
        width: 800,
        height: 600,
        zoom: 1,
        offsetX: 0,
        offsetY: 0
      };
      if (!diagram.metadata) diagram.metadata = { source: "dot" };
      diagram.metadata.backgroundColor = graphAttrs2.bgcolor;
    }
    const cleanSource = removeComments(source);
    parseSubgraphs(cleanSource, diagram, nodeMap, null);
    parseNodesAndEdges(cleanSource, diagram, nodeMap, null);
    return diagram;
  }
  function removeComments(source) {
    return source.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/#.*$/gm, "");
  }
  function parseGraphAttributes(source) {
    const attrs = {};
    const graphAttrMatch = source.match(/(?:di)?graph\s+\w*\s*\{[^}]*?graph\s*\[([^\]]+)\]/is);
    if (graphAttrMatch) {
      const parsed = parseAttributes(graphAttrMatch[1]);
      Object.assign(attrs, {
        bgcolor: parsed.bgcolor,
        fontname: parsed.fontname,
        fontsize: parsed.fontsize ? parseInt(parsed.fontsize) : void 0,
        fontcolor: parsed.fontcolor,
        label: parsed.label,
        rankdir: parsed.rankdir,
        splines: parsed.splines,
        nodesep: parsed.nodesep ? parseFloat(parsed.nodesep) : void 0,
        ranksep: parsed.ranksep ? parseFloat(parsed.ranksep) : void 0
      });
    }
    const rankdirMatch = source.match(/rankdir\s*=\s*["']?(TB|BT|LR|RL)["']?/i);
    if (rankdirMatch && !attrs.rankdir) {
      attrs.rankdir = rankdirMatch[1].toUpperCase();
    }
    const bgcolorMatch = source.match(/bgcolor\s*=\s*["']?([^"'\s;]+)["']?/i);
    if (bgcolorMatch && !attrs.bgcolor) {
      attrs.bgcolor = bgcolorMatch[1];
    }
    return attrs;
  }
  function parseSubgraphs(source, diagram, nodeMap, parentGroup) {
    const subgraphRegex = /subgraph\s+(?:cluster_)?(\w+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gi;
    let match;
    while ((match = subgraphRegex.exec(source)) !== null) {
      const [fullMatch, name, content] = match;
      const labelMatch = content.match(/label\s*=\s*["']([^"']+)["']/i);
      const styleMatch = content.match(/style\s*=\s*["']?(\w+)["']?/i);
      const colorMatch = content.match(/(?:fill)?color\s*=\s*["']?([^"'\s;]+)["']?/i);
      const bgcolorMatch = content.match(/bgcolor\s*=\s*["']?([^"'\s;]+)["']?/i);
      const group = createGroup(name, [], {
        label: (labelMatch == null ? void 0 : labelMatch[1]) || name,
        style: {
          fill: (bgcolorMatch == null ? void 0 : bgcolorMatch[1]) || (colorMatch == null ? void 0 : colorMatch[1]),
          stroke: colorMatch == null ? void 0 : colorMatch[1],
          strokeDasharray: (styleMatch == null ? void 0 : styleMatch[1]) === "dashed" ? "5,5" : void 0
        }
      });
      diagram.groups.push(group);
      if (parentGroup) {
        parentGroup.children.push(group.id);
      }
      parseSubgraphs(content, diagram, nodeMap, group);
      parseNodesAndEdges(content, diagram, nodeMap, group);
    }
  }
  function parseNodesAndEdges(source, diagram, nodeMap, currentGroup) {
    const lines = source.split(/[;\n]/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^(strict\s+)?(di)?graph\s+/i.test(line)) continue;
      if (/^subgraph\s+/i.test(line)) continue;
      if (line === "{" || line === "}") continue;
      if (/^(graph|node|edge)\s*\[/i.test(line)) continue;
      const edgeResult = parseEdgeLine3(line, nodeMap, diagram, currentGroup);
      if (edgeResult.length > 0) {
        diagram.edges.push(...edgeResult);
        continue;
      }
      const nodeResult = parseNodeLine2(line);
      if (nodeResult && !nodeMap.has(nodeResult.id)) {
        nodeMap.set(nodeResult.id, nodeResult);
        diagram.nodes.push(nodeResult);
        if (currentGroup) {
          currentGroup.children.push(nodeResult.id);
        }
      }
    }
  }
  function parseNodeLine2(line, currentGroup) {
    var _a;
    const match = line.match(/^(\w+)\s*\[([^\]]+)\]/);
    if (!match) {
      const simpleMatch = line.match(/^(\w+)\s*$/);
      if (simpleMatch && !["graph", "digraph", "subgraph", "node", "edge"].includes(simpleMatch[1].toLowerCase())) {
        return createNode(simpleMatch[1], simpleMatch[1]);
      }
      return null;
    }
    const [, id, attrsStr] = match;
    const attrs = parseAttributes(attrsStr);
    const node = createNode(id, attrs.label || id, {
      shape: mapDotShape(attrs.shape),
      style: {
        fill: attrs.fillcolor || (((_a = attrs.style) == null ? void 0 : _a.includes("filled")) ? attrs.color : void 0),
        stroke: attrs.color,
        fontColor: attrs.fontcolor,
        fontSize: attrs.fontsize ? parseInt(attrs.fontsize) : void 0
      }
    });
    if (attrs.tooltip || attrs.url || attrs.href) {
      node.metadata = {
        tooltip: attrs.tooltip,
        url: attrs.url || attrs.href
      };
    }
    return node;
  }
  function parseEdgeLine3(line, nodeMap, diagram, currentGroup) {
    const edges = [];
    const attrMatch = line.match(/\[([^\]]+)\]\s*$/);
    const attrs = attrMatch ? parseAttributes(attrMatch[1]) : {};
    const lineWithoutAttrs = attrMatch ? line.replace(/\s*\[[^\]]+\]\s*$/, "") : line;
    const parts = lineWithoutAttrs.split(/\s*(->|--)\s*/);
    if (parts.length < 3) return edges;
    const isDirected = lineWithoutAttrs.includes("->");
    for (let i = 0; i < parts.length - 2; i += 2) {
      const sourceId = parts[i].trim();
      const targetId = parts[i + 2].trim();
      if (!sourceId || !targetId) continue;
      ensureNode2(sourceId, nodeMap, diagram, currentGroup);
      ensureNode2(targetId, nodeMap, diagram, currentGroup);
      const edge = createEdge(sourceId, targetId, {
        label: attrs.label,
        arrow: {
          sourceType: attrs.dir === "back" || attrs.dir === "both" ? "arrow" : "none",
          targetType: isDirected && attrs.dir !== "back" ? mapDotArrowhead(attrs.arrowhead) : "none",
          lineType: attrs.style === "dashed" ? "dashed" : attrs.style === "dotted" ? "dotted" : "solid"
        },
        style: {
          stroke: attrs.color,
          strokeWidth: attrs.penwidth ? parseFloat(attrs.penwidth) : void 0
        }
      });
      edges.push(edge);
    }
    return edges;
  }
  function ensureNode2(id, nodeMap, diagram, currentGroup) {
    if (!nodeMap.has(id)) {
      const node = createNode(id, id);
      nodeMap.set(id, node);
      diagram.nodes.push(node);
      if (currentGroup) {
        currentGroup.children.push(id);
      }
    }
  }
  function parseAttributes(str) {
    const attrs = {};
    const regex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|<([^>]*)>|(\S+))/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      const [, key, val1, val2, val3, val4] = match;
      attrs[key.toLowerCase()] = val1 ?? val2 ?? val3 ?? val4 ?? "";
    }
    return attrs;
  }
  function mapDotArrowhead(arrowhead) {
    if (!arrowhead) return "arrow";
    const map = {
      "none": "none",
      "normal": "arrow",
      "open": "open",
      "empty": "open",
      "diamond": "diamond",
      "odiamond": "diamond",
      "dot": "circle-filled",
      "odot": "circle",
      "box": "bar",
      "obox": "bar",
      "crow": "arrow",
      "inv": "arrow",
      "tee": "bar",
      "vee": "open"
    };
    return map[arrowhead.toLowerCase()] || "arrow";
  }
  function mapDotShape(shape) {
    if (!shape) return "rectangle";
    const shapeMap = {
      "box": "rectangle",
      "rect": "rectangle",
      "rectangle": "rectangle",
      "square": "rectangle",
      "box3d": "rectangle",
      "roundedbox": "rounded-rectangle",
      "ellipse": "ellipse",
      "oval": "ellipse",
      "circle": "circle",
      "doublecircle": "circle",
      "point": "circle",
      "diamond": "diamond",
      "rhombus": "diamond",
      "hexagon": "hexagon",
      "parallelogram": "parallelogram",
      "trapezium": "trapezoid",
      "invtrapezium": "trapezoid",
      "cylinder": "cylinder",
      "note": "note",
      "tab": "note",
      "folder": "document",
      "component": "rectangle",
      "cds": "cylinder",
      "actor": "actor",
      "house": "hexagon",
      "invhouse": "hexagon",
      "star": "diamond",
      "tripleoctagon": "hexagon",
      "doubleoctagon": "hexagon",
      "octagon": "hexagon",
      "pentagon": "hexagon",
      "septagon": "hexagon",
      "plaintext": "rectangle",
      "plain": "rectangle",
      "none": "rectangle",
      "record": "rectangle",
      "Mrecord": "rounded-rectangle"
    };
    return shapeMap[shape.toLowerCase()] || "rectangle";
  }
  var SHAPE_COLORS = {
    "rectangle": { fill: "#dae8fc", stroke: "#6c8ebf", fontColor: "#1a1a1a" },
    "rounded-rectangle": { fill: "#d5e8d4", stroke: "#82b366", fontColor: "#1a1a1a" },
    "circle": { fill: "#fff2cc", stroke: "#d6b656", fontColor: "#1a1a1a" },
    "ellipse": { fill: "#e1d5e7", stroke: "#9673a6", fontColor: "#1a1a1a" },
    "diamond": { fill: "#ffe6cc", stroke: "#d79b00", fontColor: "#1a1a1a" },
    "hexagon": { fill: "#f8cecc", stroke: "#b85450", fontColor: "#1a1a1a" },
    "parallelogram": { fill: "#e6d0de", stroke: "#996185", fontColor: "#1a1a1a" },
    "trapezoid": { fill: "#d0cee2", stroke: "#56517e", fontColor: "#1a1a1a" },
    "cylinder": { fill: "#60a917", stroke: "#2d7600", fontColor: "#ffffff" },
    "document": { fill: "#f5f5f5", stroke: "#666666", fontColor: "#1a1a1a" },
    "cloud": { fill: "#b1ddf0", stroke: "#10739e", fontColor: "#1a1a1a" },
    "actor": { fill: "#ffcc00", stroke: "#000000", fontColor: "#1a1a1a" },
    "note": { fill: "#fff9b1", stroke: "#e6db74", fontColor: "#1a1a1a" },
    "custom": { fill: "#f5f5f5", stroke: "#666666", fontColor: "#1a1a1a" }
  };
  var EDGE_COLORS = {
    default: { stroke: "#6c8ebf", fontColor: "#333333" },
    dashed: { stroke: "#999999", fontColor: "#666666" },
    dotted: { stroke: "#b85450", fontColor: "#666666" }
  };
  var GROUP_COLORS = {
    fill: "#f5f5f5",
    stroke: "#666666",
    fontColor: "#333333"
  };
  function generateDrawio(diagram) {
    const cells = [];
    let cellId = 2;
    const nodeIdMap = /* @__PURE__ */ new Map();
    const groupIdMap = /* @__PURE__ */ new Map();
    for (const group of diagram.groups) {
      const id = cellId++;
      groupIdMap.set(group.id, id);
      const style = buildGroupStyle(group);
      const { x, y } = group.position || { x: 50, y: 50 };
      const { width: width2, height } = group.size || { width: 200, height: 150 };
      cells.push(`
      <mxCell id="${id}" value="${escapeXml(group.label || "")}" style="${style}" vertex="1" parent="1">
        <mxGeometry x="${x}" y="${y}" width="${width2}" height="${height}" as="geometry"/>
      </mxCell>
    `.trim());
    }
    for (const node of diagram.nodes) {
      const id = cellId++;
      nodeIdMap.set(node.id, id);
      let parentId = "1";
      for (const group of diagram.groups) {
        if (group.children.includes(node.id)) {
          const groupCellId = groupIdMap.get(group.id);
          if (groupCellId) {
            parentId = String(groupCellId);
          }
          break;
        }
      }
      const style = buildNodeStyle(node);
      const { x, y } = node.position || { x: 100, y: 100 };
      const { width: width2, height } = node.size || getDefaultSize(node.shape);
      cells.push(`
      <mxCell id="${id}" value="${escapeXml(node.label)}" style="${style}" vertex="1" parent="${parentId}">
        <mxGeometry x="${x}" y="${y}" width="${width2}" height="${height}" as="geometry"/>
      </mxCell>
    `.trim());
    }
    for (const edge of diagram.edges) {
      const id = cellId++;
      const sourceId = nodeIdMap.get(edge.source);
      const targetId = nodeIdMap.get(edge.target);
      if (!sourceId || !targetId) {
        console.warn(`Edge references unknown node: ${edge.source} -> ${edge.target}`);
        continue;
      }
      const style = buildEdgeStyle(edge);
      const label = edge.label ? escapeXml(edge.label) : "";
      let geometryContent = "";
      if (edge.waypoints && edge.waypoints.length > 0) {
        const points = edge.waypoints.map((p) => `<mxPoint x="${p.x}" y="${p.y}"/>`).join("\n");
        geometryContent = `<Array as="points">${points}</Array>`;
      }
      cells.push(`
      <mxCell id="${id}" value="${label}" style="${style}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
        <mxGeometry relative="1" as="geometry">
          ${geometryContent}
        </mxGeometry>
      </mxCell>
    `.trim());
    }
    const diagramName = diagram.name || "Page-1";
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="WB Diagrams" modified="${(/* @__PURE__ */ new Date()).toISOString()}" agent="WB Diagrams Converter" version="1.0">
  <diagram id="${diagram.id}" name="${escapeXml(diagramName)}">
    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells.join("\n        ")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
  }
  function buildNodeStyle(node) {
    const parts = [];
    const shapeStyle = DRAWIO_SHAPE_MAP[node.shape] || "rounded=0";
    parts.push(shapeStyle);
    parts.push("whiteSpace=wrap");
    parts.push("html=1");
    const defaultColors = SHAPE_COLORS[node.shape] || SHAPE_COLORS["rectangle"];
    const fillColor = node.style.fill && node.style.fill !== "#ffffff" ? node.style.fill : defaultColors.fill;
    parts.push(`fillColor=${fillColor}`);
    const strokeColor = node.style.stroke && node.style.stroke !== "#000000" ? node.style.stroke : defaultColors.stroke;
    parts.push(`strokeColor=${strokeColor}`);
    const strokeWidth = node.style.strokeWidth || 2;
    parts.push(`strokeWidth=${strokeWidth}`);
    const fontColor = node.style.fontColor && node.style.fontColor !== "#000000" ? node.style.fontColor : defaultColors.fontColor;
    parts.push(`fontColor=${fontColor}`);
    const fontSize = node.style.fontSize || 12;
    parts.push(`fontSize=${fontSize}`);
    if (node.style.fontFamily) {
      parts.push(`fontFamily=${node.style.fontFamily}`);
    }
    if (node.style.opacity !== void 0 && node.style.opacity < 1) {
      parts.push(`opacity=${Math.round(node.style.opacity * 100)}`);
    }
    parts.push("shadow=1");
    return parts.join(";") + ";";
  }
  function buildEdgeStyle(edge) {
    var _a;
    const parts = [];
    parts.push("edgeStyle=orthogonalEdgeStyle");
    parts.push("rounded=1");
    parts.push("orthogonalLoop=1");
    parts.push("jettySize=auto");
    parts.push("html=1");
    const arrowStyle = generateDrawioArrowStyle(edge.arrow);
    parts.push(arrowStyle);
    const lineType = ((_a = edge.arrow) == null ? void 0 : _a.lineType) || "solid";
    const edgeColor = lineType === "dashed" ? EDGE_COLORS.dashed : lineType === "dotted" ? EDGE_COLORS.dotted : EDGE_COLORS.default;
    const strokeColor = edge.style.stroke && edge.style.stroke !== "#000000" ? edge.style.stroke : edgeColor.stroke;
    parts.push(`strokeColor=${strokeColor}`);
    const strokeWidth = edge.style.strokeWidth || 2;
    parts.push(`strokeWidth=${strokeWidth}`);
    parts.push(`fontColor=${edgeColor.fontColor}`);
    parts.push("fontSize=11");
    if (edge.label) {
      parts.push("labelBackgroundColor=#ffffff");
    }
    if (edge.style.opacity !== void 0 && edge.style.opacity < 1) {
      parts.push(`opacity=${Math.round(edge.style.opacity * 100)}`);
    }
    return parts.join(";") + ";";
  }
  function buildGroupStyle(group) {
    const parts = [];
    parts.push("swimlane");
    parts.push("whiteSpace=wrap");
    parts.push("html=1");
    parts.push("collapsible=0");
    parts.push("startSize=30");
    const fillColor = group.style.fill || GROUP_COLORS.fill;
    parts.push(`fillColor=${fillColor}`);
    const strokeColor = group.style.stroke || GROUP_COLORS.stroke;
    parts.push(`strokeColor=${strokeColor}`);
    parts.push(`fontColor=${GROUP_COLORS.fontColor}`);
    parts.push("fontStyle=1");
    if (group.style.strokeDasharray) {
      parts.push("dashed=1");
    }
    parts.push("rounded=1");
    return parts.join(";") + ";";
  }
  function getDefaultSize(shape) {
    switch (shape) {
      case "circle":
        return { width: 80, height: 80 };
      case "diamond":
        return { width: 80, height: 80 };
      case "cylinder":
        return { width: 60, height: 80 };
      case "actor":
        return { width: 30, height: 60 };
      default:
        return { width: 120, height: 60 };
    }
  }
  function generateExcalidraw(diagram) {
    const elements = [];
    const nodeElementMap = /* @__PURE__ */ new Map();
    for (const node of diagram.nodes) {
      const elementId = generateId();
      nodeElementMap.set(node.id, elementId);
      const { x, y } = node.position || { x: 100, y: 100 };
      const { width: width2, height } = node.size || getDefaultSize2(node.shape);
      const element = createNodeElement(node, elementId, x, y, width2, height);
      elements.push(element);
      if (node.label) {
        const textElement = createTextElement(node.label, elementId, x, y, width2, height);
        elements.push(textElement);
        element.boundElements = element.boundElements || [];
        element.boundElements.push({ id: textElement.id, type: "text" });
      }
    }
    for (const edge of diagram.edges) {
      const sourceElementId = nodeElementMap.get(edge.source);
      const targetElementId = nodeElementMap.get(edge.target);
      if (!sourceElementId || !targetElementId) {
        console.warn(`Edge references unknown node: ${edge.source} -> ${edge.target}`);
        continue;
      }
      const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
      const targetNode = diagram.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) continue;
      const arrowElement = createArrowElement(
        edge,
        sourceElementId,
        targetElementId,
        sourceNode,
        targetNode
      );
      elements.push(arrowElement);
      const sourceElement = elements.find((e) => e.id === sourceElementId);
      const targetElement = elements.find((e) => e.id === targetElementId);
      if (sourceElement) {
        sourceElement.boundElements = sourceElement.boundElements || [];
        sourceElement.boundElements.push({ id: arrowElement.id, type: "arrow" });
      }
      if (targetElement) {
        targetElement.boundElements = targetElement.boundElements || [];
        targetElement.boundElements.push({ id: arrowElement.id, type: "arrow" });
      }
      if (edge.label) {
        const labelElement = createEdgeLabelElement(edge, arrowElement);
        elements.push(labelElement);
      }
    }
    const file = {
      type: "excalidraw",
      version: 2,
      source: "https://whitebite.github.io/wb-diagrams",
      elements,
      appState: {
        viewBackgroundColor: "#ffffff",
        gridSize: null
      },
      files: {}
    };
    return JSON.stringify(file, null, 2);
  }
  function createNodeElement(node, elementId, x, y, width2, height) {
    const type = EXCALIDRAW_SHAPE_MAP[node.shape] || "rectangle";
    const roundness = getExcalidrawRoundness(node.shape);
    const element = {
      id: elementId,
      type,
      x,
      y,
      width: width2,
      height,
      angle: 0,
      strokeColor: node.style.stroke || "#1e1e1e",
      backgroundColor: node.style.fill || "transparent",
      fillStyle: node.style.fill ? "solid" : "hachure",
      strokeWidth: node.style.strokeWidth || 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: node.style.opacity !== void 0 ? node.style.opacity * 100 : 100,
      groupIds: [],
      updated: Date.now(),
      link: null,
      locked: false
    };
    if (roundness) {
      element.roundness = roundness;
    }
    return element;
  }
  function createTextElement(text, containerId, containerX, containerY, containerWidth, containerHeight) {
    return {
      id: generateId(),
      type: "text",
      x: containerX + containerWidth / 2,
      y: containerY + containerHeight / 2,
      width: containerWidth - 20,
      height: 25,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      text,
      fontSize: 16,
      fontFamily: 1,
      // Virgil
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 18,
      containerId,
      originalText: text,
      updated: Date.now(),
      link: null,
      locked: false
    };
  }
  function createArrowElement(edge, sourceElementId, targetElementId, sourceNode, targetNode) {
    const sourcePos = sourceNode.position || { x: 100, y: 100 };
    const sourceSize = sourceNode.size || getDefaultSize2(sourceNode.shape);
    const targetPos = targetNode.position || { x: 300, y: 100 };
    const targetSize = targetNode.size || getDefaultSize2(targetNode.shape);
    const startX = sourcePos.x + sourceSize.width;
    const startY = sourcePos.y + sourceSize.height / 2;
    const endX = targetPos.x;
    const endY = targetPos.y + targetSize.height / 2;
    const arrowConfig = generateExcalidrawArrow(edge.arrow);
    return {
      id: generateId(),
      type: "arrow",
      x: startX,
      y: startY,
      width: endX - startX,
      height: endY - startY,
      angle: 0,
      strokeColor: edge.style.stroke || "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: edge.style.strokeWidth || 2,
      strokeStyle: arrowConfig.strokeStyle,
      roughness: 1,
      opacity: edge.style.opacity !== void 0 ? edge.style.opacity * 100 : 100,
      groupIds: [],
      points: [
        [0, 0],
        [endX - startX, endY - startY]
      ],
      startBinding: {
        elementId: sourceElementId,
        focus: 0,
        gap: 5
      },
      endBinding: {
        elementId: targetElementId,
        focus: 0,
        gap: 5
      },
      startArrowhead: arrowConfig.startArrowhead,
      endArrowhead: arrowConfig.endArrowhead,
      updated: Date.now(),
      link: null,
      locked: false
    };
  }
  function createEdgeLabelElement(edge, arrowElement) {
    const midX = arrowElement.x + arrowElement.width / 2;
    const midY = arrowElement.y + arrowElement.height / 2 - 20;
    return {
      id: generateId(),
      type: "text",
      x: midX,
      y: midY,
      width: 100,
      height: 25,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "#ffffff",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      groupIds: [],
      text: edge.label || "",
      fontSize: 14,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 14,
      containerId: null,
      originalText: edge.label || "",
      updated: Date.now(),
      link: null,
      locked: false
    };
  }
  function getDefaultSize2(shape) {
    switch (shape) {
      case "circle":
        return { width: 80, height: 80 };
      case "diamond":
        return { width: 100, height: 100 };
      case "cylinder":
        return { width: 80, height: 100 };
      case "actor":
        return { width: 60, height: 100 };
      default:
        return { width: 150, height: 75 };
    }
  }
  function generateMermaid(diagram) {
    var _a;
    const lines = [];
    const direction = ((_a = diagram.metadata) == null ? void 0 : _a.direction) || "TB";
    lines.push(`flowchart ${direction}`);
    const nodesInGroups = /* @__PURE__ */ new Set();
    for (const group of diagram.groups) {
      for (const childId of group.children) {
        nodesInGroups.add(childId);
      }
    }
    for (const group of diagram.groups) {
      lines.push(...generateGroup(group, diagram.nodes, direction));
    }
    for (const node of diagram.nodes) {
      if (!nodesInGroups.has(node.id)) {
        lines.push(`    ${generateNodeDefinition(node)}`);
      }
    }
    for (const edge of diagram.edges) {
      lines.push(`    ${generateEdge(edge)}`);
    }
    const { classDefs, classAssignments } = generateClassDefs(diagram.nodes);
    if (classDefs.length > 0) {
      lines.push("");
      lines.push(...classDefs);
      lines.push(...classAssignments);
    }
    return lines.join("\n");
  }
  function generateGroup(group, nodes, parentDirection) {
    var _a;
    const lines = [];
    const label = group.label || group.id;
    const groupDirection = ((_a = group.metadata) == null ? void 0 : _a.direction) || "";
    lines.push(`    subgraph ${group.id}[${label}]`);
    if (groupDirection && groupDirection !== parentDirection) {
      lines.push(`        direction ${groupDirection}`);
    }
    for (const childId of group.children) {
      const node = nodes.find((n) => n.id === childId);
      if (node) {
        lines.push(`        ${generateNodeDefinition(node)}`);
      }
    }
    lines.push("    end");
    return lines;
  }
  function generateNodeDefinition(node) {
    return `${node.id}${generateMermaidShape(node.shape, node.label)}`;
  }
  function generateEdge(edge) {
    const arrow = generateMermaidArrow(edge.arrow);
    if (edge.label) {
      return `${edge.source} ${arrow}|${edge.label}| ${edge.target}`;
    }
    return `${edge.source} ${arrow} ${edge.target}`;
  }
  function generateMermaidArrow(arrow) {
    let result = "";
    if (arrow.sourceType === "arrow") result += "<";
    else if (arrow.sourceType === "circle") result += "o";
    else if (arrow.sourceType === "cross") result += "x";
    if (arrow.lineType === "dashed") {
      result += "-.";
    } else if (arrow.lineType === "dotted") {
      result += "..";
    } else if (arrow.lineType === "thick") {
      result += "==";
    } else {
      result += "--";
    }
    if (arrow.targetType === "arrow") result += ">";
    else if (arrow.targetType === "circle") result += "o";
    else if (arrow.targetType === "cross") result += "x";
    else if (arrow.lineType === "dashed") result += "-";
    else if (arrow.lineType === "thick") result += "=";
    if (result === "--") result = "---";
    if (result === "-.-") result = "-.-";
    if (result === "==") result = "===";
    return result;
  }
  function generateClassDefs(nodes) {
    const classDefs = [];
    const classAssignments = [];
    const styleGroups = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      if (!hasCustomStyle(node.style)) continue;
      const signature = getStyleSignature(node.style);
      if (!styleGroups.has(signature)) {
        styleGroups.set(signature, { style: node.style, nodeIds: [] });
      }
      styleGroups.get(signature).nodeIds.push(node.id);
    }
    let classIndex = 0;
    for (const [, { style, nodeIds }] of styleGroups) {
      if (nodeIds.length >= 2) {
        const className = `style${classIndex++}`;
        const styleStr = generateStyleString(style);
        classDefs.push(`    classDef ${className} ${styleStr}`);
        classAssignments.push(`    class ${nodeIds.join(",")} ${className}`);
      } else {
        const styleStr = generateStyleString(style);
        classDefs.push(`    style ${nodeIds[0]} ${styleStr}`);
      }
    }
    return { classDefs, classAssignments };
  }
  function hasCustomStyle(style) {
    return !!(style.fill || style.stroke || style.strokeWidth || style.fontColor);
  }
  function getStyleSignature(style) {
    return JSON.stringify({
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      fontColor: style.fontColor
    });
  }
  function generateStyleString(style) {
    const parts = [];
    if (style.fill) parts.push(`fill:${style.fill}`);
    if (style.stroke) parts.push(`stroke:${style.stroke}`);
    if (style.strokeWidth) parts.push(`stroke-width:${style.strokeWidth}px`);
    if (style.fontColor) parts.push(`color:${style.fontColor}`);
    return parts.join(",");
  }
  function generatePlantUML(diagram) {
    var _a;
    const lines = [];
    const direction = ((_a = diagram.metadata) == null ? void 0 : _a.direction) || "TB";
    lines.push("@startuml");
    lines.push("");
    if (direction === "LR" || direction === "RL") {
      lines.push("left to right direction");
      lines.push("");
    }
    lines.push("skinparam defaultTextAlignment center");
    lines.push("skinparam shadowing false");
    const hasDiamond = diagram.nodes.some((n) => n.shape === "diamond");
    if (hasDiamond) {
      lines.push("skinparam agent {");
      lines.push("    BorderColor Black");
      lines.push("    BackgroundColor White");
      lines.push("}");
    }
    lines.push("");
    const nodesInGroups = /* @__PURE__ */ new Set();
    for (const group of diagram.groups) {
      for (const childId of group.children) {
        nodesInGroups.add(childId);
      }
    }
    for (const group of diagram.groups) {
      lines.push(...generateGroup2(group, diagram.nodes));
      lines.push("");
    }
    for (const node of diagram.nodes) {
      if (!nodesInGroups.has(node.id)) {
        lines.push(generateNodeDefinition2(node));
      }
    }
    if (diagram.nodes.some((n) => !nodesInGroups.has(n.id))) {
      lines.push("");
    }
    for (const edge of diagram.edges) {
      lines.push(generateEdge2(edge, diagram.nodes));
    }
    lines.push("");
    lines.push("@enduml");
    return lines.join("\n");
  }
  function generateGroup2(group, nodes) {
    const lines = [];
    const label = group.label || group.id;
    lines.push(`package "${label}" {`);
    for (const childId of group.children) {
      const node = nodes.find((n) => n.id === childId);
      if (node) {
        lines.push(`    ${generateNodeDefinition2(node)}`);
      }
    }
    lines.push("}");
    return lines;
  }
  function generateNodeDefinition2(node) {
    const shape = getPlantUMLShape(node.shape);
    const label = escapeLabel(node.label);
    const alias = sanitizeAlias(node.id);
    const style = generateNodeStyle(node);
    if (node.shape === "diamond") {
      return `agent "${label}" as ${alias} <<choice>>${style}`;
    }
    switch (shape) {
      case "actor":
        return `actor "${label}" as ${alias}${style}`;
      case "database":
        return `database "${label}" as ${alias}${style}`;
      case "cloud":
        return `cloud "${label}" as ${alias}${style}`;
      case "file":
        return `file "${label}" as ${alias}${style}`;
      case "circle":
        return `circle "${label}" as ${alias}${style}`;
      case "hexagon":
        return `hexagon "${label}" as ${alias}${style}`;
      case "card":
        return `card "${label}" as ${alias}${style}`;
      case "usecase":
        return `usecase "${label}" as ${alias}${style}`;
      case "note":
        return `note "${label}" as ${alias}${style}`;
      case "agent":
        return `agent "${label}" as ${alias}${style}`;
      default:
        return `rectangle "${label}" as ${alias}${style}`;
    }
  }
  function generateEdge2(edge, nodes) {
    const sourceAlias = sanitizeAlias(edge.source);
    const targetAlias = sanitizeAlias(edge.target);
    const arrow = generatePlantUMLArrow(edge.arrow);
    if (edge.label) {
      return `${sourceAlias} ${arrow} ${targetAlias} : ${escapeLabel(edge.label)}`;
    }
    return `${sourceAlias} ${arrow} ${targetAlias}`;
  }
  function getPlantUMLShape(shape) {
    return PLANTUML_SHAPE_MAP[shape] || "rectangle";
  }
  function generateNodeStyle(node) {
    const parts = [];
    if (node.style.fill) {
      parts.push(node.style.fill);
    }
    if (parts.length > 0) {
      return ` ${parts.join(";")}`;
    }
    return "";
  }
  function escapeLabel(label) {
    return label.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function sanitizeAlias(str) {
    return str.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  function generateDot(diagram) {
    var _a;
    const lines = [];
    const direction = ((_a = diagram.metadata) == null ? void 0 : _a.direction) || "TB";
    lines.push("digraph G {");
    lines.push(`    rankdir=${direction};`);
    lines.push('    node [fontname="Arial", fontsize=12];');
    lines.push('    edge [fontname="Arial", fontsize=10];');
    lines.push("");
    const nodesInGroups = /* @__PURE__ */ new Set();
    for (const group of diagram.groups) {
      for (const childId of group.children) {
        nodesInGroups.add(childId);
      }
    }
    for (const group of diagram.groups) {
      lines.push(...generateSubgraph(group, diagram.nodes));
      lines.push("");
    }
    for (const node of diagram.nodes) {
      if (!nodesInGroups.has(node.id)) {
        lines.push(`    ${generateNodeDef(node)}`);
      }
    }
    if (diagram.nodes.some((n) => !nodesInGroups.has(n.id))) {
      lines.push("");
    }
    for (const edge of diagram.edges) {
      lines.push(`    ${generateEdgeDef(edge)}`);
    }
    lines.push("}");
    return lines.join("\n");
  }
  function generateSubgraph(group, nodes) {
    const lines = [];
    const label = group.label || group.id;
    lines.push(`    subgraph cluster_${sanitizeId(group.id)} {`);
    lines.push(`        label="${escapeString(label)}";`);
    if (group.style.fill) {
      lines.push(`        style=filled;`);
      lines.push(`        fillcolor="${group.style.fill}";`);
    }
    for (const childId of group.children) {
      const node = nodes.find((n) => n.id === childId);
      if (node) {
        lines.push(`        ${generateNodeDef(node)}`);
      }
    }
    lines.push("    }");
    return lines;
  }
  function generateNodeDef(node) {
    const attrs = [];
    attrs.push(`label="${escapeString(node.label)}"`);
    const shape = mapIRShapeToDot(node.shape);
    if (shape !== "box") {
      attrs.push(`shape=${shape}`);
    }
    if (node.style.fill) {
      attrs.push("style=filled");
      attrs.push(`fillcolor="${node.style.fill}"`);
    }
    if (node.style.stroke) {
      attrs.push(`color="${node.style.stroke}"`);
    }
    if (node.style.fontColor) {
      attrs.push(`fontcolor="${node.style.fontColor}"`);
    }
    return `${sanitizeId(node.id)} [${attrs.join(", ")}];`;
  }
  function generateEdgeDef(edge) {
    const attrs = [];
    if (edge.label) {
      attrs.push(`label="${escapeString(edge.label)}"`);
    }
    const dir = getArrowDir(edge.arrow);
    if (dir !== "forward") {
      attrs.push(`dir=${dir}`);
    }
    if (edge.arrow.lineType === "dashed") {
      attrs.push("style=dashed");
    } else if (edge.arrow.lineType === "dotted") {
      attrs.push("style=dotted");
    }
    if (edge.style.stroke) {
      attrs.push(`color="${edge.style.stroke}"`);
    }
    const attrStr = attrs.length > 0 ? ` [${attrs.join(", ")}]` : "";
    return `${sanitizeId(edge.source)} -> ${sanitizeId(edge.target)}${attrStr};`;
  }
  function mapIRShapeToDot(shape) {
    const shapeMap = {
      "rectangle": "box",
      "rounded-rectangle": "box",
      "circle": "circle",
      "ellipse": "ellipse",
      "diamond": "diamond",
      "hexagon": "hexagon",
      "parallelogram": "parallelogram",
      "trapezoid": "trapezium",
      "cylinder": "cylinder",
      "document": "note",
      "cloud": "ellipse",
      "actor": "box",
      "note": "note",
      "custom": "box"
    };
    return shapeMap[shape] || "box";
  }
  function getArrowDir(arrow) {
    const hasSource = arrow.sourceType !== "none";
    const hasTarget = arrow.targetType !== "none";
    if (hasSource && hasTarget) return "both";
    if (hasSource && !hasTarget) return "back";
    if (!hasSource && !hasTarget) return "none";
    return "forward";
  }
  function sanitizeId(id) {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id)) {
      return id;
    }
    return `"${escapeString(id)}"`;
  }
  function escapeString(str) {
    return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  }
  var DEFAULT_OPTIONS$2 = {
    padding: 20,
    nodeWidth: 120,
    nodeHeight: 60,
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
    backgroundColor: "transparent",
    edgeRouting: "orthogonal"
  };
  function generateSvg(diagram, options = {}) {
    const opts = { ...DEFAULT_OPTIONS$2, ...options };
    const bounds = calculateBounds(diagram, opts);
    const width2 = bounds.maxX - bounds.minX + opts.padding * 2;
    const height = bounds.maxY - bounds.minY + opts.padding * 2;
    const elements = [];
    elements.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width2} ${height}" width="${width2}" height="${height}">`);
    elements.push(generateDefs());
    if (opts.backgroundColor !== "transparent") {
      elements.push(`  <rect width="100%" height="100%" fill="${opts.backgroundColor}"/>`);
    }
    const offsetX = opts.padding - bounds.minX;
    const offsetY = opts.padding - bounds.minY;
    elements.push(`  <g transform="translate(${offsetX}, ${offsetY})">`);
    for (const group of diagram.groups) {
      elements.push(renderGroup(group, diagram.nodes, opts));
    }
    for (const edge of diagram.edges) {
      const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
      const targetNode = diagram.nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        elements.push(renderEdge(edge, sourceNode, targetNode, opts));
      }
    }
    for (const node of diagram.nodes) {
      elements.push(renderNode(node, opts));
    }
    elements.push("  </g>");
    elements.push("</svg>");
    return elements.join("\n");
  }
  function generateDefs() {
    return `  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
    <marker id="arrowhead-start" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto-start-reverse">
      <polygon points="10 0, 0 3.5, 10 7" fill="#333"/>
    </marker>
    <marker id="circle-marker" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <circle cx="4" cy="4" r="3" fill="none" stroke="#333" stroke-width="1"/>
    </marker>
    <marker id="diamond-marker" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
      <polygon points="6 0, 12 6, 6 12, 0 6" fill="none" stroke="#333" stroke-width="1"/>
    </marker>
  </defs>`;
  }
  function calculateBounds(diagram, opts) {
    var _a, _b, _c, _d;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of diagram.nodes) {
      const x = ((_a = node.position) == null ? void 0 : _a.x) ?? 0;
      const y = ((_b = node.position) == null ? void 0 : _b.y) ?? 0;
      const w = ((_c = node.size) == null ? void 0 : _c.width) ?? opts.nodeWidth;
      const h = ((_d = node.size) == null ? void 0 : _d.height) ?? opts.nodeHeight;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 200, maxY: 100 };
    }
    return { minX, minY, maxX, maxY };
  }
  function renderNode(node, opts) {
    var _a, _b, _c, _d;
    const x = ((_a = node.position) == null ? void 0 : _a.x) ?? 0;
    const y = ((_b = node.position) == null ? void 0 : _b.y) ?? 0;
    const w = ((_c = node.size) == null ? void 0 : _c.width) ?? opts.nodeWidth;
    const h = ((_d = node.size) == null ? void 0 : _d.height) ?? opts.nodeHeight;
    const fill = node.style.fill || "#ffffff";
    const stroke = node.style.stroke || "#333333";
    const strokeWidth = node.style.strokeWidth || 2;
    const shape = renderShape(node.shape, x, y, w, h, fill, stroke, strokeWidth);
    const text = renderText(node.label, x + w / 2, y + h / 2, opts);
    return `    <g class="node" data-id="${escapeXml2(node.id)}">
${shape}
${text}
    </g>`;
  }
  function renderShape(shape, x, y, w, h, fill, stroke, strokeWidth) {
    const style = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"`;
    switch (shape) {
      case "circle":
        const r = Math.min(w, h) / 2;
        return `      <circle cx="${x + w / 2}" cy="${y + h / 2}" r="${r}" ${style}/>`;
      case "ellipse":
        return `      <ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${style}/>`;
      case "diamond":
        const points = `${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`;
        return `      <polygon points="${points}" ${style}/>`;
      case "rounded-rectangle":
        return `      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" ry="10" ${style}/>`;
      case "hexagon":
        const hx = w / 4;
        const hexPoints = `${x + hx},${y} ${x + w - hx},${y} ${x + w},${y + h / 2} ${x + w - hx},${y + h} ${x + hx},${y + h} ${x},${y + h / 2}`;
        return `      <polygon points="${hexPoints}" ${style}/>`;
      case "cylinder":
        return `      <path d="M${x},${y + 10} 
                          a${w / 2},10 0 0,0 ${w},0 
                          v${h - 20} 
                          a${w / 2},10 0 0,1 -${w},0 
                          v-${h - 20}
                          a${w / 2},10 0 0,1 ${w},0" ${style}/>`;
      default:
        return `      <rect x="${x}" y="${y}" width="${w}" height="${h}" ${style}/>`;
    }
  }
  function renderText(text, cx, cy, opts) {
    return `      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="${opts.fontFamily}" font-size="${opts.fontSize}">${escapeXml2(text)}</text>`;
  }
  function renderEdge(edge, source, target, opts) {
    const defaultSize = { width: opts.nodeWidth, height: opts.nodeHeight };
    const { start, end } = getConnectionPoints(source, target, defaultSize);
    const stroke = edge.style.stroke || "#333333";
    const strokeWidth = edge.style.strokeWidth || 2;
    let strokeDasharray = "";
    if (edge.arrow.lineType === "dashed") strokeDasharray = ' stroke-dasharray="8,4"';
    else if (edge.arrow.lineType === "dotted") strokeDasharray = ' stroke-dasharray="2,2"';
    let markerEnd = "";
    let markerStart = "";
    if (edge.arrow.targetType === "arrow") markerEnd = ' marker-end="url(#arrowhead)"';
    if (edge.arrow.sourceType === "arrow") markerStart = ' marker-start="url(#arrowhead-start)"';
    let pathD;
    if (opts.edgeRouting === "curved") {
      pathD = generateCurvedPath(start, end);
    } else if (opts.edgeRouting === "orthogonal") {
      pathD = generateOrthogonalPath(start, end);
    } else {
      pathD = `M${start.x},${start.y} L${end.x},${end.y}`;
    }
    let labelElement = "";
    if (edge.label) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      labelElement = `
      <rect x="${midX - 30}" y="${midY - 12}" width="60" height="18" fill="white" rx="3"/>
      <text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="middle" font-family="${opts.fontFamily}" font-size="${opts.fontSize - 2}">${escapeXml2(edge.label)}</text>`;
    }
    return `    <g class="edge">
      <path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"${strokeDasharray}${markerStart}${markerEnd}/>${labelElement}
    </g>`;
  }
  function renderGroup(group, _nodes, opts) {
    var _a, _b, _c, _d;
    const x = ((_a = group.position) == null ? void 0 : _a.x) ?? 0;
    const y = ((_b = group.position) == null ? void 0 : _b.y) ?? 0;
    const w = ((_c = group.size) == null ? void 0 : _c.width) ?? 200;
    const h = ((_d = group.size) == null ? void 0 : _d.height) ?? 150;
    const fill = group.style.fill || "#f5f5f5";
    const stroke = group.style.stroke || "#cccccc";
    let strokeDasharray = "";
    if (group.style.strokeDasharray) strokeDasharray = ` stroke-dasharray="${group.style.strokeDasharray}"`;
    const label = group.label || "";
    return `    <g class="group">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="1"${strokeDasharray} rx="5"/>
      <text x="${x + 10}" y="${y + 20}" font-family="${opts.fontFamily}" font-size="${opts.fontSize}" font-weight="bold">${escapeXml2(label)}</text>
    </g>`;
  }
  function escapeXml2(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var DEFAULT_OPTIONS2 = {
    scale: 2,
    padding: 20,
    nodeWidth: 120,
    nodeHeight: 60,
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#ffffff",
    quality: 1,
    antiAlias: true
  };
  function generatePng(diagram, options = {}) {
    return generatePngWithInfo(diagram, options).dataUrl;
  }
  function generatePngWithInfo(diagram, options = {}) {
    const opts = { ...DEFAULT_OPTIONS2, ...options };
    const canvas = createCanvas(diagram, opts);
    return {
      dataUrl: canvas.toDataURL("image/png", opts.quality),
      width: canvas.width,
      height: canvas.height
    };
  }
  function createCanvas(diagram, opts) {
    if (typeof document === "undefined") {
      throw new Error("PNG generation requires browser environment with Canvas API");
    }
    const bounds = calculateBounds2(diagram, opts);
    const width2 = (bounds.maxX - bounds.minX + opts.padding * 2) * opts.scale;
    const height = (bounds.maxY - bounds.minY + opts.padding * 2) * opts.scale;
    const canvas = document.createElement("canvas");
    canvas.width = width2;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Failed to get canvas 2D context");
    }
    if (opts.antiAlias) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
    ctx.scale(opts.scale, opts.scale);
    const offsetX = opts.padding - bounds.minX;
    const offsetY = opts.padding - bounds.minY;
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(
      bounds.minX - opts.padding,
      bounds.minY - opts.padding,
      bounds.maxX - bounds.minX + opts.padding * 2,
      bounds.maxY - bounds.minY + opts.padding * 2
    );
    for (const group of diagram.groups) {
      renderGroup2(ctx, group, opts);
    }
    for (const edge of diagram.edges) {
      const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
      const targetNode = diagram.nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        renderEdge2(ctx, edge, sourceNode, targetNode, opts);
      }
    }
    for (const node of diagram.nodes) {
      renderNode2(ctx, node, opts);
    }
    return canvas;
  }
  function calculateBounds2(diagram, opts) {
    var _a, _b, _c, _d;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of diagram.nodes) {
      const x = ((_a = node.position) == null ? void 0 : _a.x) ?? 0;
      const y = ((_b = node.position) == null ? void 0 : _b.y) ?? 0;
      const w = ((_c = node.size) == null ? void 0 : _c.width) ?? opts.nodeWidth;
      const h = ((_d = node.size) == null ? void 0 : _d.height) ?? opts.nodeHeight;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 200, maxY: 100 };
    }
    return { minX, minY, maxX, maxY };
  }
  function renderNode2(ctx, node, opts) {
    var _a, _b, _c, _d;
    const x = ((_a = node.position) == null ? void 0 : _a.x) ?? 0;
    const y = ((_b = node.position) == null ? void 0 : _b.y) ?? 0;
    const w = ((_c = node.size) == null ? void 0 : _c.width) ?? opts.nodeWidth;
    const h = ((_d = node.size) == null ? void 0 : _d.height) ?? opts.nodeHeight;
    const fill = node.style.fill || "#ffffff";
    const stroke = node.style.stroke || "#333333";
    const strokeWidth = node.style.strokeWidth || 2;
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    renderShape2(ctx, node.shape, x, y, w, h);
    ctx.fillStyle = node.style.fontColor || "#000000";
    ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, x + w / 2, y + h / 2);
  }
  function renderShape2(ctx, shape, x, y, w, h) {
    ctx.beginPath();
    switch (shape) {
      case "circle":
        const r = Math.min(w, h) / 2;
        ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
        break;
      case "ellipse":
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case "diamond":
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
        break;
      case "rounded-rectangle":
        const radius = 10;
        ctx.roundRect(x, y, w, h, radius);
        break;
      case "hexagon":
        const hx = w / 4;
        ctx.moveTo(x + hx, y);
        ctx.lineTo(x + w - hx, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w - hx, y + h);
        ctx.lineTo(x + hx, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
        break;
      default:
        ctx.rect(x, y, w, h);
    }
    ctx.fill();
    ctx.stroke();
  }
  function renderEdge2(ctx, edge, source, target, opts) {
    const defaultSize = { width: opts.nodeWidth, height: opts.nodeHeight };
    const { start, end } = getConnectionPoints(source, target, defaultSize);
    ctx.strokeStyle = edge.style.stroke || "#333333";
    ctx.lineWidth = edge.style.strokeWidth || 2;
    if (edge.arrow.lineType === "dashed") {
      ctx.setLineDash([8, 4]);
    } else if (edge.arrow.lineType === "dotted") {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    if (start.side === "right" || start.side === "left") {
      const midX = (start.x + end.x) / 2;
      ctx.lineTo(midX, start.y);
      ctx.lineTo(midX, end.y);
    } else {
      const midY = (start.y + end.y) / 2;
      ctx.lineTo(start.x, midY);
      ctx.lineTo(end.x, midY);
    }
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (edge.arrow.targetType === "arrow") {
      drawArrowhead(ctx, start.x, start.y, end.x, end.y);
    }
    if (edge.label) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(midX - 30, midY - 10, 60, 20);
      ctx.fillStyle = "#000000";
      ctx.font = `${opts.fontSize - 2}px ${opts.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(edge.label, midX, midY);
    }
  }
  function drawArrowhead(ctx, fromX, fromY, toX, toY) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
  function renderGroup2(ctx, group, opts) {
    var _a, _b, _c, _d;
    const x = ((_a = group.position) == null ? void 0 : _a.x) ?? 0;
    const y = ((_b = group.position) == null ? void 0 : _b.y) ?? 0;
    const w = ((_c = group.size) == null ? void 0 : _c.width) ?? 200;
    const h = ((_d = group.size) == null ? void 0 : _d.height) ?? 150;
    ctx.fillStyle = group.style.fill || "#f5f5f5";
    ctx.strokeStyle = group.style.stroke || "#cccccc";
    ctx.lineWidth = 1;
    if (group.style.strokeDasharray) {
      ctx.setLineDash([5, 5]);
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    if (group.label) {
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${opts.fontSize}px ${opts.fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(group.label, x + 10, y + 10);
    }
  }
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  function commonjsRequire(path) {
    throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }
  var _listCacheClear;
  var hasRequired_listCacheClear;
  function require_listCacheClear() {
    if (hasRequired_listCacheClear) return _listCacheClear;
    hasRequired_listCacheClear = 1;
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }
    _listCacheClear = listCacheClear;
    return _listCacheClear;
  }
  var eq_1;
  var hasRequiredEq;
  function requireEq() {
    if (hasRequiredEq) return eq_1;
    hasRequiredEq = 1;
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    eq_1 = eq;
    return eq_1;
  }
  var _assocIndexOf;
  var hasRequired_assocIndexOf;
  function require_assocIndexOf() {
    if (hasRequired_assocIndexOf) return _assocIndexOf;
    hasRequired_assocIndexOf = 1;
    var eq = requireEq();
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    _assocIndexOf = assocIndexOf;
    return _assocIndexOf;
  }
  var _listCacheDelete;
  var hasRequired_listCacheDelete;
  function require_listCacheDelete() {
    if (hasRequired_listCacheDelete) return _listCacheDelete;
    hasRequired_listCacheDelete = 1;
    var assocIndexOf = require_assocIndexOf();
    var arrayProto = Array.prototype;
    var splice = arrayProto.splice;
    function listCacheDelete(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }
    _listCacheDelete = listCacheDelete;
    return _listCacheDelete;
  }
  var _listCacheGet;
  var hasRequired_listCacheGet;
  function require_listCacheGet() {
    if (hasRequired_listCacheGet) return _listCacheGet;
    hasRequired_listCacheGet = 1;
    var assocIndexOf = require_assocIndexOf();
    function listCacheGet(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      return index < 0 ? void 0 : data[index][1];
    }
    _listCacheGet = listCacheGet;
    return _listCacheGet;
  }
  var _listCacheHas;
  var hasRequired_listCacheHas;
  function require_listCacheHas() {
    if (hasRequired_listCacheHas) return _listCacheHas;
    hasRequired_listCacheHas = 1;
    var assocIndexOf = require_assocIndexOf();
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    _listCacheHas = listCacheHas;
    return _listCacheHas;
  }
  var _listCacheSet;
  var hasRequired_listCacheSet;
  function require_listCacheSet() {
    if (hasRequired_listCacheSet) return _listCacheSet;
    hasRequired_listCacheSet = 1;
    var assocIndexOf = require_assocIndexOf();
    function listCacheSet(key, value) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }
    _listCacheSet = listCacheSet;
    return _listCacheSet;
  }
  var _ListCache;
  var hasRequired_ListCache;
  function require_ListCache() {
    if (hasRequired_ListCache) return _ListCache;
    hasRequired_ListCache = 1;
    var listCacheClear = require_listCacheClear(), listCacheDelete = require_listCacheDelete(), listCacheGet = require_listCacheGet(), listCacheHas = require_listCacheHas(), listCacheSet = require_listCacheSet();
    function ListCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    _ListCache = ListCache;
    return _ListCache;
  }
  var _stackClear;
  var hasRequired_stackClear;
  function require_stackClear() {
    if (hasRequired_stackClear) return _stackClear;
    hasRequired_stackClear = 1;
    var ListCache = require_ListCache();
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }
    _stackClear = stackClear;
    return _stackClear;
  }
  var _stackDelete;
  var hasRequired_stackDelete;
  function require_stackDelete() {
    if (hasRequired_stackDelete) return _stackDelete;
    hasRequired_stackDelete = 1;
    function stackDelete(key) {
      var data = this.__data__, result = data["delete"](key);
      this.size = data.size;
      return result;
    }
    _stackDelete = stackDelete;
    return _stackDelete;
  }
  var _stackGet;
  var hasRequired_stackGet;
  function require_stackGet() {
    if (hasRequired_stackGet) return _stackGet;
    hasRequired_stackGet = 1;
    function stackGet(key) {
      return this.__data__.get(key);
    }
    _stackGet = stackGet;
    return _stackGet;
  }
  var _stackHas;
  var hasRequired_stackHas;
  function require_stackHas() {
    if (hasRequired_stackHas) return _stackHas;
    hasRequired_stackHas = 1;
    function stackHas(key) {
      return this.__data__.has(key);
    }
    _stackHas = stackHas;
    return _stackHas;
  }
  var _freeGlobal;
  var hasRequired_freeGlobal;
  function require_freeGlobal() {
    if (hasRequired_freeGlobal) return _freeGlobal;
    hasRequired_freeGlobal = 1;
    var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
    _freeGlobal = freeGlobal;
    return _freeGlobal;
  }
  var _root;
  var hasRequired_root;
  function require_root() {
    if (hasRequired_root) return _root;
    hasRequired_root = 1;
    var freeGlobal = require_freeGlobal();
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root2 = freeGlobal || freeSelf || Function("return this")();
    _root = root2;
    return _root;
  }
  var _Symbol;
  var hasRequired_Symbol;
  function require_Symbol() {
    if (hasRequired_Symbol) return _Symbol;
    hasRequired_Symbol = 1;
    var root2 = require_root();
    var Symbol = root2.Symbol;
    _Symbol = Symbol;
    return _Symbol;
  }
  var _getRawTag;
  var hasRequired_getRawTag;
  function require_getRawTag() {
    if (hasRequired_getRawTag) return _getRawTag;
    hasRequired_getRawTag = 1;
    var Symbol = require_Symbol();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    _getRawTag = getRawTag;
    return _getRawTag;
  }
  var _objectToString;
  var hasRequired_objectToString;
  function require_objectToString() {
    if (hasRequired_objectToString) return _objectToString;
    hasRequired_objectToString = 1;
    var objectProto = Object.prototype;
    var nativeObjectToString = objectProto.toString;
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    _objectToString = objectToString;
    return _objectToString;
  }
  var _baseGetTag;
  var hasRequired_baseGetTag;
  function require_baseGetTag() {
    if (hasRequired_baseGetTag) return _baseGetTag;
    hasRequired_baseGetTag = 1;
    var Symbol = require_Symbol(), getRawTag = require_getRawTag(), objectToString = require_objectToString();
    var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    _baseGetTag = baseGetTag;
    return _baseGetTag;
  }
  var isObject_1;
  var hasRequiredIsObject;
  function requireIsObject() {
    if (hasRequiredIsObject) return isObject_1;
    hasRequiredIsObject = 1;
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    isObject_1 = isObject;
    return isObject_1;
  }
  var isFunction_1;
  var hasRequiredIsFunction;
  function requireIsFunction() {
    if (hasRequiredIsFunction) return isFunction_1;
    hasRequiredIsFunction = 1;
    var baseGetTag = require_baseGetTag(), isObject = requireIsObject();
    var asyncTag = "[object AsyncFunction]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    isFunction_1 = isFunction;
    return isFunction_1;
  }
  var _coreJsData;
  var hasRequired_coreJsData;
  function require_coreJsData() {
    if (hasRequired_coreJsData) return _coreJsData;
    hasRequired_coreJsData = 1;
    var root2 = require_root();
    var coreJsData = root2["__core-js_shared__"];
    _coreJsData = coreJsData;
    return _coreJsData;
  }
  var _isMasked;
  var hasRequired_isMasked;
  function require_isMasked() {
    if (hasRequired_isMasked) return _isMasked;
    hasRequired_isMasked = 1;
    var coreJsData = require_coreJsData();
    var maskSrcKey = function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    }();
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    _isMasked = isMasked;
    return _isMasked;
  }
  var _toSource;
  var hasRequired_toSource;
  function require_toSource() {
    if (hasRequired_toSource) return _toSource;
    hasRequired_toSource = 1;
    var funcProto = Function.prototype;
    var funcToString = funcProto.toString;
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    _toSource = toSource;
    return _toSource;
  }
  var _baseIsNative;
  var hasRequired_baseIsNative;
  function require_baseIsNative() {
    if (hasRequired_baseIsNative) return _baseIsNative;
    hasRequired_baseIsNative = 1;
    var isFunction = requireIsFunction(), isMasked = require_isMasked(), isObject = requireIsObject(), toSource = require_toSource();
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var funcProto = Function.prototype, objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    _baseIsNative = baseIsNative;
    return _baseIsNative;
  }
  var _getValue;
  var hasRequired_getValue;
  function require_getValue() {
    if (hasRequired_getValue) return _getValue;
    hasRequired_getValue = 1;
    function getValue(object, key) {
      return object == null ? void 0 : object[key];
    }
    _getValue = getValue;
    return _getValue;
  }
  var _getNative;
  var hasRequired_getNative;
  function require_getNative() {
    if (hasRequired_getNative) return _getNative;
    hasRequired_getNative = 1;
    var baseIsNative = require_baseIsNative(), getValue = require_getValue();
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : void 0;
    }
    _getNative = getNative;
    return _getNative;
  }
  var _Map;
  var hasRequired_Map;
  function require_Map() {
    if (hasRequired_Map) return _Map;
    hasRequired_Map = 1;
    var getNative = require_getNative(), root2 = require_root();
    var Map2 = getNative(root2, "Map");
    _Map = Map2;
    return _Map;
  }
  var _nativeCreate;
  var hasRequired_nativeCreate;
  function require_nativeCreate() {
    if (hasRequired_nativeCreate) return _nativeCreate;
    hasRequired_nativeCreate = 1;
    var getNative = require_getNative();
    var nativeCreate = getNative(Object, "create");
    _nativeCreate = nativeCreate;
    return _nativeCreate;
  }
  var _hashClear;
  var hasRequired_hashClear;
  function require_hashClear() {
    if (hasRequired_hashClear) return _hashClear;
    hasRequired_hashClear = 1;
    var nativeCreate = require_nativeCreate();
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }
    _hashClear = hashClear;
    return _hashClear;
  }
  var _hashDelete;
  var hasRequired_hashDelete;
  function require_hashDelete() {
    if (hasRequired_hashDelete) return _hashDelete;
    hasRequired_hashDelete = 1;
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }
    _hashDelete = hashDelete;
    return _hashDelete;
  }
  var _hashGet;
  var hasRequired_hashGet;
  function require_hashGet() {
    if (hasRequired_hashGet) return _hashGet;
    hasRequired_hashGet = 1;
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : void 0;
    }
    _hashGet = hashGet;
    return _hashGet;
  }
  var _hashHas;
  var hasRequired_hashHas;
  function require_hashHas() {
    if (hasRequired_hashHas) return _hashHas;
    hasRequired_hashHas = 1;
    var nativeCreate = require_nativeCreate();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
    }
    _hashHas = hashHas;
    return _hashHas;
  }
  var _hashSet;
  var hasRequired_hashSet;
  function require_hashSet() {
    if (hasRequired_hashSet) return _hashSet;
    hasRequired_hashSet = 1;
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    _hashSet = hashSet;
    return _hashSet;
  }
  var _Hash;
  var hasRequired_Hash;
  function require_Hash() {
    if (hasRequired_Hash) return _Hash;
    hasRequired_Hash = 1;
    var hashClear = require_hashClear(), hashDelete = require_hashDelete(), hashGet = require_hashGet(), hashHas = require_hashHas(), hashSet = require_hashSet();
    function Hash(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    _Hash = Hash;
    return _Hash;
  }
  var _mapCacheClear;
  var hasRequired_mapCacheClear;
  function require_mapCacheClear() {
    if (hasRequired_mapCacheClear) return _mapCacheClear;
    hasRequired_mapCacheClear = 1;
    var Hash = require_Hash(), ListCache = require_ListCache(), Map2 = require_Map();
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    _mapCacheClear = mapCacheClear;
    return _mapCacheClear;
  }
  var _isKeyable;
  var hasRequired_isKeyable;
  function require_isKeyable() {
    if (hasRequired_isKeyable) return _isKeyable;
    hasRequired_isKeyable = 1;
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    _isKeyable = isKeyable;
    return _isKeyable;
  }
  var _getMapData;
  var hasRequired_getMapData;
  function require_getMapData() {
    if (hasRequired_getMapData) return _getMapData;
    hasRequired_getMapData = 1;
    var isKeyable = require_isKeyable();
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    _getMapData = getMapData;
    return _getMapData;
  }
  var _mapCacheDelete;
  var hasRequired_mapCacheDelete;
  function require_mapCacheDelete() {
    if (hasRequired_mapCacheDelete) return _mapCacheDelete;
    hasRequired_mapCacheDelete = 1;
    var getMapData = require_getMapData();
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }
    _mapCacheDelete = mapCacheDelete;
    return _mapCacheDelete;
  }
  var _mapCacheGet;
  var hasRequired_mapCacheGet;
  function require_mapCacheGet() {
    if (hasRequired_mapCacheGet) return _mapCacheGet;
    hasRequired_mapCacheGet = 1;
    var getMapData = require_getMapData();
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    _mapCacheGet = mapCacheGet;
    return _mapCacheGet;
  }
  var _mapCacheHas;
  var hasRequired_mapCacheHas;
  function require_mapCacheHas() {
    if (hasRequired_mapCacheHas) return _mapCacheHas;
    hasRequired_mapCacheHas = 1;
    var getMapData = require_getMapData();
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    _mapCacheHas = mapCacheHas;
    return _mapCacheHas;
  }
  var _mapCacheSet;
  var hasRequired_mapCacheSet;
  function require_mapCacheSet() {
    if (hasRequired_mapCacheSet) return _mapCacheSet;
    hasRequired_mapCacheSet = 1;
    var getMapData = require_getMapData();
    function mapCacheSet(key, value) {
      var data = getMapData(this, key), size = data.size;
      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }
    _mapCacheSet = mapCacheSet;
    return _mapCacheSet;
  }
  var _MapCache;
  var hasRequired_MapCache;
  function require_MapCache() {
    if (hasRequired_MapCache) return _MapCache;
    hasRequired_MapCache = 1;
    var mapCacheClear = require_mapCacheClear(), mapCacheDelete = require_mapCacheDelete(), mapCacheGet = require_mapCacheGet(), mapCacheHas = require_mapCacheHas(), mapCacheSet = require_mapCacheSet();
    function MapCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    _MapCache = MapCache;
    return _MapCache;
  }
  var _stackSet;
  var hasRequired_stackSet;
  function require_stackSet() {
    if (hasRequired_stackSet) return _stackSet;
    hasRequired_stackSet = 1;
    var ListCache = require_ListCache(), Map2 = require_Map(), MapCache = require_MapCache();
    var LARGE_ARRAY_SIZE = 200;
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }
    _stackSet = stackSet;
    return _stackSet;
  }
  var _Stack;
  var hasRequired_Stack;
  function require_Stack() {
    if (hasRequired_Stack) return _Stack;
    hasRequired_Stack = 1;
    var ListCache = require_ListCache(), stackClear = require_stackClear(), stackDelete = require_stackDelete(), stackGet = require_stackGet(), stackHas = require_stackHas(), stackSet = require_stackSet();
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    _Stack = Stack;
    return _Stack;
  }
  var _arrayEach;
  var hasRequired_arrayEach;
  function require_arrayEach() {
    if (hasRequired_arrayEach) return _arrayEach;
    hasRequired_arrayEach = 1;
    function arrayEach(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }
    _arrayEach = arrayEach;
    return _arrayEach;
  }
  var _defineProperty;
  var hasRequired_defineProperty;
  function require_defineProperty() {
    if (hasRequired_defineProperty) return _defineProperty;
    hasRequired_defineProperty = 1;
    var getNative = require_getNative();
    var defineProperty = function() {
      try {
        var func = getNative(Object, "defineProperty");
        func({}, "", {});
        return func;
      } catch (e) {
      }
    }();
    _defineProperty = defineProperty;
    return _defineProperty;
  }
  var _baseAssignValue;
  var hasRequired_baseAssignValue;
  function require_baseAssignValue() {
    if (hasRequired_baseAssignValue) return _baseAssignValue;
    hasRequired_baseAssignValue = 1;
    var defineProperty = require_defineProperty();
    function baseAssignValue(object, key, value) {
      if (key == "__proto__" && defineProperty) {
        defineProperty(object, key, {
          "configurable": true,
          "enumerable": true,
          "value": value,
          "writable": true
        });
      } else {
        object[key] = value;
      }
    }
    _baseAssignValue = baseAssignValue;
    return _baseAssignValue;
  }
  var _assignValue;
  var hasRequired_assignValue;
  function require_assignValue() {
    if (hasRequired_assignValue) return _assignValue;
    hasRequired_assignValue = 1;
    var baseAssignValue = require_baseAssignValue(), eq = requireEq();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
        baseAssignValue(object, key, value);
      }
    }
    _assignValue = assignValue;
    return _assignValue;
  }
  var _copyObject;
  var hasRequired_copyObject;
  function require_copyObject() {
    if (hasRequired_copyObject) return _copyObject;
    hasRequired_copyObject = 1;
    var assignValue = require_assignValue(), baseAssignValue = require_baseAssignValue();
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});
      var index = -1, length = props.length;
      while (++index < length) {
        var key = props[index];
        var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
        if (newValue === void 0) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }
    _copyObject = copyObject;
    return _copyObject;
  }
  var _baseTimes;
  var hasRequired_baseTimes;
  function require_baseTimes() {
    if (hasRequired_baseTimes) return _baseTimes;
    hasRequired_baseTimes = 1;
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    _baseTimes = baseTimes;
    return _baseTimes;
  }
  var isObjectLike_1;
  var hasRequiredIsObjectLike;
  function requireIsObjectLike() {
    if (hasRequiredIsObjectLike) return isObjectLike_1;
    hasRequiredIsObjectLike = 1;
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    isObjectLike_1 = isObjectLike;
    return isObjectLike_1;
  }
  var _baseIsArguments;
  var hasRequired_baseIsArguments;
  function require_baseIsArguments() {
    if (hasRequired_baseIsArguments) return _baseIsArguments;
    hasRequired_baseIsArguments = 1;
    var baseGetTag = require_baseGetTag(), isObjectLike = requireIsObjectLike();
    var argsTag = "[object Arguments]";
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    _baseIsArguments = baseIsArguments;
    return _baseIsArguments;
  }
  var isArguments_1;
  var hasRequiredIsArguments;
  function requireIsArguments() {
    if (hasRequiredIsArguments) return isArguments_1;
    hasRequiredIsArguments = 1;
    var baseIsArguments = require_baseIsArguments(), isObjectLike = requireIsObjectLike();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var isArguments = baseIsArguments(/* @__PURE__ */ function() {
      return arguments;
    }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    isArguments_1 = isArguments;
    return isArguments_1;
  }
  var isArray_1;
  var hasRequiredIsArray;
  function requireIsArray() {
    if (hasRequiredIsArray) return isArray_1;
    hasRequiredIsArray = 1;
    var isArray = Array.isArray;
    isArray_1 = isArray;
    return isArray_1;
  }
  var isBuffer = { exports: {} };
  var stubFalse_1;
  var hasRequiredStubFalse;
  function requireStubFalse() {
    if (hasRequiredStubFalse) return stubFalse_1;
    hasRequiredStubFalse = 1;
    function stubFalse() {
      return false;
    }
    stubFalse_1 = stubFalse;
    return stubFalse_1;
  }
  isBuffer.exports;
  var hasRequiredIsBuffer;
  function requireIsBuffer() {
    if (hasRequiredIsBuffer) return isBuffer.exports;
    hasRequiredIsBuffer = 1;
    (function(module, exports$1) {
      var root2 = require_root(), stubFalse = requireStubFalse();
      var freeExports = exports$1 && !exports$1.nodeType && exports$1;
      var freeModule = freeExports && true && module && !module.nodeType && module;
      var moduleExports = freeModule && freeModule.exports === freeExports;
      var Buffer2 = moduleExports ? root2.Buffer : void 0;
      var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
      var isBuffer2 = nativeIsBuffer || stubFalse;
      module.exports = isBuffer2;
    })(isBuffer, isBuffer.exports);
    return isBuffer.exports;
  }
  var _isIndex;
  var hasRequired_isIndex;
  function require_isIndex() {
    if (hasRequired_isIndex) return _isIndex;
    hasRequired_isIndex = 1;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    _isIndex = isIndex;
    return _isIndex;
  }
  var isLength_1;
  var hasRequiredIsLength;
  function requireIsLength() {
    if (hasRequiredIsLength) return isLength_1;
    hasRequiredIsLength = 1;
    var MAX_SAFE_INTEGER = 9007199254740991;
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    isLength_1 = isLength;
    return isLength_1;
  }
  var _baseIsTypedArray;
  var hasRequired_baseIsTypedArray;
  function require_baseIsTypedArray() {
    if (hasRequired_baseIsTypedArray) return _baseIsTypedArray;
    hasRequired_baseIsTypedArray = 1;
    var baseGetTag = require_baseGetTag(), isLength = requireIsLength(), isObjectLike = requireIsObjectLike();
    var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    _baseIsTypedArray = baseIsTypedArray;
    return _baseIsTypedArray;
  }
  var _baseUnary;
  var hasRequired_baseUnary;
  function require_baseUnary() {
    if (hasRequired_baseUnary) return _baseUnary;
    hasRequired_baseUnary = 1;
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    _baseUnary = baseUnary;
    return _baseUnary;
  }
  var _nodeUtil = { exports: {} };
  _nodeUtil.exports;
  var hasRequired_nodeUtil;
  function require_nodeUtil() {
    if (hasRequired_nodeUtil) return _nodeUtil.exports;
    hasRequired_nodeUtil = 1;
    (function(module, exports$1) {
      var freeGlobal = require_freeGlobal();
      var freeExports = exports$1 && !exports$1.nodeType && exports$1;
      var freeModule = freeExports && true && module && !module.nodeType && module;
      var moduleExports = freeModule && freeModule.exports === freeExports;
      var freeProcess = moduleExports && freeGlobal.process;
      var nodeUtil = function() {
        try {
          var types = freeModule && freeModule.require && freeModule.require("util").types;
          if (types) {
            return types;
          }
          return freeProcess && freeProcess.binding && freeProcess.binding("util");
        } catch (e) {
        }
      }();
      module.exports = nodeUtil;
    })(_nodeUtil, _nodeUtil.exports);
    return _nodeUtil.exports;
  }
  var isTypedArray_1;
  var hasRequiredIsTypedArray;
  function requireIsTypedArray() {
    if (hasRequiredIsTypedArray) return isTypedArray_1;
    hasRequiredIsTypedArray = 1;
    var baseIsTypedArray = require_baseIsTypedArray(), baseUnary = require_baseUnary(), nodeUtil = require_nodeUtil();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    isTypedArray_1 = isTypedArray;
    return isTypedArray_1;
  }
  var _arrayLikeKeys;
  var hasRequired_arrayLikeKeys;
  function require_arrayLikeKeys() {
    if (hasRequired_arrayLikeKeys) return _arrayLikeKeys;
    hasRequired_arrayLikeKeys = 1;
    var baseTimes = require_baseTimes(), isArguments = requireIsArguments(), isArray = requireIsArray(), isBuffer2 = requireIsBuffer(), isIndex = require_isIndex(), isTypedArray = requireIsTypedArray();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer2(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
        isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    _arrayLikeKeys = arrayLikeKeys;
    return _arrayLikeKeys;
  }
  var _isPrototype;
  var hasRequired_isPrototype;
  function require_isPrototype() {
    if (hasRequired_isPrototype) return _isPrototype;
    hasRequired_isPrototype = 1;
    var objectProto = Object.prototype;
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    _isPrototype = isPrototype;
    return _isPrototype;
  }
  var _overArg;
  var hasRequired_overArg;
  function require_overArg() {
    if (hasRequired_overArg) return _overArg;
    hasRequired_overArg = 1;
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    _overArg = overArg;
    return _overArg;
  }
  var _nativeKeys;
  var hasRequired_nativeKeys;
  function require_nativeKeys() {
    if (hasRequired_nativeKeys) return _nativeKeys;
    hasRequired_nativeKeys = 1;
    var overArg = require_overArg();
    var nativeKeys = overArg(Object.keys, Object);
    _nativeKeys = nativeKeys;
    return _nativeKeys;
  }
  var _baseKeys;
  var hasRequired_baseKeys;
  function require_baseKeys() {
    if (hasRequired_baseKeys) return _baseKeys;
    hasRequired_baseKeys = 1;
    var isPrototype = require_isPrototype(), nativeKeys = require_nativeKeys();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    _baseKeys = baseKeys;
    return _baseKeys;
  }
  var isArrayLike_1;
  var hasRequiredIsArrayLike;
  function requireIsArrayLike() {
    if (hasRequiredIsArrayLike) return isArrayLike_1;
    hasRequiredIsArrayLike = 1;
    var isFunction = requireIsFunction(), isLength = requireIsLength();
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    isArrayLike_1 = isArrayLike;
    return isArrayLike_1;
  }
  var keys_1;
  var hasRequiredKeys;
  function requireKeys() {
    if (hasRequiredKeys) return keys_1;
    hasRequiredKeys = 1;
    var arrayLikeKeys = require_arrayLikeKeys(), baseKeys = require_baseKeys(), isArrayLike = requireIsArrayLike();
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    keys_1 = keys;
    return keys_1;
  }
  var _baseAssign;
  var hasRequired_baseAssign;
  function require_baseAssign() {
    if (hasRequired_baseAssign) return _baseAssign;
    hasRequired_baseAssign = 1;
    var copyObject = require_copyObject(), keys = requireKeys();
    function baseAssign(object, source) {
      return object && copyObject(source, keys(source), object);
    }
    _baseAssign = baseAssign;
    return _baseAssign;
  }
  var _nativeKeysIn;
  var hasRequired_nativeKeysIn;
  function require_nativeKeysIn() {
    if (hasRequired_nativeKeysIn) return _nativeKeysIn;
    hasRequired_nativeKeysIn = 1;
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }
    _nativeKeysIn = nativeKeysIn;
    return _nativeKeysIn;
  }
  var _baseKeysIn;
  var hasRequired_baseKeysIn;
  function require_baseKeysIn() {
    if (hasRequired_baseKeysIn) return _baseKeysIn;
    hasRequired_baseKeysIn = 1;
    var isObject = requireIsObject(), isPrototype = require_isPrototype(), nativeKeysIn = require_nativeKeysIn();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object), result = [];
      for (var key in object) {
        if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }
    _baseKeysIn = baseKeysIn;
    return _baseKeysIn;
  }
  var keysIn_1;
  var hasRequiredKeysIn;
  function requireKeysIn() {
    if (hasRequiredKeysIn) return keysIn_1;
    hasRequiredKeysIn = 1;
    var arrayLikeKeys = require_arrayLikeKeys(), baseKeysIn = require_baseKeysIn(), isArrayLike = requireIsArrayLike();
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }
    keysIn_1 = keysIn;
    return keysIn_1;
  }
  var _baseAssignIn;
  var hasRequired_baseAssignIn;
  function require_baseAssignIn() {
    if (hasRequired_baseAssignIn) return _baseAssignIn;
    hasRequired_baseAssignIn = 1;
    var copyObject = require_copyObject(), keysIn = requireKeysIn();
    function baseAssignIn(object, source) {
      return object && copyObject(source, keysIn(source), object);
    }
    _baseAssignIn = baseAssignIn;
    return _baseAssignIn;
  }
  var _cloneBuffer = { exports: {} };
  _cloneBuffer.exports;
  var hasRequired_cloneBuffer;
  function require_cloneBuffer() {
    if (hasRequired_cloneBuffer) return _cloneBuffer.exports;
    hasRequired_cloneBuffer = 1;
    (function(module, exports$1) {
      var root2 = require_root();
      var freeExports = exports$1 && !exports$1.nodeType && exports$1;
      var freeModule = freeExports && true && module && !module.nodeType && module;
      var moduleExports = freeModule && freeModule.exports === freeExports;
      var Buffer2 = moduleExports ? root2.Buffer : void 0, allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : void 0;
      function cloneBuffer(buffer, isDeep) {
        if (isDeep) {
          return buffer.slice();
        }
        var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
        buffer.copy(result);
        return result;
      }
      module.exports = cloneBuffer;
    })(_cloneBuffer, _cloneBuffer.exports);
    return _cloneBuffer.exports;
  }
  var _copyArray;
  var hasRequired_copyArray;
  function require_copyArray() {
    if (hasRequired_copyArray) return _copyArray;
    hasRequired_copyArray = 1;
    function copyArray(source, array) {
      var index = -1, length = source.length;
      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }
    _copyArray = copyArray;
    return _copyArray;
  }
  var _arrayFilter;
  var hasRequired_arrayFilter;
  function require_arrayFilter() {
    if (hasRequired_arrayFilter) return _arrayFilter;
    hasRequired_arrayFilter = 1;
    function arrayFilter(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    _arrayFilter = arrayFilter;
    return _arrayFilter;
  }
  var stubArray_1;
  var hasRequiredStubArray;
  function requireStubArray() {
    if (hasRequiredStubArray) return stubArray_1;
    hasRequiredStubArray = 1;
    function stubArray() {
      return [];
    }
    stubArray_1 = stubArray;
    return stubArray_1;
  }
  var _getSymbols;
  var hasRequired_getSymbols;
  function require_getSymbols() {
    if (hasRequired_getSymbols) return _getSymbols;
    hasRequired_getSymbols = 1;
    var arrayFilter = require_arrayFilter(), stubArray = requireStubArray();
    var objectProto = Object.prototype;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };
    _getSymbols = getSymbols;
    return _getSymbols;
  }
  var _copySymbols;
  var hasRequired_copySymbols;
  function require_copySymbols() {
    if (hasRequired_copySymbols) return _copySymbols;
    hasRequired_copySymbols = 1;
    var copyObject = require_copyObject(), getSymbols = require_getSymbols();
    function copySymbols(source, object) {
      return copyObject(source, getSymbols(source), object);
    }
    _copySymbols = copySymbols;
    return _copySymbols;
  }
  var _arrayPush;
  var hasRequired_arrayPush;
  function require_arrayPush() {
    if (hasRequired_arrayPush) return _arrayPush;
    hasRequired_arrayPush = 1;
    function arrayPush(array, values) {
      var index = -1, length = values.length, offset = array.length;
      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }
    _arrayPush = arrayPush;
    return _arrayPush;
  }
  var _getPrototype;
  var hasRequired_getPrototype;
  function require_getPrototype() {
    if (hasRequired_getPrototype) return _getPrototype;
    hasRequired_getPrototype = 1;
    var overArg = require_overArg();
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    _getPrototype = getPrototype;
    return _getPrototype;
  }
  var _getSymbolsIn;
  var hasRequired_getSymbolsIn;
  function require_getSymbolsIn() {
    if (hasRequired_getSymbolsIn) return _getSymbolsIn;
    hasRequired_getSymbolsIn = 1;
    var arrayPush = require_arrayPush(), getPrototype = require_getPrototype(), getSymbols = require_getSymbols(), stubArray = requireStubArray();
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
      var result = [];
      while (object) {
        arrayPush(result, getSymbols(object));
        object = getPrototype(object);
      }
      return result;
    };
    _getSymbolsIn = getSymbolsIn;
    return _getSymbolsIn;
  }
  var _copySymbolsIn;
  var hasRequired_copySymbolsIn;
  function require_copySymbolsIn() {
    if (hasRequired_copySymbolsIn) return _copySymbolsIn;
    hasRequired_copySymbolsIn = 1;
    var copyObject = require_copyObject(), getSymbolsIn = require_getSymbolsIn();
    function copySymbolsIn(source, object) {
      return copyObject(source, getSymbolsIn(source), object);
    }
    _copySymbolsIn = copySymbolsIn;
    return _copySymbolsIn;
  }
  var _baseGetAllKeys;
  var hasRequired_baseGetAllKeys;
  function require_baseGetAllKeys() {
    if (hasRequired_baseGetAllKeys) return _baseGetAllKeys;
    hasRequired_baseGetAllKeys = 1;
    var arrayPush = require_arrayPush(), isArray = requireIsArray();
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }
    _baseGetAllKeys = baseGetAllKeys;
    return _baseGetAllKeys;
  }
  var _getAllKeys;
  var hasRequired_getAllKeys;
  function require_getAllKeys() {
    if (hasRequired_getAllKeys) return _getAllKeys;
    hasRequired_getAllKeys = 1;
    var baseGetAllKeys = require_baseGetAllKeys(), getSymbols = require_getSymbols(), keys = requireKeys();
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }
    _getAllKeys = getAllKeys;
    return _getAllKeys;
  }
  var _getAllKeysIn;
  var hasRequired_getAllKeysIn;
  function require_getAllKeysIn() {
    if (hasRequired_getAllKeysIn) return _getAllKeysIn;
    hasRequired_getAllKeysIn = 1;
    var baseGetAllKeys = require_baseGetAllKeys(), getSymbolsIn = require_getSymbolsIn(), keysIn = requireKeysIn();
    function getAllKeysIn(object) {
      return baseGetAllKeys(object, keysIn, getSymbolsIn);
    }
    _getAllKeysIn = getAllKeysIn;
    return _getAllKeysIn;
  }
  var _DataView;
  var hasRequired_DataView;
  function require_DataView() {
    if (hasRequired_DataView) return _DataView;
    hasRequired_DataView = 1;
    var getNative = require_getNative(), root2 = require_root();
    var DataView = getNative(root2, "DataView");
    _DataView = DataView;
    return _DataView;
  }
  var _Promise;
  var hasRequired_Promise;
  function require_Promise() {
    if (hasRequired_Promise) return _Promise;
    hasRequired_Promise = 1;
    var getNative = require_getNative(), root2 = require_root();
    var Promise2 = getNative(root2, "Promise");
    _Promise = Promise2;
    return _Promise;
  }
  var _Set;
  var hasRequired_Set;
  function require_Set() {
    if (hasRequired_Set) return _Set;
    hasRequired_Set = 1;
    var getNative = require_getNative(), root2 = require_root();
    var Set2 = getNative(root2, "Set");
    _Set = Set2;
    return _Set;
  }
  var _WeakMap;
  var hasRequired_WeakMap;
  function require_WeakMap() {
    if (hasRequired_WeakMap) return _WeakMap;
    hasRequired_WeakMap = 1;
    var getNative = require_getNative(), root2 = require_root();
    var WeakMap = getNative(root2, "WeakMap");
    _WeakMap = WeakMap;
    return _WeakMap;
  }
  var _getTag;
  var hasRequired_getTag;
  function require_getTag() {
    if (hasRequired_getTag) return _getTag;
    hasRequired_getTag = 1;
    var DataView = require_DataView(), Map2 = require_Map(), Promise2 = require_Promise(), Set2 = require_Set(), WeakMap = require_WeakMap(), baseGetTag = require_baseGetTag(), toSource = require_toSource();
    var mapTag = "[object Map]", objectTag = "[object Object]", promiseTag = "[object Promise]", setTag = "[object Set]", weakMapTag = "[object WeakMap]";
    var dataViewTag = "[object DataView]";
    var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap);
    var getTag = baseGetTag;
    if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
      getTag = function(value) {
        var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }
    _getTag = getTag;
    return _getTag;
  }
  var _initCloneArray;
  var hasRequired_initCloneArray;
  function require_initCloneArray() {
    if (hasRequired_initCloneArray) return _initCloneArray;
    hasRequired_initCloneArray = 1;
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function initCloneArray(array) {
      var length = array.length, result = new array.constructor(length);
      if (length && typeof array[0] == "string" && hasOwnProperty.call(array, "index")) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }
    _initCloneArray = initCloneArray;
    return _initCloneArray;
  }
  var _Uint8Array;
  var hasRequired_Uint8Array;
  function require_Uint8Array() {
    if (hasRequired_Uint8Array) return _Uint8Array;
    hasRequired_Uint8Array = 1;
    var root2 = require_root();
    var Uint8Array2 = root2.Uint8Array;
    _Uint8Array = Uint8Array2;
    return _Uint8Array;
  }
  var _cloneArrayBuffer;
  var hasRequired_cloneArrayBuffer;
  function require_cloneArrayBuffer() {
    if (hasRequired_cloneArrayBuffer) return _cloneArrayBuffer;
    hasRequired_cloneArrayBuffer = 1;
    var Uint8Array2 = require_Uint8Array();
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array2(result).set(new Uint8Array2(arrayBuffer));
      return result;
    }
    _cloneArrayBuffer = cloneArrayBuffer;
    return _cloneArrayBuffer;
  }
  var _cloneDataView;
  var hasRequired_cloneDataView;
  function require_cloneDataView() {
    if (hasRequired_cloneDataView) return _cloneDataView;
    hasRequired_cloneDataView = 1;
    var cloneArrayBuffer = require_cloneArrayBuffer();
    function cloneDataView(dataView, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
      return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
    }
    _cloneDataView = cloneDataView;
    return _cloneDataView;
  }
  var _cloneRegExp;
  var hasRequired_cloneRegExp;
  function require_cloneRegExp() {
    if (hasRequired_cloneRegExp) return _cloneRegExp;
    hasRequired_cloneRegExp = 1;
    var reFlags = /\w*$/;
    function cloneRegExp(regexp) {
      var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
      result.lastIndex = regexp.lastIndex;
      return result;
    }
    _cloneRegExp = cloneRegExp;
    return _cloneRegExp;
  }
  var _cloneSymbol;
  var hasRequired_cloneSymbol;
  function require_cloneSymbol() {
    if (hasRequired_cloneSymbol) return _cloneSymbol;
    hasRequired_cloneSymbol = 1;
    var Symbol = require_Symbol();
    var symbolProto = Symbol ? Symbol.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function cloneSymbol(symbol) {
      return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
    }
    _cloneSymbol = cloneSymbol;
    return _cloneSymbol;
  }
  var _cloneTypedArray;
  var hasRequired_cloneTypedArray;
  function require_cloneTypedArray() {
    if (hasRequired_cloneTypedArray) return _cloneTypedArray;
    hasRequired_cloneTypedArray = 1;
    var cloneArrayBuffer = require_cloneArrayBuffer();
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }
    _cloneTypedArray = cloneTypedArray;
    return _cloneTypedArray;
  }
  var _initCloneByTag;
  var hasRequired_initCloneByTag;
  function require_initCloneByTag() {
    if (hasRequired_initCloneByTag) return _initCloneByTag;
    hasRequired_initCloneByTag = 1;
    var cloneArrayBuffer = require_cloneArrayBuffer(), cloneDataView = require_cloneDataView(), cloneRegExp = require_cloneRegExp(), cloneSymbol = require_cloneSymbol(), cloneTypedArray = require_cloneTypedArray();
    var boolTag = "[object Boolean]", dateTag = "[object Date]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return cloneArrayBuffer(object);
        case boolTag:
        case dateTag:
          return new Ctor(+object);
        case dataViewTag:
          return cloneDataView(object, isDeep);
        case float32Tag:
        case float64Tag:
        case int8Tag:
        case int16Tag:
        case int32Tag:
        case uint8Tag:
        case uint8ClampedTag:
        case uint16Tag:
        case uint32Tag:
          return cloneTypedArray(object, isDeep);
        case mapTag:
          return new Ctor();
        case numberTag:
        case stringTag:
          return new Ctor(object);
        case regexpTag:
          return cloneRegExp(object);
        case setTag:
          return new Ctor();
        case symbolTag:
          return cloneSymbol(object);
      }
    }
    _initCloneByTag = initCloneByTag;
    return _initCloneByTag;
  }
  var _baseCreate;
  var hasRequired_baseCreate;
  function require_baseCreate() {
    if (hasRequired_baseCreate) return _baseCreate;
    hasRequired_baseCreate = 1;
    var isObject = requireIsObject();
    var objectCreate = Object.create;
    var baseCreate = /* @__PURE__ */ function() {
      function object() {
      }
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object();
        object.prototype = void 0;
        return result;
      };
    }();
    _baseCreate = baseCreate;
    return _baseCreate;
  }
  var _initCloneObject;
  var hasRequired_initCloneObject;
  function require_initCloneObject() {
    if (hasRequired_initCloneObject) return _initCloneObject;
    hasRequired_initCloneObject = 1;
    var baseCreate = require_baseCreate(), getPrototype = require_getPrototype(), isPrototype = require_isPrototype();
    function initCloneObject(object) {
      return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
    }
    _initCloneObject = initCloneObject;
    return _initCloneObject;
  }
  var _baseIsMap;
  var hasRequired_baseIsMap;
  function require_baseIsMap() {
    if (hasRequired_baseIsMap) return _baseIsMap;
    hasRequired_baseIsMap = 1;
    var getTag = require_getTag(), isObjectLike = requireIsObjectLike();
    var mapTag = "[object Map]";
    function baseIsMap(value) {
      return isObjectLike(value) && getTag(value) == mapTag;
    }
    _baseIsMap = baseIsMap;
    return _baseIsMap;
  }
  var isMap_1;
  var hasRequiredIsMap;
  function requireIsMap() {
    if (hasRequiredIsMap) return isMap_1;
    hasRequiredIsMap = 1;
    var baseIsMap = require_baseIsMap(), baseUnary = require_baseUnary(), nodeUtil = require_nodeUtil();
    var nodeIsMap = nodeUtil && nodeUtil.isMap;
    var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
    isMap_1 = isMap;
    return isMap_1;
  }
  var _baseIsSet;
  var hasRequired_baseIsSet;
  function require_baseIsSet() {
    if (hasRequired_baseIsSet) return _baseIsSet;
    hasRequired_baseIsSet = 1;
    var getTag = require_getTag(), isObjectLike = requireIsObjectLike();
    var setTag = "[object Set]";
    function baseIsSet(value) {
      return isObjectLike(value) && getTag(value) == setTag;
    }
    _baseIsSet = baseIsSet;
    return _baseIsSet;
  }
  var isSet_1;
  var hasRequiredIsSet;
  function requireIsSet() {
    if (hasRequiredIsSet) return isSet_1;
    hasRequiredIsSet = 1;
    var baseIsSet = require_baseIsSet(), baseUnary = require_baseUnary(), nodeUtil = require_nodeUtil();
    var nodeIsSet = nodeUtil && nodeUtil.isSet;
    var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
    isSet_1 = isSet;
    return isSet_1;
  }
  var _baseClone;
  var hasRequired_baseClone;
  function require_baseClone() {
    if (hasRequired_baseClone) return _baseClone;
    hasRequired_baseClone = 1;
    var Stack = require_Stack(), arrayEach = require_arrayEach(), assignValue = require_assignValue(), baseAssign = require_baseAssign(), baseAssignIn = require_baseAssignIn(), cloneBuffer = require_cloneBuffer(), copyArray = require_copyArray(), copySymbols = require_copySymbols(), copySymbolsIn = require_copySymbolsIn(), getAllKeys = require_getAllKeys(), getAllKeysIn = require_getAllKeysIn(), getTag = require_getTag(), initCloneArray = require_initCloneArray(), initCloneByTag = require_initCloneByTag(), initCloneObject = require_initCloneObject(), isArray = requireIsArray(), isBuffer2 = requireIsBuffer(), isMap = requireIsMap(), isObject = requireIsObject(), isSet = requireIsSet(), keys = requireKeys(), keysIn = requireKeysIn();
    var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4;
    var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
    var cloneableTags = {};
    cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
    cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
    function baseClone(value, bitmask, customizer, key, object, stack) {
      var result, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
      if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
      }
      if (result !== void 0) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return copyArray(value, result);
        }
      } else {
        var tag = getTag(value), isFunc = tag == funcTag || tag == genTag;
        if (isBuffer2(value)) {
          return cloneBuffer(value, isDeep);
        }
        if (tag == objectTag || tag == argsTag || isFunc && !object) {
          result = isFlat || isFunc ? {} : initCloneObject(value);
          if (!isDeep) {
            return isFlat ? copySymbolsIn(value, baseAssignIn(result, value)) : copySymbols(value, baseAssign(result, value));
          }
        } else {
          if (!cloneableTags[tag]) {
            return object ? value : {};
          }
          result = initCloneByTag(value, tag, isDeep);
        }
      }
      stack || (stack = new Stack());
      var stacked = stack.get(value);
      if (stacked) {
        return stacked;
      }
      stack.set(value, result);
      if (isSet(value)) {
        value.forEach(function(subValue) {
          result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
        });
      } else if (isMap(value)) {
        value.forEach(function(subValue, key2) {
          result.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
        });
      }
      var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys;
      var props = isArr ? void 0 : keysFunc(value);
      arrayEach(props || value, function(subValue, key2) {
        if (props) {
          key2 = subValue;
          subValue = value[key2];
        }
        assignValue(result, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
      });
      return result;
    }
    _baseClone = baseClone;
    return _baseClone;
  }
  var clone_1;
  var hasRequiredClone;
  function requireClone() {
    if (hasRequiredClone) return clone_1;
    hasRequiredClone = 1;
    var baseClone = require_baseClone();
    var CLONE_SYMBOLS_FLAG = 4;
    function clone(value) {
      return baseClone(value, CLONE_SYMBOLS_FLAG);
    }
    clone_1 = clone;
    return clone_1;
  }
  var constant_1;
  var hasRequiredConstant;
  function requireConstant() {
    if (hasRequiredConstant) return constant_1;
    hasRequiredConstant = 1;
    function constant(value) {
      return function() {
        return value;
      };
    }
    constant_1 = constant;
    return constant_1;
  }
  var _createBaseFor;
  var hasRequired_createBaseFor;
  function require_createBaseFor() {
    if (hasRequired_createBaseFor) return _createBaseFor;
    hasRequired_createBaseFor = 1;
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }
    _createBaseFor = createBaseFor;
    return _createBaseFor;
  }
  var _baseFor;
  var hasRequired_baseFor;
  function require_baseFor() {
    if (hasRequired_baseFor) return _baseFor;
    hasRequired_baseFor = 1;
    var createBaseFor = require_createBaseFor();
    var baseFor = createBaseFor();
    _baseFor = baseFor;
    return _baseFor;
  }
  var _baseForOwn;
  var hasRequired_baseForOwn;
  function require_baseForOwn() {
    if (hasRequired_baseForOwn) return _baseForOwn;
    hasRequired_baseForOwn = 1;
    var baseFor = require_baseFor(), keys = requireKeys();
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }
    _baseForOwn = baseForOwn;
    return _baseForOwn;
  }
  var _createBaseEach;
  var hasRequired_createBaseEach;
  function require_createBaseEach() {
    if (hasRequired_createBaseEach) return _createBaseEach;
    hasRequired_createBaseEach = 1;
    var isArrayLike = requireIsArrayLike();
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
        while (fromRight ? index-- : ++index < length) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }
    _createBaseEach = createBaseEach;
    return _createBaseEach;
  }
  var _baseEach;
  var hasRequired_baseEach;
  function require_baseEach() {
    if (hasRequired_baseEach) return _baseEach;
    hasRequired_baseEach = 1;
    var baseForOwn = require_baseForOwn(), createBaseEach = require_createBaseEach();
    var baseEach = createBaseEach(baseForOwn);
    _baseEach = baseEach;
    return _baseEach;
  }
  var identity_1;
  var hasRequiredIdentity;
  function requireIdentity() {
    if (hasRequiredIdentity) return identity_1;
    hasRequiredIdentity = 1;
    function identity(value) {
      return value;
    }
    identity_1 = identity;
    return identity_1;
  }
  var _castFunction;
  var hasRequired_castFunction;
  function require_castFunction() {
    if (hasRequired_castFunction) return _castFunction;
    hasRequired_castFunction = 1;
    var identity = requireIdentity();
    function castFunction(value) {
      return typeof value == "function" ? value : identity;
    }
    _castFunction = castFunction;
    return _castFunction;
  }
  var forEach_1;
  var hasRequiredForEach;
  function requireForEach() {
    if (hasRequiredForEach) return forEach_1;
    hasRequiredForEach = 1;
    var arrayEach = require_arrayEach(), baseEach = require_baseEach(), castFunction = require_castFunction(), isArray = requireIsArray();
    function forEach(collection, iteratee) {
      var func = isArray(collection) ? arrayEach : baseEach;
      return func(collection, castFunction(iteratee));
    }
    forEach_1 = forEach;
    return forEach_1;
  }
  var each;
  var hasRequiredEach;
  function requireEach() {
    if (hasRequiredEach) return each;
    hasRequiredEach = 1;
    each = requireForEach();
    return each;
  }
  var _baseFilter;
  var hasRequired_baseFilter;
  function require_baseFilter() {
    if (hasRequired_baseFilter) return _baseFilter;
    hasRequired_baseFilter = 1;
    var baseEach = require_baseEach();
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection2) {
        if (predicate(value, index, collection2)) {
          result.push(value);
        }
      });
      return result;
    }
    _baseFilter = baseFilter;
    return _baseFilter;
  }
  var _setCacheAdd;
  var hasRequired_setCacheAdd;
  function require_setCacheAdd() {
    if (hasRequired_setCacheAdd) return _setCacheAdd;
    hasRequired_setCacheAdd = 1;
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    _setCacheAdd = setCacheAdd;
    return _setCacheAdd;
  }
  var _setCacheHas;
  var hasRequired_setCacheHas;
  function require_setCacheHas() {
    if (hasRequired_setCacheHas) return _setCacheHas;
    hasRequired_setCacheHas = 1;
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    _setCacheHas = setCacheHas;
    return _setCacheHas;
  }
  var _SetCache;
  var hasRequired_SetCache;
  function require_SetCache() {
    if (hasRequired_SetCache) return _SetCache;
    hasRequired_SetCache = 1;
    var MapCache = require_MapCache(), setCacheAdd = require_setCacheAdd(), setCacheHas = require_setCacheHas();
    function SetCache(values) {
      var index = -1, length = values == null ? 0 : values.length;
      this.__data__ = new MapCache();
      while (++index < length) {
        this.add(values[index]);
      }
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    _SetCache = SetCache;
    return _SetCache;
  }
  var _arraySome;
  var hasRequired_arraySome;
  function require_arraySome() {
    if (hasRequired_arraySome) return _arraySome;
    hasRequired_arraySome = 1;
    function arraySome(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }
    _arraySome = arraySome;
    return _arraySome;
  }
  var _cacheHas;
  var hasRequired_cacheHas;
  function require_cacheHas() {
    if (hasRequired_cacheHas) return _cacheHas;
    hasRequired_cacheHas = 1;
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    _cacheHas = cacheHas;
    return _cacheHas;
  }
  var _equalArrays;
  var hasRequired_equalArrays;
  function require_equalArrays() {
    if (hasRequired_equalArrays) return _equalArrays;
    hasRequired_equalArrays = 1;
    var SetCache = require_SetCache(), arraySome = require_arraySome(), cacheHas = require_cacheHas();
    var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      var arrStacked = stack.get(array);
      var othStacked = stack.get(other);
      if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array;
      }
      var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
      stack.set(array, other);
      stack.set(other, array);
      while (++index < arrLength) {
        var arrValue = array[index], othValue = other[index];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== void 0) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        if (seen) {
          if (!arraySome(other, function(othValue2, othIndex) {
            if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
            result = false;
            break;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          result = false;
          break;
        }
      }
      stack["delete"](array);
      stack["delete"](other);
      return result;
    }
    _equalArrays = equalArrays;
    return _equalArrays;
  }
  var _mapToArray;
  var hasRequired_mapToArray;
  function require_mapToArray() {
    if (hasRequired_mapToArray) return _mapToArray;
    hasRequired_mapToArray = 1;
    function mapToArray(map) {
      var index = -1, result = Array(map.size);
      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }
    _mapToArray = mapToArray;
    return _mapToArray;
  }
  var _setToArray;
  var hasRequired_setToArray;
  function require_setToArray() {
    if (hasRequired_setToArray) return _setToArray;
    hasRequired_setToArray = 1;
    function setToArray(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }
    _setToArray = setToArray;
    return _setToArray;
  }
  var _equalByTag;
  var hasRequired_equalByTag;
  function require_equalByTag() {
    if (hasRequired_equalByTag) return _equalByTag;
    hasRequired_equalByTag = 1;
    var Symbol = require_Symbol(), Uint8Array2 = require_Uint8Array(), eq = requireEq(), equalArrays = require_equalArrays(), mapToArray = require_mapToArray(), setToArray = require_setToArray();
    var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
    var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]";
    var symbolProto = Symbol ? Symbol.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;
        case arrayBufferTag:
          if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
            return false;
          }
          return true;
        case boolTag:
        case dateTag:
        case numberTag:
          return eq(+object, +other);
        case errorTag:
          return object.name == other.name && object.message == other.message;
        case regexpTag:
        case stringTag:
          return object == other + "";
        case mapTag:
          var convert2 = mapToArray;
        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert2 || (convert2 = setToArray);
          if (object.size != other.size && !isPartial) {
            return false;
          }
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;
          stack.set(object, other);
          var result = equalArrays(convert2(object), convert2(other), bitmask, customizer, equalFunc, stack);
          stack["delete"](object);
          return result;
        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }
    _equalByTag = equalByTag;
    return _equalByTag;
  }
  var _equalObjects;
  var hasRequired_equalObjects;
  function require_equalObjects() {
    if (hasRequired_equalObjects) return _equalObjects;
    hasRequired_equalObjects = 1;
    var getAllKeys = require_getAllKeys();
    var COMPARE_PARTIAL_FLAG = 1;
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var objStacked = stack.get(object);
      var othStacked = stack.get(other);
      if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);
      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key], othValue = other[key];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
        }
        if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor, othCtor = other.constructor;
        if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack["delete"](object);
      stack["delete"](other);
      return result;
    }
    _equalObjects = equalObjects;
    return _equalObjects;
  }
  var _baseIsEqualDeep;
  var hasRequired_baseIsEqualDeep;
  function require_baseIsEqualDeep() {
    if (hasRequired_baseIsEqualDeep) return _baseIsEqualDeep;
    hasRequired_baseIsEqualDeep = 1;
    var Stack = require_Stack(), equalArrays = require_equalArrays(), equalByTag = require_equalByTag(), equalObjects = require_equalObjects(), getTag = require_getTag(), isArray = requireIsArray(), isBuffer2 = requireIsBuffer(), isTypedArray = requireIsTypedArray();
    var COMPARE_PARTIAL_FLAG = 1;
    var argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;
      var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
      if (isSameTag && isBuffer2(object)) {
        if (!isBuffer2(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
          stack || (stack = new Stack());
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }
    _baseIsEqualDeep = baseIsEqualDeep;
    return _baseIsEqualDeep;
  }
  var _baseIsEqual;
  var hasRequired_baseIsEqual;
  function require_baseIsEqual() {
    if (hasRequired_baseIsEqual) return _baseIsEqual;
    hasRequired_baseIsEqual = 1;
    var baseIsEqualDeep = require_baseIsEqualDeep(), isObjectLike = requireIsObjectLike();
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }
    _baseIsEqual = baseIsEqual;
    return _baseIsEqual;
  }
  var _baseIsMatch;
  var hasRequired_baseIsMatch;
  function require_baseIsMatch() {
    if (hasRequired_baseIsMatch) return _baseIsMatch;
    hasRequired_baseIsMatch = 1;
    var Stack = require_Stack(), baseIsEqual = require_baseIsEqual();
    var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length, length = index, noCustomizer = !customizer;
      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0], objValue = object[key], srcValue = data[1];
        if (noCustomizer && data[2]) {
          if (objValue === void 0 && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack();
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === void 0 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
            return false;
          }
        }
      }
      return true;
    }
    _baseIsMatch = baseIsMatch;
    return _baseIsMatch;
  }
  var _isStrictComparable;
  var hasRequired_isStrictComparable;
  function require_isStrictComparable() {
    if (hasRequired_isStrictComparable) return _isStrictComparable;
    hasRequired_isStrictComparable = 1;
    var isObject = requireIsObject();
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }
    _isStrictComparable = isStrictComparable;
    return _isStrictComparable;
  }
  var _getMatchData;
  var hasRequired_getMatchData;
  function require_getMatchData() {
    if (hasRequired_getMatchData) return _getMatchData;
    hasRequired_getMatchData = 1;
    var isStrictComparable = require_isStrictComparable(), keys = requireKeys();
    function getMatchData(object) {
      var result = keys(object), length = result.length;
      while (length--) {
        var key = result[length], value = object[key];
        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }
    _getMatchData = getMatchData;
    return _getMatchData;
  }
  var _matchesStrictComparable;
  var hasRequired_matchesStrictComparable;
  function require_matchesStrictComparable() {
    if (hasRequired_matchesStrictComparable) return _matchesStrictComparable;
    hasRequired_matchesStrictComparable = 1;
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
      };
    }
    _matchesStrictComparable = matchesStrictComparable;
    return _matchesStrictComparable;
  }
  var _baseMatches;
  var hasRequired_baseMatches;
  function require_baseMatches() {
    if (hasRequired_baseMatches) return _baseMatches;
    hasRequired_baseMatches = 1;
    var baseIsMatch = require_baseIsMatch(), getMatchData = require_getMatchData(), matchesStrictComparable = require_matchesStrictComparable();
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }
    _baseMatches = baseMatches;
    return _baseMatches;
  }
  var isSymbol_1;
  var hasRequiredIsSymbol;
  function requireIsSymbol() {
    if (hasRequiredIsSymbol) return isSymbol_1;
    hasRequiredIsSymbol = 1;
    var baseGetTag = require_baseGetTag(), isObjectLike = requireIsObjectLike();
    var symbolTag = "[object Symbol]";
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
    }
    isSymbol_1 = isSymbol;
    return isSymbol_1;
  }
  var _isKey;
  var hasRequired_isKey;
  function require_isKey() {
    if (hasRequired_isKey) return _isKey;
    hasRequired_isKey = 1;
    var isArray = requireIsArray(), isSymbol = requireIsSymbol();
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
    }
    _isKey = isKey;
    return _isKey;
  }
  var memoize_1;
  var hasRequiredMemoize;
  function requireMemoize() {
    if (hasRequiredMemoize) return memoize_1;
    hasRequiredMemoize = 1;
    var MapCache = require_MapCache();
    var FUNC_ERROR_TEXT = "Expected a function";
    function memoize(func, resolver) {
      if (typeof func != "function" || resolver != null && typeof resolver != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache)();
      return memoized;
    }
    memoize.Cache = MapCache;
    memoize_1 = memoize;
    return memoize_1;
  }
  var _memoizeCapped;
  var hasRequired_memoizeCapped;
  function require_memoizeCapped() {
    if (hasRequired_memoizeCapped) return _memoizeCapped;
    hasRequired_memoizeCapped = 1;
    var memoize = requireMemoize();
    var MAX_MEMOIZE_SIZE = 500;
    function memoizeCapped(func) {
      var result = memoize(func, function(key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
          cache.clear();
        }
        return key;
      });
      var cache = result.cache;
      return result;
    }
    _memoizeCapped = memoizeCapped;
    return _memoizeCapped;
  }
  var _stringToPath;
  var hasRequired_stringToPath;
  function require_stringToPath() {
    if (hasRequired_stringToPath) return _stringToPath;
    hasRequired_stringToPath = 1;
    var memoizeCapped = require_memoizeCapped();
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = memoizeCapped(function(string) {
      var result = [];
      if (string.charCodeAt(0) === 46) {
        result.push("");
      }
      string.replace(rePropName, function(match, number, quote, subString) {
        result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
      });
      return result;
    });
    _stringToPath = stringToPath;
    return _stringToPath;
  }
  var _arrayMap;
  var hasRequired_arrayMap;
  function require_arrayMap() {
    if (hasRequired_arrayMap) return _arrayMap;
    hasRequired_arrayMap = 1;
    function arrayMap(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    _arrayMap = arrayMap;
    return _arrayMap;
  }
  var _baseToString;
  var hasRequired_baseToString;
  function require_baseToString() {
    if (hasRequired_baseToString) return _baseToString;
    hasRequired_baseToString = 1;
    var Symbol = require_Symbol(), arrayMap = require_arrayMap(), isArray = requireIsArray(), isSymbol = requireIsSymbol();
    var symbolProto = Symbol ? Symbol.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseToString(value) {
      if (typeof value == "string") {
        return value;
      }
      if (isArray(value)) {
        return arrayMap(value, baseToString) + "";
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : "";
      }
      var result = value + "";
      return result == "0" && 1 / value == -Infinity ? "-0" : result;
    }
    _baseToString = baseToString;
    return _baseToString;
  }
  var toString_1;
  var hasRequiredToString;
  function requireToString() {
    if (hasRequiredToString) return toString_1;
    hasRequiredToString = 1;
    var baseToString = require_baseToString();
    function toString(value) {
      return value == null ? "" : baseToString(value);
    }
    toString_1 = toString;
    return toString_1;
  }
  var _castPath;
  var hasRequired_castPath;
  function require_castPath() {
    if (hasRequired_castPath) return _castPath;
    hasRequired_castPath = 1;
    var isArray = requireIsArray(), isKey = require_isKey(), stringToPath = require_stringToPath(), toString = requireToString();
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString(value));
    }
    _castPath = castPath;
    return _castPath;
  }
  var _toKey;
  var hasRequired_toKey;
  function require_toKey() {
    if (hasRequired_toKey) return _toKey;
    hasRequired_toKey = 1;
    var isSymbol = requireIsSymbol();
    function toKey(value) {
      if (typeof value == "string" || isSymbol(value)) {
        return value;
      }
      var result = value + "";
      return result == "0" && 1 / value == -Infinity ? "-0" : result;
    }
    _toKey = toKey;
    return _toKey;
  }
  var _baseGet;
  var hasRequired_baseGet;
  function require_baseGet() {
    if (hasRequired_baseGet) return _baseGet;
    hasRequired_baseGet = 1;
    var castPath = require_castPath(), toKey = require_toKey();
    function baseGet(object, path) {
      path = castPath(path, object);
      var index = 0, length = path.length;
      while (object != null && index < length) {
        object = object[toKey(path[index++])];
      }
      return index && index == length ? object : void 0;
    }
    _baseGet = baseGet;
    return _baseGet;
  }
  var get_1;
  var hasRequiredGet;
  function requireGet() {
    if (hasRequiredGet) return get_1;
    hasRequiredGet = 1;
    var baseGet = require_baseGet();
    function get(object, path, defaultValue) {
      var result = object == null ? void 0 : baseGet(object, path);
      return result === void 0 ? defaultValue : result;
    }
    get_1 = get;
    return get_1;
  }
  var _baseHasIn;
  var hasRequired_baseHasIn;
  function require_baseHasIn() {
    if (hasRequired_baseHasIn) return _baseHasIn;
    hasRequired_baseHasIn = 1;
    function baseHasIn(object, key) {
      return object != null && key in Object(object);
    }
    _baseHasIn = baseHasIn;
    return _baseHasIn;
  }
  var _hasPath;
  var hasRequired_hasPath;
  function require_hasPath() {
    if (hasRequired_hasPath) return _hasPath;
    hasRequired_hasPath = 1;
    var castPath = require_castPath(), isArguments = requireIsArguments(), isArray = requireIsArray(), isIndex = require_isIndex(), isLength = requireIsLength(), toKey = require_toKey();
    function hasPath(object, path, hasFunc) {
      path = castPath(path, object);
      var index = -1, length = path.length, result = false;
      while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result || ++index != length) {
        return result;
      }
      length = object == null ? 0 : object.length;
      return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
    }
    _hasPath = hasPath;
    return _hasPath;
  }
  var hasIn_1;
  var hasRequiredHasIn;
  function requireHasIn() {
    if (hasRequiredHasIn) return hasIn_1;
    hasRequiredHasIn = 1;
    var baseHasIn = require_baseHasIn(), hasPath = require_hasPath();
    function hasIn(object, path) {
      return object != null && hasPath(object, path, baseHasIn);
    }
    hasIn_1 = hasIn;
    return hasIn_1;
  }
  var _baseMatchesProperty;
  var hasRequired_baseMatchesProperty;
  function require_baseMatchesProperty() {
    if (hasRequired_baseMatchesProperty) return _baseMatchesProperty;
    hasRequired_baseMatchesProperty = 1;
    var baseIsEqual = require_baseIsEqual(), get = requireGet(), hasIn = requireHasIn(), isKey = require_isKey(), isStrictComparable = require_isStrictComparable(), matchesStrictComparable = require_matchesStrictComparable(), toKey = require_toKey();
    var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
    function baseMatchesProperty(path, srcValue) {
      if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
      }
      return function(object) {
        var objValue = get(object, path);
        return objValue === void 0 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
      };
    }
    _baseMatchesProperty = baseMatchesProperty;
    return _baseMatchesProperty;
  }
  var _baseProperty;
  var hasRequired_baseProperty;
  function require_baseProperty() {
    if (hasRequired_baseProperty) return _baseProperty;
    hasRequired_baseProperty = 1;
    function baseProperty(key) {
      return function(object) {
        return object == null ? void 0 : object[key];
      };
    }
    _baseProperty = baseProperty;
    return _baseProperty;
  }
  var _basePropertyDeep;
  var hasRequired_basePropertyDeep;
  function require_basePropertyDeep() {
    if (hasRequired_basePropertyDeep) return _basePropertyDeep;
    hasRequired_basePropertyDeep = 1;
    var baseGet = require_baseGet();
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }
    _basePropertyDeep = basePropertyDeep;
    return _basePropertyDeep;
  }
  var property_1;
  var hasRequiredProperty;
  function requireProperty() {
    if (hasRequiredProperty) return property_1;
    hasRequiredProperty = 1;
    var baseProperty = require_baseProperty(), basePropertyDeep = require_basePropertyDeep(), isKey = require_isKey(), toKey = require_toKey();
    function property(path) {
      return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
    }
    property_1 = property;
    return property_1;
  }
  var _baseIteratee;
  var hasRequired_baseIteratee;
  function require_baseIteratee() {
    if (hasRequired_baseIteratee) return _baseIteratee;
    hasRequired_baseIteratee = 1;
    var baseMatches = require_baseMatches(), baseMatchesProperty = require_baseMatchesProperty(), identity = requireIdentity(), isArray = requireIsArray(), property = requireProperty();
    function baseIteratee(value) {
      if (typeof value == "function") {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == "object") {
        return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
      }
      return property(value);
    }
    _baseIteratee = baseIteratee;
    return _baseIteratee;
  }
  var filter_1;
  var hasRequiredFilter;
  function requireFilter() {
    if (hasRequiredFilter) return filter_1;
    hasRequiredFilter = 1;
    var arrayFilter = require_arrayFilter(), baseFilter = require_baseFilter(), baseIteratee = require_baseIteratee(), isArray = requireIsArray();
    function filter(collection, predicate) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      return func(collection, baseIteratee(predicate, 3));
    }
    filter_1 = filter;
    return filter_1;
  }
  var _baseHas;
  var hasRequired_baseHas;
  function require_baseHas() {
    if (hasRequired_baseHas) return _baseHas;
    hasRequired_baseHas = 1;
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseHas(object, key) {
      return object != null && hasOwnProperty.call(object, key);
    }
    _baseHas = baseHas;
    return _baseHas;
  }
  var has_1;
  var hasRequiredHas;
  function requireHas() {
    if (hasRequiredHas) return has_1;
    hasRequiredHas = 1;
    var baseHas = require_baseHas(), hasPath = require_hasPath();
    function has2(object, path) {
      return object != null && hasPath(object, path, baseHas);
    }
    has_1 = has2;
    return has_1;
  }
  var isEmpty_1;
  var hasRequiredIsEmpty;
  function requireIsEmpty() {
    if (hasRequiredIsEmpty) return isEmpty_1;
    hasRequiredIsEmpty = 1;
    var baseKeys = require_baseKeys(), getTag = require_getTag(), isArguments = requireIsArguments(), isArray = requireIsArray(), isArrayLike = requireIsArrayLike(), isBuffer2 = requireIsBuffer(), isPrototype = require_isPrototype(), isTypedArray = requireIsTypedArray();
    var mapTag = "[object Map]", setTag = "[object Set]";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function isEmpty(value) {
      if (value == null) {
        return true;
      }
      if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer2(value) || isTypedArray(value) || isArguments(value))) {
        return !value.length;
      }
      var tag = getTag(value);
      if (tag == mapTag || tag == setTag) {
        return !value.size;
      }
      if (isPrototype(value)) {
        return !baseKeys(value).length;
      }
      for (var key in value) {
        if (hasOwnProperty.call(value, key)) {
          return false;
        }
      }
      return true;
    }
    isEmpty_1 = isEmpty;
    return isEmpty_1;
  }
  var isUndefined_1;
  var hasRequiredIsUndefined;
  function requireIsUndefined() {
    if (hasRequiredIsUndefined) return isUndefined_1;
    hasRequiredIsUndefined = 1;
    function isUndefined(value) {
      return value === void 0;
    }
    isUndefined_1 = isUndefined;
    return isUndefined_1;
  }
  var _baseMap;
  var hasRequired_baseMap;
  function require_baseMap() {
    if (hasRequired_baseMap) return _baseMap;
    hasRequired_baseMap = 1;
    var baseEach = require_baseEach(), isArrayLike = requireIsArrayLike();
    function baseMap(collection, iteratee) {
      var index = -1, result = isArrayLike(collection) ? Array(collection.length) : [];
      baseEach(collection, function(value, key, collection2) {
        result[++index] = iteratee(value, key, collection2);
      });
      return result;
    }
    _baseMap = baseMap;
    return _baseMap;
  }
  var map_1;
  var hasRequiredMap;
  function requireMap() {
    if (hasRequiredMap) return map_1;
    hasRequiredMap = 1;
    var arrayMap = require_arrayMap(), baseIteratee = require_baseIteratee(), baseMap = require_baseMap(), isArray = requireIsArray();
    function map(collection, iteratee) {
      var func = isArray(collection) ? arrayMap : baseMap;
      return func(collection, baseIteratee(iteratee, 3));
    }
    map_1 = map;
    return map_1;
  }
  var _arrayReduce;
  var hasRequired_arrayReduce;
  function require_arrayReduce() {
    if (hasRequired_arrayReduce) return _arrayReduce;
    hasRequired_arrayReduce = 1;
    function arrayReduce(array, iteratee, accumulator, initAccum) {
      var index = -1, length = array == null ? 0 : array.length;
      if (initAccum && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }
    _arrayReduce = arrayReduce;
    return _arrayReduce;
  }
  var _baseReduce;
  var hasRequired_baseReduce;
  function require_baseReduce() {
    if (hasRequired_baseReduce) return _baseReduce;
    hasRequired_baseReduce = 1;
    function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
      eachFunc(collection, function(value, index, collection2) {
        accumulator = initAccum ? (initAccum = false, value) : iteratee(accumulator, value, index, collection2);
      });
      return accumulator;
    }
    _baseReduce = baseReduce;
    return _baseReduce;
  }
  var reduce_1;
  var hasRequiredReduce;
  function requireReduce() {
    if (hasRequiredReduce) return reduce_1;
    hasRequiredReduce = 1;
    var arrayReduce = require_arrayReduce(), baseEach = require_baseEach(), baseIteratee = require_baseIteratee(), baseReduce = require_baseReduce(), isArray = requireIsArray();
    function reduce2(collection, iteratee, accumulator) {
      var func = isArray(collection) ? arrayReduce : baseReduce, initAccum = arguments.length < 3;
      return func(collection, baseIteratee(iteratee, 4), accumulator, initAccum, baseEach);
    }
    reduce_1 = reduce2;
    return reduce_1;
  }
  var isString_1;
  var hasRequiredIsString;
  function requireIsString() {
    if (hasRequiredIsString) return isString_1;
    hasRequiredIsString = 1;
    var baseGetTag = require_baseGetTag(), isArray = requireIsArray(), isObjectLike = requireIsObjectLike();
    var stringTag = "[object String]";
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag;
    }
    isString_1 = isString;
    return isString_1;
  }
  var _asciiSize;
  var hasRequired_asciiSize;
  function require_asciiSize() {
    if (hasRequired_asciiSize) return _asciiSize;
    hasRequired_asciiSize = 1;
    var baseProperty = require_baseProperty();
    var asciiSize = baseProperty("length");
    _asciiSize = asciiSize;
    return _asciiSize;
  }
  var _hasUnicode;
  var hasRequired_hasUnicode;
  function require_hasUnicode() {
    if (hasRequired_hasUnicode) return _hasUnicode;
    hasRequired_hasUnicode = 1;
    var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsVarRange = "\\ufe0e\\ufe0f";
    var rsZWJ = "\\u200d";
    var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
    function hasUnicode(string) {
      return reHasUnicode.test(string);
    }
    _hasUnicode = hasUnicode;
    return _hasUnicode;
  }
  var _unicodeSize;
  var hasRequired_unicodeSize;
  function require_unicodeSize() {
    if (hasRequired_unicodeSize) return _unicodeSize;
    hasRequired_unicodeSize = 1;
    var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsVarRange = "\\ufe0e\\ufe0f";
    var rsAstral = "[" + rsAstralRange + "]", rsCombo = "[" + rsComboRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsZWJ = "\\u200d";
    var reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
    var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
    function unicodeSize(string) {
      var result = reUnicode.lastIndex = 0;
      while (reUnicode.test(string)) {
        ++result;
      }
      return result;
    }
    _unicodeSize = unicodeSize;
    return _unicodeSize;
  }
  var _stringSize;
  var hasRequired_stringSize;
  function require_stringSize() {
    if (hasRequired_stringSize) return _stringSize;
    hasRequired_stringSize = 1;
    var asciiSize = require_asciiSize(), hasUnicode = require_hasUnicode(), unicodeSize = require_unicodeSize();
    function stringSize(string) {
      return hasUnicode(string) ? unicodeSize(string) : asciiSize(string);
    }
    _stringSize = stringSize;
    return _stringSize;
  }
  var size_1;
  var hasRequiredSize;
  function requireSize() {
    if (hasRequiredSize) return size_1;
    hasRequiredSize = 1;
    var baseKeys = require_baseKeys(), getTag = require_getTag(), isArrayLike = requireIsArrayLike(), isString = requireIsString(), stringSize = require_stringSize();
    var mapTag = "[object Map]", setTag = "[object Set]";
    function size(collection) {
      if (collection == null) {
        return 0;
      }
      if (isArrayLike(collection)) {
        return isString(collection) ? stringSize(collection) : collection.length;
      }
      var tag = getTag(collection);
      if (tag == mapTag || tag == setTag) {
        return collection.size;
      }
      return baseKeys(collection).length;
    }
    size_1 = size;
    return size_1;
  }
  var transform_1;
  var hasRequiredTransform;
  function requireTransform() {
    if (hasRequiredTransform) return transform_1;
    hasRequiredTransform = 1;
    var arrayEach = require_arrayEach(), baseCreate = require_baseCreate(), baseForOwn = require_baseForOwn(), baseIteratee = require_baseIteratee(), getPrototype = require_getPrototype(), isArray = requireIsArray(), isBuffer2 = requireIsBuffer(), isFunction = requireIsFunction(), isObject = requireIsObject(), isTypedArray = requireIsTypedArray();
    function transform(object, iteratee, accumulator) {
      var isArr = isArray(object), isArrLike = isArr || isBuffer2(object) || isTypedArray(object);
      iteratee = baseIteratee(iteratee, 4);
      if (accumulator == null) {
        var Ctor = object && object.constructor;
        if (isArrLike) {
          accumulator = isArr ? new Ctor() : [];
        } else if (isObject(object)) {
          accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
        } else {
          accumulator = {};
        }
      }
      (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object2) {
        return iteratee(accumulator, value, index, object2);
      });
      return accumulator;
    }
    transform_1 = transform;
    return transform_1;
  }
  var _isFlattenable;
  var hasRequired_isFlattenable;
  function require_isFlattenable() {
    if (hasRequired_isFlattenable) return _isFlattenable;
    hasRequired_isFlattenable = 1;
    var Symbol = require_Symbol(), isArguments = requireIsArguments(), isArray = requireIsArray();
    var spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : void 0;
    function isFlattenable(value) {
      return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
    }
    _isFlattenable = isFlattenable;
    return _isFlattenable;
  }
  var _baseFlatten;
  var hasRequired_baseFlatten;
  function require_baseFlatten() {
    if (hasRequired_baseFlatten) return _baseFlatten;
    hasRequired_baseFlatten = 1;
    var arrayPush = require_arrayPush(), isFlattenable = require_isFlattenable();
    function baseFlatten(array, depth, predicate, isStrict, result) {
      var index = -1, length = array.length;
      predicate || (predicate = isFlattenable);
      result || (result = []);
      while (++index < length) {
        var value = array[index];
        if (depth > 0 && predicate(value)) {
          if (depth > 1) {
            baseFlatten(value, depth - 1, predicate, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }
    _baseFlatten = baseFlatten;
    return _baseFlatten;
  }
  var _apply;
  var hasRequired_apply;
  function require_apply() {
    if (hasRequired_apply) return _apply;
    hasRequired_apply = 1;
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0:
          return func.call(thisArg);
        case 1:
          return func.call(thisArg, args[0]);
        case 2:
          return func.call(thisArg, args[0], args[1]);
        case 3:
          return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }
    _apply = apply;
    return _apply;
  }
  var _overRest;
  var hasRequired_overRest;
  function require_overRest() {
    if (hasRequired_overRest) return _overRest;
    hasRequired_overRest = 1;
    var apply = require_apply();
    var nativeMax = Math.max;
    function overRest(func, start, transform) {
      start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
      return function() {
        var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }
    _overRest = overRest;
    return _overRest;
  }
  var _baseSetToString;
  var hasRequired_baseSetToString;
  function require_baseSetToString() {
    if (hasRequired_baseSetToString) return _baseSetToString;
    hasRequired_baseSetToString = 1;
    var constant = requireConstant(), defineProperty = require_defineProperty(), identity = requireIdentity();
    var baseSetToString = !defineProperty ? identity : function(func, string) {
      return defineProperty(func, "toString", {
        "configurable": true,
        "enumerable": false,
        "value": constant(string),
        "writable": true
      });
    };
    _baseSetToString = baseSetToString;
    return _baseSetToString;
  }
  var _shortOut;
  var hasRequired_shortOut;
  function require_shortOut() {
    if (hasRequired_shortOut) return _shortOut;
    hasRequired_shortOut = 1;
    var HOT_COUNT = 800, HOT_SPAN = 16;
    var nativeNow = Date.now;
    function shortOut(func) {
      var count = 0, lastCalled = 0;
      return function() {
        var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(void 0, arguments);
      };
    }
    _shortOut = shortOut;
    return _shortOut;
  }
  var _setToString;
  var hasRequired_setToString;
  function require_setToString() {
    if (hasRequired_setToString) return _setToString;
    hasRequired_setToString = 1;
    var baseSetToString = require_baseSetToString(), shortOut = require_shortOut();
    var setToString = shortOut(baseSetToString);
    _setToString = setToString;
    return _setToString;
  }
  var _baseRest;
  var hasRequired_baseRest;
  function require_baseRest() {
    if (hasRequired_baseRest) return _baseRest;
    hasRequired_baseRest = 1;
    var identity = requireIdentity(), overRest = require_overRest(), setToString = require_setToString();
    function baseRest(func, start) {
      return setToString(overRest(func, start, identity), func + "");
    }
    _baseRest = baseRest;
    return _baseRest;
  }
  var _baseFindIndex;
  var hasRequired_baseFindIndex;
  function require_baseFindIndex() {
    if (hasRequired_baseFindIndex) return _baseFindIndex;
    hasRequired_baseFindIndex = 1;
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index-- : ++index < length) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    _baseFindIndex = baseFindIndex;
    return _baseFindIndex;
  }
  var _baseIsNaN;
  var hasRequired_baseIsNaN;
  function require_baseIsNaN() {
    if (hasRequired_baseIsNaN) return _baseIsNaN;
    hasRequired_baseIsNaN = 1;
    function baseIsNaN(value) {
      return value !== value;
    }
    _baseIsNaN = baseIsNaN;
    return _baseIsNaN;
  }
  var _strictIndexOf;
  var hasRequired_strictIndexOf;
  function require_strictIndexOf() {
    if (hasRequired_strictIndexOf) return _strictIndexOf;
    hasRequired_strictIndexOf = 1;
    function strictIndexOf(array, value, fromIndex) {
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }
    _strictIndexOf = strictIndexOf;
    return _strictIndexOf;
  }
  var _baseIndexOf;
  var hasRequired_baseIndexOf;
  function require_baseIndexOf() {
    if (hasRequired_baseIndexOf) return _baseIndexOf;
    hasRequired_baseIndexOf = 1;
    var baseFindIndex = require_baseFindIndex(), baseIsNaN = require_baseIsNaN(), strictIndexOf = require_strictIndexOf();
    function baseIndexOf(array, value, fromIndex) {
      return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
    }
    _baseIndexOf = baseIndexOf;
    return _baseIndexOf;
  }
  var _arrayIncludes;
  var hasRequired_arrayIncludes;
  function require_arrayIncludes() {
    if (hasRequired_arrayIncludes) return _arrayIncludes;
    hasRequired_arrayIncludes = 1;
    var baseIndexOf = require_baseIndexOf();
    function arrayIncludes(array, value) {
      var length = array == null ? 0 : array.length;
      return !!length && baseIndexOf(array, value, 0) > -1;
    }
    _arrayIncludes = arrayIncludes;
    return _arrayIncludes;
  }
  var _arrayIncludesWith;
  var hasRequired_arrayIncludesWith;
  function require_arrayIncludesWith() {
    if (hasRequired_arrayIncludesWith) return _arrayIncludesWith;
    hasRequired_arrayIncludesWith = 1;
    function arrayIncludesWith(array, value, comparator) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (comparator(value, array[index])) {
          return true;
        }
      }
      return false;
    }
    _arrayIncludesWith = arrayIncludesWith;
    return _arrayIncludesWith;
  }
  var noop_1;
  var hasRequiredNoop;
  function requireNoop() {
    if (hasRequiredNoop) return noop_1;
    hasRequiredNoop = 1;
    function noop() {
    }
    noop_1 = noop;
    return noop_1;
  }
  var _createSet;
  var hasRequired_createSet;
  function require_createSet() {
    if (hasRequired_createSet) return _createSet;
    hasRequired_createSet = 1;
    var Set2 = require_Set(), noop = requireNoop(), setToArray = require_setToArray();
    var INFINITY = 1 / 0;
    var createSet = !(Set2 && 1 / setToArray(new Set2([, -0]))[1] == INFINITY) ? noop : function(values) {
      return new Set2(values);
    };
    _createSet = createSet;
    return _createSet;
  }
  var _baseUniq;
  var hasRequired_baseUniq;
  function require_baseUniq() {
    if (hasRequired_baseUniq) return _baseUniq;
    hasRequired_baseUniq = 1;
    var SetCache = require_SetCache(), arrayIncludes = require_arrayIncludes(), arrayIncludesWith = require_arrayIncludesWith(), cacheHas = require_cacheHas(), createSet = require_createSet(), setToArray = require_setToArray();
    var LARGE_ARRAY_SIZE = 200;
    function baseUniq(array, iteratee, comparator) {
      var index = -1, includes = arrayIncludes, length = array.length, isCommon = true, result = [], seen = result;
      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
      } else if (length >= LARGE_ARRAY_SIZE) {
        var set = iteratee ? null : createSet(array);
        if (set) {
          return setToArray(set);
        }
        isCommon = false;
        includes = cacheHas;
        seen = new SetCache();
      } else {
        seen = iteratee ? [] : result;
      }
      outer:
        while (++index < length) {
          var value = array[index], computed = iteratee ? iteratee(value) : value;
          value = comparator || value !== 0 ? value : 0;
          if (isCommon && computed === computed) {
            var seenIndex = seen.length;
            while (seenIndex--) {
              if (seen[seenIndex] === computed) {
                continue outer;
              }
            }
            if (iteratee) {
              seen.push(computed);
            }
            result.push(value);
          } else if (!includes(seen, computed, comparator)) {
            if (seen !== result) {
              seen.push(computed);
            }
            result.push(value);
          }
        }
      return result;
    }
    _baseUniq = baseUniq;
    return _baseUniq;
  }
  var isArrayLikeObject_1;
  var hasRequiredIsArrayLikeObject;
  function requireIsArrayLikeObject() {
    if (hasRequiredIsArrayLikeObject) return isArrayLikeObject_1;
    hasRequiredIsArrayLikeObject = 1;
    var isArrayLike = requireIsArrayLike(), isObjectLike = requireIsObjectLike();
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    isArrayLikeObject_1 = isArrayLikeObject;
    return isArrayLikeObject_1;
  }
  var union_1;
  var hasRequiredUnion;
  function requireUnion() {
    if (hasRequiredUnion) return union_1;
    hasRequiredUnion = 1;
    var baseFlatten = require_baseFlatten(), baseRest = require_baseRest(), baseUniq = require_baseUniq(), isArrayLikeObject = requireIsArrayLikeObject();
    var union = baseRest(function(arrays) {
      return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
    });
    union_1 = union;
    return union_1;
  }
  var _baseValues;
  var hasRequired_baseValues;
  function require_baseValues() {
    if (hasRequired_baseValues) return _baseValues;
    hasRequired_baseValues = 1;
    var arrayMap = require_arrayMap();
    function baseValues(object, props) {
      return arrayMap(props, function(key) {
        return object[key];
      });
    }
    _baseValues = baseValues;
    return _baseValues;
  }
  var values_1;
  var hasRequiredValues;
  function requireValues() {
    if (hasRequiredValues) return values_1;
    hasRequiredValues = 1;
    var baseValues = require_baseValues(), keys = requireKeys();
    function values(object) {
      return object == null ? [] : baseValues(object, keys(object));
    }
    values_1 = values;
    return values_1;
  }
  var lodash_1$1;
  var hasRequiredLodash;
  function requireLodash() {
    if (hasRequiredLodash) return lodash_1$1;
    hasRequiredLodash = 1;
    var lodash2;
    if (typeof commonjsRequire === "function") {
      try {
        lodash2 = {
          clone: requireClone(),
          constant: requireConstant(),
          each: requireEach(),
          filter: requireFilter(),
          has: requireHas(),
          isArray: requireIsArray(),
          isEmpty: requireIsEmpty(),
          isFunction: requireIsFunction(),
          isUndefined: requireIsUndefined(),
          keys: requireKeys(),
          map: requireMap(),
          reduce: requireReduce(),
          size: requireSize(),
          transform: requireTransform(),
          union: requireUnion(),
          values: requireValues()
        };
      } catch (e) {
      }
    }
    if (!lodash2) {
      lodash2 = window._;
    }
    lodash_1$1 = lodash2;
    return lodash_1$1;
  }
  var graph;
  var hasRequiredGraph;
  function requireGraph() {
    if (hasRequiredGraph) return graph;
    hasRequiredGraph = 1;
    var _2 = requireLodash();
    graph = Graph2;
    var DEFAULT_EDGE_NAME = "\0";
    var GRAPH_NODE = "\0";
    var EDGE_KEY_DELIM = "";
    function Graph2(opts) {
      this._isDirected = _2.has(opts, "directed") ? opts.directed : true;
      this._isMultigraph = _2.has(opts, "multigraph") ? opts.multigraph : false;
      this._isCompound = _2.has(opts, "compound") ? opts.compound : false;
      this._label = void 0;
      this._defaultNodeLabelFn = _2.constant(void 0);
      this._defaultEdgeLabelFn = _2.constant(void 0);
      this._nodes = {};
      if (this._isCompound) {
        this._parent = {};
        this._children = {};
        this._children[GRAPH_NODE] = {};
      }
      this._in = {};
      this._preds = {};
      this._out = {};
      this._sucs = {};
      this._edgeObjs = {};
      this._edgeLabels = {};
    }
    Graph2.prototype._nodeCount = 0;
    Graph2.prototype._edgeCount = 0;
    Graph2.prototype.isDirected = function() {
      return this._isDirected;
    };
    Graph2.prototype.isMultigraph = function() {
      return this._isMultigraph;
    };
    Graph2.prototype.isCompound = function() {
      return this._isCompound;
    };
    Graph2.prototype.setGraph = function(label) {
      this._label = label;
      return this;
    };
    Graph2.prototype.graph = function() {
      return this._label;
    };
    Graph2.prototype.setDefaultNodeLabel = function(newDefault) {
      if (!_2.isFunction(newDefault)) {
        newDefault = _2.constant(newDefault);
      }
      this._defaultNodeLabelFn = newDefault;
      return this;
    };
    Graph2.prototype.nodeCount = function() {
      return this._nodeCount;
    };
    Graph2.prototype.nodes = function() {
      return _2.keys(this._nodes);
    };
    Graph2.prototype.sources = function() {
      var self2 = this;
      return _2.filter(this.nodes(), function(v) {
        return _2.isEmpty(self2._in[v]);
      });
    };
    Graph2.prototype.sinks = function() {
      var self2 = this;
      return _2.filter(this.nodes(), function(v) {
        return _2.isEmpty(self2._out[v]);
      });
    };
    Graph2.prototype.setNodes = function(vs, value) {
      var args = arguments;
      var self2 = this;
      _2.each(vs, function(v) {
        if (args.length > 1) {
          self2.setNode(v, value);
        } else {
          self2.setNode(v);
        }
      });
      return this;
    };
    Graph2.prototype.setNode = function(v, value) {
      if (_2.has(this._nodes, v)) {
        if (arguments.length > 1) {
          this._nodes[v] = value;
        }
        return this;
      }
      this._nodes[v] = arguments.length > 1 ? value : this._defaultNodeLabelFn(v);
      if (this._isCompound) {
        this._parent[v] = GRAPH_NODE;
        this._children[v] = {};
        this._children[GRAPH_NODE][v] = true;
      }
      this._in[v] = {};
      this._preds[v] = {};
      this._out[v] = {};
      this._sucs[v] = {};
      ++this._nodeCount;
      return this;
    };
    Graph2.prototype.node = function(v) {
      return this._nodes[v];
    };
    Graph2.prototype.hasNode = function(v) {
      return _2.has(this._nodes, v);
    };
    Graph2.prototype.removeNode = function(v) {
      var self2 = this;
      if (_2.has(this._nodes, v)) {
        var removeEdge = function(e) {
          self2.removeEdge(self2._edgeObjs[e]);
        };
        delete this._nodes[v];
        if (this._isCompound) {
          this._removeFromParentsChildList(v);
          delete this._parent[v];
          _2.each(this.children(v), function(child) {
            self2.setParent(child);
          });
          delete this._children[v];
        }
        _2.each(_2.keys(this._in[v]), removeEdge);
        delete this._in[v];
        delete this._preds[v];
        _2.each(_2.keys(this._out[v]), removeEdge);
        delete this._out[v];
        delete this._sucs[v];
        --this._nodeCount;
      }
      return this;
    };
    Graph2.prototype.setParent = function(v, parent) {
      if (!this._isCompound) {
        throw new Error("Cannot set parent in a non-compound graph");
      }
      if (_2.isUndefined(parent)) {
        parent = GRAPH_NODE;
      } else {
        parent += "";
        for (var ancestor = parent; !_2.isUndefined(ancestor); ancestor = this.parent(ancestor)) {
          if (ancestor === v) {
            throw new Error("Setting " + parent + " as parent of " + v + " would create a cycle");
          }
        }
        this.setNode(parent);
      }
      this.setNode(v);
      this._removeFromParentsChildList(v);
      this._parent[v] = parent;
      this._children[parent][v] = true;
      return this;
    };
    Graph2.prototype._removeFromParentsChildList = function(v) {
      delete this._children[this._parent[v]][v];
    };
    Graph2.prototype.parent = function(v) {
      if (this._isCompound) {
        var parent = this._parent[v];
        if (parent !== GRAPH_NODE) {
          return parent;
        }
      }
    };
    Graph2.prototype.children = function(v) {
      if (_2.isUndefined(v)) {
        v = GRAPH_NODE;
      }
      if (this._isCompound) {
        var children = this._children[v];
        if (children) {
          return _2.keys(children);
        }
      } else if (v === GRAPH_NODE) {
        return this.nodes();
      } else if (this.hasNode(v)) {
        return [];
      }
    };
    Graph2.prototype.predecessors = function(v) {
      var predsV = this._preds[v];
      if (predsV) {
        return _2.keys(predsV);
      }
    };
    Graph2.prototype.successors = function(v) {
      var sucsV = this._sucs[v];
      if (sucsV) {
        return _2.keys(sucsV);
      }
    };
    Graph2.prototype.neighbors = function(v) {
      var preds = this.predecessors(v);
      if (preds) {
        return _2.union(preds, this.successors(v));
      }
    };
    Graph2.prototype.isLeaf = function(v) {
      var neighbors;
      if (this.isDirected()) {
        neighbors = this.successors(v);
      } else {
        neighbors = this.neighbors(v);
      }
      return neighbors.length === 0;
    };
    Graph2.prototype.filterNodes = function(filter) {
      var copy = new this.constructor({
        directed: this._isDirected,
        multigraph: this._isMultigraph,
        compound: this._isCompound
      });
      copy.setGraph(this.graph());
      var self2 = this;
      _2.each(this._nodes, function(value, v) {
        if (filter(v)) {
          copy.setNode(v, value);
        }
      });
      _2.each(this._edgeObjs, function(e) {
        if (copy.hasNode(e.v) && copy.hasNode(e.w)) {
          copy.setEdge(e, self2.edge(e));
        }
      });
      var parents = {};
      function findParent(v) {
        var parent = self2.parent(v);
        if (parent === void 0 || copy.hasNode(parent)) {
          parents[v] = parent;
          return parent;
        } else if (parent in parents) {
          return parents[parent];
        } else {
          return findParent(parent);
        }
      }
      if (this._isCompound) {
        _2.each(copy.nodes(), function(v) {
          copy.setParent(v, findParent(v));
        });
      }
      return copy;
    };
    Graph2.prototype.setDefaultEdgeLabel = function(newDefault) {
      if (!_2.isFunction(newDefault)) {
        newDefault = _2.constant(newDefault);
      }
      this._defaultEdgeLabelFn = newDefault;
      return this;
    };
    Graph2.prototype.edgeCount = function() {
      return this._edgeCount;
    };
    Graph2.prototype.edges = function() {
      return _2.values(this._edgeObjs);
    };
    Graph2.prototype.setPath = function(vs, value) {
      var self2 = this;
      var args = arguments;
      _2.reduce(vs, function(v, w) {
        if (args.length > 1) {
          self2.setEdge(v, w, value);
        } else {
          self2.setEdge(v, w);
        }
        return w;
      });
      return this;
    };
    Graph2.prototype.setEdge = function() {
      var v, w, name, value;
      var valueSpecified = false;
      var arg0 = arguments[0];
      if (typeof arg0 === "object" && arg0 !== null && "v" in arg0) {
        v = arg0.v;
        w = arg0.w;
        name = arg0.name;
        if (arguments.length === 2) {
          value = arguments[1];
          valueSpecified = true;
        }
      } else {
        v = arg0;
        w = arguments[1];
        name = arguments[3];
        if (arguments.length > 2) {
          value = arguments[2];
          valueSpecified = true;
        }
      }
      v = "" + v;
      w = "" + w;
      if (!_2.isUndefined(name)) {
        name = "" + name;
      }
      var e = edgeArgsToId(this._isDirected, v, w, name);
      if (_2.has(this._edgeLabels, e)) {
        if (valueSpecified) {
          this._edgeLabels[e] = value;
        }
        return this;
      }
      if (!_2.isUndefined(name) && !this._isMultigraph) {
        throw new Error("Cannot set a named edge when isMultigraph = false");
      }
      this.setNode(v);
      this.setNode(w);
      this._edgeLabels[e] = valueSpecified ? value : this._defaultEdgeLabelFn(v, w, name);
      var edgeObj = edgeArgsToObj(this._isDirected, v, w, name);
      v = edgeObj.v;
      w = edgeObj.w;
      Object.freeze(edgeObj);
      this._edgeObjs[e] = edgeObj;
      incrementOrInitEntry(this._preds[w], v);
      incrementOrInitEntry(this._sucs[v], w);
      this._in[w][e] = edgeObj;
      this._out[v][e] = edgeObj;
      this._edgeCount++;
      return this;
    };
    Graph2.prototype.edge = function(v, w, name) {
      var e = arguments.length === 1 ? edgeObjToId(this._isDirected, arguments[0]) : edgeArgsToId(this._isDirected, v, w, name);
      return this._edgeLabels[e];
    };
    Graph2.prototype.hasEdge = function(v, w, name) {
      var e = arguments.length === 1 ? edgeObjToId(this._isDirected, arguments[0]) : edgeArgsToId(this._isDirected, v, w, name);
      return _2.has(this._edgeLabels, e);
    };
    Graph2.prototype.removeEdge = function(v, w, name) {
      var e = arguments.length === 1 ? edgeObjToId(this._isDirected, arguments[0]) : edgeArgsToId(this._isDirected, v, w, name);
      var edge = this._edgeObjs[e];
      if (edge) {
        v = edge.v;
        w = edge.w;
        delete this._edgeLabels[e];
        delete this._edgeObjs[e];
        decrementOrRemoveEntry(this._preds[w], v);
        decrementOrRemoveEntry(this._sucs[v], w);
        delete this._in[w][e];
        delete this._out[v][e];
        this._edgeCount--;
      }
      return this;
    };
    Graph2.prototype.inEdges = function(v, u) {
      var inV = this._in[v];
      if (inV) {
        var edges = _2.values(inV);
        if (!u) {
          return edges;
        }
        return _2.filter(edges, function(edge) {
          return edge.v === u;
        });
      }
    };
    Graph2.prototype.outEdges = function(v, w) {
      var outV = this._out[v];
      if (outV) {
        var edges = _2.values(outV);
        if (!w) {
          return edges;
        }
        return _2.filter(edges, function(edge) {
          return edge.w === w;
        });
      }
    };
    Graph2.prototype.nodeEdges = function(v, w) {
      var inEdges = this.inEdges(v, w);
      if (inEdges) {
        return inEdges.concat(this.outEdges(v, w));
      }
    };
    function incrementOrInitEntry(map, k) {
      if (map[k]) {
        map[k]++;
      } else {
        map[k] = 1;
      }
    }
    function decrementOrRemoveEntry(map, k) {
      if (!--map[k]) {
        delete map[k];
      }
    }
    function edgeArgsToId(isDirected, v_, w_, name) {
      var v = "" + v_;
      var w = "" + w_;
      if (!isDirected && v > w) {
        var tmp = v;
        v = w;
        w = tmp;
      }
      return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM + (_2.isUndefined(name) ? DEFAULT_EDGE_NAME : name);
    }
    function edgeArgsToObj(isDirected, v_, w_, name) {
      var v = "" + v_;
      var w = "" + w_;
      if (!isDirected && v > w) {
        var tmp = v;
        v = w;
        w = tmp;
      }
      var edgeObj = { v, w };
      if (name) {
        edgeObj.name = name;
      }
      return edgeObj;
    }
    function edgeObjToId(isDirected, edgeObj) {
      return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
    }
    return graph;
  }
  var version$1;
  var hasRequiredVersion;
  function requireVersion() {
    if (hasRequiredVersion) return version$1;
    hasRequiredVersion = 1;
    version$1 = "2.1.8";
    return version$1;
  }
  var lib;
  var hasRequiredLib;
  function requireLib() {
    if (hasRequiredLib) return lib;
    hasRequiredLib = 1;
    lib = {
      Graph: requireGraph(),
      version: requireVersion()
    };
    return lib;
  }
  var json;
  var hasRequiredJson;
  function requireJson() {
    if (hasRequiredJson) return json;
    hasRequiredJson = 1;
    var _2 = requireLodash();
    var Graph2 = requireGraph();
    json = {
      write,
      read
    };
    function write(g) {
      var json2 = {
        options: {
          directed: g.isDirected(),
          multigraph: g.isMultigraph(),
          compound: g.isCompound()
        },
        nodes: writeNodes(g),
        edges: writeEdges(g)
      };
      if (!_2.isUndefined(g.graph())) {
        json2.value = _2.clone(g.graph());
      }
      return json2;
    }
    function writeNodes(g) {
      return _2.map(g.nodes(), function(v) {
        var nodeValue = g.node(v);
        var parent = g.parent(v);
        var node = { v };
        if (!_2.isUndefined(nodeValue)) {
          node.value = nodeValue;
        }
        if (!_2.isUndefined(parent)) {
          node.parent = parent;
        }
        return node;
      });
    }
    function writeEdges(g) {
      return _2.map(g.edges(), function(e) {
        var edgeValue = g.edge(e);
        var edge = { v: e.v, w: e.w };
        if (!_2.isUndefined(e.name)) {
          edge.name = e.name;
        }
        if (!_2.isUndefined(edgeValue)) {
          edge.value = edgeValue;
        }
        return edge;
      });
    }
    function read(json2) {
      var g = new Graph2(json2.options).setGraph(json2.value);
      _2.each(json2.nodes, function(entry) {
        g.setNode(entry.v, entry.value);
        if (entry.parent) {
          g.setParent(entry.v, entry.parent);
        }
      });
      _2.each(json2.edges, function(entry) {
        g.setEdge({ v: entry.v, w: entry.w, name: entry.name }, entry.value);
      });
      return g;
    }
    return json;
  }
  var components_1;
  var hasRequiredComponents;
  function requireComponents() {
    if (hasRequiredComponents) return components_1;
    hasRequiredComponents = 1;
    var _2 = requireLodash();
    components_1 = components;
    function components(g) {
      var visited = {};
      var cmpts = [];
      var cmpt;
      function dfs2(v) {
        if (_2.has(visited, v)) return;
        visited[v] = true;
        cmpt.push(v);
        _2.each(g.successors(v), dfs2);
        _2.each(g.predecessors(v), dfs2);
      }
      _2.each(g.nodes(), function(v) {
        cmpt = [];
        dfs2(v);
        if (cmpt.length) {
          cmpts.push(cmpt);
        }
      });
      return cmpts;
    }
    return components_1;
  }
  var priorityQueue;
  var hasRequiredPriorityQueue;
  function requirePriorityQueue() {
    if (hasRequiredPriorityQueue) return priorityQueue;
    hasRequiredPriorityQueue = 1;
    var _2 = requireLodash();
    priorityQueue = PriorityQueue;
    function PriorityQueue() {
      this._arr = [];
      this._keyIndices = {};
    }
    PriorityQueue.prototype.size = function() {
      return this._arr.length;
    };
    PriorityQueue.prototype.keys = function() {
      return this._arr.map(function(x) {
        return x.key;
      });
    };
    PriorityQueue.prototype.has = function(key) {
      return _2.has(this._keyIndices, key);
    };
    PriorityQueue.prototype.priority = function(key) {
      var index = this._keyIndices[key];
      if (index !== void 0) {
        return this._arr[index].priority;
      }
    };
    PriorityQueue.prototype.min = function() {
      if (this.size() === 0) {
        throw new Error("Queue underflow");
      }
      return this._arr[0].key;
    };
    PriorityQueue.prototype.add = function(key, priority) {
      var keyIndices = this._keyIndices;
      key = String(key);
      if (!_2.has(keyIndices, key)) {
        var arr = this._arr;
        var index = arr.length;
        keyIndices[key] = index;
        arr.push({ key, priority });
        this._decrease(index);
        return true;
      }
      return false;
    };
    PriorityQueue.prototype.removeMin = function() {
      this._swap(0, this._arr.length - 1);
      var min = this._arr.pop();
      delete this._keyIndices[min.key];
      this._heapify(0);
      return min.key;
    };
    PriorityQueue.prototype.decrease = function(key, priority) {
      var index = this._keyIndices[key];
      if (priority > this._arr[index].priority) {
        throw new Error("New priority is greater than current priority. Key: " + key + " Old: " + this._arr[index].priority + " New: " + priority);
      }
      this._arr[index].priority = priority;
      this._decrease(index);
    };
    PriorityQueue.prototype._heapify = function(i) {
      var arr = this._arr;
      var l = 2 * i;
      var r = l + 1;
      var largest = i;
      if (l < arr.length) {
        largest = arr[l].priority < arr[largest].priority ? l : largest;
        if (r < arr.length) {
          largest = arr[r].priority < arr[largest].priority ? r : largest;
        }
        if (largest !== i) {
          this._swap(i, largest);
          this._heapify(largest);
        }
      }
    };
    PriorityQueue.prototype._decrease = function(index) {
      var arr = this._arr;
      var priority = arr[index].priority;
      var parent;
      while (index !== 0) {
        parent = index >> 1;
        if (arr[parent].priority < priority) {
          break;
        }
        this._swap(index, parent);
        index = parent;
      }
    };
    PriorityQueue.prototype._swap = function(i, j) {
      var arr = this._arr;
      var keyIndices = this._keyIndices;
      var origArrI = arr[i];
      var origArrJ = arr[j];
      arr[i] = origArrJ;
      arr[j] = origArrI;
      keyIndices[origArrJ.key] = i;
      keyIndices[origArrI.key] = j;
    };
    return priorityQueue;
  }
  var dijkstra_1;
  var hasRequiredDijkstra;
  function requireDijkstra() {
    if (hasRequiredDijkstra) return dijkstra_1;
    hasRequiredDijkstra = 1;
    var _2 = requireLodash();
    var PriorityQueue = requirePriorityQueue();
    dijkstra_1 = dijkstra;
    var DEFAULT_WEIGHT_FUNC = _2.constant(1);
    function dijkstra(g, source, weightFn, edgeFn) {
      return runDijkstra(
        g,
        String(source),
        weightFn || DEFAULT_WEIGHT_FUNC,
        edgeFn || function(v) {
          return g.outEdges(v);
        }
      );
    }
    function runDijkstra(g, source, weightFn, edgeFn) {
      var results = {};
      var pq = new PriorityQueue();
      var v, vEntry;
      var updateNeighbors = function(edge) {
        var w = edge.v !== v ? edge.v : edge.w;
        var wEntry = results[w];
        var weight = weightFn(edge);
        var distance = vEntry.distance + weight;
        if (weight < 0) {
          throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + edge + " Weight: " + weight);
        }
        if (distance < wEntry.distance) {
          wEntry.distance = distance;
          wEntry.predecessor = v;
          pq.decrease(w, distance);
        }
      };
      g.nodes().forEach(function(v2) {
        var distance = v2 === source ? 0 : Number.POSITIVE_INFINITY;
        results[v2] = { distance };
        pq.add(v2, distance);
      });
      while (pq.size() > 0) {
        v = pq.removeMin();
        vEntry = results[v];
        if (vEntry.distance === Number.POSITIVE_INFINITY) {
          break;
        }
        edgeFn(v).forEach(updateNeighbors);
      }
      return results;
    }
    return dijkstra_1;
  }
  var dijkstraAll_1;
  var hasRequiredDijkstraAll;
  function requireDijkstraAll() {
    if (hasRequiredDijkstraAll) return dijkstraAll_1;
    hasRequiredDijkstraAll = 1;
    var dijkstra = requireDijkstra();
    var _2 = requireLodash();
    dijkstraAll_1 = dijkstraAll;
    function dijkstraAll(g, weightFunc, edgeFunc) {
      return _2.transform(g.nodes(), function(acc, v) {
        acc[v] = dijkstra(g, v, weightFunc, edgeFunc);
      }, {});
    }
    return dijkstraAll_1;
  }
  var tarjan_1;
  var hasRequiredTarjan;
  function requireTarjan() {
    if (hasRequiredTarjan) return tarjan_1;
    hasRequiredTarjan = 1;
    var _2 = requireLodash();
    tarjan_1 = tarjan;
    function tarjan(g) {
      var index = 0;
      var stack = [];
      var visited = {};
      var results = [];
      function dfs2(v) {
        var entry = visited[v] = {
          onStack: true,
          lowlink: index,
          index: index++
        };
        stack.push(v);
        g.successors(v).forEach(function(w2) {
          if (!_2.has(visited, w2)) {
            dfs2(w2);
            entry.lowlink = Math.min(entry.lowlink, visited[w2].lowlink);
          } else if (visited[w2].onStack) {
            entry.lowlink = Math.min(entry.lowlink, visited[w2].index);
          }
        });
        if (entry.lowlink === entry.index) {
          var cmpt = [];
          var w;
          do {
            w = stack.pop();
            visited[w].onStack = false;
            cmpt.push(w);
          } while (v !== w);
          results.push(cmpt);
        }
      }
      g.nodes().forEach(function(v) {
        if (!_2.has(visited, v)) {
          dfs2(v);
        }
      });
      return results;
    }
    return tarjan_1;
  }
  var findCycles_1;
  var hasRequiredFindCycles;
  function requireFindCycles() {
    if (hasRequiredFindCycles) return findCycles_1;
    hasRequiredFindCycles = 1;
    var _2 = requireLodash();
    var tarjan = requireTarjan();
    findCycles_1 = findCycles;
    function findCycles(g) {
      return _2.filter(tarjan(g), function(cmpt) {
        return cmpt.length > 1 || cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0]);
      });
    }
    return findCycles_1;
  }
  var floydWarshall_1;
  var hasRequiredFloydWarshall;
  function requireFloydWarshall() {
    if (hasRequiredFloydWarshall) return floydWarshall_1;
    hasRequiredFloydWarshall = 1;
    var _2 = requireLodash();
    floydWarshall_1 = floydWarshall;
    var DEFAULT_WEIGHT_FUNC = _2.constant(1);
    function floydWarshall(g, weightFn, edgeFn) {
      return runFloydWarshall(
        g,
        weightFn || DEFAULT_WEIGHT_FUNC,
        edgeFn || function(v) {
          return g.outEdges(v);
        }
      );
    }
    function runFloydWarshall(g, weightFn, edgeFn) {
      var results = {};
      var nodes = g.nodes();
      nodes.forEach(function(v) {
        results[v] = {};
        results[v][v] = { distance: 0 };
        nodes.forEach(function(w) {
          if (v !== w) {
            results[v][w] = { distance: Number.POSITIVE_INFINITY };
          }
        });
        edgeFn(v).forEach(function(edge) {
          var w = edge.v === v ? edge.w : edge.v;
          var d = weightFn(edge);
          results[v][w] = { distance: d, predecessor: v };
        });
      });
      nodes.forEach(function(k) {
        var rowK = results[k];
        nodes.forEach(function(i) {
          var rowI = results[i];
          nodes.forEach(function(j) {
            var ik = rowI[k];
            var kj = rowK[j];
            var ij = rowI[j];
            var altDistance = ik.distance + kj.distance;
            if (altDistance < ij.distance) {
              ij.distance = altDistance;
              ij.predecessor = kj.predecessor;
            }
          });
        });
      });
      return results;
    }
    return floydWarshall_1;
  }
  var topsort_1;
  var hasRequiredTopsort;
  function requireTopsort() {
    if (hasRequiredTopsort) return topsort_1;
    hasRequiredTopsort = 1;
    var _2 = requireLodash();
    topsort_1 = topsort;
    topsort.CycleException = CycleException;
    function topsort(g) {
      var visited = {};
      var stack = {};
      var results = [];
      function visit(node) {
        if (_2.has(stack, node)) {
          throw new CycleException();
        }
        if (!_2.has(visited, node)) {
          stack[node] = true;
          visited[node] = true;
          _2.each(g.predecessors(node), visit);
          delete stack[node];
          results.push(node);
        }
      }
      _2.each(g.sinks(), visit);
      if (_2.size(visited) !== g.nodeCount()) {
        throw new CycleException();
      }
      return results;
    }
    function CycleException() {
    }
    CycleException.prototype = new Error();
    return topsort_1;
  }
  var isAcyclic_1;
  var hasRequiredIsAcyclic;
  function requireIsAcyclic() {
    if (hasRequiredIsAcyclic) return isAcyclic_1;
    hasRequiredIsAcyclic = 1;
    var topsort = requireTopsort();
    isAcyclic_1 = isAcyclic;
    function isAcyclic(g) {
      try {
        topsort(g);
      } catch (e) {
        if (e instanceof topsort.CycleException) {
          return false;
        }
        throw e;
      }
      return true;
    }
    return isAcyclic_1;
  }
  var dfs_1;
  var hasRequiredDfs;
  function requireDfs() {
    if (hasRequiredDfs) return dfs_1;
    hasRequiredDfs = 1;
    var _2 = requireLodash();
    dfs_1 = dfs2;
    function dfs2(g, vs, order2) {
      if (!_2.isArray(vs)) {
        vs = [vs];
      }
      var navigation = (g.isDirected() ? g.successors : g.neighbors).bind(g);
      var acc = [];
      var visited = {};
      _2.each(vs, function(v) {
        if (!g.hasNode(v)) {
          throw new Error("Graph does not have node: " + v);
        }
        doDfs(g, v, order2 === "post", visited, navigation, acc);
      });
      return acc;
    }
    function doDfs(g, v, postorder2, visited, navigation, acc) {
      if (!_2.has(visited, v)) {
        visited[v] = true;
        if (!postorder2) {
          acc.push(v);
        }
        _2.each(navigation(v), function(w) {
          doDfs(g, w, postorder2, visited, navigation, acc);
        });
        if (postorder2) {
          acc.push(v);
        }
      }
    }
    return dfs_1;
  }
  var postorder_1;
  var hasRequiredPostorder;
  function requirePostorder() {
    if (hasRequiredPostorder) return postorder_1;
    hasRequiredPostorder = 1;
    var dfs2 = requireDfs();
    postorder_1 = postorder2;
    function postorder2(g, vs) {
      return dfs2(g, vs, "post");
    }
    return postorder_1;
  }
  var preorder_1;
  var hasRequiredPreorder;
  function requirePreorder() {
    if (hasRequiredPreorder) return preorder_1;
    hasRequiredPreorder = 1;
    var dfs2 = requireDfs();
    preorder_1 = preorder2;
    function preorder2(g, vs) {
      return dfs2(g, vs, "pre");
    }
    return preorder_1;
  }
  var prim_1;
  var hasRequiredPrim;
  function requirePrim() {
    if (hasRequiredPrim) return prim_1;
    hasRequiredPrim = 1;
    var _2 = requireLodash();
    var Graph2 = requireGraph();
    var PriorityQueue = requirePriorityQueue();
    prim_1 = prim;
    function prim(g, weightFunc) {
      var result = new Graph2();
      var parents = {};
      var pq = new PriorityQueue();
      var v;
      function updateNeighbors(edge) {
        var w = edge.v === v ? edge.w : edge.v;
        var pri = pq.priority(w);
        if (pri !== void 0) {
          var edgeWeight = weightFunc(edge);
          if (edgeWeight < pri) {
            parents[w] = v;
            pq.decrease(w, edgeWeight);
          }
        }
      }
      if (g.nodeCount() === 0) {
        return result;
      }
      _2.each(g.nodes(), function(v2) {
        pq.add(v2, Number.POSITIVE_INFINITY);
        result.setNode(v2);
      });
      pq.decrease(g.nodes()[0], 0);
      var init2 = false;
      while (pq.size() > 0) {
        v = pq.removeMin();
        if (_2.has(parents, v)) {
          result.setEdge(v, parents[v]);
        } else if (init2) {
          throw new Error("Input graph is not connected: " + g);
        } else {
          init2 = true;
        }
        g.nodeEdges(v).forEach(updateNeighbors);
      }
      return result;
    }
    return prim_1;
  }
  var alg;
  var hasRequiredAlg;
  function requireAlg() {
    if (hasRequiredAlg) return alg;
    hasRequiredAlg = 1;
    alg = {
      components: requireComponents(),
      dijkstra: requireDijkstra(),
      dijkstraAll: requireDijkstraAll(),
      findCycles: requireFindCycles(),
      floydWarshall: requireFloydWarshall(),
      isAcyclic: requireIsAcyclic(),
      postorder: requirePostorder(),
      preorder: requirePreorder(),
      prim: requirePrim(),
      tarjan: requireTarjan(),
      topsort: requireTopsort()
    };
    return alg;
  }
  var graphlib$1;
  var hasRequiredGraphlib;
  function requireGraphlib() {
    if (hasRequiredGraphlib) return graphlib$1;
    hasRequiredGraphlib = 1;
    var lib2 = requireLib();
    graphlib$1 = {
      Graph: lib2.Graph,
      json: requireJson(),
      alg: requireAlg(),
      version: lib2.version
    };
    return graphlib$1;
  }
  var graphlib;
  if (typeof commonjsRequire === "function") {
    try {
      graphlib = requireGraphlib();
    } catch (e) {
    }
  }
  if (!graphlib) {
    graphlib = window.graphlib;
  }
  var graphlib_1 = graphlib;
  var cloneDeep_1;
  var hasRequiredCloneDeep;
  function requireCloneDeep() {
    if (hasRequiredCloneDeep) return cloneDeep_1;
    hasRequiredCloneDeep = 1;
    var baseClone = require_baseClone();
    var CLONE_DEEP_FLAG = 1, CLONE_SYMBOLS_FLAG = 4;
    function cloneDeep(value) {
      return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
    }
    cloneDeep_1 = cloneDeep;
    return cloneDeep_1;
  }
  var _isIterateeCall;
  var hasRequired_isIterateeCall;
  function require_isIterateeCall() {
    if (hasRequired_isIterateeCall) return _isIterateeCall;
    hasRequired_isIterateeCall = 1;
    var eq = requireEq(), isArrayLike = requireIsArrayLike(), isIndex = require_isIndex(), isObject = requireIsObject();
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
        return eq(object[index], value);
      }
      return false;
    }
    _isIterateeCall = isIterateeCall;
    return _isIterateeCall;
  }
  var defaults_1;
  var hasRequiredDefaults;
  function requireDefaults() {
    if (hasRequiredDefaults) return defaults_1;
    hasRequiredDefaults = 1;
    var baseRest = require_baseRest(), eq = requireEq(), isIterateeCall = require_isIterateeCall(), keysIn = requireKeysIn();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var defaults = baseRest(function(object, sources) {
      object = Object(object);
      var index = -1;
      var length = sources.length;
      var guard = length > 2 ? sources[2] : void 0;
      if (guard && isIterateeCall(sources[0], sources[1], guard)) {
        length = 1;
      }
      while (++index < length) {
        var source = sources[index];
        var props = keysIn(source);
        var propsIndex = -1;
        var propsLength = props.length;
        while (++propsIndex < propsLength) {
          var key = props[propsIndex];
          var value = object[key];
          if (value === void 0 || eq(value, objectProto[key]) && !hasOwnProperty.call(object, key)) {
            object[key] = source[key];
          }
        }
      }
      return object;
    });
    defaults_1 = defaults;
    return defaults_1;
  }
  var _createFind;
  var hasRequired_createFind;
  function require_createFind() {
    if (hasRequired_createFind) return _createFind;
    hasRequired_createFind = 1;
    var baseIteratee = require_baseIteratee(), isArrayLike = requireIsArrayLike(), keys = requireKeys();
    function createFind(findIndexFunc) {
      return function(collection, predicate, fromIndex) {
        var iterable = Object(collection);
        if (!isArrayLike(collection)) {
          var iteratee = baseIteratee(predicate, 3);
          collection = keys(collection);
          predicate = function(key) {
            return iteratee(iterable[key], key, iterable);
          };
        }
        var index = findIndexFunc(collection, predicate, fromIndex);
        return index > -1 ? iterable[iteratee ? collection[index] : index] : void 0;
      };
    }
    _createFind = createFind;
    return _createFind;
  }
  var _trimmedEndIndex;
  var hasRequired_trimmedEndIndex;
  function require_trimmedEndIndex() {
    if (hasRequired_trimmedEndIndex) return _trimmedEndIndex;
    hasRequired_trimmedEndIndex = 1;
    var reWhitespace = /\s/;
    function trimmedEndIndex(string) {
      var index = string.length;
      while (index-- && reWhitespace.test(string.charAt(index))) {
      }
      return index;
    }
    _trimmedEndIndex = trimmedEndIndex;
    return _trimmedEndIndex;
  }
  var _baseTrim;
  var hasRequired_baseTrim;
  function require_baseTrim() {
    if (hasRequired_baseTrim) return _baseTrim;
    hasRequired_baseTrim = 1;
    var trimmedEndIndex = require_trimmedEndIndex();
    var reTrimStart = /^\s+/;
    function baseTrim(string) {
      return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
    }
    _baseTrim = baseTrim;
    return _baseTrim;
  }
  var toNumber_1;
  var hasRequiredToNumber;
  function requireToNumber() {
    if (hasRequiredToNumber) return toNumber_1;
    hasRequiredToNumber = 1;
    var baseTrim = require_baseTrim(), isObject = requireIsObject(), isSymbol = requireIsSymbol();
    var NAN = 0 / 0;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = baseTrim(value);
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    toNumber_1 = toNumber;
    return toNumber_1;
  }
  var toFinite_1;
  var hasRequiredToFinite;
  function requireToFinite() {
    if (hasRequiredToFinite) return toFinite_1;
    hasRequiredToFinite = 1;
    var toNumber = requireToNumber();
    var INFINITY = 1 / 0, MAX_INTEGER = 17976931348623157e292;
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    toFinite_1 = toFinite;
    return toFinite_1;
  }
  var toInteger_1;
  var hasRequiredToInteger;
  function requireToInteger() {
    if (hasRequiredToInteger) return toInteger_1;
    hasRequiredToInteger = 1;
    var toFinite = requireToFinite();
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    toInteger_1 = toInteger;
    return toInteger_1;
  }
  var findIndex_1;
  var hasRequiredFindIndex;
  function requireFindIndex() {
    if (hasRequiredFindIndex) return findIndex_1;
    hasRequiredFindIndex = 1;
    var baseFindIndex = require_baseFindIndex(), baseIteratee = require_baseIteratee(), toInteger = requireToInteger();
    var nativeMax = Math.max;
    function findIndex(array, predicate, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = fromIndex == null ? 0 : toInteger(fromIndex);
      if (index < 0) {
        index = nativeMax(length + index, 0);
      }
      return baseFindIndex(array, baseIteratee(predicate, 3), index);
    }
    findIndex_1 = findIndex;
    return findIndex_1;
  }
  var find_1;
  var hasRequiredFind;
  function requireFind() {
    if (hasRequiredFind) return find_1;
    hasRequiredFind = 1;
    var createFind = require_createFind(), findIndex = requireFindIndex();
    var find = createFind(findIndex);
    find_1 = find;
    return find_1;
  }
  var flatten_1;
  var hasRequiredFlatten;
  function requireFlatten() {
    if (hasRequiredFlatten) return flatten_1;
    hasRequiredFlatten = 1;
    var baseFlatten = require_baseFlatten();
    function flatten(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseFlatten(array, 1) : [];
    }
    flatten_1 = flatten;
    return flatten_1;
  }
  var forIn_1;
  var hasRequiredForIn;
  function requireForIn() {
    if (hasRequiredForIn) return forIn_1;
    hasRequiredForIn = 1;
    var baseFor = require_baseFor(), castFunction = require_castFunction(), keysIn = requireKeysIn();
    function forIn(object, iteratee) {
      return object == null ? object : baseFor(object, castFunction(iteratee), keysIn);
    }
    forIn_1 = forIn;
    return forIn_1;
  }
  var last_1;
  var hasRequiredLast;
  function requireLast() {
    if (hasRequiredLast) return last_1;
    hasRequiredLast = 1;
    function last(array) {
      var length = array == null ? 0 : array.length;
      return length ? array[length - 1] : void 0;
    }
    last_1 = last;
    return last_1;
  }
  var mapValues_1;
  var hasRequiredMapValues;
  function requireMapValues() {
    if (hasRequiredMapValues) return mapValues_1;
    hasRequiredMapValues = 1;
    var baseAssignValue = require_baseAssignValue(), baseForOwn = require_baseForOwn(), baseIteratee = require_baseIteratee();
    function mapValues(object, iteratee) {
      var result = {};
      iteratee = baseIteratee(iteratee, 3);
      baseForOwn(object, function(value, key, object2) {
        baseAssignValue(result, key, iteratee(value, key, object2));
      });
      return result;
    }
    mapValues_1 = mapValues;
    return mapValues_1;
  }
  var _baseExtremum;
  var hasRequired_baseExtremum;
  function require_baseExtremum() {
    if (hasRequired_baseExtremum) return _baseExtremum;
    hasRequired_baseExtremum = 1;
    var isSymbol = requireIsSymbol();
    function baseExtremum(array, iteratee, comparator) {
      var index = -1, length = array.length;
      while (++index < length) {
        var value = array[index], current = iteratee(value);
        if (current != null && (computed === void 0 ? current === current && !isSymbol(current) : comparator(current, computed))) {
          var computed = current, result = value;
        }
      }
      return result;
    }
    _baseExtremum = baseExtremum;
    return _baseExtremum;
  }
  var _baseGt;
  var hasRequired_baseGt;
  function require_baseGt() {
    if (hasRequired_baseGt) return _baseGt;
    hasRequired_baseGt = 1;
    function baseGt(value, other) {
      return value > other;
    }
    _baseGt = baseGt;
    return _baseGt;
  }
  var max_1;
  var hasRequiredMax;
  function requireMax() {
    if (hasRequiredMax) return max_1;
    hasRequiredMax = 1;
    var baseExtremum = require_baseExtremum(), baseGt = require_baseGt(), identity = requireIdentity();
    function max(array) {
      return array && array.length ? baseExtremum(array, identity, baseGt) : void 0;
    }
    max_1 = max;
    return max_1;
  }
  var _assignMergeValue;
  var hasRequired_assignMergeValue;
  function require_assignMergeValue() {
    if (hasRequired_assignMergeValue) return _assignMergeValue;
    hasRequired_assignMergeValue = 1;
    var baseAssignValue = require_baseAssignValue(), eq = requireEq();
    function assignMergeValue(object, key, value) {
      if (value !== void 0 && !eq(object[key], value) || value === void 0 && !(key in object)) {
        baseAssignValue(object, key, value);
      }
    }
    _assignMergeValue = assignMergeValue;
    return _assignMergeValue;
  }
  var isPlainObject_1;
  var hasRequiredIsPlainObject;
  function requireIsPlainObject() {
    if (hasRequiredIsPlainObject) return isPlainObject_1;
    hasRequiredIsPlainObject = 1;
    var baseGetTag = require_baseGetTag(), getPrototype = require_getPrototype(), isObjectLike = requireIsObjectLike();
    var objectTag = "[object Object]";
    var funcProto = Function.prototype, objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectCtorString = funcToString.call(Object);
    function isPlainObject(value) {
      if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    }
    isPlainObject_1 = isPlainObject;
    return isPlainObject_1;
  }
  var _safeGet;
  var hasRequired_safeGet;
  function require_safeGet() {
    if (hasRequired_safeGet) return _safeGet;
    hasRequired_safeGet = 1;
    function safeGet(object, key) {
      if (key === "constructor" && typeof object[key] === "function") {
        return;
      }
      if (key == "__proto__") {
        return;
      }
      return object[key];
    }
    _safeGet = safeGet;
    return _safeGet;
  }
  var toPlainObject_1;
  var hasRequiredToPlainObject;
  function requireToPlainObject() {
    if (hasRequiredToPlainObject) return toPlainObject_1;
    hasRequiredToPlainObject = 1;
    var copyObject = require_copyObject(), keysIn = requireKeysIn();
    function toPlainObject(value) {
      return copyObject(value, keysIn(value));
    }
    toPlainObject_1 = toPlainObject;
    return toPlainObject_1;
  }
  var _baseMergeDeep;
  var hasRequired_baseMergeDeep;
  function require_baseMergeDeep() {
    if (hasRequired_baseMergeDeep) return _baseMergeDeep;
    hasRequired_baseMergeDeep = 1;
    var assignMergeValue = require_assignMergeValue(), cloneBuffer = require_cloneBuffer(), cloneTypedArray = require_cloneTypedArray(), copyArray = require_copyArray(), initCloneObject = require_initCloneObject(), isArguments = requireIsArguments(), isArray = requireIsArray(), isArrayLikeObject = requireIsArrayLikeObject(), isBuffer2 = requireIsBuffer(), isFunction = requireIsFunction(), isObject = requireIsObject(), isPlainObject = requireIsPlainObject(), isTypedArray = requireIsTypedArray(), safeGet = require_safeGet(), toPlainObject = requireToPlainObject();
    function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
      var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack.get(srcValue);
      if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
      }
      var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : void 0;
      var isCommon = newValue === void 0;
      if (isCommon) {
        var isArr = isArray(srcValue), isBuff = !isArr && isBuffer2(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
          if (isArray(objValue)) {
            newValue = objValue;
          } else if (isArrayLikeObject(objValue)) {
            newValue = copyArray(objValue);
          } else if (isBuff) {
            isCommon = false;
            newValue = cloneBuffer(srcValue, true);
          } else if (isTyped) {
            isCommon = false;
            newValue = cloneTypedArray(srcValue, true);
          } else {
            newValue = [];
          }
        } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          newValue = objValue;
          if (isArguments(objValue)) {
            newValue = toPlainObject(objValue);
          } else if (!isObject(objValue) || isFunction(objValue)) {
            newValue = initCloneObject(srcValue);
          }
        } else {
          isCommon = false;
        }
      }
      if (isCommon) {
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack["delete"](srcValue);
      }
      assignMergeValue(object, key, newValue);
    }
    _baseMergeDeep = baseMergeDeep;
    return _baseMergeDeep;
  }
  var _baseMerge;
  var hasRequired_baseMerge;
  function require_baseMerge() {
    if (hasRequired_baseMerge) return _baseMerge;
    hasRequired_baseMerge = 1;
    var Stack = require_Stack(), assignMergeValue = require_assignMergeValue(), baseFor = require_baseFor(), baseMergeDeep = require_baseMergeDeep(), isObject = requireIsObject(), keysIn = requireKeysIn(), safeGet = require_safeGet();
    function baseMerge(object, source, srcIndex, customizer, stack) {
      if (object === source) {
        return;
      }
      baseFor(source, function(srcValue, key) {
        stack || (stack = new Stack());
        if (isObject(srcValue)) {
          baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        } else {
          var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack) : void 0;
          if (newValue === void 0) {
            newValue = srcValue;
          }
          assignMergeValue(object, key, newValue);
        }
      }, keysIn);
    }
    _baseMerge = baseMerge;
    return _baseMerge;
  }
  var _createAssigner;
  var hasRequired_createAssigner;
  function require_createAssigner() {
    if (hasRequired_createAssigner) return _createAssigner;
    hasRequired_createAssigner = 1;
    var baseRest = require_baseRest(), isIterateeCall = require_isIterateeCall();
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard = length > 2 ? sources[2] : void 0;
        customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? void 0 : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, index, customizer);
          }
        }
        return object;
      });
    }
    _createAssigner = createAssigner;
    return _createAssigner;
  }
  var merge_1;
  var hasRequiredMerge;
  function requireMerge() {
    if (hasRequiredMerge) return merge_1;
    hasRequiredMerge = 1;
    var baseMerge = require_baseMerge(), createAssigner = require_createAssigner();
    var merge = createAssigner(function(object, source, srcIndex) {
      baseMerge(object, source, srcIndex);
    });
    merge_1 = merge;
    return merge_1;
  }
  var _baseLt;
  var hasRequired_baseLt;
  function require_baseLt() {
    if (hasRequired_baseLt) return _baseLt;
    hasRequired_baseLt = 1;
    function baseLt(value, other) {
      return value < other;
    }
    _baseLt = baseLt;
    return _baseLt;
  }
  var min_1;
  var hasRequiredMin;
  function requireMin() {
    if (hasRequiredMin) return min_1;
    hasRequiredMin = 1;
    var baseExtremum = require_baseExtremum(), baseLt = require_baseLt(), identity = requireIdentity();
    function min(array) {
      return array && array.length ? baseExtremum(array, identity, baseLt) : void 0;
    }
    min_1 = min;
    return min_1;
  }
  var minBy_1;
  var hasRequiredMinBy;
  function requireMinBy() {
    if (hasRequiredMinBy) return minBy_1;
    hasRequiredMinBy = 1;
    var baseExtremum = require_baseExtremum(), baseIteratee = require_baseIteratee(), baseLt = require_baseLt();
    function minBy(array, iteratee) {
      return array && array.length ? baseExtremum(array, baseIteratee(iteratee, 2), baseLt) : void 0;
    }
    minBy_1 = minBy;
    return minBy_1;
  }
  var now_1;
  var hasRequiredNow;
  function requireNow() {
    if (hasRequiredNow) return now_1;
    hasRequiredNow = 1;
    var root2 = require_root();
    var now = function() {
      return root2.Date.now();
    };
    now_1 = now;
    return now_1;
  }
  var _baseSet;
  var hasRequired_baseSet;
  function require_baseSet() {
    if (hasRequired_baseSet) return _baseSet;
    hasRequired_baseSet = 1;
    var assignValue = require_assignValue(), castPath = require_castPath(), isIndex = require_isIndex(), isObject = requireIsObject(), toKey = require_toKey();
    function baseSet(object, path, value, customizer) {
      if (!isObject(object)) {
        return object;
      }
      path = castPath(path, object);
      var index = -1, length = path.length, lastIndex = length - 1, nested = object;
      while (nested != null && ++index < length) {
        var key = toKey(path[index]), newValue = value;
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          return object;
        }
        if (index != lastIndex) {
          var objValue = nested[key];
          newValue = customizer ? customizer(objValue, key, nested) : void 0;
          if (newValue === void 0) {
            newValue = isObject(objValue) ? objValue : isIndex(path[index + 1]) ? [] : {};
          }
        }
        assignValue(nested, key, newValue);
        nested = nested[key];
      }
      return object;
    }
    _baseSet = baseSet;
    return _baseSet;
  }
  var _basePickBy;
  var hasRequired_basePickBy;
  function require_basePickBy() {
    if (hasRequired_basePickBy) return _basePickBy;
    hasRequired_basePickBy = 1;
    var baseGet = require_baseGet(), baseSet = require_baseSet(), castPath = require_castPath();
    function basePickBy(object, paths, predicate) {
      var index = -1, length = paths.length, result = {};
      while (++index < length) {
        var path = paths[index], value = baseGet(object, path);
        if (predicate(value, path)) {
          baseSet(result, castPath(path, object), value);
        }
      }
      return result;
    }
    _basePickBy = basePickBy;
    return _basePickBy;
  }
  var _basePick;
  var hasRequired_basePick;
  function require_basePick() {
    if (hasRequired_basePick) return _basePick;
    hasRequired_basePick = 1;
    var basePickBy = require_basePickBy(), hasIn = requireHasIn();
    function basePick(object, paths) {
      return basePickBy(object, paths, function(value, path) {
        return hasIn(object, path);
      });
    }
    _basePick = basePick;
    return _basePick;
  }
  var _flatRest;
  var hasRequired_flatRest;
  function require_flatRest() {
    if (hasRequired_flatRest) return _flatRest;
    hasRequired_flatRest = 1;
    var flatten = requireFlatten(), overRest = require_overRest(), setToString = require_setToString();
    function flatRest(func) {
      return setToString(overRest(func, void 0, flatten), func + "");
    }
    _flatRest = flatRest;
    return _flatRest;
  }
  var pick_1;
  var hasRequiredPick;
  function requirePick() {
    if (hasRequiredPick) return pick_1;
    hasRequiredPick = 1;
    var basePick = require_basePick(), flatRest = require_flatRest();
    var pick = flatRest(function(object, paths) {
      return object == null ? {} : basePick(object, paths);
    });
    pick_1 = pick;
    return pick_1;
  }
  var _baseRange;
  var hasRequired_baseRange;
  function require_baseRange() {
    if (hasRequired_baseRange) return _baseRange;
    hasRequired_baseRange = 1;
    var nativeCeil = Math.ceil, nativeMax = Math.max;
    function baseRange(start, end, step, fromRight) {
      var index = -1, length = nativeMax(nativeCeil((end - start) / (step || 1)), 0), result = Array(length);
      while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
      }
      return result;
    }
    _baseRange = baseRange;
    return _baseRange;
  }
  var _createRange;
  var hasRequired_createRange;
  function require_createRange() {
    if (hasRequired_createRange) return _createRange;
    hasRequired_createRange = 1;
    var baseRange = require_baseRange(), isIterateeCall = require_isIterateeCall(), toFinite = requireToFinite();
    function createRange(fromRight) {
      return function(start, end, step) {
        if (step && typeof step != "number" && isIterateeCall(start, end, step)) {
          end = step = void 0;
        }
        start = toFinite(start);
        if (end === void 0) {
          end = start;
          start = 0;
        } else {
          end = toFinite(end);
        }
        step = step === void 0 ? start < end ? 1 : -1 : toFinite(step);
        return baseRange(start, end, step, fromRight);
      };
    }
    _createRange = createRange;
    return _createRange;
  }
  var range_1;
  var hasRequiredRange;
  function requireRange() {
    if (hasRequiredRange) return range_1;
    hasRequiredRange = 1;
    var createRange = require_createRange();
    var range = createRange();
    range_1 = range;
    return range_1;
  }
  var _baseSortBy;
  var hasRequired_baseSortBy;
  function require_baseSortBy() {
    if (hasRequired_baseSortBy) return _baseSortBy;
    hasRequired_baseSortBy = 1;
    function baseSortBy(array, comparer) {
      var length = array.length;
      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }
    _baseSortBy = baseSortBy;
    return _baseSortBy;
  }
  var _compareAscending;
  var hasRequired_compareAscending;
  function require_compareAscending() {
    if (hasRequired_compareAscending) return _compareAscending;
    hasRequired_compareAscending = 1;
    var isSymbol = requireIsSymbol();
    function compareAscending(value, other) {
      if (value !== other) {
        var valIsDefined = value !== void 0, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol(value);
        var othIsDefined = other !== void 0, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol(other);
        if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
          return 1;
        }
        if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
          return -1;
        }
      }
      return 0;
    }
    _compareAscending = compareAscending;
    return _compareAscending;
  }
  var _compareMultiple;
  var hasRequired_compareMultiple;
  function require_compareMultiple() {
    if (hasRequired_compareMultiple) return _compareMultiple;
    hasRequired_compareMultiple = 1;
    var compareAscending = require_compareAscending();
    function compareMultiple(object, other, orders) {
      var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
      while (++index < length) {
        var result = compareAscending(objCriteria[index], othCriteria[index]);
        if (result) {
          if (index >= ordersLength) {
            return result;
          }
          var order2 = orders[index];
          return result * (order2 == "desc" ? -1 : 1);
        }
      }
      return object.index - other.index;
    }
    _compareMultiple = compareMultiple;
    return _compareMultiple;
  }
  var _baseOrderBy;
  var hasRequired_baseOrderBy;
  function require_baseOrderBy() {
    if (hasRequired_baseOrderBy) return _baseOrderBy;
    hasRequired_baseOrderBy = 1;
    var arrayMap = require_arrayMap(), baseGet = require_baseGet(), baseIteratee = require_baseIteratee(), baseMap = require_baseMap(), baseSortBy = require_baseSortBy(), baseUnary = require_baseUnary(), compareMultiple = require_compareMultiple(), identity = requireIdentity(), isArray = requireIsArray();
    function baseOrderBy(collection, iteratees, orders) {
      if (iteratees.length) {
        iteratees = arrayMap(iteratees, function(iteratee) {
          if (isArray(iteratee)) {
            return function(value) {
              return baseGet(value, iteratee.length === 1 ? iteratee[0] : iteratee);
            };
          }
          return iteratee;
        });
      } else {
        iteratees = [identity];
      }
      var index = -1;
      iteratees = arrayMap(iteratees, baseUnary(baseIteratee));
      var result = baseMap(collection, function(value, key, collection2) {
        var criteria = arrayMap(iteratees, function(iteratee) {
          return iteratee(value);
        });
        return { "criteria": criteria, "index": ++index, "value": value };
      });
      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }
    _baseOrderBy = baseOrderBy;
    return _baseOrderBy;
  }
  var sortBy_1;
  var hasRequiredSortBy;
  function requireSortBy() {
    if (hasRequiredSortBy) return sortBy_1;
    hasRequiredSortBy = 1;
    var baseFlatten = require_baseFlatten(), baseOrderBy = require_baseOrderBy(), baseRest = require_baseRest(), isIterateeCall = require_isIterateeCall();
    var sortBy = baseRest(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var length = iteratees.length;
      if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
        iteratees = [];
      } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
        iteratees = [iteratees[0]];
      }
      return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
    });
    sortBy_1 = sortBy;
    return sortBy_1;
  }
  var uniqueId_1;
  var hasRequiredUniqueId;
  function requireUniqueId() {
    if (hasRequiredUniqueId) return uniqueId_1;
    hasRequiredUniqueId = 1;
    var toString = requireToString();
    var idCounter = 0;
    function uniqueId(prefix) {
      var id = ++idCounter;
      return toString(prefix) + id;
    }
    uniqueId_1 = uniqueId;
    return uniqueId_1;
  }
  var _baseZipObject;
  var hasRequired_baseZipObject;
  function require_baseZipObject() {
    if (hasRequired_baseZipObject) return _baseZipObject;
    hasRequired_baseZipObject = 1;
    function baseZipObject(props, values, assignFunc) {
      var index = -1, length = props.length, valsLength = values.length, result = {};
      while (++index < length) {
        var value = index < valsLength ? values[index] : void 0;
        assignFunc(result, props[index], value);
      }
      return result;
    }
    _baseZipObject = baseZipObject;
    return _baseZipObject;
  }
  var zipObject_1;
  var hasRequiredZipObject;
  function requireZipObject() {
    if (hasRequiredZipObject) return zipObject_1;
    hasRequiredZipObject = 1;
    var assignValue = require_assignValue(), baseZipObject = require_baseZipObject();
    function zipObject(props, values) {
      return baseZipObject(props || [], values || [], assignValue);
    }
    zipObject_1 = zipObject;
    return zipObject_1;
  }
  var lodash;
  if (typeof commonjsRequire === "function") {
    try {
      lodash = {
        cloneDeep: requireCloneDeep(),
        constant: requireConstant(),
        defaults: requireDefaults(),
        each: requireEach(),
        filter: requireFilter(),
        find: requireFind(),
        flatten: requireFlatten(),
        forEach: requireForEach(),
        forIn: requireForIn(),
        has: requireHas(),
        isUndefined: requireIsUndefined(),
        last: requireLast(),
        map: requireMap(),
        mapValues: requireMapValues(),
        max: requireMax(),
        merge: requireMerge(),
        min: requireMin(),
        minBy: requireMinBy(),
        now: requireNow(),
        pick: requirePick(),
        range: requireRange(),
        reduce: requireReduce(),
        sortBy: requireSortBy(),
        uniqueId: requireUniqueId(),
        values: requireValues(),
        zipObject: requireZipObject()
      };
    } catch (e) {
    }
  }
  if (!lodash) {
    lodash = window._;
  }
  var lodash_1 = lodash;
  var list = List$1;
  function List$1() {
    var sentinel = {};
    sentinel._next = sentinel._prev = sentinel;
    this._sentinel = sentinel;
  }
  List$1.prototype.dequeue = function() {
    var sentinel = this._sentinel;
    var entry = sentinel._prev;
    if (entry !== sentinel) {
      unlink(entry);
      return entry;
    }
  };
  List$1.prototype.enqueue = function(entry) {
    var sentinel = this._sentinel;
    if (entry._prev && entry._next) {
      unlink(entry);
    }
    entry._next = sentinel._next;
    sentinel._next._prev = entry;
    sentinel._next = entry;
    entry._prev = sentinel;
  };
  List$1.prototype.toString = function() {
    var strs = [];
    var sentinel = this._sentinel;
    var curr = sentinel._prev;
    while (curr !== sentinel) {
      strs.push(JSON.stringify(curr, filterOutLinks));
      curr = curr._prev;
    }
    return "[" + strs.join(", ") + "]";
  };
  function unlink(entry) {
    entry._prev._next = entry._next;
    entry._next._prev = entry._prev;
    delete entry._next;
    delete entry._prev;
  }
  function filterOutLinks(k, v) {
    if (k !== "_next" && k !== "_prev") {
      return v;
    }
  }
  var _$n = lodash_1;
  var Graph$7 = graphlib_1.Graph;
  var List = list;
  var greedyFas = greedyFAS$1;
  var DEFAULT_WEIGHT_FN = _$n.constant(1);
  function greedyFAS$1(g, weightFn) {
    if (g.nodeCount() <= 1) {
      return [];
    }
    var state = buildState(g, weightFn || DEFAULT_WEIGHT_FN);
    var results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);
    return _$n.flatten(_$n.map(results, function(e) {
      return g.outEdges(e.v, e.w);
    }), true);
  }
  function doGreedyFAS(g, buckets, zeroIdx) {
    var results = [];
    var sources = buckets[buckets.length - 1];
    var sinks = buckets[0];
    var entry;
    while (g.nodeCount()) {
      while (entry = sinks.dequeue()) {
        removeNode(g, buckets, zeroIdx, entry);
      }
      while (entry = sources.dequeue()) {
        removeNode(g, buckets, zeroIdx, entry);
      }
      if (g.nodeCount()) {
        for (var i = buckets.length - 2; i > 0; --i) {
          entry = buckets[i].dequeue();
          if (entry) {
            results = results.concat(removeNode(g, buckets, zeroIdx, entry, true));
            break;
          }
        }
      }
    }
    return results;
  }
  function removeNode(g, buckets, zeroIdx, entry, collectPredecessors) {
    var results = collectPredecessors ? [] : void 0;
    _$n.forEach(g.inEdges(entry.v), function(edge) {
      var weight = g.edge(edge);
      var uEntry = g.node(edge.v);
      if (collectPredecessors) {
        results.push({ v: edge.v, w: edge.w });
      }
      uEntry.out -= weight;
      assignBucket(buckets, zeroIdx, uEntry);
    });
    _$n.forEach(g.outEdges(entry.v), function(edge) {
      var weight = g.edge(edge);
      var w = edge.w;
      var wEntry = g.node(w);
      wEntry["in"] -= weight;
      assignBucket(buckets, zeroIdx, wEntry);
    });
    g.removeNode(entry.v);
    return results;
  }
  function buildState(g, weightFn) {
    var fasGraph = new Graph$7();
    var maxIn = 0;
    var maxOut = 0;
    _$n.forEach(g.nodes(), function(v) {
      fasGraph.setNode(v, { v, "in": 0, out: 0 });
    });
    _$n.forEach(g.edges(), function(e) {
      var prevWeight = fasGraph.edge(e.v, e.w) || 0;
      var weight = weightFn(e);
      var edgeWeight = prevWeight + weight;
      fasGraph.setEdge(e.v, e.w, edgeWeight);
      maxOut = Math.max(maxOut, fasGraph.node(e.v).out += weight);
      maxIn = Math.max(maxIn, fasGraph.node(e.w)["in"] += weight);
    });
    var buckets = _$n.range(maxOut + maxIn + 3).map(function() {
      return new List();
    });
    var zeroIdx = maxIn + 1;
    _$n.forEach(fasGraph.nodes(), function(v) {
      assignBucket(buckets, zeroIdx, fasGraph.node(v));
    });
    return { graph: fasGraph, buckets, zeroIdx };
  }
  function assignBucket(buckets, zeroIdx, entry) {
    if (!entry.out) {
      buckets[0].enqueue(entry);
    } else if (!entry["in"]) {
      buckets[buckets.length - 1].enqueue(entry);
    } else {
      buckets[entry.out - entry["in"] + zeroIdx].enqueue(entry);
    }
  }
  var _$m = lodash_1;
  var greedyFAS = greedyFas;
  var acyclic$1 = {
    run: run$2,
    undo: undo$2
  };
  function run$2(g) {
    var fas = g.graph().acyclicer === "greedy" ? greedyFAS(g, weightFn(g)) : dfsFAS(g);
    _$m.forEach(fas, function(e) {
      var label = g.edge(e);
      g.removeEdge(e);
      label.forwardName = e.name;
      label.reversed = true;
      g.setEdge(e.w, e.v, label, _$m.uniqueId("rev"));
    });
    function weightFn(g2) {
      return function(e) {
        return g2.edge(e).weight;
      };
    }
  }
  function dfsFAS(g) {
    var fas = [];
    var stack = {};
    var visited = {};
    function dfs2(v) {
      if (_$m.has(visited, v)) {
        return;
      }
      visited[v] = true;
      stack[v] = true;
      _$m.forEach(g.outEdges(v), function(e) {
        if (_$m.has(stack, e.w)) {
          fas.push(e);
        } else {
          dfs2(e.w);
        }
      });
      delete stack[v];
    }
    _$m.forEach(g.nodes(), dfs2);
    return fas;
  }
  function undo$2(g) {
    _$m.forEach(g.edges(), function(e) {
      var label = g.edge(e);
      if (label.reversed) {
        g.removeEdge(e);
        var forwardName = label.forwardName;
        delete label.reversed;
        delete label.forwardName;
        g.setEdge(e.w, e.v, label, forwardName);
      }
    });
  }
  var _$l = lodash_1;
  var Graph$6 = graphlib_1.Graph;
  var util$a = {
    addDummyNode,
    simplify: simplify$1,
    asNonCompoundGraph,
    successorWeights,
    predecessorWeights,
    intersectRect,
    buildLayerMatrix,
    normalizeRanks: normalizeRanks$1,
    removeEmptyRanks: removeEmptyRanks$1,
    addBorderNode: addBorderNode$1,
    maxRank,
    partition,
    time,
    notime
  };
  function addDummyNode(g, type, attrs, name) {
    var v;
    do {
      v = _$l.uniqueId(name);
    } while (g.hasNode(v));
    attrs.dummy = type;
    g.setNode(v, attrs);
    return v;
  }
  function simplify$1(g) {
    var simplified = new Graph$6().setGraph(g.graph());
    _$l.forEach(g.nodes(), function(v) {
      simplified.setNode(v, g.node(v));
    });
    _$l.forEach(g.edges(), function(e) {
      var simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
      var label = g.edge(e);
      simplified.setEdge(e.v, e.w, {
        weight: simpleLabel.weight + label.weight,
        minlen: Math.max(simpleLabel.minlen, label.minlen)
      });
    });
    return simplified;
  }
  function asNonCompoundGraph(g) {
    var simplified = new Graph$6({ multigraph: g.isMultigraph() }).setGraph(g.graph());
    _$l.forEach(g.nodes(), function(v) {
      if (!g.children(v).length) {
        simplified.setNode(v, g.node(v));
      }
    });
    _$l.forEach(g.edges(), function(e) {
      simplified.setEdge(e, g.edge(e));
    });
    return simplified;
  }
  function successorWeights(g) {
    var weightMap = _$l.map(g.nodes(), function(v) {
      var sucs = {};
      _$l.forEach(g.outEdges(v), function(e) {
        sucs[e.w] = (sucs[e.w] || 0) + g.edge(e).weight;
      });
      return sucs;
    });
    return _$l.zipObject(g.nodes(), weightMap);
  }
  function predecessorWeights(g) {
    var weightMap = _$l.map(g.nodes(), function(v) {
      var preds = {};
      _$l.forEach(g.inEdges(v), function(e) {
        preds[e.v] = (preds[e.v] || 0) + g.edge(e).weight;
      });
      return preds;
    });
    return _$l.zipObject(g.nodes(), weightMap);
  }
  function intersectRect(rect, point) {
    var x = rect.x;
    var y = rect.y;
    var dx = point.x - x;
    var dy = point.y - y;
    var w = rect.width / 2;
    var h = rect.height / 2;
    if (!dx && !dy) {
      throw new Error("Not possible to find intersection inside of the rectangle");
    }
    var sx, sy;
    if (Math.abs(dy) * w > Math.abs(dx) * h) {
      if (dy < 0) {
        h = -h;
      }
      sx = h * dx / dy;
      sy = h;
    } else {
      if (dx < 0) {
        w = -w;
      }
      sx = w;
      sy = w * dy / dx;
    }
    return { x: x + sx, y: y + sy };
  }
  function buildLayerMatrix(g) {
    var layering = _$l.map(_$l.range(maxRank(g) + 1), function() {
      return [];
    });
    _$l.forEach(g.nodes(), function(v) {
      var node = g.node(v);
      var rank2 = node.rank;
      if (!_$l.isUndefined(rank2)) {
        layering[rank2][node.order] = v;
      }
    });
    return layering;
  }
  function normalizeRanks$1(g) {
    var min = _$l.min(_$l.map(g.nodes(), function(v) {
      return g.node(v).rank;
    }));
    _$l.forEach(g.nodes(), function(v) {
      var node = g.node(v);
      if (_$l.has(node, "rank")) {
        node.rank -= min;
      }
    });
  }
  function removeEmptyRanks$1(g) {
    var offset = _$l.min(_$l.map(g.nodes(), function(v) {
      return g.node(v).rank;
    }));
    var layers = [];
    _$l.forEach(g.nodes(), function(v) {
      var rank2 = g.node(v).rank - offset;
      if (!layers[rank2]) {
        layers[rank2] = [];
      }
      layers[rank2].push(v);
    });
    var delta = 0;
    var nodeRankFactor = g.graph().nodeRankFactor;
    _$l.forEach(layers, function(vs, i) {
      if (_$l.isUndefined(vs) && i % nodeRankFactor !== 0) {
        --delta;
      } else if (delta) {
        _$l.forEach(vs, function(v) {
          g.node(v).rank += delta;
        });
      }
    });
  }
  function addBorderNode$1(g, prefix, rank2, order2) {
    var node = {
      width: 0,
      height: 0
    };
    if (arguments.length >= 4) {
      node.rank = rank2;
      node.order = order2;
    }
    return addDummyNode(g, "border", node, prefix);
  }
  function maxRank(g) {
    return _$l.max(_$l.map(g.nodes(), function(v) {
      var rank2 = g.node(v).rank;
      if (!_$l.isUndefined(rank2)) {
        return rank2;
      }
    }));
  }
  function partition(collection, fn) {
    var result = { lhs: [], rhs: [] };
    _$l.forEach(collection, function(value) {
      if (fn(value)) {
        result.lhs.push(value);
      } else {
        result.rhs.push(value);
      }
    });
    return result;
  }
  function time(name, fn) {
    var start = _$l.now();
    try {
      return fn();
    } finally {
      console.log(name + " time: " + (_$l.now() - start) + "ms");
    }
  }
  function notime(name, fn) {
    return fn();
  }
  var _$k = lodash_1;
  var util$9 = util$a;
  var normalize$1 = {
    run: run$1,
    undo: undo$1
  };
  function run$1(g) {
    g.graph().dummyChains = [];
    _$k.forEach(g.edges(), function(edge) {
      normalizeEdge(g, edge);
    });
  }
  function normalizeEdge(g, e) {
    var v = e.v;
    var vRank = g.node(v).rank;
    var w = e.w;
    var wRank = g.node(w).rank;
    var name = e.name;
    var edgeLabel = g.edge(e);
    var labelRank = edgeLabel.labelRank;
    if (wRank === vRank + 1) return;
    g.removeEdge(e);
    var dummy, attrs, i;
    for (i = 0, ++vRank; vRank < wRank; ++i, ++vRank) {
      edgeLabel.points = [];
      attrs = {
        width: 0,
        height: 0,
        edgeLabel,
        edgeObj: e,
        rank: vRank
      };
      dummy = util$9.addDummyNode(g, "edge", attrs, "_d");
      if (vRank === labelRank) {
        attrs.width = edgeLabel.width;
        attrs.height = edgeLabel.height;
        attrs.dummy = "edge-label";
        attrs.labelpos = edgeLabel.labelpos;
      }
      g.setEdge(v, dummy, { weight: edgeLabel.weight }, name);
      if (i === 0) {
        g.graph().dummyChains.push(dummy);
      }
      v = dummy;
    }
    g.setEdge(v, w, { weight: edgeLabel.weight }, name);
  }
  function undo$1(g) {
    _$k.forEach(g.graph().dummyChains, function(v) {
      var node = g.node(v);
      var origLabel = node.edgeLabel;
      var w;
      g.setEdge(node.edgeObj, origLabel);
      while (node.dummy) {
        w = g.successors(v)[0];
        g.removeNode(v);
        origLabel.points.push({ x: node.x, y: node.y });
        if (node.dummy === "edge-label") {
          origLabel.x = node.x;
          origLabel.y = node.y;
          origLabel.width = node.width;
          origLabel.height = node.height;
        }
        v = w;
        node = g.node(v);
      }
    });
  }
  var _$j = lodash_1;
  var util$8 = {
    longestPath: longestPath$1,
    slack: slack$2
  };
  function longestPath$1(g) {
    var visited = {};
    function dfs2(v) {
      var label = g.node(v);
      if (_$j.has(visited, v)) {
        return label.rank;
      }
      visited[v] = true;
      var rank2 = _$j.min(_$j.map(g.outEdges(v), function(e) {
        return dfs2(e.w) - g.edge(e).minlen;
      }));
      if (rank2 === Number.POSITIVE_INFINITY || // return value of _.map([]) for Lodash 3
      rank2 === void 0 || // return value of _.map([]) for Lodash 4
      rank2 === null) {
        rank2 = 0;
      }
      return label.rank = rank2;
    }
    _$j.forEach(g.sources(), dfs2);
  }
  function slack$2(g, e) {
    return g.node(e.w).rank - g.node(e.v).rank - g.edge(e).minlen;
  }
  var _$i = lodash_1;
  var Graph$5 = graphlib_1.Graph;
  var slack$1 = util$8.slack;
  var feasibleTree_1 = feasibleTree$2;
  function feasibleTree$2(g) {
    var t = new Graph$5({ directed: false });
    var start = g.nodes()[0];
    var size = g.nodeCount();
    t.setNode(start, {});
    var edge, delta;
    while (tightTree(t, g) < size) {
      edge = findMinSlackEdge(t, g);
      delta = t.hasNode(edge.v) ? slack$1(g, edge) : -slack$1(g, edge);
      shiftRanks(t, g, delta);
    }
    return t;
  }
  function tightTree(t, g) {
    function dfs2(v) {
      _$i.forEach(g.nodeEdges(v), function(e) {
        var edgeV = e.v, w = v === edgeV ? e.w : edgeV;
        if (!t.hasNode(w) && !slack$1(g, e)) {
          t.setNode(w, {});
          t.setEdge(v, w, {});
          dfs2(w);
        }
      });
    }
    _$i.forEach(t.nodes(), dfs2);
    return t.nodeCount();
  }
  function findMinSlackEdge(t, g) {
    return _$i.minBy(g.edges(), function(e) {
      if (t.hasNode(e.v) !== t.hasNode(e.w)) {
        return slack$1(g, e);
      }
    });
  }
  function shiftRanks(t, g, delta) {
    _$i.forEach(t.nodes(), function(v) {
      g.node(v).rank += delta;
    });
  }
  var _$h = lodash_1;
  var feasibleTree$1 = feasibleTree_1;
  var slack = util$8.slack;
  var initRank = util$8.longestPath;
  var preorder = graphlib_1.alg.preorder;
  var postorder$1 = graphlib_1.alg.postorder;
  var simplify = util$a.simplify;
  var networkSimplex_1 = networkSimplex$1;
  networkSimplex$1.initLowLimValues = initLowLimValues;
  networkSimplex$1.initCutValues = initCutValues;
  networkSimplex$1.calcCutValue = calcCutValue;
  networkSimplex$1.leaveEdge = leaveEdge;
  networkSimplex$1.enterEdge = enterEdge;
  networkSimplex$1.exchangeEdges = exchangeEdges;
  function networkSimplex$1(g) {
    g = simplify(g);
    initRank(g);
    var t = feasibleTree$1(g);
    initLowLimValues(t);
    initCutValues(t, g);
    var e, f;
    while (e = leaveEdge(t)) {
      f = enterEdge(t, g, e);
      exchangeEdges(t, g, e, f);
    }
  }
  function initCutValues(t, g) {
    var vs = postorder$1(t, t.nodes());
    vs = vs.slice(0, vs.length - 1);
    _$h.forEach(vs, function(v) {
      assignCutValue(t, g, v);
    });
  }
  function assignCutValue(t, g, child) {
    var childLab = t.node(child);
    var parent = childLab.parent;
    t.edge(child, parent).cutvalue = calcCutValue(t, g, child);
  }
  function calcCutValue(t, g, child) {
    var childLab = t.node(child);
    var parent = childLab.parent;
    var childIsTail = true;
    var graphEdge = g.edge(child, parent);
    var cutValue = 0;
    if (!graphEdge) {
      childIsTail = false;
      graphEdge = g.edge(parent, child);
    }
    cutValue = graphEdge.weight;
    _$h.forEach(g.nodeEdges(child), function(e) {
      var isOutEdge = e.v === child, other = isOutEdge ? e.w : e.v;
      if (other !== parent) {
        var pointsToHead = isOutEdge === childIsTail, otherWeight = g.edge(e).weight;
        cutValue += pointsToHead ? otherWeight : -otherWeight;
        if (isTreeEdge(t, child, other)) {
          var otherCutValue = t.edge(child, other).cutvalue;
          cutValue += pointsToHead ? -otherCutValue : otherCutValue;
        }
      }
    });
    return cutValue;
  }
  function initLowLimValues(tree, root2) {
    if (arguments.length < 2) {
      root2 = tree.nodes()[0];
    }
    dfsAssignLowLim(tree, {}, 1, root2);
  }
  function dfsAssignLowLim(tree, visited, nextLim, v, parent) {
    var low = nextLim;
    var label = tree.node(v);
    visited[v] = true;
    _$h.forEach(tree.neighbors(v), function(w) {
      if (!_$h.has(visited, w)) {
        nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
      }
    });
    label.low = low;
    label.lim = nextLim++;
    if (parent) {
      label.parent = parent;
    } else {
      delete label.parent;
    }
    return nextLim;
  }
  function leaveEdge(tree) {
    return _$h.find(tree.edges(), function(e) {
      return tree.edge(e).cutvalue < 0;
    });
  }
  function enterEdge(t, g, edge) {
    var v = edge.v;
    var w = edge.w;
    if (!g.hasEdge(v, w)) {
      v = edge.w;
      w = edge.v;
    }
    var vLabel = t.node(v);
    var wLabel = t.node(w);
    var tailLabel = vLabel;
    var flip = false;
    if (vLabel.lim > wLabel.lim) {
      tailLabel = wLabel;
      flip = true;
    }
    var candidates = _$h.filter(g.edges(), function(edge2) {
      return flip === isDescendant(t, t.node(edge2.v), tailLabel) && flip !== isDescendant(t, t.node(edge2.w), tailLabel);
    });
    return _$h.minBy(candidates, function(edge2) {
      return slack(g, edge2);
    });
  }
  function exchangeEdges(t, g, e, f) {
    var v = e.v;
    var w = e.w;
    t.removeEdge(v, w);
    t.setEdge(f.v, f.w, {});
    initLowLimValues(t);
    initCutValues(t, g);
    updateRanks(t, g);
  }
  function updateRanks(t, g) {
    var root2 = _$h.find(t.nodes(), function(v) {
      return !g.node(v).parent;
    });
    var vs = preorder(t, root2);
    vs = vs.slice(1);
    _$h.forEach(vs, function(v) {
      var parent = t.node(v).parent, edge = g.edge(v, parent), flipped = false;
      if (!edge) {
        edge = g.edge(parent, v);
        flipped = true;
      }
      g.node(v).rank = g.node(parent).rank + (flipped ? edge.minlen : -edge.minlen);
    });
  }
  function isTreeEdge(tree, u, v) {
    return tree.hasEdge(u, v);
  }
  function isDescendant(tree, vLabel, rootLabel) {
    return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
  }
  var rankUtil = util$8;
  var longestPath = rankUtil.longestPath;
  var feasibleTree = feasibleTree_1;
  var networkSimplex = networkSimplex_1;
  var rank_1 = rank$1;
  function rank$1(g) {
    switch (g.graph().ranker) {
      case "network-simplex":
        networkSimplexRanker(g);
        break;
      case "tight-tree":
        tightTreeRanker(g);
        break;
      case "longest-path":
        longestPathRanker(g);
        break;
      default:
        networkSimplexRanker(g);
    }
  }
  var longestPathRanker = longestPath;
  function tightTreeRanker(g) {
    longestPath(g);
    feasibleTree(g);
  }
  function networkSimplexRanker(g) {
    networkSimplex(g);
  }
  var _$g = lodash_1;
  var parentDummyChains_1 = parentDummyChains$1;
  function parentDummyChains$1(g) {
    var postorderNums = postorder(g);
    _$g.forEach(g.graph().dummyChains, function(v) {
      var node = g.node(v);
      var edgeObj = node.edgeObj;
      var pathData = findPath(g, postorderNums, edgeObj.v, edgeObj.w);
      var path = pathData.path;
      var lca = pathData.lca;
      var pathIdx = 0;
      var pathV = path[pathIdx];
      var ascending = true;
      while (v !== edgeObj.w) {
        node = g.node(v);
        if (ascending) {
          while ((pathV = path[pathIdx]) !== lca && g.node(pathV).maxRank < node.rank) {
            pathIdx++;
          }
          if (pathV === lca) {
            ascending = false;
          }
        }
        if (!ascending) {
          while (pathIdx < path.length - 1 && g.node(pathV = path[pathIdx + 1]).minRank <= node.rank) {
            pathIdx++;
          }
          pathV = path[pathIdx];
        }
        g.setParent(v, pathV);
        v = g.successors(v)[0];
      }
    });
  }
  function findPath(g, postorderNums, v, w) {
    var vPath = [];
    var wPath = [];
    var low = Math.min(postorderNums[v].low, postorderNums[w].low);
    var lim = Math.max(postorderNums[v].lim, postorderNums[w].lim);
    var parent;
    var lca;
    parent = v;
    do {
      parent = g.parent(parent);
      vPath.push(parent);
    } while (parent && (postorderNums[parent].low > low || lim > postorderNums[parent].lim));
    lca = parent;
    parent = w;
    while ((parent = g.parent(parent)) !== lca) {
      wPath.push(parent);
    }
    return { path: vPath.concat(wPath.reverse()), lca };
  }
  function postorder(g) {
    var result = {};
    var lim = 0;
    function dfs2(v) {
      var low = lim;
      _$g.forEach(g.children(v), dfs2);
      result[v] = { low, lim: lim++ };
    }
    _$g.forEach(g.children(), dfs2);
    return result;
  }
  var _$f = lodash_1;
  var util$7 = util$a;
  var nestingGraph$1 = {
    run,
    cleanup
  };
  function run(g) {
    var root2 = util$7.addDummyNode(g, "root", {}, "_root");
    var depths = treeDepths(g);
    var height = _$f.max(_$f.values(depths)) - 1;
    var nodeSep = 2 * height + 1;
    g.graph().nestingRoot = root2;
    _$f.forEach(g.edges(), function(e) {
      g.edge(e).minlen *= nodeSep;
    });
    var weight = sumWeights(g) + 1;
    _$f.forEach(g.children(), function(child) {
      dfs(g, root2, nodeSep, weight, height, depths, child);
    });
    g.graph().nodeRankFactor = nodeSep;
  }
  function dfs(g, root2, nodeSep, weight, height, depths, v) {
    var children = g.children(v);
    if (!children.length) {
      if (v !== root2) {
        g.setEdge(root2, v, { weight: 0, minlen: nodeSep });
      }
      return;
    }
    var top = util$7.addBorderNode(g, "_bt");
    var bottom = util$7.addBorderNode(g, "_bb");
    var label = g.node(v);
    g.setParent(top, v);
    label.borderTop = top;
    g.setParent(bottom, v);
    label.borderBottom = bottom;
    _$f.forEach(children, function(child) {
      dfs(g, root2, nodeSep, weight, height, depths, child);
      var childNode = g.node(child);
      var childTop = childNode.borderTop ? childNode.borderTop : child;
      var childBottom = childNode.borderBottom ? childNode.borderBottom : child;
      var thisWeight = childNode.borderTop ? weight : 2 * weight;
      var minlen = childTop !== childBottom ? 1 : height - depths[v] + 1;
      g.setEdge(top, childTop, {
        weight: thisWeight,
        minlen,
        nestingEdge: true
      });
      g.setEdge(childBottom, bottom, {
        weight: thisWeight,
        minlen,
        nestingEdge: true
      });
    });
    if (!g.parent(v)) {
      g.setEdge(root2, top, { weight: 0, minlen: height + depths[v] });
    }
  }
  function treeDepths(g) {
    var depths = {};
    function dfs2(v, depth) {
      var children = g.children(v);
      if (children && children.length) {
        _$f.forEach(children, function(child) {
          dfs2(child, depth + 1);
        });
      }
      depths[v] = depth;
    }
    _$f.forEach(g.children(), function(v) {
      dfs2(v, 1);
    });
    return depths;
  }
  function sumWeights(g) {
    return _$f.reduce(g.edges(), function(acc, e) {
      return acc + g.edge(e).weight;
    }, 0);
  }
  function cleanup(g) {
    var graphLabel = g.graph();
    g.removeNode(graphLabel.nestingRoot);
    delete graphLabel.nestingRoot;
    _$f.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      if (edge.nestingEdge) {
        g.removeEdge(e);
      }
    });
  }
  var _$e = lodash_1;
  var util$6 = util$a;
  var addBorderSegments_1 = addBorderSegments$1;
  function addBorderSegments$1(g) {
    function dfs2(v) {
      var children = g.children(v);
      var node = g.node(v);
      if (children.length) {
        _$e.forEach(children, dfs2);
      }
      if (_$e.has(node, "minRank")) {
        node.borderLeft = [];
        node.borderRight = [];
        for (var rank2 = node.minRank, maxRank2 = node.maxRank + 1; rank2 < maxRank2; ++rank2) {
          addBorderNode(g, "borderLeft", "_bl", v, node, rank2);
          addBorderNode(g, "borderRight", "_br", v, node, rank2);
        }
      }
    }
    _$e.forEach(g.children(), dfs2);
  }
  function addBorderNode(g, prop, prefix, sg, sgNode, rank2) {
    var label = { width: 0, height: 0, rank: rank2, borderType: prop };
    var prev = sgNode[prop][rank2 - 1];
    var curr = util$6.addDummyNode(g, "border", label, prefix);
    sgNode[prop][rank2] = curr;
    g.setParent(curr, sg);
    if (prev) {
      g.setEdge(prev, curr, { weight: 1 });
    }
  }
  var _$d = lodash_1;
  var coordinateSystem$1 = {
    adjust,
    undo
  };
  function adjust(g) {
    var rankDir = g.graph().rankdir.toLowerCase();
    if (rankDir === "lr" || rankDir === "rl") {
      swapWidthHeight(g);
    }
  }
  function undo(g) {
    var rankDir = g.graph().rankdir.toLowerCase();
    if (rankDir === "bt" || rankDir === "rl") {
      reverseY(g);
    }
    if (rankDir === "lr" || rankDir === "rl") {
      swapXY(g);
      swapWidthHeight(g);
    }
  }
  function swapWidthHeight(g) {
    _$d.forEach(g.nodes(), function(v) {
      swapWidthHeightOne(g.node(v));
    });
    _$d.forEach(g.edges(), function(e) {
      swapWidthHeightOne(g.edge(e));
    });
  }
  function swapWidthHeightOne(attrs) {
    var w = attrs.width;
    attrs.width = attrs.height;
    attrs.height = w;
  }
  function reverseY(g) {
    _$d.forEach(g.nodes(), function(v) {
      reverseYOne(g.node(v));
    });
    _$d.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      _$d.forEach(edge.points, reverseYOne);
      if (_$d.has(edge, "y")) {
        reverseYOne(edge);
      }
    });
  }
  function reverseYOne(attrs) {
    attrs.y = -attrs.y;
  }
  function swapXY(g) {
    _$d.forEach(g.nodes(), function(v) {
      swapXYOne(g.node(v));
    });
    _$d.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      _$d.forEach(edge.points, swapXYOne);
      if (_$d.has(edge, "x")) {
        swapXYOne(edge);
      }
    });
  }
  function swapXYOne(attrs) {
    var x = attrs.x;
    attrs.x = attrs.y;
    attrs.y = x;
  }
  var _$c = lodash_1;
  var initOrder_1 = initOrder$1;
  function initOrder$1(g) {
    var visited = {};
    var simpleNodes = _$c.filter(g.nodes(), function(v) {
      return !g.children(v).length;
    });
    var maxRank2 = _$c.max(_$c.map(simpleNodes, function(v) {
      return g.node(v).rank;
    }));
    var layers = _$c.map(_$c.range(maxRank2 + 1), function() {
      return [];
    });
    function dfs2(v) {
      if (_$c.has(visited, v)) return;
      visited[v] = true;
      var node = g.node(v);
      layers[node.rank].push(v);
      _$c.forEach(g.successors(v), dfs2);
    }
    var orderedVs = _$c.sortBy(simpleNodes, function(v) {
      return g.node(v).rank;
    });
    _$c.forEach(orderedVs, dfs2);
    return layers;
  }
  var _$b = lodash_1;
  var crossCount_1 = crossCount$1;
  function crossCount$1(g, layering) {
    var cc = 0;
    for (var i = 1; i < layering.length; ++i) {
      cc += twoLayerCrossCount(g, layering[i - 1], layering[i]);
    }
    return cc;
  }
  function twoLayerCrossCount(g, northLayer, southLayer) {
    var southPos = _$b.zipObject(
      southLayer,
      _$b.map(southLayer, function(v, i) {
        return i;
      })
    );
    var southEntries = _$b.flatten(_$b.map(northLayer, function(v) {
      return _$b.sortBy(_$b.map(g.outEdges(v), function(e) {
        return { pos: southPos[e.w], weight: g.edge(e).weight };
      }), "pos");
    }), true);
    var firstIndex = 1;
    while (firstIndex < southLayer.length) firstIndex <<= 1;
    var treeSize = 2 * firstIndex - 1;
    firstIndex -= 1;
    var tree = _$b.map(new Array(treeSize), function() {
      return 0;
    });
    var cc = 0;
    _$b.forEach(southEntries.forEach(function(entry) {
      var index = entry.pos + firstIndex;
      tree[index] += entry.weight;
      var weightSum = 0;
      while (index > 0) {
        if (index % 2) {
          weightSum += tree[index + 1];
        }
        index = index - 1 >> 1;
        tree[index] += entry.weight;
      }
      cc += entry.weight * weightSum;
    }));
    return cc;
  }
  var _$a = lodash_1;
  var barycenter_1 = barycenter$1;
  function barycenter$1(g, movable) {
    return _$a.map(movable, function(v) {
      var inV = g.inEdges(v);
      if (!inV.length) {
        return { v };
      } else {
        var result = _$a.reduce(inV, function(acc, e) {
          var edge = g.edge(e), nodeU = g.node(e.v);
          return {
            sum: acc.sum + edge.weight * nodeU.order,
            weight: acc.weight + edge.weight
          };
        }, { sum: 0, weight: 0 });
        return {
          v,
          barycenter: result.sum / result.weight,
          weight: result.weight
        };
      }
    });
  }
  var _$9 = lodash_1;
  var resolveConflicts_1 = resolveConflicts$1;
  function resolveConflicts$1(entries, cg) {
    var mappedEntries = {};
    _$9.forEach(entries, function(entry, i) {
      var tmp = mappedEntries[entry.v] = {
        indegree: 0,
        "in": [],
        out: [],
        vs: [entry.v],
        i
      };
      if (!_$9.isUndefined(entry.barycenter)) {
        tmp.barycenter = entry.barycenter;
        tmp.weight = entry.weight;
      }
    });
    _$9.forEach(cg.edges(), function(e) {
      var entryV = mappedEntries[e.v];
      var entryW = mappedEntries[e.w];
      if (!_$9.isUndefined(entryV) && !_$9.isUndefined(entryW)) {
        entryW.indegree++;
        entryV.out.push(mappedEntries[e.w]);
      }
    });
    var sourceSet = _$9.filter(mappedEntries, function(entry) {
      return !entry.indegree;
    });
    return doResolveConflicts(sourceSet);
  }
  function doResolveConflicts(sourceSet) {
    var entries = [];
    function handleIn(vEntry) {
      return function(uEntry) {
        if (uEntry.merged) {
          return;
        }
        if (_$9.isUndefined(uEntry.barycenter) || _$9.isUndefined(vEntry.barycenter) || uEntry.barycenter >= vEntry.barycenter) {
          mergeEntries(vEntry, uEntry);
        }
      };
    }
    function handleOut(vEntry) {
      return function(wEntry) {
        wEntry["in"].push(vEntry);
        if (--wEntry.indegree === 0) {
          sourceSet.push(wEntry);
        }
      };
    }
    while (sourceSet.length) {
      var entry = sourceSet.pop();
      entries.push(entry);
      _$9.forEach(entry["in"].reverse(), handleIn(entry));
      _$9.forEach(entry.out, handleOut(entry));
    }
    return _$9.map(
      _$9.filter(entries, function(entry2) {
        return !entry2.merged;
      }),
      function(entry2) {
        return _$9.pick(entry2, ["vs", "i", "barycenter", "weight"]);
      }
    );
  }
  function mergeEntries(target, source) {
    var sum = 0;
    var weight = 0;
    if (target.weight) {
      sum += target.barycenter * target.weight;
      weight += target.weight;
    }
    if (source.weight) {
      sum += source.barycenter * source.weight;
      weight += source.weight;
    }
    target.vs = source.vs.concat(target.vs);
    target.barycenter = sum / weight;
    target.weight = weight;
    target.i = Math.min(source.i, target.i);
    source.merged = true;
  }
  var _$8 = lodash_1;
  var util$5 = util$a;
  var sort_1 = sort$1;
  function sort$1(entries, biasRight) {
    var parts = util$5.partition(entries, function(entry) {
      return _$8.has(entry, "barycenter");
    });
    var sortable = parts.lhs, unsortable = _$8.sortBy(parts.rhs, function(entry) {
      return -entry.i;
    }), vs = [], sum = 0, weight = 0, vsIndex = 0;
    sortable.sort(compareWithBias(!!biasRight));
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
    _$8.forEach(sortable, function(entry) {
      vsIndex += entry.vs.length;
      vs.push(entry.vs);
      sum += entry.barycenter * entry.weight;
      weight += entry.weight;
      vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
    });
    var result = { vs: _$8.flatten(vs, true) };
    if (weight) {
      result.barycenter = sum / weight;
      result.weight = weight;
    }
    return result;
  }
  function consumeUnsortable(vs, unsortable, index) {
    var last;
    while (unsortable.length && (last = _$8.last(unsortable)).i <= index) {
      unsortable.pop();
      vs.push(last.vs);
      index++;
    }
    return index;
  }
  function compareWithBias(bias) {
    return function(entryV, entryW) {
      if (entryV.barycenter < entryW.barycenter) {
        return -1;
      } else if (entryV.barycenter > entryW.barycenter) {
        return 1;
      }
      return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
    };
  }
  var _$7 = lodash_1;
  var barycenter = barycenter_1;
  var resolveConflicts = resolveConflicts_1;
  var sort = sort_1;
  var sortSubgraph_1 = sortSubgraph$1;
  function sortSubgraph$1(g, v, cg, biasRight) {
    var movable = g.children(v);
    var node = g.node(v);
    var bl = node ? node.borderLeft : void 0;
    var br = node ? node.borderRight : void 0;
    var subgraphs = {};
    if (bl) {
      movable = _$7.filter(movable, function(w) {
        return w !== bl && w !== br;
      });
    }
    var barycenters = barycenter(g, movable);
    _$7.forEach(barycenters, function(entry) {
      if (g.children(entry.v).length) {
        var subgraphResult = sortSubgraph$1(g, entry.v, cg, biasRight);
        subgraphs[entry.v] = subgraphResult;
        if (_$7.has(subgraphResult, "barycenter")) {
          mergeBarycenters(entry, subgraphResult);
        }
      }
    });
    var entries = resolveConflicts(barycenters, cg);
    expandSubgraphs(entries, subgraphs);
    var result = sort(entries, biasRight);
    if (bl) {
      result.vs = _$7.flatten([bl, result.vs, br], true);
      if (g.predecessors(bl).length) {
        var blPred = g.node(g.predecessors(bl)[0]), brPred = g.node(g.predecessors(br)[0]);
        if (!_$7.has(result, "barycenter")) {
          result.barycenter = 0;
          result.weight = 0;
        }
        result.barycenter = (result.barycenter * result.weight + blPred.order + brPred.order) / (result.weight + 2);
        result.weight += 2;
      }
    }
    return result;
  }
  function expandSubgraphs(entries, subgraphs) {
    _$7.forEach(entries, function(entry) {
      entry.vs = _$7.flatten(entry.vs.map(function(v) {
        if (subgraphs[v]) {
          return subgraphs[v].vs;
        }
        return v;
      }), true);
    });
  }
  function mergeBarycenters(target, other) {
    if (!_$7.isUndefined(target.barycenter)) {
      target.barycenter = (target.barycenter * target.weight + other.barycenter * other.weight) / (target.weight + other.weight);
      target.weight += other.weight;
    } else {
      target.barycenter = other.barycenter;
      target.weight = other.weight;
    }
  }
  var _$6 = lodash_1;
  var Graph$4 = graphlib_1.Graph;
  var buildLayerGraph_1 = buildLayerGraph$1;
  function buildLayerGraph$1(g, rank2, relationship) {
    var root2 = createRootNode(g), result = new Graph$4({ compound: true }).setGraph({ root: root2 }).setDefaultNodeLabel(function(v) {
      return g.node(v);
    });
    _$6.forEach(g.nodes(), function(v) {
      var node = g.node(v), parent = g.parent(v);
      if (node.rank === rank2 || node.minRank <= rank2 && rank2 <= node.maxRank) {
        result.setNode(v);
        result.setParent(v, parent || root2);
        _$6.forEach(g[relationship](v), function(e) {
          var u = e.v === v ? e.w : e.v, edge = result.edge(u, v), weight = !_$6.isUndefined(edge) ? edge.weight : 0;
          result.setEdge(u, v, { weight: g.edge(e).weight + weight });
        });
        if (_$6.has(node, "minRank")) {
          result.setNode(v, {
            borderLeft: node.borderLeft[rank2],
            borderRight: node.borderRight[rank2]
          });
        }
      }
    });
    return result;
  }
  function createRootNode(g) {
    var v;
    while (g.hasNode(v = _$6.uniqueId("_root"))) ;
    return v;
  }
  var _$5 = lodash_1;
  var addSubgraphConstraints_1 = addSubgraphConstraints$1;
  function addSubgraphConstraints$1(g, cg, vs) {
    var prev = {}, rootPrev;
    _$5.forEach(vs, function(v) {
      var child = g.parent(v), parent, prevChild;
      while (child) {
        parent = g.parent(child);
        if (parent) {
          prevChild = prev[parent];
          prev[parent] = child;
        } else {
          prevChild = rootPrev;
          rootPrev = child;
        }
        if (prevChild && prevChild !== child) {
          cg.setEdge(prevChild, child);
          return;
        }
        child = parent;
      }
    });
  }
  var _$4 = lodash_1;
  var initOrder = initOrder_1;
  var crossCount = crossCount_1;
  var sortSubgraph = sortSubgraph_1;
  var buildLayerGraph = buildLayerGraph_1;
  var addSubgraphConstraints = addSubgraphConstraints_1;
  var Graph$3 = graphlib_1.Graph;
  var util$4 = util$a;
  var order_1 = order$1;
  function order$1(g) {
    var maxRank2 = util$4.maxRank(g), downLayerGraphs = buildLayerGraphs(g, _$4.range(1, maxRank2 + 1), "inEdges"), upLayerGraphs = buildLayerGraphs(g, _$4.range(maxRank2 - 1, -1, -1), "outEdges");
    var layering = initOrder(g);
    assignOrder(g, layering);
    var bestCC = Number.POSITIVE_INFINITY, best;
    for (var i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
      sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);
      layering = util$4.buildLayerMatrix(g);
      var cc = crossCount(g, layering);
      if (cc < bestCC) {
        lastBest = 0;
        best = _$4.cloneDeep(layering);
        bestCC = cc;
      }
    }
    assignOrder(g, best);
  }
  function buildLayerGraphs(g, ranks, relationship) {
    return _$4.map(ranks, function(rank2) {
      return buildLayerGraph(g, rank2, relationship);
    });
  }
  function sweepLayerGraphs(layerGraphs, biasRight) {
    var cg = new Graph$3();
    _$4.forEach(layerGraphs, function(lg) {
      var root2 = lg.graph().root;
      var sorted = sortSubgraph(lg, root2, cg, biasRight);
      _$4.forEach(sorted.vs, function(v, i) {
        lg.node(v).order = i;
      });
      addSubgraphConstraints(lg, cg, sorted.vs);
    });
  }
  function assignOrder(g, layering) {
    _$4.forEach(layering, function(layer) {
      _$4.forEach(layer, function(v, i) {
        g.node(v).order = i;
      });
    });
  }
  var _$3 = lodash_1;
  var Graph$2 = graphlib_1.Graph;
  var util$3 = util$a;
  var bk = {
    positionX: positionX$1
  };
  function findType1Conflicts(g, layering) {
    var conflicts = {};
    function visitLayer(prevLayer, layer) {
      var k0 = 0, scanPos = 0, prevLayerLength = prevLayer.length, lastNode = _$3.last(layer);
      _$3.forEach(layer, function(v, i) {
        var w = findOtherInnerSegmentNode(g, v), k1 = w ? g.node(w).order : prevLayerLength;
        if (w || v === lastNode) {
          _$3.forEach(layer.slice(scanPos, i + 1), function(scanNode) {
            _$3.forEach(g.predecessors(scanNode), function(u) {
              var uLabel = g.node(u), uPos = uLabel.order;
              if ((uPos < k0 || k1 < uPos) && !(uLabel.dummy && g.node(scanNode).dummy)) {
                addConflict(conflicts, u, scanNode);
              }
            });
          });
          scanPos = i + 1;
          k0 = k1;
        }
      });
      return layer;
    }
    _$3.reduce(layering, visitLayer);
    return conflicts;
  }
  function findType2Conflicts(g, layering) {
    var conflicts = {};
    function scan(south, southPos, southEnd, prevNorthBorder, nextNorthBorder) {
      var v;
      _$3.forEach(_$3.range(southPos, southEnd), function(i) {
        v = south[i];
        if (g.node(v).dummy) {
          _$3.forEach(g.predecessors(v), function(u) {
            var uNode = g.node(u);
            if (uNode.dummy && (uNode.order < prevNorthBorder || uNode.order > nextNorthBorder)) {
              addConflict(conflicts, u, v);
            }
          });
        }
      });
    }
    function visitLayer(north, south) {
      var prevNorthPos = -1, nextNorthPos, southPos = 0;
      _$3.forEach(south, function(v, southLookahead) {
        if (g.node(v).dummy === "border") {
          var predecessors = g.predecessors(v);
          if (predecessors.length) {
            nextNorthPos = g.node(predecessors[0]).order;
            scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
            southPos = southLookahead;
            prevNorthPos = nextNorthPos;
          }
        }
        scan(south, southPos, south.length, nextNorthPos, north.length);
      });
      return south;
    }
    _$3.reduce(layering, visitLayer);
    return conflicts;
  }
  function findOtherInnerSegmentNode(g, v) {
    if (g.node(v).dummy) {
      return _$3.find(g.predecessors(v), function(u) {
        return g.node(u).dummy;
      });
    }
  }
  function addConflict(conflicts, v, w) {
    if (v > w) {
      var tmp = v;
      v = w;
      w = tmp;
    }
    var conflictsV = conflicts[v];
    if (!conflictsV) {
      conflicts[v] = conflictsV = {};
    }
    conflictsV[w] = true;
  }
  function hasConflict(conflicts, v, w) {
    if (v > w) {
      var tmp = v;
      v = w;
      w = tmp;
    }
    return _$3.has(conflicts[v], w);
  }
  function verticalAlignment(g, layering, conflicts, neighborFn) {
    var root2 = {}, align = {}, pos = {};
    _$3.forEach(layering, function(layer) {
      _$3.forEach(layer, function(v, order2) {
        root2[v] = v;
        align[v] = v;
        pos[v] = order2;
      });
    });
    _$3.forEach(layering, function(layer) {
      var prevIdx = -1;
      _$3.forEach(layer, function(v) {
        var ws = neighborFn(v);
        if (ws.length) {
          ws = _$3.sortBy(ws, function(w2) {
            return pos[w2];
          });
          var mp = (ws.length - 1) / 2;
          for (var i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
            var w = ws[i];
            if (align[v] === v && prevIdx < pos[w] && !hasConflict(conflicts, v, w)) {
              align[w] = v;
              align[v] = root2[v] = root2[w];
              prevIdx = pos[w];
            }
          }
        }
      });
    });
    return { root: root2, align };
  }
  function horizontalCompaction(g, layering, root2, align, reverseSep) {
    var xs = {}, blockG = buildBlockGraph(g, layering, root2, reverseSep), borderType = reverseSep ? "borderLeft" : "borderRight";
    function iterate(setXsFunc, nextNodesFunc) {
      var stack = blockG.nodes();
      var elem = stack.pop();
      var visited = {};
      while (elem) {
        if (visited[elem]) {
          setXsFunc(elem);
        } else {
          visited[elem] = true;
          stack.push(elem);
          stack = stack.concat(nextNodesFunc(elem));
        }
        elem = stack.pop();
      }
    }
    function pass1(elem) {
      xs[elem] = blockG.inEdges(elem).reduce(function(acc, e) {
        return Math.max(acc, xs[e.v] + blockG.edge(e));
      }, 0);
    }
    function pass2(elem) {
      var min = blockG.outEdges(elem).reduce(function(acc, e) {
        return Math.min(acc, xs[e.w] - blockG.edge(e));
      }, Number.POSITIVE_INFINITY);
      var node = g.node(elem);
      if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
        xs[elem] = Math.max(xs[elem], min);
      }
    }
    iterate(pass1, blockG.predecessors.bind(blockG));
    iterate(pass2, blockG.successors.bind(blockG));
    _$3.forEach(align, function(v) {
      xs[v] = xs[root2[v]];
    });
    return xs;
  }
  function buildBlockGraph(g, layering, root2, reverseSep) {
    var blockGraph = new Graph$2(), graphLabel = g.graph(), sepFn = sep(graphLabel.nodesep, graphLabel.edgesep, reverseSep);
    _$3.forEach(layering, function(layer) {
      var u;
      _$3.forEach(layer, function(v) {
        var vRoot = root2[v];
        blockGraph.setNode(vRoot);
        if (u) {
          var uRoot = root2[u], prevMax = blockGraph.edge(uRoot, vRoot);
          blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(g, v, u), prevMax || 0));
        }
        u = v;
      });
    });
    return blockGraph;
  }
  function findSmallestWidthAlignment(g, xss) {
    return _$3.minBy(_$3.values(xss), function(xs) {
      var max = Number.NEGATIVE_INFINITY;
      var min = Number.POSITIVE_INFINITY;
      _$3.forIn(xs, function(x, v) {
        var halfWidth = width(g, v) / 2;
        max = Math.max(x + halfWidth, max);
        min = Math.min(x - halfWidth, min);
      });
      return max - min;
    });
  }
  function alignCoordinates(xss, alignTo) {
    var alignToVals = _$3.values(alignTo), alignToMin = _$3.min(alignToVals), alignToMax = _$3.max(alignToVals);
    _$3.forEach(["u", "d"], function(vert) {
      _$3.forEach(["l", "r"], function(horiz) {
        var alignment = vert + horiz, xs = xss[alignment], delta;
        if (xs === alignTo) return;
        var xsVals = _$3.values(xs);
        delta = horiz === "l" ? alignToMin - _$3.min(xsVals) : alignToMax - _$3.max(xsVals);
        if (delta) {
          xss[alignment] = _$3.mapValues(xs, function(x) {
            return x + delta;
          });
        }
      });
    });
  }
  function balance(xss, align) {
    return _$3.mapValues(xss.ul, function(ignore, v) {
      if (align) {
        return xss[align.toLowerCase()][v];
      } else {
        var xs = _$3.sortBy(_$3.map(xss, v));
        return (xs[1] + xs[2]) / 2;
      }
    });
  }
  function positionX$1(g) {
    var layering = util$3.buildLayerMatrix(g);
    var conflicts = _$3.merge(
      findType1Conflicts(g, layering),
      findType2Conflicts(g, layering)
    );
    var xss = {};
    var adjustedLayering;
    _$3.forEach(["u", "d"], function(vert) {
      adjustedLayering = vert === "u" ? layering : _$3.values(layering).reverse();
      _$3.forEach(["l", "r"], function(horiz) {
        if (horiz === "r") {
          adjustedLayering = _$3.map(adjustedLayering, function(inner) {
            return _$3.values(inner).reverse();
          });
        }
        var neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
        var align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
        var xs = horizontalCompaction(
          g,
          adjustedLayering,
          align.root,
          align.align,
          horiz === "r"
        );
        if (horiz === "r") {
          xs = _$3.mapValues(xs, function(x) {
            return -x;
          });
        }
        xss[vert + horiz] = xs;
      });
    });
    var smallestWidth = findSmallestWidthAlignment(g, xss);
    alignCoordinates(xss, smallestWidth);
    return balance(xss, g.graph().align);
  }
  function sep(nodeSep, edgeSep, reverseSep) {
    return function(g, v, w) {
      var vLabel = g.node(v);
      var wLabel = g.node(w);
      var sum = 0;
      var delta;
      sum += vLabel.width / 2;
      if (_$3.has(vLabel, "labelpos")) {
        switch (vLabel.labelpos.toLowerCase()) {
          case "l":
            delta = -vLabel.width / 2;
            break;
          case "r":
            delta = vLabel.width / 2;
            break;
        }
      }
      if (delta) {
        sum += reverseSep ? delta : -delta;
      }
      delta = 0;
      sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
      sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;
      sum += wLabel.width / 2;
      if (_$3.has(wLabel, "labelpos")) {
        switch (wLabel.labelpos.toLowerCase()) {
          case "l":
            delta = wLabel.width / 2;
            break;
          case "r":
            delta = -wLabel.width / 2;
            break;
        }
      }
      if (delta) {
        sum += reverseSep ? delta : -delta;
      }
      delta = 0;
      return sum;
    };
  }
  function width(g, v) {
    return g.node(v).width;
  }
  var _$2 = lodash_1;
  var util$2 = util$a;
  var positionX = bk.positionX;
  var position_1 = position$1;
  function position$1(g) {
    g = util$2.asNonCompoundGraph(g);
    positionY(g);
    _$2.forEach(positionX(g), function(x, v) {
      g.node(v).x = x;
    });
  }
  function positionY(g) {
    var layering = util$2.buildLayerMatrix(g);
    var rankSep = g.graph().ranksep;
    var prevY = 0;
    _$2.forEach(layering, function(layer) {
      var maxHeight = _$2.max(_$2.map(layer, function(v) {
        return g.node(v).height;
      }));
      _$2.forEach(layer, function(v) {
        g.node(v).y = prevY + maxHeight / 2;
      });
      prevY += maxHeight + rankSep;
    });
  }
  var _$1 = lodash_1;
  var acyclic = acyclic$1;
  var normalize = normalize$1;
  var rank = rank_1;
  var normalizeRanks = util$a.normalizeRanks;
  var parentDummyChains = parentDummyChains_1;
  var removeEmptyRanks = util$a.removeEmptyRanks;
  var nestingGraph = nestingGraph$1;
  var addBorderSegments = addBorderSegments_1;
  var coordinateSystem = coordinateSystem$1;
  var order = order_1;
  var position = position_1;
  var util$1 = util$a;
  var Graph$1 = graphlib_1.Graph;
  var layout_1 = layout;
  function layout(g, opts) {
    var time2 = opts && opts.debugTiming ? util$1.time : util$1.notime;
    time2("layout", function() {
      var layoutGraph = time2("  buildLayoutGraph", function() {
        return buildLayoutGraph(g);
      });
      time2("  runLayout", function() {
        runLayout(layoutGraph, time2);
      });
      time2("  updateInputGraph", function() {
        updateInputGraph(g, layoutGraph);
      });
    });
  }
  function runLayout(g, time2) {
    time2("    makeSpaceForEdgeLabels", function() {
      makeSpaceForEdgeLabels(g);
    });
    time2("    removeSelfEdges", function() {
      removeSelfEdges(g);
    });
    time2("    acyclic", function() {
      acyclic.run(g);
    });
    time2("    nestingGraph.run", function() {
      nestingGraph.run(g);
    });
    time2("    rank", function() {
      rank(util$1.asNonCompoundGraph(g));
    });
    time2("    injectEdgeLabelProxies", function() {
      injectEdgeLabelProxies(g);
    });
    time2("    removeEmptyRanks", function() {
      removeEmptyRanks(g);
    });
    time2("    nestingGraph.cleanup", function() {
      nestingGraph.cleanup(g);
    });
    time2("    normalizeRanks", function() {
      normalizeRanks(g);
    });
    time2("    assignRankMinMax", function() {
      assignRankMinMax(g);
    });
    time2("    removeEdgeLabelProxies", function() {
      removeEdgeLabelProxies(g);
    });
    time2("    normalize.run", function() {
      normalize.run(g);
    });
    time2("    parentDummyChains", function() {
      parentDummyChains(g);
    });
    time2("    addBorderSegments", function() {
      addBorderSegments(g);
    });
    time2("    order", function() {
      order(g);
    });
    time2("    insertSelfEdges", function() {
      insertSelfEdges(g);
    });
    time2("    adjustCoordinateSystem", function() {
      coordinateSystem.adjust(g);
    });
    time2("    position", function() {
      position(g);
    });
    time2("    positionSelfEdges", function() {
      positionSelfEdges(g);
    });
    time2("    removeBorderNodes", function() {
      removeBorderNodes(g);
    });
    time2("    normalize.undo", function() {
      normalize.undo(g);
    });
    time2("    fixupEdgeLabelCoords", function() {
      fixupEdgeLabelCoords(g);
    });
    time2("    undoCoordinateSystem", function() {
      coordinateSystem.undo(g);
    });
    time2("    translateGraph", function() {
      translateGraph(g);
    });
    time2("    assignNodeIntersects", function() {
      assignNodeIntersects(g);
    });
    time2("    reversePoints", function() {
      reversePointsForReversedEdges(g);
    });
    time2("    acyclic.undo", function() {
      acyclic.undo(g);
    });
  }
  function updateInputGraph(inputGraph, layoutGraph) {
    _$1.forEach(inputGraph.nodes(), function(v) {
      var inputLabel = inputGraph.node(v);
      var layoutLabel = layoutGraph.node(v);
      if (inputLabel) {
        inputLabel.x = layoutLabel.x;
        inputLabel.y = layoutLabel.y;
        if (layoutGraph.children(v).length) {
          inputLabel.width = layoutLabel.width;
          inputLabel.height = layoutLabel.height;
        }
      }
    });
    _$1.forEach(inputGraph.edges(), function(e) {
      var inputLabel = inputGraph.edge(e);
      var layoutLabel = layoutGraph.edge(e);
      inputLabel.points = layoutLabel.points;
      if (_$1.has(layoutLabel, "x")) {
        inputLabel.x = layoutLabel.x;
        inputLabel.y = layoutLabel.y;
      }
    });
    inputGraph.graph().width = layoutGraph.graph().width;
    inputGraph.graph().height = layoutGraph.graph().height;
  }
  var graphNumAttrs = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
  var graphDefaults = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "tb" };
  var graphAttrs = ["acyclicer", "ranker", "rankdir", "align"];
  var nodeNumAttrs = ["width", "height"];
  var nodeDefaults = { width: 0, height: 0 };
  var edgeNumAttrs = ["minlen", "weight", "width", "height", "labeloffset"];
  var edgeDefaults = {
    minlen: 1,
    weight: 1,
    width: 0,
    height: 0,
    labeloffset: 10,
    labelpos: "r"
  };
  var edgeAttrs = ["labelpos"];
  function buildLayoutGraph(inputGraph) {
    var g = new Graph$1({ multigraph: true, compound: true });
    var graph2 = canonicalize(inputGraph.graph());
    g.setGraph(_$1.merge(
      {},
      graphDefaults,
      selectNumberAttrs(graph2, graphNumAttrs),
      _$1.pick(graph2, graphAttrs)
    ));
    _$1.forEach(inputGraph.nodes(), function(v) {
      var node = canonicalize(inputGraph.node(v));
      g.setNode(v, _$1.defaults(selectNumberAttrs(node, nodeNumAttrs), nodeDefaults));
      g.setParent(v, inputGraph.parent(v));
    });
    _$1.forEach(inputGraph.edges(), function(e) {
      var edge = canonicalize(inputGraph.edge(e));
      g.setEdge(e, _$1.merge(
        {},
        edgeDefaults,
        selectNumberAttrs(edge, edgeNumAttrs),
        _$1.pick(edge, edgeAttrs)
      ));
    });
    return g;
  }
  function makeSpaceForEdgeLabels(g) {
    var graph2 = g.graph();
    graph2.ranksep /= 2;
    _$1.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      edge.minlen *= 2;
      if (edge.labelpos.toLowerCase() !== "c") {
        if (graph2.rankdir === "TB" || graph2.rankdir === "BT") {
          edge.width += edge.labeloffset;
        } else {
          edge.height += edge.labeloffset;
        }
      }
    });
  }
  function injectEdgeLabelProxies(g) {
    _$1.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      if (edge.width && edge.height) {
        var v = g.node(e.v);
        var w = g.node(e.w);
        var label = { rank: (w.rank - v.rank) / 2 + v.rank, e };
        util$1.addDummyNode(g, "edge-proxy", label, "_ep");
      }
    });
  }
  function assignRankMinMax(g) {
    var maxRank2 = 0;
    _$1.forEach(g.nodes(), function(v) {
      var node = g.node(v);
      if (node.borderTop) {
        node.minRank = g.node(node.borderTop).rank;
        node.maxRank = g.node(node.borderBottom).rank;
        maxRank2 = _$1.max(maxRank2, node.maxRank);
      }
    });
    g.graph().maxRank = maxRank2;
  }
  function removeEdgeLabelProxies(g) {
    _$1.forEach(g.nodes(), function(v) {
      var node = g.node(v);
      if (node.dummy === "edge-proxy") {
        g.edge(node.e).labelRank = node.rank;
        g.removeNode(v);
      }
    });
  }
  function translateGraph(g) {
    var minX = Number.POSITIVE_INFINITY;
    var maxX = 0;
    var minY = Number.POSITIVE_INFINITY;
    var maxY = 0;
    var graphLabel = g.graph();
    var marginX = graphLabel.marginx || 0;
    var marginY = graphLabel.marginy || 0;
    function getExtremes(attrs) {
      var x = attrs.x;
      var y = attrs.y;
      var w = attrs.width;
      var h = attrs.height;
      minX = Math.min(minX, x - w / 2);
      maxX = Math.max(maxX, x + w / 2);
      minY = Math.min(minY, y - h / 2);
      maxY = Math.max(maxY, y + h / 2);
    }
    _$1.forEach(g.nodes(), function(v) {
      getExtremes(g.node(v));
    });
    _$1.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      if (_$1.has(edge, "x")) {
        getExtremes(edge);
      }
    });
    minX -= marginX;
    minY -= marginY;
    _$1.forEach(g.nodes(), function(v) {
      var node = g.node(v);
      node.x -= minX;
      node.y -= minY;
    });
    _$1.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      _$1.forEach(edge.points, function(p) {
        p.x -= minX;
        p.y -= minY;
      });
      if (_$1.has(edge, "x")) {
        edge.x -= minX;
      }
      if (_$1.has(edge, "y")) {
        edge.y -= minY;
      }
    });
    graphLabel.width = maxX - minX + marginX;
    graphLabel.height = maxY - minY + marginY;
  }
  function assignNodeIntersects(g) {
    _$1.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      var nodeV = g.node(e.v);
      var nodeW = g.node(e.w);
      var p1, p2;
      if (!edge.points) {
        edge.points = [];
        p1 = nodeW;
        p2 = nodeV;
      } else {
        p1 = edge.points[0];
        p2 = edge.points[edge.points.length - 1];
      }
      edge.points.unshift(util$1.intersectRect(nodeV, p1));
      edge.points.push(util$1.intersectRect(nodeW, p2));
    });
  }
  function fixupEdgeLabelCoords(g) {
    _$1.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      if (_$1.has(edge, "x")) {
        if (edge.labelpos === "l" || edge.labelpos === "r") {
          edge.width -= edge.labeloffset;
        }
        switch (edge.labelpos) {
          case "l":
            edge.x -= edge.width / 2 + edge.labeloffset;
            break;
          case "r":
            edge.x += edge.width / 2 + edge.labeloffset;
            break;
        }
      }
    });
  }
  function reversePointsForReversedEdges(g) {
    _$1.forEach(g.edges(), function(e) {
      var edge = g.edge(e);
      if (edge.reversed) {
        edge.points.reverse();
      }
    });
  }
  function removeBorderNodes(g) {
    _$1.forEach(g.nodes(), function(v) {
      if (g.children(v).length) {
        var node = g.node(v);
        var t = g.node(node.borderTop);
        var b = g.node(node.borderBottom);
        var l = g.node(_$1.last(node.borderLeft));
        var r = g.node(_$1.last(node.borderRight));
        node.width = Math.abs(r.x - l.x);
        node.height = Math.abs(b.y - t.y);
        node.x = l.x + node.width / 2;
        node.y = t.y + node.height / 2;
      }
    });
    _$1.forEach(g.nodes(), function(v) {
      if (g.node(v).dummy === "border") {
        g.removeNode(v);
      }
    });
  }
  function removeSelfEdges(g) {
    _$1.forEach(g.edges(), function(e) {
      if (e.v === e.w) {
        var node = g.node(e.v);
        if (!node.selfEdges) {
          node.selfEdges = [];
        }
        node.selfEdges.push({ e, label: g.edge(e) });
        g.removeEdge(e);
      }
    });
  }
  function insertSelfEdges(g) {
    var layers = util$1.buildLayerMatrix(g);
    _$1.forEach(layers, function(layer) {
      var orderShift = 0;
      _$1.forEach(layer, function(v, i) {
        var node = g.node(v);
        node.order = i + orderShift;
        _$1.forEach(node.selfEdges, function(selfEdge) {
          util$1.addDummyNode(g, "selfedge", {
            width: selfEdge.label.width,
            height: selfEdge.label.height,
            rank: node.rank,
            order: i + ++orderShift,
            e: selfEdge.e,
            label: selfEdge.label
          }, "_se");
        });
        delete node.selfEdges;
      });
    });
  }
  function positionSelfEdges(g) {
    _$1.forEach(g.nodes(), function(v) {
      var node = g.node(v);
      if (node.dummy === "selfedge") {
        var selfNode = g.node(node.e.v);
        var x = selfNode.x + selfNode.width / 2;
        var y = selfNode.y;
        var dx = node.x - x;
        var dy = selfNode.height / 2;
        g.setEdge(node.e, node.label);
        g.removeNode(v);
        node.label.points = [
          { x: x + 2 * dx / 3, y: y - dy },
          { x: x + 5 * dx / 6, y: y - dy },
          { x: x + dx, y },
          { x: x + 5 * dx / 6, y: y + dy },
          { x: x + 2 * dx / 3, y: y + dy }
        ];
        node.label.x = node.x;
        node.label.y = node.y;
      }
    });
  }
  function selectNumberAttrs(obj, attrs) {
    return _$1.mapValues(_$1.pick(obj, attrs), Number);
  }
  function canonicalize(attrs) {
    var newAttrs = {};
    _$1.forEach(attrs, function(v, k) {
      newAttrs[k.toLowerCase()] = v;
    });
    return newAttrs;
  }
  var _ = lodash_1;
  var util = util$a;
  var Graph = graphlib_1.Graph;
  var debug = {
    debugOrdering
  };
  function debugOrdering(g) {
    var layerMatrix = util.buildLayerMatrix(g);
    var h = new Graph({ compound: true, multigraph: true }).setGraph({});
    _.forEach(g.nodes(), function(v) {
      h.setNode(v, { label: v });
      h.setParent(v, "layer" + g.node(v).rank);
    });
    _.forEach(g.edges(), function(e) {
      h.setEdge(e.v, e.w, {}, e.name);
    });
    _.forEach(layerMatrix, function(layer, i) {
      var layerV = "layer" + i;
      h.setNode(layerV, { rank: "same" });
      _.reduce(layer, function(u, v) {
        h.setEdge(u, v, { style: "invis" });
        return v;
      });
    });
    return h;
  }
  var version = "0.8.5";
  var dagre = {
    graphlib: graphlib_1,
    layout: layout_1,
    debug,
    util: {
      time: util$a.time,
      notime: util$a.notime
    },
    version
  };
  const dagre$1 = /* @__PURE__ */ getDefaultExportFromCjs(dagre);
  var DEFAULT_OPTIONS$1 = {
    algorithm: "dagre",
    direction: "TB",
    nodeSpacing: 50,
    rankSpacing: 70,
    marginX: 50,
    marginY: 50
  };
  function autoLayout(diagram, options = {}) {
    const cleanOptions = Object.fromEntries(
      Object.entries(options).filter(([, v]) => v !== void 0)
    );
    const opts = { ...DEFAULT_OPTIONS$1, ...cleanOptions };
    if (opts.algorithm === "none") {
      return diagram;
    }
    if (opts.algorithm === "elk") {
      console.warn("ELK layout not implemented, falling back to Dagre");
    }
    return applyDagreLayout(diagram, opts);
  }
  function applyDagreLayout(diagram, options) {
    try {
      const g = new dagre$1.graphlib.Graph();
      g.setGraph({
        rankdir: options.direction,
        nodesep: options.nodeSpacing,
        ranksep: options.rankSpacing,
        marginx: options.marginX,
        marginy: options.marginY
      });
      g.setDefaultEdgeLabel(() => ({}));
      for (const node of diagram.nodes) {
        const size = node.size || getDefaultNodeSize(node.shape);
        g.setNode(node.id, {
          width: size.width,
          height: size.height,
          label: node.label
        });
      }
      for (const edge of diagram.edges) {
        g.setEdge(edge.source, edge.target);
      }
      dagre$1.layout(g);
      const layoutedNodes = diagram.nodes.map((node) => {
        const dagreNode = g.node(node.id);
        if (!dagreNode) {
          throw new Error(`Node ${node.id} not found in dagre graph`);
        }
        if (isNaN(dagreNode.x) || isNaN(dagreNode.y)) {
          throw new Error(`Node ${node.id} has invalid position`);
        }
        const size = node.size || getDefaultNodeSize(node.shape);
        return {
          ...node,
          position: {
            x: Math.round(dagreNode.x - size.width / 2),
            y: Math.round(dagreNode.y - size.height / 2)
          },
          size
        };
      });
      const layoutedEdges = diagram.edges.map((edge) => {
        const dagreEdge = g.edge(edge.source, edge.target);
        if (!dagreEdge || !dagreEdge.points) {
          return edge;
        }
        const waypoints = dagreEdge.points.slice(1, -1).map((p) => ({
          x: Math.round(p.x),
          y: Math.round(p.y)
        }));
        return {
          ...edge,
          waypoints: waypoints.length > 0 ? waypoints : void 0
        };
      });
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const node of layoutedNodes) {
        if (node.position && node.size) {
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + node.size.width);
          maxY = Math.max(maxY, node.position.y + node.size.height);
        }
      }
      return {
        ...diagram,
        nodes: layoutedNodes,
        edges: layoutedEdges,
        viewport: {
          width: maxX - minX + options.marginX * 2,
          height: maxY - minY + options.marginY * 2
        }
      };
    } catch (layoutError) {
      console.warn("Dagre layout failed, using simple layout:", layoutError);
      return applySimpleLayout(diagram, options);
    }
  }
  function getDefaultNodeSize(shape) {
    switch (shape) {
      case "circle":
        return { width: 80, height: 80 };
      case "diamond":
        return { width: 100, height: 80 };
      case "cylinder":
        return { width: 80, height: 100 };
      case "actor":
        return { width: 50, height: 80 };
      case "hexagon":
        return { width: 120, height: 80 };
      default:
        return { width: 150, height: 60 };
    }
  }
  function applySimpleLayout(diagram, options) {
    const isHorizontal = options.direction === "LR" || options.direction === "RL";
    const spacing = options.nodeSpacing + 100;
    const layoutedNodes = diagram.nodes.map((node, index) => {
      const size = node.size || getDefaultNodeSize(node.shape);
      const col = isHorizontal ? index : index % 3;
      const row = isHorizontal ? 0 : Math.floor(index / 3);
      return {
        ...node,
        position: {
          x: Math.round(options.marginX + col * spacing),
          y: Math.round(options.marginY + row * spacing)
        },
        size
      };
    });
    let maxX = 0, maxY = 0;
    for (const node of layoutedNodes) {
      if (node.position && node.size) {
        maxX = Math.max(maxX, node.position.x + node.size.width);
        maxY = Math.max(maxY, node.position.y + node.size.height);
      }
    }
    return {
      ...diagram,
      nodes: layoutedNodes,
      edges: diagram.edges,
      viewport: {
        width: maxX + options.marginX,
        height: maxY + options.marginY
      }
    };
  }
  var parsers = {
    mermaid: parseMermaid,
    drawio: parseDrawio,
    excalidraw: parseExcalidraw,
    plantuml: parsePlantUML,
    dot: parseDot
  };
  var generators = {
    mermaid: generateMermaid,
    drawio: generateDrawio,
    excalidraw: generateExcalidraw,
    plantuml: generatePlantUML,
    dot: generateDot,
    svg: generateSvg,
    png: generatePng
  };
  function applyTextOptions(diagram, options) {
    if (!options.text) return diagram;
    const { transliterate, maxLength, escapeSpecial } = options.text;
    const targetFormat = options.to;
    const transformedNodes = diagram.nodes.map((node) => {
      let label = node.label;
      if (transliterate && hasCyrillic(label)) {
        label = transliterateCyrillic(label);
      }
      if (maxLength && label.length > maxLength) {
        label = label.slice(0, maxLength - 3) + "...";
      }
      if (escapeSpecial !== false) {
        label = encodeText(label, targetFormat, { escapeSpecial });
      }
      return label !== node.label ? { ...node, label } : node;
    });
    const transformedEdges = diagram.edges.map((edge) => {
      if (!edge.label) return edge;
      let label = edge.label;
      if (transliterate && hasCyrillic(label)) {
        label = transliterateCyrillic(label);
      }
      if (maxLength && label.length > maxLength) {
        label = label.slice(0, maxLength - 3) + "...";
      }
      if (escapeSpecial !== false) {
        label = encodeText(label, targetFormat, { escapeSpecial });
      }
      return label !== edge.label ? { ...edge, label } : edge;
    });
    const transformedGroups = diagram.groups.map((group) => {
      if (!group.label) return group;
      let label = group.label;
      if (transliterate && hasCyrillic(label)) {
        label = transliterateCyrillic(label);
      }
      if (maxLength && label.length > maxLength) {
        label = label.slice(0, maxLength - 3) + "...";
      }
      return label !== group.label ? { ...group, label } : group;
    });
    return {
      ...diagram,
      nodes: transformedNodes,
      edges: transformedEdges,
      groups: transformedGroups
    };
  }
  function convert(source, options) {
    const warnings = [];
    const errors = [];
    const parser = parsers[options.from];
    if (!parser) {
      throw new Error(`Unsupported input format: ${options.from}`);
    }
    let diagram;
    try {
      diagram = parser(source);
    } catch (error) {
      throw new Error(`Failed to parse ${options.from}: ${error}`);
    }
    if (options.layout && options.layout.algorithm !== "none") {
      diagram = autoLayout(diagram, {
        algorithm: options.layout.algorithm,
        direction: options.layout.direction,
        nodeSpacing: options.layout.nodeSpacing,
        rankSpacing: options.layout.rankSpacing
      });
    }
    if (options.text) {
      diagram = applyTextOptions(diagram, options);
    }
    const generator = generators[options.to];
    if (!generator) {
      throw new Error(`Unsupported output format: ${options.to}`);
    }
    let output;
    try {
      output = generator(diagram);
    } catch (error) {
      throw new Error(`Failed to generate ${options.to}: ${error}`);
    }
    return {
      output,
      diagram,
      warnings: warnings.length > 0 ? warnings : void 0,
      errors: errors.length > 0 ? errors : void 0
    };
  }
  const DEFAULT_OPTIONS = {
    targetFormat: "mermaid",
    embedAsCodeBlocks: true,
    keepOriginalOnError: true,
    includePngFallback: true
  };
  function extractDiagramFromMacro(element) {
    var _a, _b, _c;
    const macroName = element.getAttribute("data-macro-name") || "";
    const classList = element.classList;
    if (macroName === "drawio" || classList.contains("drawio-macro") || classList.contains("drawio-diagram")) {
      const name = element.getAttribute("data-diagram-name") || ((_a = element.dataset) == null ? void 0 : _a.diagramName) || "diagram";
      const content = element.getAttribute("data-diagram-content") || ((_b = element.querySelector("[data-diagram-content]")) == null ? void 0 : _b.getAttribute("data-diagram-content")) || "";
      return {
        format: "drawio",
        name,
        content,
        sourceElement: element
      };
    }
    if (macroName === "gliffy" || classList.contains("gliffy-macro") || classList.contains("gliffy-diagram")) {
      const name = element.getAttribute("data-diagram-name") || ((_c = element.dataset) == null ? void 0 : _c.diagramName) || "diagram";
      return {
        format: "gliffy",
        name,
        content: "",
        sourceElement: element
      };
    }
    if (macroName === "plantuml" || classList.contains("plantuml-macro")) {
      const content = element.textContent || "";
      return {
        format: "plantuml",
        name: "plantuml-diagram",
        content,
        sourceElement: element
      };
    }
    if (macroName === "mermaid" || classList.contains("mermaid-macro")) {
      const content = element.textContent || "";
      return {
        format: "mermaid",
        name: "mermaid-diagram",
        content,
        sourceElement: element
      };
    }
    return null;
  }
  function convertDiagram(content, fromFormat, toFormat) {
    if (fromFormat === "unknown" || fromFormat === "gliffy") {
      return null;
    }
    if (toFormat === "original") {
      return null;
    }
    const inputFormat = fromFormat;
    const outputFormat = toFormat;
    try {
      return convert(content, {
        from: inputFormat,
        to: outputFormat,
        layout: {
          algorithm: "dagre",
          direction: "TB"
        }
      });
    } catch (error) {
      return null;
    }
  }
  function processDiagram(info, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const result = {
      name: info.name,
      originalFormat: info.format,
      targetFormat: opts.targetFormat
    };
    if (opts.targetFormat === "original" || info.format === "unknown") {
      result.fileContent = info.content;
      result.fileExtension = getFileExtension(info.format);
      return result;
    }
    if (info.content) {
      const converted = convertDiagram(info.content, info.format, opts.targetFormat);
      if (converted) {
        result.code = converted.output;
        result.warnings = converted.warnings;
        if (opts.targetFormat === "mermaid" && opts.embedAsCodeBlocks) {
          result.code = converted.output;
        } else {
          result.fileContent = converted.output;
          result.fileExtension = getFileExtension(opts.targetFormat);
        }
      } else if (opts.keepOriginalOnError) {
        result.fileContent = info.content;
        result.fileExtension = getFileExtension(info.format);
        result.error = "Conversion failed, keeping original format";
      } else {
        result.error = "Conversion failed";
      }
    } else {
      result.error = "No diagram content available";
    }
    return result;
  }
  function generateMermaidCodeBlock(code, title) {
    const header = title ? `%% ${title}
` : "";
    return `\`\`\`mermaid
${header}${code.trim()}
\`\`\``;
  }
  function getFileExtension(format) {
    switch (format) {
      case "drawio":
        return "drawio";
      case "mermaid":
        return "md";
      case "plantuml":
        return "puml";
      case "excalidraw":
        return "excalidraw";
      case "gliffy":
        return "gliffy";
      default:
        return "txt";
    }
  }
  const BASE_SELECTORS_TO_REMOVE = [
    "#likes-and-labels-container",
    "#likes-section",
    "#labels-section",
    ".page-metadata-modification-info",
    "#children-section",
    ".plugin_pagetree",
    ".content-action",
    ".page-header-actions",
    ".contributors",
    "script",
    "style",
    ".expand-control",
    ".aui-expander-trigger"
  ];
  const DIAGRAM_SELECTORS = [
    '[data-macro-name="drawio"]',
    '[data-macro-name="drawio-sketch"]',
    ".drawio-macro",
    ".drawio-diagram",
    '.conf-macro[data-macro-name="drawio"]',
    '.conf-macro[data-macro-name="drawio-sketch"]',
    '[data-macro-name="gliffy"]',
    ".gliffy-macro",
    ".gliffy-diagram"
  ].join(", ");
  function extractDiagramNameFromScript(el) {
    const script = el.querySelector("script");
    if (!(script == null ? void 0 : script.textContent)) return "";
    const nameMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*decodeURIComponent\(['"]([^'"]+)['"]\)/);
    if (nameMatch) {
      try {
        return decodeURIComponent(nameMatch[1]);
      } catch {
        return nameMatch[1];
      }
    }
    const simpleMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*['"]([^'"]+)['"]/);
    if (simpleMatch) return simpleMatch[1];
    return "";
  }
  function sanitizeHtml(html, options, pageId) {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll(".aui-expander-content, .expand-content").forEach((el) => {
      el.style.display = "block";
      el.removeAttribute("aria-hidden");
      const expander = el.closest(".aui-expander-container, .expand-container");
      if (expander) {
        expander.classList.remove("collapsed");
        expander.classList.add("expanded");
      }
    });
    doc.querySelectorAll(DIAGRAM_SELECTORS).forEach((el, index) => {
      const htmlEl = el;
      let name = htmlEl.dataset.diagramName || htmlEl.getAttribute("data-diagram-name") || htmlEl.getAttribute("data-extracted-diagram-name") || "";
      if (!name) {
        name = extractDiagramNameFromScript(htmlEl);
      }
      if (name) {
        htmlEl.setAttribute("data-extracted-diagram-name", name);
      }
      htmlEl.setAttribute("data-diagram-index", String(index));
      const marker = doc.createElement("span");
      marker.style.display = "none";
      marker.setAttribute("data-diagram-marker", "true");
      marker.textContent = `DIAGRAM:${name || `diagram-${index + 1}`}`;
      htmlEl.appendChild(marker);
    });
    BASE_SELECTORS_TO_REMOVE.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((el) => el.remove());
    });
    if (!options.includeComments) {
      doc.querySelectorAll("#comments-section, .comment-thread, .inline-comment").forEach((el) => {
        el.remove();
      });
    }
    if (!options.includeImages) {
      doc.querySelectorAll("img, .confluence-embedded-image, .image-wrap").forEach((el) => {
        el.remove();
      });
    } else {
      doc.querySelectorAll("img").forEach((img) => {
        var _a, _b;
        if (!((_a = img.alt) == null ? void 0 : _a.trim())) {
          const src = img.src || "";
          const filename = ((_b = src.split("/").pop()) == null ? void 0 : _b.split("?")[0]) || "image";
          img.alt = `[Image: ${filename}]`;
        }
      });
    }
    return doc.body.innerHTML;
  }
  let turndownInstance = null;
  let obsidianTurndownInstance = null;
  let diagramConvertInstance = null;
  function getTurndown(options) {
    const useObsidian = (options == null ? void 0 : options.useObsidianCallouts) ?? false;
    const convertDiagrams = (options == null ? void 0 : options.convertDiagrams) ?? false;
    const diagramTarget = (options == null ? void 0 : options.diagramTargetFormat) ?? "mermaid";
    const embedAsCode = (options == null ? void 0 : options.embedDiagramsAsCode) ?? true;
    if (useObsidian && !convertDiagrams && obsidianTurndownInstance) return obsidianTurndownInstance;
    if (!useObsidian && !convertDiagrams && turndownInstance) return turndownInstance;
    if (convertDiagrams && diagramConvertInstance) return diagramConvertInstance;
    const instance = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*"
    });
    instance.use(gfm);
    if (useObsidian) {
      instance.addRule("confluenceMacrosObsidian", {
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return false;
          return node.classList.contains("confluence-information-macro") || node.tagName === "DIV" && node.dataset.macroName === "panel";
        },
        replacement: (_content, node) => {
          var _a, _b, _c;
          const el = node;
          let type = "info";
          const macroName = el.dataset.macroName || "";
          if (macroName.includes("note") || el.classList.contains("confluence-information-macro-note")) {
            type = "note";
          } else if (macroName.includes("tip") || el.classList.contains("confluence-information-macro-tip")) {
            type = "tip";
          } else if (macroName.includes("warning") || el.classList.contains("confluence-information-macro-warning")) {
            type = "warning";
          }
          const titleEl = el.querySelector(".confluence-information-macro-title, .panelHeader");
          const title = ((_a = titleEl == null ? void 0 : titleEl.textContent) == null ? void 0 : _a.trim()) || "";
          const bodyEl = el.querySelector(".confluence-information-macro-body, .panelContent");
          const body = ((_b = bodyEl == null ? void 0 : bodyEl.textContent) == null ? void 0 : _b.trim()) || ((_c = el.textContent) == null ? void 0 : _c.trim()) || "";
          const header = title ? `> [!${type}] ${title}` : `> [!${type}]`;
          const lines = body.split("\n").map((line) => `> ${line}`).join("\n");
          return `
${header}
${lines}

`;
        }
      });
    } else {
      instance.addRule("confluenceMacros", {
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return false;
          return node.classList.contains("confluence-information-macro") || node.tagName === "DIV" && node.dataset.macroName === "panel";
        },
        replacement: (_content, node) => {
          var _a, _b, _c;
          const el = node;
          let type = "Info";
          const macroName = el.dataset.macroName || "";
          if (macroName.includes("note") || el.classList.contains("confluence-information-macro-note")) {
            type = "Note";
          } else if (macroName.includes("tip") || el.classList.contains("confluence-information-macro-tip")) {
            type = "Tip";
          } else if (macroName.includes("warning") || el.classList.contains("confluence-information-macro-warning")) {
            type = "Warning";
          }
          const titleEl = el.querySelector(".confluence-information-macro-title, .panelHeader");
          const title = ((_a = titleEl == null ? void 0 : titleEl.textContent) == null ? void 0 : _a.trim()) || "";
          const bodyEl = el.querySelector(".confluence-information-macro-body, .panelContent");
          const body = ((_b = bodyEl == null ? void 0 : bodyEl.textContent) == null ? void 0 : _b.trim()) || ((_c = el.textContent) == null ? void 0 : _c.trim()) || "";
          const header = title ? `**${type}: ${title}**` : `**${type}**`;
          const lines = body.split("\n").map((line) => `> ${line}`).join("\n");
          return `
${header}
${lines}

`;
        }
      });
    }
    instance.addRule("expandCollapse", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("expand-container") || node.classList.contains("aui-expander-container");
      },
      replacement: (_content, node) => {
        var _a, _b;
        const el = node;
        const titleEl = el.querySelector(".expand-control-text, .aui-expander-trigger");
        const title = ((_a = titleEl == null ? void 0 : titleEl.textContent) == null ? void 0 : _a.trim()) || "Details";
        const contentEl = el.querySelector(".expand-content, .aui-expander-content");
        const content = ((_b = contentEl == null ? void 0 : contentEl.textContent) == null ? void 0 : _b.trim()) || "";
        return `
<details>
<summary>${title}</summary>

${content}

</details>

`;
      }
    });
    instance.addRule("drawioMacro", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        const macroName = node.getAttribute("data-macro-name") || "";
        if (node.classList.contains("drawio-macro") || node.classList.contains("drawio-diagram") || macroName === "drawio" || macroName === "drawio-sketch") {
          return true;
        }
        if (node.classList.contains("conf-macro") && (macroName === "drawio" || macroName === "drawio-sketch")) {
          return true;
        }
        if (node.getAttribute("data-extracted-diagram-name")) {
          return true;
        }
        if (node.classList.contains("geDiagramContainer")) {
          return true;
        }
        return false;
      },
      replacement: (_content, node) => {
        const el = node;
        let diagramName = el.getAttribute("data-extracted-diagram-name") || el.dataset.diagramName || el.getAttribute("data-diagram-name") || "";
        if (!diagramName) {
          const index = el.getAttribute("data-diagram-index");
          diagramName = index ? `diagram-${parseInt(index) + 1}` : "diagram";
        }
        if (convertDiagrams) {
          const diagramInfo = extractDiagramFromMacro(el);
          if (diagramInfo && diagramInfo.content) {
            const processed = processDiagram(diagramInfo, {
              targetFormat: diagramTarget,
              embedAsCodeBlocks: embedAsCode,
              keepOriginalOnError: true,
              includePngFallback: true
            });
            if (processed.code && embedAsCode) {
              return `
${generateMermaidCodeBlock(processed.code, diagramName)}

`;
            }
          }
        }
        return `
![[${diagramName}.png]]

%% Editable source: ${diagramName}.drawio %%

`;
      }
    });
    instance.addRule("gliffyMacro", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("gliffy-macro") || node.classList.contains("gliffy-diagram") || node.dataset.macroName === "gliffy";
      },
      replacement: (_content, node) => {
        const el = node;
        const diagramName = el.dataset.diagramName || el.getAttribute("data-diagram-name") || "diagram";
        return `
![[${diagramName}.png]]

`;
      }
    });
    instance.addRule("plantumlMacro", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("plantuml-macro") || node.dataset.macroName === "plantuml";
      },
      replacement: (_content, node) => {
        var _a;
        const el = node;
        const code = ((_a = el.textContent) == null ? void 0 : _a.trim()) || "";
        if (convertDiagrams && diagramTarget === "mermaid" && code) {
          const diagramInfo = { format: "plantuml", name: "plantuml", content: code };
          const processed = processDiagram(diagramInfo, {
            targetFormat: "mermaid",
            embedAsCodeBlocks: true,
            keepOriginalOnError: true,
            includePngFallback: false
          });
          if (processed.code) {
            return `
${generateMermaidCodeBlock(processed.code)}

`;
          }
        }
        return `
\`\`\`plantuml
${code}
\`\`\`

`;
      }
    });
    instance.addRule("mermaidMacro", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("mermaid-macro") || node.dataset.macroName === "mermaid";
      },
      replacement: (_content, node) => {
        var _a;
        const el = node;
        const code = ((_a = el.textContent) == null ? void 0 : _a.trim()) || "";
        return `
\`\`\`mermaid
${code}
\`\`\`

`;
      }
    });
    instance.addRule("auiLozenge", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("aui-lozenge");
      },
      replacement: (content) => {
        return content ? `[${content.trim()}]` : "";
      }
    });
    instance.addRule("taskList", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("task-list-item");
      },
      replacement: (content, node) => {
        const el = node;
        const isComplete = el.dataset.taskStatus === "complete";
        const checkbox = isComplete ? "[x]" : "[ ]";
        return `- ${checkbox} ${content.trim()}
`;
      }
    });
    instance.addRule("codeBlock", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.tagName === "PRE" || node.classList.contains("code") || node.classList.contains("codeContent");
      },
      replacement: (content, node) => {
        var _a;
        const el = node;
        const lang = el.dataset.language || ((_a = el.className.match(/language-(\w+)/)) == null ? void 0 : _a[1]) || "";
        const code = content.trim();
        return `
\`\`\`${lang}
${code}
\`\`\`

`;
      }
    });
    instance.addRule("emptyLinks", {
      filter: (node) => {
        var _a;
        if (!(node instanceof HTMLElement)) return false;
        return node.tagName === "A" && !((_a = node.textContent) == null ? void 0 : _a.trim());
      },
      replacement: () => ""
    });
    instance.addRule("confluenceTable", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.tagName === "TABLE" && node.classList.contains("confluenceTable");
      },
      replacement: (_content, node) => {
        const el = node;
        const rows = Array.from(el.querySelectorAll("tr"));
        if (rows.length === 0) return "";
        const result = [];
        let hasHeader = false;
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll("th, td"));
          const isHeaderRow = cells.some((c) => c.tagName === "TH");
          const cellContents = cells.map((cell2) => {
            return (cell2.textContent || "").replace(/\n/g, " ").replace(/\|/g, "\\|").trim();
          });
          result.push(`| ${cellContents.join(" | ")} |`);
          if (isHeaderRow && !hasHeader) {
            hasHeader = true;
            result.push(`| ${cells.map(() => "---").join(" | ")} |`);
          } else if (rowIndex === 0 && !hasHeader) {
            hasHeader = true;
            result.push(`| ${cells.map(() => "---").join(" | ")} |`);
          }
        });
        return `

${result.join("\n")}

`;
      }
    });
    if (convertDiagrams) {
      diagramConvertInstance = instance;
    } else if (useObsidian) {
      obsidianTurndownInstance = instance;
    } else {
      turndownInstance = instance;
    }
    return instance;
  }
  function convertToMarkdown(html, options) {
    if (!html) return "";
    const turndown = getTurndown(options);
    return turndown.turndown(html);
  }
  async function fetchPagesContent(pageIds, settings, onProgress) {
    const sanitizeOptions = {
      includeImages: settings.includeImages,
      includeComments: settings.includeComments
    };
    const fetchSingle = async (pageId) => {
      try {
        const page = await fetchPageWithContent(pageId);
        return {
          id: page.id,
          title: page.title,
          htmlContent: sanitizeHtml(page.body.view.value, sanitizeOptions, pageId),
          ancestors: page.ancestors || [],
          version: page.version,
          error: false
        };
      } catch (error) {
        return {
          id: pageId,
          title: `Error loading: ${pageId}`,
          htmlContent: "",
          ancestors: [],
          error: true
        };
      }
    };
    const results = await runWithConcurrency(pageIds, fetchSingle, {
      concurrency: MAX_CONCURRENCY,
      onProgress: (completed, total) => {
        onProgress == null ? void 0 : onProgress(completed, total, "content");
      }
    });
    return results;
  }
  async function fetchJson(url) {
    return withRetry(async () => {
      if (IS_TAMPERMONKEY) {
        return gmFetchJson(url);
      }
      return browserFetchJson(url);
    });
  }
  async function fetchBlob(url) {
    return withRetry(async () => {
      if (IS_TAMPERMONKEY) {
        return gmFetchBlob(url);
      }
      return browserFetchBlob(url);
    });
  }
  function gmFetchJson(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        headers: { Accept: "application/json" },
        onload(response) {
          if (response.status >= 200 && response.status < 300) {
            try {
              resolve(JSON.parse(response.responseText));
            } catch (e) {
              reject(new Error(`JSON parse error: ${e}`));
            }
          } else {
            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
          }
        },
        onerror(response) {
          reject(new Error(`Network error: ${response.statusText || "Unknown"}`));
        }
      });
    });
  }
  function gmFetchBlob(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        responseType: "blob",
        onload(response) {
          if (response.status >= 200 && response.status < 300) {
            resolve(response.response);
          } else {
            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
          }
        },
        onerror(response) {
          reject(new Error(`Network error: ${response.statusText || "Unknown"}`));
        }
      });
    });
  }
  async function browserFetchJson(url) {
    const response = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
  async function browserFetchBlob(url) {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.blob();
  }
  function extractDiagramReferences(html) {
    const diagrams = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const drawioSelectors = [
      '[data-macro-name="drawio"]',
      '[data-macro-name="drawio-sketch"]',
      ".drawio-macro",
      ".drawio-diagram",
      '.conf-macro[data-macro-name="drawio"]',
      '.conf-macro[data-macro-name="drawio-sketch"]'
    ].join(", ");
    doc.querySelectorAll(drawioSelectors).forEach((el) => {
      var _a;
      let name = el.dataset.diagramName || el.getAttribute("data-diagram-name") || ((_a = el.querySelector("img")) == null ? void 0 : _a.getAttribute("data-diagram-name")) || "";
      if (!name) {
        const script = el.querySelector("script");
        if (script == null ? void 0 : script.textContent) {
          const nameMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*decodeURIComponent\(['"]([^'"]+)['"]\)/);
          if (nameMatch) {
            try {
              name = decodeURIComponent(nameMatch[1]);
            } catch {
              name = nameMatch[1];
            }
          }
          if (!name) {
            const simpleMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*['"]([^'"]+)['"]/);
            if (simpleMatch) name = simpleMatch[1];
          }
        }
      }
      if (!name) name = "diagram";
      diagrams.push({ type: "drawio", name });
    });
    doc.querySelectorAll('[data-macro-name="gliffy"], .gliffy-macro, .gliffy-diagram').forEach((el) => {
      let name = el.dataset.diagramName || el.getAttribute("data-diagram-name") || "";
      if (!name) {
        const childWithName = el.querySelector("[data-diagram-name]");
        if (childWithName) {
          name = childWithName.getAttribute("data-diagram-name") || "";
        }
      }
      if (!name) name = "diagram";
      diagrams.push({ type: "gliffy", name });
    });
    return diagrams;
  }
  async function convertDrawioToMermaid(pageId, diagramName) {
    try {
      const baseUrl = getBaseUrl();
      const attachments = await fetchPageAttachments(pageId);
      const drawioAttachment = attachments.find(
        (att) => att.filename === `${diagramName}.drawio` || att.filename === `${diagramName}.drawio.xml` || att.filename === diagramName
      );
      let xmlText;
      if (drawioAttachment == null ? void 0 : drawioAttachment.downloadUrl) {
        const xmlBlob = await downloadAttachment(drawioAttachment.downloadUrl);
        xmlText = await xmlBlob.text();
      } else {
        const xmlUrl = `${baseUrl}/plugins/servlet/drawio/export?pageId=${pageId}&diagramName=${encodeURIComponent(diagramName)}&format=xml`;
        try {
          const xmlBlob = await downloadAttachment(xmlUrl);
          xmlText = await xmlBlob.text();
        } catch (error) {
          if (DEBUG) ;
          return null;
        }
      }
      const result = convert(xmlText, {
        from: "drawio",
        to: "mermaid",
        layout: {
          algorithm: "dagre",
          direction: "TB"
        }
      });
      return result.output;
    } catch (error) {
      return null;
    }
  }
  async function fetchPageAttachments(pageId) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/rest/api/content/${pageId}/child/attachment?expand=metadata,extensions`;
    try {
      const response = await fetchJson(url);
      return (response.results || []).map((att) => {
        var _a, _b, _c, _d;
        return {
          id: att.id,
          title: att.title,
          filename: att.title,
          mediaType: ((_a = att.extensions) == null ? void 0 : _a.mediaType) || ((_b = att.metadata) == null ? void 0 : _b.mediaType) || "application/octet-stream",
          fileSize: ((_c = att.extensions) == null ? void 0 : _c.fileSize) || 0,
          downloadUrl: ((_d = att._links) == null ? void 0 : _d.download) ? `${baseUrl}${att._links.download}` : "",
          pageId
        };
      });
    } catch (error) {
      return [];
    }
  }
  function identifyDiagram(attachment) {
    const { filename, mediaType } = attachment;
    const baseUrl = getBaseUrl();
    if (mediaType === "application/vnd.jgraph.mxfile" || filename.endsWith(".drawio") || filename.endsWith(".drawio.xml")) {
      const diagramName = filename.replace(/\.(drawio|drawio\.xml)$/, "");
      return {
        ...attachment,
        diagramType: "drawio",
        diagramName,
        renderUrl: `${baseUrl}/plugins/servlet/drawio/export?pageId=${attachment.pageId}&diagramName=${encodeURIComponent(diagramName)}&format=png`
      };
    }
    if (mediaType === "application/gliffy+json" || filename.endsWith(".gliffy")) {
      const diagramName = filename.replace(/\.gliffy$/, "");
      return {
        ...attachment,
        diagramType: "gliffy",
        diagramName,
        renderUrl: `${baseUrl}/plugins/servlet/gliffy/export?pageId=${attachment.pageId}&diagramName=${encodeURIComponent(diagramName)}&format=png`
      };
    }
    return null;
  }
  function isImageAttachment(attachment) {
    const imageTypes = ["image/png", "image/jpeg", "image/gif", "image/svg+xml", "image/webp"];
    return imageTypes.includes(attachment.mediaType) || /\.(png|jpe?g|gif|svg|webp)$/i.test(attachment.filename);
  }
  async function downloadAttachment(url) {
    return fetchBlob(url);
  }
  async function exportImageAttachment(attachment) {
    if (!attachment.downloadUrl) return null;
    try {
      const blob = await downloadAttachment(attachment.downloadUrl);
      return {
        filename: attachment.filename,
        pageId: attachment.pageId,
        blob,
        type: "image"
      };
    } catch (error) {
      return null;
    }
  }
  async function convertDiagramsInMarkdown(markdown, pageId, format) {
    if (format === "wikilink") {
      return markdown;
    }
    let result = markdown;
    const diagramPattern = /!\[\[([^\]]+)\.png\]\](?:%% Editable source: ([^\s]+)\.drawio %%)?/g;
    const conversions = [];
    let match;
    while ((match = diagramPattern.exec(markdown)) !== null) {
      const [fullMatch, diagramName] = match;
      if (format === "mermaid") {
        const mermaidCode = await convertDrawioToMermaid(pageId, diagramName);
        if (mermaidCode) {
          const replacement = `\`\`\`mermaid
${mermaidCode}
\`\`\``;
          conversions.push({ original: fullMatch, replacement });
        }
      } else if (format === "drawio-xml") {
        try {
          const attachments = await fetchPageAttachments(pageId);
          const drawioAttachment = attachments.find(
            (att) => att.filename === `${diagramName}.drawio` || att.filename === `${diagramName}.drawio.xml` || att.filename === diagramName
          );
          if (drawioAttachment == null ? void 0 : drawioAttachment.downloadUrl) {
            const xmlBlob = await downloadAttachment(drawioAttachment.downloadUrl);
            const xmlText = await xmlBlob.text();
            const replacement = `\`\`\`xml
${xmlText}
\`\`\``;
            conversions.push({ original: fullMatch, replacement });
          }
        } catch (error) {
          console.warn(`Failed to download Draw.io XML for ${diagramName}:`, error);
        }
      }
    }
    for (const { original, replacement } of conversions) {
      result = result.replace(original, replacement);
    }
    if (format === "mermaid") {
      const plantumlPattern = /```plantuml\n([\s\S]*?)\n```/g;
      result = result.replace(plantumlPattern, (fullMatch, plantumlCode) => {
        try {
          const converted = convert(plantumlCode.trim(), {
            from: "plantuml",
            to: "mermaid",
            layout: {
              algorithm: "dagre",
              direction: "TB"
            }
          });
          if (converted.output) {
            return `\`\`\`mermaid
${converted.output}
\`\`\``;
          }
        } catch (error) {
          console.warn("Failed to convert PlantUML to Mermaid:", error);
        }
        return fullMatch;
      });
    }
    return result;
  }
  async function buildMarkdownDocument(pages, rootNode, exportTitle, settings, diagramFormat = "wikilink") {
    const flatTree = flattenTree(rootNode);
    const treeMap = new Map(flatTree.map((n) => [n.id, n]));
    const lines = [];
    const baseUrl = getBaseUrl();
    lines.push(`# ${exportTitle}`);
    lines.push("");
    if (settings.includeMetadata) {
      lines.push("## Metadata");
      lines.push("");
      lines.push(`- **Root Page ID:** ${rootNode.id}`);
      lines.push(`- **Total Pages:** ${pages.length}`);
      lines.push(`- **Export Date:** ${(/* @__PURE__ */ new Date()).toISOString()}`);
      lines.push("");
    }
    lines.push("## Table of Contents");
    lines.push("");
    const baseLevel = rootNode.level;
    for (const page of pages) {
      if (page.error) continue;
      const node = treeMap.get(page.id);
      const relativeLevel = node ? node.level - baseLevel : 0;
      const indent = "  ".repeat(relativeLevel);
      const anchor = makeAnchor(page.title);
      lines.push(`${indent}- [${page.title}](#${anchor})`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
    for (const page of pages) {
      const node = treeMap.get(page.id);
      const relativeLevel = node ? node.level - baseLevel : 0;
      const headingLevel = Math.min(relativeLevel + 2, 6);
      const heading = "#".repeat(headingLevel);
      lines.push(`${heading} ${page.title}`);
      lines.push("");
      if (settings.includeSourceLinks) {
        const pageUrl = `${baseUrl}/pages/viewpage.action?pageId=${page.id}`;
        lines.push(`> Source: ${pageUrl}`);
        lines.push("");
      }
      if (settings.includeMetadata && page.version) {
        const date = new Date(page.version.when).toLocaleDateString();
        lines.push(`*Last updated: ${date}*`);
        lines.push("");
      }
      if (page.error) {
        lines.push("*Error loading page content*");
      } else {
        const sanitizedHtml = sanitizeHtml(page.htmlContent, {
          includeImages: settings.includeImages,
          includeComments: settings.includeComments
        }, page.id);
        let markdown = convertToMarkdown(sanitizedHtml);
        markdown = await convertDiagramsInMarkdown(markdown, page.id, diagramFormat);
        lines.push(markdown);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }
    return {
      markdown: lines.join("\n"),
      pageCount: pages.length,
      title: exportTitle
    };
  }
  function makeAnchor(title) {
    return title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  }
  function downloadMarkdown(result) {
    const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `${sanitizeFilename$1(result.title)}.md`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  async function copyToClipboard(result) {
    try {
      await navigator.clipboard.writeText(result.markdown);
      return true;
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = result.markdown;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    }
  }
  function sanitizeFilename$1(name) {
    return name.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_").substring(0, 100);
  }
  function exportToPdf(pages, rootNode, exportTitle, settings) {
    const flatTree = flattenTree(rootNode);
    const treeMap = new Map(flatTree.map((n) => [n.id, n]));
    const baseUrl = getBaseUrl();
    const baseLevel = rootNode.level;
    const html = buildPrintableHtml(pages, treeMap, baseUrl, baseLevel, exportTitle, settings);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export PDF");
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
  function buildPrintableHtml(pages, treeMap, baseUrl, baseLevel, exportTitle, settings) {
    const styles = getPrintStyles();
    let content = "";
    content += `
    <div class="title-page">
      <h1>${escapeHtml$1(exportTitle)}</h1>
      <div class="meta">
        <p><strong>Всего страниц:</strong> ${pages.length}</p>
        <p><strong>Дата экспорта:</strong> ${(/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU")}</p>
      </div>
    </div>
    <div class="page-break"></div>
  `;
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
      content += `<li style="margin-left: ${indent}px;"><a href="#page-${page.id}">${escapeHtml$1(page.title)}</a></li>`;
    }
    content += `
      </ul>
    </div>
    <div class="page-break"></div>
  `;
    for (const page of pages) {
      const node = treeMap.get(page.id);
      const relativeLevel = node ? node.level - baseLevel : 0;
      const headingTag = `h${Math.min(relativeLevel + 1, 6)}`;
      const pageUrl = `${baseUrl}/pages/viewpage.action?pageId=${page.id}`;
      content += `<article class="page-content" id="page-${page.id}">`;
      content += `<${headingTag} class="page-title">${escapeHtml$1(page.title)}</${headingTag}>`;
      if (settings.includeSourceLinks) {
        content += `<p class="source-link">Источник: <a href="${pageUrl}">${pageUrl}</a></p>`;
      }
      if (settings.includeMetadata && page.version) {
        const date = new Date(page.version.when).toLocaleDateString("ru-RU");
        content += `<p class="meta-info">Обновлено: ${date}</p>`;
      }
      if (page.error) {
        content += `<p class="error">Ошибка загрузки содержимого страницы</p>`;
      } else {
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
  <title>${escapeHtml$1(exportTitle)} - PDF Export</title>
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
  function processHtmlContent(html, settings) {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (!settings.includeImages) {
      doc.querySelectorAll("img").forEach((img) => img.remove());
    } else {
      doc.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("/")) {
          img.setAttribute("src", getBaseUrl() + src);
        }
        img.style.maxWidth = "100%";
        img.style.height = "auto";
      });
    }
    doc.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href && href.startsWith("/")) {
        a.setAttribute("href", getBaseUrl() + href);
      }
    });
    return doc.body.innerHTML;
  }
  function getPrintStyles() {
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
  function escapeHtml$1(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  var jszip_min = { exports: {} };
  /*!

  JSZip v3.10.1 - A JavaScript class for generating and reading zip files
  <http://stuartk.com/jszip>

  (c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
  Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

  JSZip uses the library pako released under the MIT license :
  https://github.com/nodeca/pako/blob/main/LICENSE
  */
  (function(module, exports$1) {
    !function(e) {
      module.exports = e();
    }(function() {
      return function s(a, o, h) {
        function u(r, e2) {
          if (!o[r]) {
            if (!a[r]) {
              var t = "function" == typeof commonjsRequire && commonjsRequire;
              if (!e2 && t) return t(r, true);
              if (l) return l(r, true);
              var n = new Error("Cannot find module '" + r + "'");
              throw n.code = "MODULE_NOT_FOUND", n;
            }
            var i = o[r] = { exports: {} };
            a[r][0].call(i.exports, function(e3) {
              var t2 = a[r][1][e3];
              return u(t2 || e3);
            }, i, i.exports, s, a, o, h);
          }
          return o[r].exports;
        }
        for (var l = "function" == typeof commonjsRequire && commonjsRequire, e = 0; e < h.length; e++) u(h[e]);
        return u;
      }({ 1: [function(e, t, r) {
        var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        r.encode = function(e2) {
          for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; ) f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
          return h.join("");
        }, r.decode = function(e2) {
          var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
          if (e2.substr(0, u.length) === u) throw new Error("Invalid base64 input, it looks like a data url.");
          var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; ) t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
          return l;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
        var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
        function o(e2, t2, r2, n2, i2) {
          this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
        }
        o.prototype = { getContentWorker: function() {
          var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
          return e2.on("end", function() {
            if (this.streamInfo.data_length !== t2.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), e2;
        }, getCompressedWorker: function() {
          return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, o.createWorkerFrom = function(e2, t2, r2) {
          return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
        }, t.exports = o;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
        var n = e("./stream/GenericWorker");
        r.STORE = { magic: "\0\0", compressWorker: function() {
          return new n("STORE compression");
        }, uncompressWorker: function() {
          return new n("STORE decompression");
        } }, r.DEFLATE = e("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
        var n = e("./utils");
        var o = function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n2 = 0; n2 < 8; n2++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        }();
        t.exports = function(e2, t2) {
          return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
            return -1 ^ e3;
          }(0 | t2, e2, e2.length, 0) : function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
            return -1 ^ e3;
          }(0 | t2, e2, e2.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(e, t, r) {
        r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
      }, {}], 6: [function(e, t, r) {
        var n = null;
        n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
      }, { lie: 37 }], 7: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
        function h(e2, t2) {
          a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
        }
        r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
          this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
        }, h.prototype.flush = function() {
          a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
        }, h.prototype.cleanUp = function() {
          a.prototype.cleanUp.call(this), this._pako = null;
        }, h.prototype._createPako = function() {
          this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
          var t2 = this;
          this._pako.onData = function(e2) {
            t2.push({ data: e2, meta: t2.meta });
          };
        }, r.compressWorker = function(e2) {
          return new h("Deflate", e2);
        }, r.uncompressWorker = function() {
          return new h("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
        function A(e2, t2) {
          var r2, n2 = "";
          for (r2 = 0; r2 < t2; r2++) n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
          return n2;
        }
        function n(e2, t2, r2, n2, i2, s2) {
          var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _2 = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
          var S = 0;
          t2 && (S |= 8), l || !_2 && !g || (S |= 2048);
          var z = 0, C = 0;
          w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= function(e3, t3) {
            var r3 = e3;
            return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
          }(h.unixPermissions, w)) : (C = 20, z |= function(e3) {
            return 63 & (e3 || 0);
          }(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _2 && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
          var E = "";
          return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
        }
        var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
        function s(e2, t2, r2, n2) {
          i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        I.inherits(s, i), s.prototype.push = function(e2) {
          var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
          this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
        }, s.prototype.openedSource = function(e2) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
          var t2 = this.streamFiles && !e2.file.dir;
          if (t2) {
            var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r2.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = true;
        }, s.prototype.closedSource = function(e2) {
          this.accumulate = false;
          var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r2.dirRecord), t2) this.push({ data: function(e3) {
            return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
          }(e2), meta: { percent: 100 } });
          else for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, s.prototype.flush = function() {
          for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++) this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
          var r2 = this.bytesWritten - e2, n2 = function(e3, t3, r3, n3, i2) {
            var s2 = I.transformTo("string", i2(n3));
            return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
          }(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
          this.push({ data: n2, meta: { percent: 100 } });
        }, s.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, s.prototype.registerPrevious = function(e2) {
          this._sources.push(e2);
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
        }, s.prototype.error = function(e2) {
          var t2 = this._sources;
          if (!i.prototype.error.call(this, e2)) return false;
          for (var r2 = 0; r2 < t2.length; r2++) try {
            t2[r2].error(e2);
          } catch (e3) {
          }
          return true;
        }, s.prototype.lock = function() {
          i.prototype.lock.call(this);
          for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++) e2[t2].lock();
        }, t.exports = s;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
        var u = e("../compressions"), n = e("./ZipFileWorker");
        r.generateWorker = function(e2, a, t2) {
          var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
          try {
            e2.forEach(function(e3, t3) {
              h++;
              var r2 = function(e4, t4) {
                var r3 = e4 || t4, n3 = u[r3];
                if (!n3) throw new Error(r3 + " is not a valid compression method !");
                return n3;
              }(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
              t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
            }), o.entriesCount = h;
          } catch (e3) {
            o.error(e3);
          }
          return o;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
        function n() {
          if (!(this instanceof n)) return new n();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var e2 = new n();
            for (var t2 in this) "function" != typeof this[t2] && (e2[t2] = this[t2]);
            return e2;
          };
        }
        (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(e2, t2) {
          return new n().loadAsync(e2, t2);
        }, n.external = e("./external"), t.exports = n;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
        var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
        function f(n2) {
          return new i.Promise(function(e2, t2) {
            var r2 = n2.decompressed.getContentWorker().pipe(new a());
            r2.on("error", function(e3) {
              t2(e3);
            }).on("end", function() {
              r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
            }).resume();
          });
        }
        t.exports = function(e2, o) {
          var h = this;
          return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
            var t2 = new s(o);
            return t2.load(e3), t2;
          }).then(function(e3) {
            var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
            if (o.checkCRC32) for (var n2 = 0; n2 < r2.length; n2++) t2.push(f(r2[n2]));
            return i.Promise.all(t2);
          }).then(function(e3) {
            for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
              var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
              h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
            }
            return t2.zipComment.length && (h.comment = t2.zipComment), h;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
        var n = e("../utils"), i = e("../stream/GenericWorker");
        function s(e2, t2) {
          i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
        }
        n.inherits(s, i), s.prototype._bindStream = function(e2) {
          var t2 = this;
          (this._stream = e2).pause(), e2.on("data", function(e3) {
            t2.push({ data: e3, meta: { percent: 0 } });
          }).on("error", function(e3) {
            t2.isPaused ? this.generatedError = e3 : t2.error(e3);
          }).on("end", function() {
            t2.isPaused ? t2._upstreamEnded = true : t2.end();
          });
        }, s.prototype.pause = function() {
          return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
        }, t.exports = s;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
        var i = e("readable-stream").Readable;
        function n(e2, t2, r2) {
          i.call(this, t2), this._helper = e2;
          var n2 = this;
          e2.on("data", function(e3, t3) {
            n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
          }).on("error", function(e3) {
            n2.emit("error", e3);
          }).on("end", function() {
            n2.push(null);
          });
        }
        e("../utils").inherits(n, i), n.prototype._read = function() {
          this._helper.resume();
        }, t.exports = n;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
        t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e2, t2);
          if ("number" == typeof e2) throw new Error('The "data" argument must not be a number');
          return new Buffer(e2, t2);
        }, allocBuffer: function(e2) {
          if (Buffer.alloc) return Buffer.alloc(e2);
          var t2 = new Buffer(e2);
          return t2.fill(0), t2;
        }, isBuffer: function(e2) {
          return Buffer.isBuffer(e2);
        }, isStream: function(e2) {
          return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
        } };
      }, {}], 15: [function(e, t, r) {
        function s(e2, t2, r2) {
          var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
          s2.date = s2.date || /* @__PURE__ */ new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _2(e2)) && b.call(this, n2, true);
          var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
          r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
          var o2 = null;
          o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
          var h2 = new d(e2, o2, s2);
          this.files[e2] = h2;
        }
        var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _2 = function(e2) {
          "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
          var t2 = e2.lastIndexOf("/");
          return 0 < t2 ? e2.substring(0, t2) : "";
        }, g = function(e2) {
          return "/" !== e2.slice(-1) && (e2 += "/"), e2;
        }, b = function(e2, t2) {
          return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
        };
        function h(e2) {
          return "[object RegExp]" === Object.prototype.toString.call(e2);
        }
        var n = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(e2) {
          var t2, r2, n2;
          for (t2 in this.files) n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
        }, filter: function(r2) {
          var n2 = [];
          return this.forEach(function(e2, t2) {
            r2(e2, t2) && n2.push(t2);
          }), n2;
        }, file: function(e2, t2, r2) {
          if (1 !== arguments.length) return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
          if (h(e2)) {
            var n2 = e2;
            return this.filter(function(e3, t3) {
              return !t3.dir && n2.test(e3);
            });
          }
          var i2 = this.files[this.root + e2];
          return i2 && !i2.dir ? i2 : null;
        }, folder: function(r2) {
          if (!r2) return this;
          if (h(r2)) return this.filter(function(e3, t3) {
            return t3.dir && r2.test(e3);
          });
          var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
          return n2.root = t2.name, n2;
        }, remove: function(r2) {
          r2 = this.root + r2;
          var e2 = this.files[r2];
          if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir) delete this.files[r2];
          else for (var t2 = this.filter(function(e3, t3) {
            return t3.name.slice(0, r2.length) === r2;
          }), n2 = 0; n2 < t2.length; n2++) delete this.files[t2[n2].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(e2) {
          var t2, r2 = {};
          try {
            if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type) throw new Error("No output type specified.");
            u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
            var n2 = r2.comment || this.comment || "";
            t2 = o.generateWorker(this, r2, n2);
          } catch (e3) {
            (t2 = new l("error")).error(e3);
          }
          return new a(t2, r2.type || "string", r2.mimeType);
        }, generateAsync: function(e2, t2) {
          return this.generateInternalStream(e2).accumulate(t2);
        }, generateNodeStream: function(e2, t2) {
          return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
        } };
        t.exports = n;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
        t.exports = e("stream");
      }, { stream: void 0 }], 17: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
          for (var t2 = 0; t2 < this.data.length; t2++) e2[t2] = 255 & e2[t2];
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data[this.zero + e2];
        }, i.prototype.lastIndexOfSignature = function(e2) {
          for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s) if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2) return s - this.zero;
          return -1;
        }, i.prototype.readAndCheckSignature = function(e2) {
          var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
          return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
        }, i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return [];
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
        var n = e("../utils");
        function i(e2) {
          this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
        }
        i.prototype = { checkOffset: function(e2) {
          this.checkIndex(this.index + e2);
        }, checkIndex: function(e2) {
          if (this.length < this.zero + e2 || e2 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
        }, setIndex: function(e2) {
          this.checkIndex(e2), this.index = e2;
        }, skip: function(e2) {
          this.setIndex(this.index + e2);
        }, byteAt: function() {
        }, readInt: function(e2) {
          var t2, r2 = 0;
          for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--) r2 = (r2 << 8) + this.byteAt(t2);
          return this.index += e2, r2;
        }, readString: function(e2) {
          return n.transformTo("string", this.readData(e2));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var e2 = this.readInt(4);
          return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
        } }, t.exports = i;
      }, { "../utils": 32 }], 19: [function(e, t, r) {
        var n = e("./Uint8ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data.charCodeAt(this.zero + e2);
        }, i.prototype.lastIndexOfSignature = function(e2) {
          return this.data.lastIndexOf(e2) - this.zero;
        }, i.prototype.readAndCheckSignature = function(e2) {
          return e2 === this.readData(4);
        }, i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
        var n = e("./ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return new Uint8Array(0);
          var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
        var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
        t.exports = function(e2) {
          var t2 = n.getTypeOf(e2);
          return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
        r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../utils");
        function s(e2) {
          n.call(this, "ConvertWorker to " + e2), this.destType = e2;
        }
        i.inherits(s, n), s.prototype.processChunk = function(e2) {
          this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../crc32");
        function s() {
          n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
          this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
        }, t.exports = s;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
        }
        n.inherits(s, i), s.prototype.processChunk = function(e2) {
          if (e2) {
            var t2 = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = t2 + e2.data.length;
          }
          i.prototype.processChunk.call(this, e2);
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataWorker");
          var t2 = this;
          this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
            t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
          }, function(e3) {
            t2.error(e3);
          });
        }
        n.inherits(s, i), s.prototype.cleanUp = function() {
          i.prototype.cleanUp.call(this), this.data = null;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
        }, s.prototype._tickAndRepeat = function() {
          this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
        }, s.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return false;
          var e2 = null, t2 = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              e2 = this.data.substring(this.index, t2);
              break;
            case "uint8array":
              e2 = this.data.subarray(this.index, t2);
              break;
            case "array":
            case "nodebuffer":
              e2 = this.data.slice(this.index, t2);
          }
          return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
        function n(e2) {
          this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        n.prototype = { push: function(e2) {
          this.emit("data", e2);
        }, end: function() {
          if (this.isFinished) return false;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = true;
          } catch (e2) {
            this.emit("error", e2);
          }
          return true;
        }, error: function(e2) {
          return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
        }, on: function(e2, t2) {
          return this._listeners[e2].push(t2), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(e2, t2) {
          if (this._listeners[e2]) for (var r2 = 0; r2 < this._listeners[e2].length; r2++) this._listeners[e2][r2].call(this, t2);
        }, pipe: function(e2) {
          return e2.registerPrevious(this);
        }, registerPrevious: function(e2) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return false;
          var e2 = this.isPaused = false;
          return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
        }, flush: function() {
        }, processChunk: function(e2) {
          this.push(e2);
        }, withStreamInfo: function(e2, t2) {
          return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var e2 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = true, this.previous && this.previous.lock();
        }, toString: function() {
          var e2 = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + e2 : e2;
        } }, t.exports = n;
      }, {}], 29: [function(e, t, r) {
        var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
        if (n.nodestream) try {
          o = e("../nodejs/NodejsStreamOutputAdapter");
        } catch (e2) {
        }
        function l(e2, o2) {
          return new a.Promise(function(t2, r2) {
            var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
            e2.on("data", function(e3, t3) {
              n2.push(e3), o2 && o2(t3);
            }).on("error", function(e3) {
              n2 = [], r2(e3);
            }).on("end", function() {
              try {
                var e3 = function(e4, t3, r3) {
                  switch (e4) {
                    case "blob":
                      return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                    case "base64":
                      return u.encode(t3);
                    default:
                      return h.transformTo(e4, t3);
                  }
                }(s2, function(e4, t3) {
                  var r3, n3 = 0, i3 = null, s3 = 0;
                  for (r3 = 0; r3 < t3.length; r3++) s3 += t3[r3].length;
                  switch (e4) {
                    case "string":
                      return t3.join("");
                    case "array":
                      return Array.prototype.concat.apply([], t3);
                    case "uint8array":
                      for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++) i3.set(t3[r3], n3), n3 += t3[r3].length;
                      return i3;
                    case "nodebuffer":
                      return Buffer.concat(t3);
                    default:
                      throw new Error("concat : unsupported type '" + e4 + "'");
                  }
                }(i2, n2), a2);
                t2(e3);
              } catch (e4) {
                r2(e4);
              }
              n2 = [];
            }).resume();
          });
        }
        function f(e2, t2, r2) {
          var n2 = t2;
          switch (t2) {
            case "blob":
            case "arraybuffer":
              n2 = "uint8array";
              break;
            case "base64":
              n2 = "string";
          }
          try {
            this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
          } catch (e3) {
            this._worker = new s("error"), this._worker.error(e3);
          }
        }
        f.prototype = { accumulate: function(e2) {
          return l(this, e2);
        }, on: function(e2, t2) {
          var r2 = this;
          return "data" === e2 ? this._worker.on(e2, function(e3) {
            t2.call(r2, e3.data, e3.meta);
          }) : this._worker.on(e2, function() {
            h.delay(t2, arguments, r2);
          }), this;
        }, resume: function() {
          return h.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(e2) {
          if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
          return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
        } }, t.exports = f;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
        if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r.blob = false;
        else {
          var n = new ArrayBuffer(0);
          try {
            r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
          } catch (e2) {
            try {
              var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
            } catch (e3) {
              r.blob = false;
            }
          }
        }
        try {
          r.nodestream = !!e("readable-stream").Readable;
        } catch (e2) {
          r.nodestream = false;
        }
      }, { "readable-stream": 16 }], 31: [function(e, t, s) {
        for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++) u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
        u[254] = u[254] = 1;
        function a() {
          n.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function l() {
          n.call(this, "utf-8 encode");
        }
        s.utf8encode = function(e2) {
          return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : function(e3) {
            var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
            for (i2 = 0; i2 < a2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          }(e2);
        }, s.utf8decode = function(e2) {
          return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : function(e3) {
            var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
            for (t2 = r2 = 0; t2 < s2; ) if ((n2 = e3[t2++]) < 128) a2[r2++] = n2;
            else if (4 < (i2 = u[n2])) a2[r2++] = 65533, t2 += i2 - 1;
            else {
              for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; ) n2 = n2 << 6 | 63 & e3[t2++], i2--;
              1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
            }
            return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
          }(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
        }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
          var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
          if (this.leftOver && this.leftOver.length) {
            if (h.uint8array) {
              var r2 = t2;
              (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
            } else t2 = this.leftOver.concat(t2);
            this.leftOver = null;
          }
          var n2 = function(e3, t3) {
            var r3;
            for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); ) r3--;
            return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
          }(t2), i2 = t2;
          n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
        }, a.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
          this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
        }, s.Utf8EncodeWorker = l;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
        var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
        function n(e2) {
          return e2;
        }
        function l(e2, t2) {
          for (var r2 = 0; r2 < e2.length; ++r2) t2[r2] = 255 & e2.charCodeAt(r2);
          return t2;
        }
        e("setimmediate"), a.newBlob = function(t2, r2) {
          a.checkSupport("blob");
          try {
            return new Blob([t2], { type: r2 });
          } catch (e2) {
            try {
              var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return n2.append(t2), n2.getBlob(r2);
            } catch (e3) {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var i = { stringifyByChunk: function(e2, t2, r2) {
          var n2 = [], i2 = 0, s2 = e2.length;
          if (s2 <= r2) return String.fromCharCode.apply(null, e2);
          for (; i2 < s2; ) "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
          return n2.join("");
        }, stringifyByChar: function(e2) {
          for (var t2 = "", r2 = 0; r2 < e2.length; r2++) t2 += String.fromCharCode(e2[r2]);
          return t2;
        }, applyCanBeUsed: { uint8array: function() {
          try {
            return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
          } catch (e2) {
            return false;
          }
        }(), nodebuffer: function() {
          try {
            return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
          } catch (e2) {
            return false;
          }
        }() } };
        function s(e2) {
          var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
          if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2) for (; 1 < t2; ) try {
            return i.stringifyByChunk(e2, r2, t2);
          } catch (e3) {
            t2 = Math.floor(t2 / 2);
          }
          return i.stringifyByChar(e2);
        }
        function f(e2, t2) {
          for (var r2 = 0; r2 < e2.length; r2++) t2[r2] = e2[r2];
          return t2;
        }
        a.applyFromCharCode = s;
        var c = {};
        c.string = { string: n, array: function(e2) {
          return l(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.string.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return l(e2, new Uint8Array(e2.length));
        }, nodebuffer: function(e2) {
          return l(e2, r.allocBuffer(e2.length));
        } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
          return new Uint8Array(e2).buffer;
        }, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.arraybuffer = { string: function(e2) {
          return s(new Uint8Array(e2));
        }, array: function(e2) {
          return f(new Uint8Array(e2), new Array(e2.byteLength));
        }, arraybuffer: n, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(new Uint8Array(e2));
        } }, c.uint8array = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return e2.buffer;
        }, uint8array: n, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.nodebuffer = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.nodebuffer.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return f(e2, new Uint8Array(e2.length));
        }, nodebuffer: n }, a.transformTo = function(e2, t2) {
          if (t2 = t2 || "", !e2) return t2;
          a.checkSupport(e2);
          var r2 = a.getTypeOf(t2);
          return c[r2][e2](t2);
        }, a.resolve = function(e2) {
          for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
            var i2 = t2[n2];
            "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
          }
          return r2.join("/");
        }, a.getTypeOf = function(e2) {
          return "string" == typeof e2 ? "string" : "[object Array]" === Object.prototype.toString.call(e2) ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && e2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && e2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, a.checkSupport = function(e2) {
          if (!o[e2.toLowerCase()]) throw new Error(e2 + " is not supported by this platform");
        }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
          var t2, r2, n2 = "";
          for (r2 = 0; r2 < (e2 || "").length; r2++) n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
          return n2;
        }, a.delay = function(e2, t2, r2) {
          setImmediate(function() {
            e2.apply(r2 || null, t2 || []);
          });
        }, a.inherits = function(e2, t2) {
          function r2() {
          }
          r2.prototype = t2.prototype, e2.prototype = new r2();
        }, a.extend = function() {
          var e2, t2, r2 = {};
          for (e2 = 0; e2 < arguments.length; e2++) for (t2 in arguments[e2]) Object.prototype.hasOwnProperty.call(arguments[e2], t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
          return r2;
        }, a.prepareContent = function(r2, e2, n2, i2, s2) {
          return u.Promise.resolve(e2).then(function(n3) {
            return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) && "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
              var e3 = new FileReader();
              e3.onload = function(e4) {
                t2(e4.target.result);
              }, e3.onerror = function(e4) {
                r3(e4.target.error);
              }, e3.readAsArrayBuffer(n3);
            }) : n3;
          }).then(function(e3) {
            var t2 = a.getTypeOf(e3);
            return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = function(e4) {
              return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
            }(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
        var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = e("./support");
        function h(e2) {
          this.files = [], this.loadOptions = e2;
        }
        h.prototype = { checkSignature: function(e2) {
          if (!this.reader.readAndCheckSignature(e2)) {
            this.reader.index -= 4;
            var t2 = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
          }
        }, isSignature: function(e2, t2) {
          var r2 = this.reader.index;
          this.reader.setIndex(e2);
          var n2 = this.reader.readString(4) === t2;
          return this.reader.setIndex(r2), n2;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
          this.zipComment = this.loadOptions.decodeFileName(r2);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; ) e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var e2, t2;
          for (e2 = 0; e2 < this.files.length; e2++) t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
        }, readCentralDir: function() {
          var e2;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
          if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
          if (e2 < 0) throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
          this.reader.setIndex(e2);
          var t2 = e2;
          if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
            if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var r2 = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
          var n2 = t2 - r2;
          if (0 < n2) this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
          else if (n2 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
        }, prepareReader: function(e2) {
          this.reader = n(e2);
        }, load: function(e2) {
          this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, t.exports = h;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
        var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
        function l(e2, t2) {
          this.options = e2, this.loadOptions = t2;
        }
        l.prototype = { isEncrypted: function() {
          return 1 == (1 & this.bitFlag);
        }, useUTF8: function() {
          return 2048 == (2048 & this.bitFlag);
        }, readLocalPart: function(e2) {
          var t2, r2;
          if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if (null === (t2 = function(e3) {
            for (var t3 in h) if (Object.prototype.hasOwnProperty.call(h, t3) && h[t3].magic === e3) return h[t3];
            return null;
          }(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
          this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
        }, readCentralPart: function(e2) {
          this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
          var t2 = e2.readInt(2);
          if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var e2 = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var e2 = n(this.extraFields[1].value);
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
          }
        }, readExtraFields: function(e2) {
          var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; ) t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
          e2.setIndex(i2);
        }, handleUTF8: function() {
          var e2 = u.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
          else {
            var t2 = this.findExtraFieldUnicodePath();
            if (null !== t2) this.fileNameStr = t2;
            else {
              var r2 = s.transformTo(e2, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r2);
            }
            var n2 = this.findExtraFieldUnicodeComment();
            if (null !== n2) this.fileCommentStr = n2;
            else {
              var i2 = s.transformTo(e2, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(i2);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var e2 = this.extraFields[28789];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var e2 = this.extraFields[25461];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        } }, t.exports = l;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
        function n(e2, t2, r2) {
          this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
        }
        var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
        n.prototype = { internalStream: function(e2) {
          var t2 = null, r2 = "string";
          try {
            if (!e2) throw new Error("No output type specified.");
            var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
            "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
            var i2 = !this._dataBinary;
            i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
          } catch (e3) {
            (t2 = new h("error")).error(e3);
          }
          return new s(t2, r2, "");
        }, async: function(e2, t2) {
          return this.internalStream(e2).accumulate(t2);
        }, nodeStream: function(e2, t2) {
          return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
        }, _compressWorker: function(e2, t2) {
          if (this._data instanceof o && this._data.compression.magic === e2.magic) return this._data.getCompressedWorker();
          var r2 = this._decompressWorker();
          return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
        }, _decompressWorker: function() {
          return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
        } };
        for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, f = 0; f < u.length; f++) n.prototype[u[f]] = l;
        t.exports = n;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
        (function(t2) {
          var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
          if (e2) {
            var i = 0, s = new e2(u), a = t2.document.createTextNode("");
            s.observe(a, { characterData: true }), r = function() {
              a.data = i = ++i % 2;
            };
          } else if (t2.setImmediate || void 0 === t2.MessageChannel) r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
            var e3 = t2.document.createElement("script");
            e3.onreadystatechange = function() {
              u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
            }, t2.document.documentElement.appendChild(e3);
          } : function() {
            setTimeout(u, 0);
          };
          else {
            var o = new t2.MessageChannel();
            o.port1.onmessage = u, r = function() {
              o.port2.postMessage(0);
            };
          }
          var h = [];
          function u() {
            var e3, t3;
            n = true;
            for (var r2 = h.length; r2; ) {
              for (t3 = h, h = [], e3 = -1; ++e3 < r2; ) t3[e3]();
              r2 = h.length;
            }
            n = false;
          }
          l.exports = function(e3) {
            1 !== h.push(e3) || n || r();
          };
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}], 37: [function(e, t, r) {
        var i = e("immediate");
        function u() {
        }
        var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
        function o(e2) {
          if ("function" != typeof e2) throw new TypeError("resolver must be a function");
          this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
        }
        function h(e2, t2, r2) {
          this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
        }
        function f(t2, r2, n2) {
          i(function() {
            var e2;
            try {
              e2 = r2(n2);
            } catch (e3) {
              return l.reject(t2, e3);
            }
            e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
          });
        }
        function c(e2) {
          var t2 = e2 && e2.then;
          if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2) return function() {
            t2.apply(e2, arguments);
          };
        }
        function d(t2, e2) {
          var r2 = false;
          function n2(e3) {
            r2 || (r2 = true, l.reject(t2, e3));
          }
          function i2(e3) {
            r2 || (r2 = true, l.resolve(t2, e3));
          }
          var s2 = p(function() {
            e2(i2, n2);
          });
          "error" === s2.status && n2(s2.value);
        }
        function p(e2, t2) {
          var r2 = {};
          try {
            r2.value = e2(t2), r2.status = "success";
          } catch (e3) {
            r2.status = "error", r2.value = e3;
          }
          return r2;
        }
        (t.exports = o).prototype.finally = function(t2) {
          if ("function" != typeof t2) return this;
          var r2 = this.constructor;
          return this.then(function(e2) {
            return r2.resolve(t2()).then(function() {
              return e2;
            });
          }, function(e2) {
            return r2.resolve(t2()).then(function() {
              throw e2;
            });
          });
        }, o.prototype.catch = function(e2) {
          return this.then(null, e2);
        }, o.prototype.then = function(e2, t2) {
          if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s) return this;
          var r2 = new this.constructor(u);
          this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
          return r2;
        }, h.prototype.callFulfilled = function(e2) {
          l.resolve(this.promise, e2);
        }, h.prototype.otherCallFulfilled = function(e2) {
          f(this.promise, this.onFulfilled, e2);
        }, h.prototype.callRejected = function(e2) {
          l.reject(this.promise, e2);
        }, h.prototype.otherCallRejected = function(e2) {
          f(this.promise, this.onRejected, e2);
        }, l.resolve = function(e2, t2) {
          var r2 = p(c, t2);
          if ("error" === r2.status) return l.reject(e2, r2.value);
          var n2 = r2.value;
          if (n2) d(e2, n2);
          else {
            e2.state = a, e2.outcome = t2;
            for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; ) e2.queue[i2].callFulfilled(t2);
          }
          return e2;
        }, l.reject = function(e2, t2) {
          e2.state = s, e2.outcome = t2;
          for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; ) e2.queue[r2].callRejected(t2);
          return e2;
        }, o.resolve = function(e2) {
          if (e2 instanceof this) return e2;
          return l.resolve(new this(u), e2);
        }, o.reject = function(e2) {
          var t2 = new this(u);
          return l.reject(t2, e2);
        }, o.all = function(e2) {
          var r2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var n2 = e2.length, i2 = false;
          if (!n2) return this.resolve([]);
          var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
          for (; ++t2 < n2; ) h2(e2[t2], t2);
          return o2;
          function h2(e3, t3) {
            r2.resolve(e3).then(function(e4) {
              s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
            }, function(e4) {
              i2 || (i2 = true, l.reject(o2, e4));
            });
          }
        }, o.race = function(e2) {
          var t2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var r2 = e2.length, n2 = false;
          if (!r2) return this.resolve([]);
          var i2 = -1, s2 = new this(u);
          for (; ++i2 < r2; ) a2 = e2[i2], t2.resolve(a2).then(function(e3) {
            n2 || (n2 = true, l.resolve(s2, e3));
          }, function(e3) {
            n2 || (n2 = true, l.reject(s2, e3));
          });
          var a2;
          return s2;
        };
      }, { immediate: 36 }], 38: [function(e, t, r) {
        var n = {};
        (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
        var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
        function p(e2) {
          if (!(this instanceof p)) return new p(e2);
          this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
          var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
          if (r2 !== l) throw new Error(i[r2]);
          if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
            var n2;
            if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l) throw new Error(i[r2]);
            this._dict_set = true;
          }
        }
        function n(e2, t2) {
          var r2 = new p(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || i[r2.err];
          return r2.result;
        }
        p.prototype.push = function(e2, t2) {
          var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
          do {
            if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l) return this.onEnd(r2), !(this.ended = true);
            0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
          } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
          return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
        }, p.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, p.prototype.onEnd = function(e2) {
          e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, n(e2, t2);
        }, r.gzip = function(e2, t2) {
          return (t2 = t2 || {}).gzip = true, n(e2, t2);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
        var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _2 = Object.prototype.toString;
        function a(e2) {
          if (!(this instanceof a)) return new a(e2);
          this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
          var r2 = c.inflateInit2(this.strm, t2.windowBits);
          if (r2 !== m.Z_OK) throw new Error(n[r2]);
          this.header = new s(), c.inflateGetHeader(this.strm, this.header);
        }
        function o(e2, t2) {
          var r2 = new a(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || n[r2.err];
          return r2.result;
        }
        a.prototype.push = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _2.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
          do {
            if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _2.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK) return this.onEnd(r2), !(this.ended = true);
            h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
          } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
          return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
        }, a.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, a.prototype.onEnd = function(e2) {
          e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, o(e2, t2);
        }, r.ungzip = o;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
        r.assign = function(e2) {
          for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
            var r2 = t2.shift();
            if (r2) {
              if ("object" != typeof r2) throw new TypeError(r2 + "must be non-object");
              for (var n2 in r2) r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
            }
          }
          return e2;
        }, r.shrinkBuf = function(e2, t2) {
          return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
        };
        var i = { arraySet: function(e2, t2, r2, n2, i2) {
          if (t2.subarray && e2.subarray) e2.set(t2.subarray(r2, r2 + n2), i2);
          else for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          var t2, r2, n2, i2, s2, a;
          for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++) n2 += e2[t2].length;
          for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++) s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
          return a;
        } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
          for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          return [].concat.apply([], e2);
        } };
        r.setTyped = function(e2) {
          e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
        }, r.setTyped(n);
      }, {}], 42: [function(e, t, r) {
        var h = e("./common"), i = true, s = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (e2) {
          i = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (e2) {
          s = false;
        }
        for (var u = new h.Buf8(256), n = 0; n < 256; n++) u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
        function l(e2, t2) {
          if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i)) return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
          for (var r2 = "", n2 = 0; n2 < t2; n2++) r2 += String.fromCharCode(e2[n2]);
          return r2;
        }
        u[254] = u[254] = 1, r.string2buf = function(e2) {
          var t2, r2, n2, i2, s2, a = e2.length, o = 0;
          for (i2 = 0; i2 < a; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
          for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
          return t2;
        }, r.buf2binstring = function(e2) {
          return l(e2, e2.length);
        }, r.binstring2buf = function(e2) {
          for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++) t2[r2] = e2.charCodeAt(r2);
          return t2;
        }, r.buf2string = function(e2, t2) {
          var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
          for (r2 = n2 = 0; r2 < a; ) if ((i2 = e2[r2++]) < 128) o[n2++] = i2;
          else if (4 < (s2 = u[i2])) o[n2++] = 65533, r2 += s2 - 1;
          else {
            for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; ) i2 = i2 << 6 | 63 & e2[r2++], s2--;
            1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
          }
          return l(o, n2);
        }, r.utf8border = function(e2, t2) {
          var r2;
          for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); ) r2--;
          return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
        };
      }, { "./common": 41 }], 43: [function(e, t, r) {
        t.exports = function(e2, t2, r2, n) {
          for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
            for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; ) ;
            i %= 65521, s %= 65521;
          }
          return i | s << 16 | 0;
        };
      }, {}], 44: [function(e, t, r) {
        t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(e, t, r) {
        var o = function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n = 0; n < 8; n++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        }();
        t.exports = function(e2, t2, r2, n) {
          var i = o, s = n + r2;
          e2 ^= -1;
          for (var a = n; a < s; a++) e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
          return -1 ^ e2;
        };
      }, {}], 46: [function(e, t, r) {
        var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _2 = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
        function R(e2, t2) {
          return e2.msg = n[t2], t2;
        }
        function T(e2) {
          return (e2 << 1) - (4 < e2 ? 9 : 0);
        }
        function D(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        function F(e2) {
          var t2 = e2.state, r2 = t2.pending;
          r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
        }
        function N(e2, t2) {
          u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = t2;
        }
        function P(e2, t2) {
          e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
        }
        function L(e2, t2) {
          var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
          e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
          do {
            if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
              s2 += 2, r2++;
              do {
              } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
              if (n2 = S - (c2 - s2), s2 = c2 - S, a2 < n2) {
                if (e2.match_start = t2, o2 <= (a2 = n2)) break;
                d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
              }
            }
          } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
          return a2 <= e2.lookahead ? a2 : e2.lookahead;
        }
        function j(e2) {
          var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
          do {
            if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
              for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              i2 += f2;
            }
            if (0 === e2.strm.avail_in) break;
            if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x) for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); ) ;
          } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
        }
        function Z(e2, t2) {
          for (var r2, n2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x) if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
              for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; ) ;
              e2.strstart++;
            } else e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
            else n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
            if (n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function W(e2, t2) {
          for (var r2, n2, i2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
              for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; ) ;
              if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            } else if (e2.match_available) {
              if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out) return A;
            } else e2.match_available = 1, e2.strstart++, e2.lookahead--;
          }
          return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function M(e2, t2, r2, n2, i2) {
          this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
        }
        function H() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function G(e2) {
          var t2;
          return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _2);
        }
        function K(e2) {
          var t2 = G(e2);
          return t2 === m && function(e3) {
            e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
          }(e2.state), t2;
        }
        function Y(e2, t2, r2, n2, i2, s2) {
          if (!e2) return _2;
          var a2 = 1;
          if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2) return R(e2, _2);
          8 === n2 && (n2 = 9);
          var o2 = new H();
          return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
        }
        h = [new M(0, 0, 0, 0, function(e2, t2) {
          var r2 = 65535;
          for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
            if (e2.lookahead <= 1) {
              if (j(e2), 0 === e2.lookahead && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            e2.strstart += e2.lookahead, e2.lookahead = 0;
            var n2 = e2.block_start + r2;
            if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out)) return A;
            if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
        }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
          return Y(e2, t2, v, 15, 8, 0);
        }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
          return e2 && e2.state ? 2 !== e2.state.wrap ? _2 : (e2.state.gzhead = t2, m) : _2;
        }, r.deflate = function(e2, t2) {
          var r2, n2, i2, s2;
          if (!e2 || !e2.state || 5 < t2 || t2 < 0) return e2 ? R(e2, _2) : _2;
          if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f) return R(e2, 0 === e2.avail_out ? -5 : _2);
          if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C) if (2 === n2.wrap) e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
          else {
            var a2 = v + (n2.w_bits - 8 << 4) << 8;
            a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
          }
          if (69 === n2.status) if (n2.gzhead.extra) {
            for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); ) U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
          } else n2.status = 73;
          if (73 === n2.status) if (n2.gzhead.name) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
          } else n2.status = 91;
          if (91 === n2.status) if (n2.gzhead.comment) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
          } else n2.status = 103;
          if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
            if (F(e2), 0 === e2.avail_out) return n2.last_flush = -1, m;
          } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f) return R(e2, -5);
          if (666 === n2.status && 0 !== e2.avail_in) return R(e2, -5);
          if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
            var o2 = 2 === n2.strategy ? function(e3, t3) {
              for (var r3; ; ) {
                if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                  if (t3 === l) return A;
                  break;
                }
                if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            }(n2, t2) : 3 === n2.strategy ? function(e3, t3) {
              for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                if (e3.lookahead <= S) {
                  if (j(e3), e3.lookahead <= S && t3 === l) return A;
                  if (0 === e3.lookahead) break;
                }
                if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                  s3 = e3.strstart + S;
                  do {
                  } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                  e3.match_length = S - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                }
                if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            }(n2, t2) : h[n2.level].func(n2, t2);
            if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O) return 0 === e2.avail_out && (n2.last_flush = -1), m;
            if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out)) return n2.last_flush = -1, m;
          }
          return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
        }, r.deflateEnd = function(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _2) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _2;
        }, r.deflateSetDictionary = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
          if (!e2 || !e2.state) return _2;
          if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead) return _2;
          for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
            for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; ) ;
            r2.strstart = n2, r2.lookahead = x - 1, j(r2);
          }
          return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
        }, r.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
        t.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
        };
      }, {}], 48: [function(e, t, r) {
        t.exports = function(e2, t2) {
          var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _2, g, b, v, y, w, k, x, S, z, C;
          r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _2 = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
          e: do {
            p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
            t: for (; ; ) {
              if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255)) C[s++] = 65535 & v;
              else {
                if (!(16 & y)) {
                  if (0 == (64 & y)) {
                    v = m[(65535 & v) + (d & (1 << y) - 1)];
                    continue t;
                  }
                  if (32 & y) {
                    r2.mode = 12;
                    break e;
                  }
                  e2.msg = "invalid literal/length code", r2.mode = 30;
                  break e;
                }
                w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _2[d & b];
                r: for (; ; ) {
                  if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                    if (0 == (64 & y)) {
                      v = _2[(65535 & v) + (d & (1 << y) - 1)];
                      continue r;
                    }
                    e2.msg = "invalid distance code", r2.mode = 30;
                    break e;
                  }
                  if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break e;
                  }
                  if (d >>>= y, p -= y, (y = s - a) < k) {
                    if (l < (y = k - y) && r2.sane) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break e;
                    }
                    if (S = c, (x = 0) === f) {
                      if (x += u - y, y < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        x = s - k, S = C;
                      }
                    } else if (f < y) {
                      if (x += u + f - y, (y -= f) < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        if (x = 0, f < w) {
                          for (w -= y = f; C[s++] = c[x++], --y; ) ;
                          x = s - k, S = C;
                        }
                      }
                    } else if (x += f - y, y < w) {
                      for (w -= y; C[s++] = c[x++], --y; ) ;
                      x = s - k, S = C;
                    }
                    for (; 2 < w; ) C[s++] = S[x++], C[s++] = S[x++], C[s++] = S[x++], w -= 3;
                    w && (C[s++] = S[x++], 1 < w && (C[s++] = S[x++]));
                  } else {
                    for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); ) ;
                    w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (n < i && s < o);
          n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
        };
      }, {}], 49: [function(e, t, r) {
        var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
        function L(e2) {
          return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
        }
        function s() {
          this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function a(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
        }
        function o(e2) {
          var t2;
          return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
        }
        function h(e2, t2) {
          var r2, n2;
          return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
        }
        function u(e2, t2) {
          var r2, n2;
          return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
        }
        var l, f, c = true;
        function j(e2) {
          if (c) {
            var t2;
            for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; ) e2.lens[t2++] = 8;
            for (; t2 < 256; ) e2.lens[t2++] = 9;
            for (; t2 < 280; ) e2.lens[t2++] = 7;
            for (; t2 < 288; ) e2.lens[t2++] = 8;
            for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; ) e2.lens[t2++] = 5;
            T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
          }
          e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
        }
        function Z(e2, t2, r2, n2) {
          var i2, s2 = e2.state;
          return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
        }
        r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
          return u(e2, 15);
        }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _2, g, b, v, y, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in) return U;
          12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
          e: for (; ; ) switch (r2.mode) {
            case P:
              if (0 === r2.wrap) {
                r2.mode = 13;
                break;
              }
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (2 & r2.wrap && 35615 === u2) {
                E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                break;
              }
              if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                e2.msg = "incorrect header check", r2.mode = 30;
                break;
              }
              if (8 != (15 & u2)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits) r2.wbits = k;
              else if (k > r2.wbits) {
                e2.msg = "invalid window size", r2.mode = 30;
                break;
              }
              r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
              break;
            case 2:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.flags = u2, 8 != (255 & r2.flags)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (57344 & r2.flags) {
                e2.msg = "unknown header flags set", r2.mode = 30;
                break;
              }
              r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
            case 3:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
            case 4:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
            case 5:
              if (1024 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
              } else r2.head && (r2.head.extra = null);
              r2.mode = 6;
            case 6:
              if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length)) break e;
              r2.length = 0, r2.mode = 7;
            case 7:
              if (2048 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.name = null);
              r2.length = 0, r2.mode = 8;
            case 8:
              if (4096 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.comment = null);
              r2.mode = 9;
            case 9:
              if (512 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (65535 & r2.check)) {
                  e2.msg = "header crc mismatch", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
              break;
            case 10:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
            case 11:
              if (0 === r2.havedict) return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
              e2.adler = r2.check = 1, r2.mode = 12;
            case 12:
              if (5 === t2 || 6 === t2) break e;
            case 13:
              if (r2.last) {
                u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                break;
              }
              for (; l2 < 3; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                case 0:
                  r2.mode = 14;
                  break;
                case 1:
                  if (j(r2), r2.mode = 20, 6 !== t2) break;
                  u2 >>>= 2, l2 -= 2;
                  break e;
                case 2:
                  r2.mode = 17;
                  break;
                case 3:
                  e2.msg = "invalid block type", r2.mode = 30;
              }
              u2 >>>= 2, l2 -= 2;
              break;
            case 14:
              for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                e2.msg = "invalid stored block lengths", r2.mode = 30;
                break;
              }
              if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2) break e;
            case 15:
              r2.mode = 16;
            case 16:
              if (d = r2.length) {
                if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d) break e;
                I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                break;
              }
              r2.mode = 12;
              break;
            case 17:
              for (; l2 < 14; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                e2.msg = "too many length or distance symbols", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 18;
            case 18:
              for (; r2.have < r2.ncode; ) {
                for (; l2 < 3; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
              }
              for (; r2.have < 19; ) r2.lens[A[r2.have++]] = 0;
              if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid code lengths set", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 19;
            case 19:
              for (; r2.have < r2.nlen + r2.ndist; ) {
                for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (b < 16) u2 >>>= _2, l2 -= _2, r2.lens[r2.have++] = b;
                else {
                  if (16 === b) {
                    for (z = _2 + 2; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (u2 >>>= _2, l2 -= _2, 0 === r2.have) {
                      e2.msg = "invalid bit length repeat", r2.mode = 30;
                      break;
                    }
                    k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                  } else if (17 === b) {
                    for (z = _2 + 3; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _2, k = 0, d = 3 + (7 & (u2 >>>= _2)), u2 >>>= 3, l2 -= 3;
                  } else {
                    for (z = _2 + 7; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _2, k = 0, d = 11 + (127 & (u2 >>>= _2)), u2 >>>= 7, l2 -= 7;
                  }
                  if (r2.have + d > r2.nlen + r2.ndist) {
                    e2.msg = "invalid bit length repeat", r2.mode = 30;
                    break;
                  }
                  for (; d--; ) r2.lens[r2.have++] = k;
                }
              }
              if (30 === r2.mode) break;
              if (0 === r2.lens[256]) {
                e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                break;
              }
              if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid literal/lengths set", r2.mode = 30;
                break;
              }
              if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                e2.msg = "invalid distances set", r2.mode = 30;
                break;
              }
              if (r2.mode = 20, 6 === t2) break e;
            case 20:
              r2.mode = 21;
            case 21:
              if (6 <= o2 && 258 <= h2) {
                e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                break;
              }
              for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (g && 0 == (240 & g)) {
                for (v = _2, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_2 = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _2, l2 -= _2, r2.back += _2, r2.length = b, 0 === g) {
                r2.mode = 26;
                break;
              }
              if (32 & g) {
                r2.back = -1, r2.mode = 12;
                break;
              }
              if (64 & g) {
                e2.msg = "invalid literal/length code", r2.mode = 30;
                break;
              }
              r2.extra = 15 & g, r2.mode = 22;
            case 22:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              r2.was = r2.length, r2.mode = 23;
            case 23:
              for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (0 == (240 & g)) {
                for (v = _2, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_2 = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _2, l2 -= _2, r2.back += _2, 64 & g) {
                e2.msg = "invalid distance code", r2.mode = 30;
                break;
              }
              r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
            case 24:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              if (r2.offset > r2.dmax) {
                e2.msg = "invalid distance too far back", r2.mode = 30;
                break;
              }
              r2.mode = 25;
            case 25:
              if (0 === h2) break e;
              if (d = c2 - h2, r2.offset > d) {
                if ((d = r2.offset - d) > r2.whave && r2.sane) {
                  e2.msg = "invalid distance too far back", r2.mode = 30;
                  break;
                }
                p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
              } else m = i2, p = a2 - r2.offset, d = r2.length;
              for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; ) ;
              0 === r2.length && (r2.mode = 21);
              break;
            case 26:
              if (0 === h2) break e;
              i2[a2++] = r2.length, h2--, r2.mode = 21;
              break;
            case 27:
              if (r2.wrap) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 |= n2[s2++] << l2, l2 += 8;
                }
                if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                  e2.msg = "incorrect data check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 28;
            case 28:
              if (r2.wrap && r2.flags) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (4294967295 & r2.total)) {
                  e2.msg = "incorrect length check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 29;
            case 29:
              x = 1;
              break e;
            case 30:
              x = -3;
              break e;
            case 31:
              return -4;
            case 32:
            default:
              return U;
          }
          return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
        }, r.inflateEnd = function(e2) {
          if (!e2 || !e2.state) return U;
          var t2 = e2.state;
          return t2.window && (t2.window = null), e2.state = null, N;
        }, r.inflateGetHeader = function(e2, t2) {
          var r2;
          return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
        }, r.inflateSetDictionary = function(e2, t2) {
          var r2, n2 = t2.length;
          return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
        }, r.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
        var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        t.exports = function(e2, t2, r2, n, i, s, a, o) {
          var h, u, l, f, c, d, p, m, _2, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
          for (b = 0; b <= 15; b++) O[b] = 0;
          for (v = 0; v < n; v++) O[t2[r2 + v]]++;
          for (k = g, w = 15; 1 <= w && 0 === O[w]; w--) ;
          if (w < k && (k = w), 0 === w) return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
          for (y = 1; y < w && 0 === O[y]; y++) ;
          for (k < y && (k = y), b = z = 1; b <= 15; b++) if (z <<= 1, (z -= O[b]) < 0) return -1;
          if (0 < z && (0 === e2 || 1 !== w)) return -1;
          for (B[1] = 0, b = 1; b < 15; b++) B[b + 1] = B[b] + O[b];
          for (v = 0; v < n; v++) 0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
          if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
          for (; ; ) {
            for (p = b - S, _2 = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S, y = u = 1 << x; i[c + (E >> S) + (u -= h)] = p << 24 | m << 16 | _2 | 0, 0 !== u; ) ;
            for (h = 1 << b - 1; E & h; ) h >>= 1;
            if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
              if (b === w) break;
              b = t2[r2 + a[v]];
            }
            if (k < b && (E & f) !== l) {
              for (0 === S && (S = k), c += y, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); ) x++, z <<= 1;
              if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
              i[l = E & f] = k << 24 | x << 16 | c - s | 0;
            }
          }
          return 0 !== E && (i[c + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(e, t, r) {
        t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(e, t, r) {
        var i = e("../utils/common"), o = 0, h = 1;
        function n(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _2 = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
        n(z);
        var C = new Array(2 * f);
        n(C);
        var E = new Array(512);
        n(E);
        var A = new Array(256);
        n(A);
        var I = new Array(a);
        n(I);
        var O, B, R, T = new Array(f);
        function D(e2, t2, r2, n2, i2) {
          this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
        }
        function F(e2, t2) {
          this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
        }
        function N(e2) {
          return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
        }
        function P(e2, t2, r2) {
          e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
        }
        function L(e2, t2, r2) {
          P(e2, r2[2 * t2], r2[2 * t2 + 1]);
        }
        function j(e2, t2) {
          for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; ) ;
          return r2 >>> 1;
        }
        function Z(e2, t2, r2) {
          var n2, i2, s2 = new Array(g + 1), a2 = 0;
          for (n2 = 1; n2 <= g; n2++) s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
          for (i2 = 0; i2 <= t2; i2++) {
            var o2 = e2[2 * i2 + 1];
            0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
          }
        }
        function W(e2) {
          var t2;
          for (t2 = 0; t2 < l; t2++) e2.dyn_ltree[2 * t2] = 0;
          for (t2 = 0; t2 < f; t2++) e2.dyn_dtree[2 * t2] = 0;
          for (t2 = 0; t2 < c; t2++) e2.bl_tree[2 * t2] = 0;
          e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
        }
        function M(e2) {
          8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
        }
        function H(e2, t2, r2, n2) {
          var i2 = 2 * t2, s2 = 2 * r2;
          return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
        }
        function G(e2, t2, r2) {
          for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); ) e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
          e2.heap[r2] = n2;
        }
        function K(e2, t2, r2) {
          var n2, i2, s2, a2, o2 = 0;
          if (0 !== e2.last_lit) for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; ) ;
          L(e2, m, t2);
        }
        function Y(e2, t2) {
          var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
          for (e2.heap_len = 0, e2.heap_max = _2, r2 = 0; r2 < h2; r2++) 0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
          for (; e2.heap_len < 2; ) s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
          for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--) G(e2, s2, r2);
          for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; ) ;
          e2.heap[--e2.heap_max] = e2.heap[1], function(e3, t3) {
            var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
            for (s3 = 0; s3 <= g; s3++) e3.bl_count[s3] = 0;
            for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _2; r3++) p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
            if (0 !== m2) {
              do {
                for (s3 = p2 - 1; 0 === e3.bl_count[s3]; ) s3--;
                e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
              } while (0 < m2);
              for (s3 = p2; 0 !== s3; s3--) for (n3 = e3.bl_count[s3]; 0 !== n3; ) u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
            }
          }(e2, t2), Z(s2, u2, e2.bl_count);
        }
        function X(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++) i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
        }
        function V(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++) if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
            if (o2 < u2) for (; L(e2, i2, e2.bl_tree), 0 != --o2; ) ;
            else 0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
            s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
          }
        }
        n(T);
        var q = false;
        function J(e2, t2, r2, n2) {
          P(e2, (s << 1) + (n2 ? 1 : 0), 3), function(e3, t3, r3, n3) {
            M(e3), U(e3, r3), U(e3, ~r3), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
          }(e2, t2, r2);
        }
        r._tr_init = function(e2) {
          q || (function() {
            var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
            for (n2 = r2 = 0; n2 < a - 1; n2++) for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++) A[r2++] = n2;
            for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++) for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++) E[i2++] = n2;
            for (i2 >>= 7; n2 < f; n2++) for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++) E[256 + i2++] = n2;
            for (t2 = 0; t2 <= g; t2++) s2[t2] = 0;
            for (e3 = 0; e3 <= 143; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (; e3 <= 255; ) z[2 * e3 + 1] = 9, e3++, s2[9]++;
            for (; e3 <= 279; ) z[2 * e3 + 1] = 7, e3++, s2[7]++;
            for (; e3 <= 287; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++) C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
            O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
          }(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
        }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
          var i2, s2, a2 = 0;
          0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = function(e3) {
            var t3, r3 = 4093624447;
            for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1) if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3]) return o;
            if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26]) return h;
            for (t3 = 32; t3 < u; t3++) if (0 !== e3.dyn_ltree[2 * t3]) return h;
            return o;
          }(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = function(e3) {
            var t3;
            for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S[t3] + 1]; t3--) ;
            return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
          }(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), function(e3, t3, r3, n3) {
            var i3;
            for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) P(e3, e3.bl_tree[2 * S[i3] + 1], 3);
            V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
          }(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
        }, r._tr_tally = function(e2, t2, r2) {
          return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
        }, r._tr_align = function(e2) {
          P(e2, 2, 3), L(e2, m, z), function(e3) {
            16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
          }(e2);
        };
      }, { "../utils/common": 41 }], 53: [function(e, t, r) {
        t.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(e, t, r) {
        (function(e2) {
          !function(r2, n) {
            if (!r2.setImmediate) {
              var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
              e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                process.nextTick(function() {
                  c(e4);
                });
              } : function() {
                if (r2.postMessage && !r2.importScripts) {
                  var e4 = true, t3 = r2.onmessage;
                  return r2.onmessage = function() {
                    e4 = false;
                  }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                }
              }() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                r2.postMessage(a + e4, "*");
              }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                c(e4.data);
              }, function(e4) {
                t2.port2.postMessage(e4);
              }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                var t3 = l.createElement("script");
                t3.onreadystatechange = function() {
                  c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                }, s.appendChild(t3);
              }) : function(e4) {
                setTimeout(c, 0, e4);
              }, e3.setImmediate = function(e4) {
                "function" != typeof e4 && (e4 = new Function("" + e4));
                for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++) t3[r3] = arguments[r3 + 1];
                var n2 = { callback: e4, args: t3 };
                return h[o] = n2, i(o), o++;
              }, e3.clearImmediate = f;
            }
            function f(e4) {
              delete h[e4];
            }
            function c(e4) {
              if (u) setTimeout(c, 0, e4);
              else {
                var t3 = h[e4];
                if (t3) {
                  u = true;
                  try {
                    !function(e5) {
                      var t4 = e5.callback, r3 = e5.args;
                      switch (r3.length) {
                        case 0:
                          t4();
                          break;
                        case 1:
                          t4(r3[0]);
                          break;
                        case 2:
                          t4(r3[0], r3[1]);
                          break;
                        case 3:
                          t4(r3[0], r3[1], r3[2]);
                          break;
                        default:
                          t4.apply(n, r3);
                      }
                    }(t3);
                  } finally {
                    f(e4), u = false;
                  }
                }
              }
            }
            function d(e4) {
              e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
            }
          }("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(jszip_min);
  var jszip_minExports = jszip_min.exports;
  const JSZip = /* @__PURE__ */ getDefaultExportFromCjs(jszip_minExports);
  function convertToWikilinks(markdown, pageMap, currentPageId) {
    const brokenLinks = [];
    const baseUrl = getBaseUrl();
    const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
    const converted = markdown.replace(linkPattern, (match, text, url) => {
      const pageIdMatch = url.match(/pageId=(\d+)/);
      const viewPageMatch = url.match(/\/pages\/viewpage\.action\?pageId=(\d+)/);
      const displayMatch = url.match(/\/display\/([^/]+)\/([^?#]+)/);
      let targetPageId = null;
      if (pageIdMatch) {
        targetPageId = pageIdMatch[1];
      } else if (viewPageMatch) {
        targetPageId = viewPageMatch[1];
      } else if (displayMatch && url.startsWith(baseUrl)) {
        const titleFromUrl = decodeURIComponent(displayMatch[2]).replace(/\+/g, " ");
        targetPageId = pageMap.byTitle.get(titleFromUrl.toLowerCase()) || null;
      }
      if (targetPageId) {
        const targetTitle = pageMap.byId.get(targetPageId);
        if (targetTitle) {
          const linkText = text && text !== targetTitle ? `${targetTitle}|${text}` : targetTitle;
          return `[[${linkText}]]`;
        } else {
          brokenLinks.push(url);
          return `[${text}](${url})`;
        }
      }
      if (url.startsWith("#")) {
        const currentTitle = pageMap.byId.get(currentPageId);
        if (currentTitle) {
          return `[[${currentTitle}${url}|${text || url.slice(1)}]]`;
        }
      }
      return match;
    });
    return { markdown: converted, brokenLinks };
  }
  function sanitizeFilename(title) {
    return title.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, " ").trim().substring(0, 200);
  }
  function makeWikilink(title, displayText) {
    return `[[${title}]]`;
  }
  function generateFrontmatter(page, node, pageMap, settings) {
    var _a;
    const lines = ["---"];
    const baseUrl = getBaseUrl();
    lines.push(`title: "${page.title.replace(/"/g, '\\"')}"`);
    lines.push("aliases: []");
    if (settings.includeConfluenceMetadata) {
      lines.push("confluence:");
      lines.push(`  id: "${page.id}"`);
      lines.push(`  url: "${baseUrl}/pages/viewpage.action?pageId=${page.id}"`);
      if (page.version) {
        lines.push(`  version: ${page.version.number}`);
        lines.push(`  lastModified: "${page.version.when}"`);
      }
    }
    if (node == null ? void 0 : node.parentId) {
      const parentTitle = pageMap.get(node.parentId);
      if (parentTitle) {
        lines.push(`parent: "[[${parentTitle}]]"`);
      }
    }
    if (node && node.children.length > 0) {
      lines.push("children:");
      for (const child of node.children) {
        lines.push(`  - "[[${child.title}]]"`);
      }
    }
    lines.push("tags:");
    lines.push("  - confluence/imported");
    if ((_a = page.version) == null ? void 0 : _a.when) {
      const date = page.version.when.split("T")[0];
      lines.push(`updated: ${date}`);
    }
    lines.push("---");
    lines.push("");
    return lines.join("\n");
  }
  function convertPageContent(page, pageMap, settings) {
    const sanitizedHtml = sanitizeHtml(page.htmlContent, {
      includeImages: settings.includeImages,
      includeComments: settings.includeComments
    }, page.id);
    let markdown = convertToMarkdown(sanitizedHtml, {
      useObsidianCallouts: settings.useObsidianCallouts,
      convertDiagrams: settings.convertDiagrams,
      diagramTargetFormat: settings.diagramTargetFormat,
      embedDiagramsAsCode: settings.embedDiagramsAsCode
    });
    if (settings.linkStyle === "wikilink" && settings.resolveInternalLinks) {
      const titleMap = {
        byId: pageMap,
        byTitle: new Map(Array.from(pageMap.entries()).map(([id, title]) => [title.toLowerCase(), id]))
      };
      const result = convertToWikilinks(markdown, titleMap, page.id);
      markdown = result.markdown;
    }
    return markdown;
  }
  function buildPagePath(node, flatTree, settings) {
    if (settings.folderStructure === "flat") {
      return sanitizeFilename(node.title) + ".md";
    }
    const pathParts = [];
    let current = node;
    const nodeMap = new Map(flatTree.map((n) => [n.id, n]));
    while (current) {
      if (current.children.length > 0 || current.parentId === null) {
        pathParts.unshift(sanitizeFilename(current.title));
      }
      if (current.parentId) {
        current = nodeMap.get(current.parentId);
      } else {
        break;
      }
    }
    if (node.children.length > 0) {
      return [...pathParts, sanitizeFilename(node.title) + ".md"].join("/");
    }
    return [...pathParts.slice(0, -1), sanitizeFilename(node.title) + ".md"].join("/").replace(/^\//, "");
  }
  function generateIndexFile(rootNode, pages, stats) {
    const lines = [];
    lines.push("---");
    lines.push('title: "Confluence Export Index"');
    lines.push(`created: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`);
    lines.push("tags:");
    lines.push("  - confluence/index");
    lines.push("  - MOC");
    lines.push("---");
    lines.push("");
    lines.push("# 📚 Confluence Export");
    lines.push("");
    lines.push(`> Exported on ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`);
    lines.push(`> Total pages: ${pages.length} | Attachments: ${stats.attachments} | Diagrams: ${stats.diagrams}`);
    lines.push("");
    lines.push("## 🗂️ Structure");
    lines.push("");
    function renderTree(node, indent = "") {
      const link = makeWikilink(node.title);
      const childCount = node.children.length > 0 ? ` (${node.children.length})` : "";
      lines.push(`${indent}- ${link}${childCount}`);
      for (const child of node.children) {
        renderTree(child, indent + "  ");
      }
    }
    renderTree(rootNode);
    lines.push("");
    lines.push("## 📊 Statistics");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| Total Pages | ${pages.length} |`);
    lines.push(`| Attachments | ${stats.attachments} |`);
    lines.push(`| Diagrams | ${stats.diagrams} |`);
    lines.push(`| Export Date | ${(/* @__PURE__ */ new Date()).toISOString()} |`);
    lines.push("");
    return lines.join("\n");
  }
  async function createObsidianVault(pages, rootNode, rootTitle, settings, onProgress) {
    const zip = new JSZip();
    const flatTree = flattenTree(rootNode);
    const nodeMap = new Map(flatTree.map((n) => [n.id, n]));
    const pageMap = new Map(pages.map((p) => [p.id, p.title]));
    const pageFiles = [];
    const attachmentFiles = [];
    let diagramCount = 0;
    let attachmentCount = 0;
    onProgress == null ? void 0 : onProgress("Converting pages...", 0, pages.length);
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const node = nodeMap.get(page.id);
      let content = "";
      if (settings.includeFrontmatter) {
        content += generateFrontmatter(page, node, pageMap, settings);
      }
      content += `# ${page.title}

`;
      if (settings.includeSourceLinks) {
        const baseUrl = getBaseUrl();
        content += `> Source: ${baseUrl}/pages/viewpage.action?pageId=${page.id}

`;
      }
      if (!page.error) {
        content += convertPageContent(page, pageMap, settings);
      } else {
        content += "*Error loading page content*\n";
      }
      const filePath = node ? buildPagePath(node, flatTree, settings) : sanitizeFilename(page.title) + ".md";
      pageFiles.push({ path: filePath, content, pageId: page.id });
      onProgress == null ? void 0 : onProgress("Converting pages...", i + 1, pages.length);
    }
    if (settings.downloadAttachments || settings.exportDiagrams) {
      const totalPages = pages.length;
      let processedPages = 0;
      for (const page of pages) {
        onProgress == null ? void 0 : onProgress("Downloading attachments...", processedPages, totalPages);
        const diagramRefs = extractDiagramReferences(page.htmlContent);
        if (settings.exportDiagrams && diagramRefs.length > 0) {
          for (const ref of diagramRefs) {
            try {
              const baseUrl = getBaseUrl();
              const format = ref.type === "gliffy" ? "gliffy" : "drawio";
              const renderUrl = `${baseUrl}/plugins/servlet/${format}/export?pageId=${page.id}&diagramName=${encodeURIComponent(ref.name)}&format=png`;
              const response = await fetch(renderUrl, { credentials: "include" });
              if (response.ok) {
                const blob = await response.blob();
                attachmentFiles.push({
                  path: `_attachments/${ref.name}.png`,
                  blob
                });
                diagramCount++;
                attachmentCount++;
              }
            } catch (error) {
              console.error(`Failed to download diagram ${ref.name}:`, error);
            }
          }
        }
        if (settings.downloadAttachments) {
          const attachments = await fetchPageAttachments(page.id);
          for (const att of attachments) {
            if (settings.maxAttachmentSizeMB > 0 && att.fileSize > settings.maxAttachmentSizeMB * 1024 * 1024) {
              continue;
            }
            const diagram = identifyDiagram(att);
            if (diagram) continue;
            if (isImageAttachment(att) && settings.includeImages) {
              const exported = await exportImageAttachment(att);
              if (exported) {
                attachmentFiles.push({
                  path: `_attachments/${exported.filename}`,
                  blob: exported.blob
                });
                attachmentCount++;
              }
            }
          }
        }
        processedPages++;
      }
    }
    onProgress == null ? void 0 : onProgress("Creating ZIP archive...", 0, 1);
    for (const file of pageFiles) {
      zip.file(file.path, file.content);
    }
    for (const file of attachmentFiles) {
      zip.file(file.path, file.blob);
    }
    const indexContent = generateIndexFile(rootNode, pages, {
      attachments: attachmentCount,
      diagrams: diagramCount
    });
    zip.file("_Index.md", indexContent);
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });
    onProgress == null ? void 0 : onProgress("Done!", 1, 1);
    return {
      zipBlob,
      pageCount: pages.length,
      attachmentCount,
      diagramCount,
      totalSize: zipBlob.size,
      title: rootTitle
    };
  }
  function downloadVaultZip(result) {
    const url = URL.createObjectURL(result.zipBlob);
    const filename = `${sanitizeFilename(result.title)}_obsidian.zip`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  const DEFAULT_SETTINGS = {
    includeImages: true,
    includeMetadata: true,
    includeComments: false,
    includeSourceLinks: true
  };
  const DEFAULT_OBSIDIAN_SETTINGS = {
    // Format
    exportFormat: "single",
    folderStructure: "hierarchical",
    // Links
    linkStyle: "wikilink",
    resolveInternalLinks: true,
    // Frontmatter
    includeFrontmatter: true,
    includeConfluenceMetadata: true,
    // Diagrams
    exportDiagrams: true,
    includeDiagramSource: true,
    includeDiagramPreview: true,
    diagramPreviewScale: 2,
    convertDiagrams: true,
    diagramTargetFormat: "wikilink",
    embedDiagramsAsCode: true,
    // Attachments
    downloadAttachments: true,
    maxAttachmentSizeMB: 50,
    // Content
    useObsidianCallouts: true,
    // Base settings
    includeImages: true,
    includeMetadata: true,
    includeComments: false,
    includeSourceLinks: true
  };
  const EXPORT_PRESETS = {
    quick: {
      exportFormat: "obsidian",
      folderStructure: "flat",
      downloadAttachments: false,
      exportDiagrams: false,
      convertDiagrams: false,
      includeFrontmatter: false,
      linkStyle: "markdown",
      useObsidianCallouts: false
    },
    full: {
      exportFormat: "obsidian",
      folderStructure: "hierarchical",
      downloadAttachments: true,
      exportDiagrams: true,
      includeDiagramSource: true,
      includeDiagramPreview: true,
      convertDiagrams: true,
      diagramTargetFormat: "wikilink",
      embedDiagramsAsCode: true,
      includeFrontmatter: true,
      includeConfluenceMetadata: true,
      linkStyle: "wikilink",
      useObsidianCallouts: true
    },
    documentation: {
      exportFormat: "obsidian",
      folderStructure: "flat",
      downloadAttachments: true,
      exportDiagrams: true,
      includeDiagramSource: false,
      includeDiagramPreview: true,
      convertDiagrams: true,
      diagramTargetFormat: "mermaid",
      embedDiagramsAsCode: true,
      includeFrontmatter: false,
      linkStyle: "markdown",
      useObsidianCallouts: false,
      includeSourceLinks: false
    },
    sync: {
      exportFormat: "obsidian",
      folderStructure: "hierarchical",
      downloadAttachments: true,
      exportDiagrams: true,
      includeDiagramSource: true,
      convertDiagrams: false,
      diagramTargetFormat: "wikilink",
      includeFrontmatter: true,
      includeConfluenceMetadata: true,
      linkStyle: "wikilink",
      useObsidianCallouts: true
    }
  };
  const STORAGE_KEYS = {
    SETTINGS: "md_export_settings",
    OBSIDIAN_SETTINGS: "md_obsidian_settings",
    TREE_PREFIX: "md_tree_cache_"
  };
  const CACHE_TTL = 24 * 60 * 60 * 1e3;
  function loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Failed to load settings:", e);
    }
    return { ...DEFAULT_SETTINGS };
  }
  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to save settings:", e);
    }
  }
  function loadObsidianSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OBSIDIAN_SETTINGS);
      if (stored) {
        return { ...DEFAULT_OBSIDIAN_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Failed to load Obsidian settings:", e);
    }
    return { ...DEFAULT_OBSIDIAN_SETTINGS };
  }
  function saveObsidianSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.OBSIDIAN_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to save Obsidian settings:", e);
    }
  }
  function applyPreset(preset) {
    const presetSettings = EXPORT_PRESETS[preset];
    return { ...DEFAULT_OBSIDIAN_SETTINGS, ...presetSettings };
  }
  function getCachedTree(rootId) {
    try {
      const key = STORAGE_KEYS.TREE_PREFIX + rootId;
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      const cached = JSON.parse(stored);
      if (Date.now() - cached.timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return cached;
    } catch (e) {
      console.warn("Failed to load cached tree:", e);
      return null;
    }
  }
  function setCachedTree(rootId, rootTitle, tree) {
    try {
      const key = STORAGE_KEYS.TREE_PREFIX + rootId;
      const cached = {
        rootId,
        rootTitle,
        tree,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (e) {
      console.warn("Failed to cache tree:", e);
    }
  }
  function clearCachedTree(rootId) {
    try {
      const key = STORAGE_KEYS.TREE_PREFIX + rootId;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Failed to clear cache:", e);
    }
  }
  function calculateTreeStats(rootNode, selectedIds) {
    const allNodes = flattenTree(rootNode);
    const selectedNodes = allNodes.filter((n) => selectedIds.has(n.id));
    const errors = allNodes.filter((n) => n.error).length;
    return {
      pages: allNodes.length,
      selectedPages: selectedNodes.length,
      errors
    };
  }
  const ICONS = {
    chevron: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    folder: `<svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
    page: `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
    download: `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    obsidian: `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    sun: `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
    moon: `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`
  };
  let modalElement = null;
  let currentSettings;
  let currentObsidianSettings;
  let resolveModal = null;
  let currentRootNode = null;
  let currentTheme = "light";
  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(theme) {
    currentTheme = theme;
    if (modalElement) {
      modalElement.setAttribute("data-theme", theme);
    }
  }
  function cancelModal() {
    if (modalElement && resolveModal) {
      modalElement.remove();
      modalElement = null;
      resolveModal({ selectedIds: [], cancelled: true, action: "cancel", settings: currentSettings, obsidianSettings: currentObsidianSettings });
      resolveModal = null;
    }
  }
  function showPageSelectorModal(rootNode, rootTitle, options) {
    return new Promise((resolve) => {
      resolveModal = resolve;
      currentSettings = loadSettings();
      currentObsidianSettings = loadObsidianSettings();
      currentRootNode = rootNode;
      const modal = document.createElement("div");
      modal.id = "md-export-modal";
      modalElement = modal;
      const totalPages = countNodes(rootNode);
      modal.innerHTML = `
      <div id="md-export-modal-content" class="md-modal-content">
        <div class="md-modal-header">
          <div class="md-header-row">
            <div class="md-header-title">
              <h3>Export to Markdown</h3>
              <button class="md-btn-icon" data-action="refresh" title="Refresh page tree (re-scan)">
                ${ICONS.refresh}
              </button>
            </div>
            <div class="md-header-actions">
              <button class="md-btn-icon" data-action="toggle-theme" title="Toggle theme">
                ${currentTheme === "dark" ? ICONS.sun : ICONS.moon}
              </button>
              <button class="md-btn-icon md-close-btn" data-action="cancel" title="Close (Esc)">
                ${ICONS.close}
              </button>
            </div>
          </div>
          <p class="subtitle">
            ${ICONS.folder.replace("<svg", '<svg class="icon"')}
            <span>${escapeHtml(rootTitle)}</span>
            <span class="md-page-count">${totalPages} pages</span>
          </p>
        </div>
        
        <!-- Search -->
        <div class="md-search-bar">
          <span class="md-search-icon">${ICONS.search}</span>
          <input type="text" id="md-search-input" placeholder="Search pages..." autocomplete="off">
          <button class="md-search-clear" id="md-search-clear" style="display:none">${ICONS.close}</button>
        </div>
        
        <div class="md-controls">
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="expand" title="Expand all branches">Expand</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="collapse" title="Collapse all branches">Collapse</button>
          <div class="md-controls-divider"></div>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="select-all" title="Select all pages (Ctrl+A)">All</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="deselect-all" title="Deselect all pages">None</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="invert" title="Invert selection">Invert</button>
          <div class="md-filter-chips">
            <button class="md-filter-chip active" data-filter="all" title="Show all pages">All</button>
            <button class="md-filter-chip" data-filter="errors" title="Show only pages with errors">⚠️ Errors</button>
          </div>
          <span class="md-selection-count" id="md-selection-count">0 selected</span>
        </div>
        
        <!-- Statistics Section -->
        <div class="md-stats-section" id="md-stats-section">
          <div class="md-stats-grid">
            <div class="md-stat-item">
              <span class="md-stat-icon">📄</span>
              <span class="md-stat-value" id="stat-pages">0</span>
              <span class="md-stat-label">Pages</span>
            </div>
            <div class="md-stat-item">
              <span class="md-stat-icon">🖼️</span>
              <span class="md-stat-value" id="stat-images">-</span>
              <span class="md-stat-label">Images</span>
            </div>
            <div class="md-stat-item">
              <span class="md-stat-icon">📊</span>
              <span class="md-stat-value" id="stat-diagrams">-</span>
              <span class="md-stat-label">Diagrams</span>
            </div>
            <div class="md-stat-item">
              <span class="md-stat-icon">📦</span>
              <span class="md-stat-value" id="stat-size">-</span>
              <span class="md-stat-label">MB (est.)</span>
            </div>
          </div>
        </div>
        
        <div class="md-tree-container" id="md-tree-container">
          <div class="md-tree" id="md-tree-root">${buildTreeHtml([rootNode])}</div>
        </div>
        
        <!-- Export Format Panel -->
        <div class="md-settings-panel">
          <button class="md-settings-toggle" data-action="toggle-format">
            ${ICONS.obsidian}
            <span>Export Format</span>
            <span class="md-chevron">${ICONS.chevron}</span>
          </button>
          <div class="md-settings-content" id="md-format-content" style="display: none;">
            <div class="md-preset-buttons">
              <button class="md-preset-btn ${currentObsidianSettings.exportFormat === "single" ? "active" : ""}" data-preset="single" title="Single markdown file">
                📄 Single File
              </button>
              <button class="md-preset-btn ${currentObsidianSettings.exportFormat === "obsidian" ? "active" : ""}" data-preset="obsidian" title="Obsidian vault (ZIP)">
                💎 Obsidian Vault
              </button>
            </div>
            
            <div class="md-obsidian-options" id="md-obsidian-options" style="display: ${currentObsidianSettings.exportFormat === "obsidian" ? "block" : "none"};">
              <div class="md-option-group">
                <span class="md-option-label">Quick Presets:</span>
                <div class="md-preset-mini">
                  <button class="md-btn md-btn-xs" data-apply-preset="quick" title="Fast export, no attachments">🚀 Quick</button>
                  <button class="md-btn md-btn-xs" data-apply-preset="full" title="Full vault with all features">📚 Full</button>
                  <button class="md-btn md-btn-xs" data-apply-preset="documentation" title="Clean docs, no source files">📖 Docs</button>
                </div>
              </div>
              
              <label class="md-checkbox-label">
                <input type="checkbox" id="setting-hierarchical" ${currentObsidianSettings.folderStructure === "hierarchical" ? "checked" : ""}>
                <span>Hierarchical folders</span>
              </label>
              <label class="md-checkbox-label">
                <input type="checkbox" id="setting-wikilinks" ${currentObsidianSettings.linkStyle === "wikilink" ? "checked" : ""}>
                <span>Use [[wikilinks]]</span>
              </label>
              <label class="md-checkbox-label">
                <input type="checkbox" id="setting-callouts" ${currentObsidianSettings.useObsidianCallouts ? "checked" : ""}>
                <span>Obsidian callouts</span>
              </label>
              <label class="md-checkbox-label">
                <input type="checkbox" id="setting-frontmatter" ${currentObsidianSettings.includeFrontmatter ? "checked" : ""}>
                <span>Include frontmatter</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Diagrams Panel -->
        <div class="md-settings-panel">
          <button class="md-settings-toggle" data-action="toggle-diagrams">
            🎨
            <span>Diagrams (Draw.io)</span>
            <span class="md-chevron">${ICONS.chevron}</span>
          </button>
          <div class="md-settings-content" id="md-diagrams-content" style="display: none;">
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-diagrams" ${currentObsidianSettings.exportDiagrams ? "checked" : ""}>
              <span>Export diagrams</span>
            </label>
            <label class="md-checkbox-label md-indent">
              <input type="checkbox" id="setting-convert-diagrams" ${currentObsidianSettings.convertDiagrams ? "checked" : ""}>
              <span>Convert diagrams</span>
            </label>
            <div class="md-option-group md-indent">
              <span class="md-option-label">Diagram format:</span>
              <div class="md-radio-group">
                <label><input type="radio" name="diagram-format" value="wikilink" ${currentObsidianSettings.diagramTargetFormat === "wikilink" ? "checked" : ""}> Wikilinks (![[name.png]])</label>
                <label><input type="radio" name="diagram-format" value="mermaid" ${currentObsidianSettings.diagramTargetFormat === "mermaid" ? "checked" : ""}> Mermaid code</label>
                <label><input type="radio" name="diagram-format" value="drawio-xml" ${currentObsidianSettings.diagramTargetFormat === "drawio-xml" ? "checked" : ""}> Draw.io XML</label>
              </div>
            </div>
            <label class="md-checkbox-label md-indent">
              <input type="checkbox" id="setting-embed-diagrams" ${currentObsidianSettings.embedDiagramsAsCode ? "checked" : ""}>
              <span>Embed as code blocks</span>
            </label>
            <label class="md-checkbox-label md-indent">
              <input type="checkbox" id="setting-diagram-source" ${currentObsidianSettings.includeDiagramSource ? "checked" : ""}>
              <span>Include editable source (.drawio)</span>
            </label>
            <label class="md-checkbox-label md-indent">
              <input type="checkbox" id="setting-diagram-preview" ${currentObsidianSettings.includeDiagramPreview ? "checked" : ""}>
              <span>Include preview (PNG)</span>
            </label>
            <div class="md-option-group md-indent">
              <span class="md-option-label">Preview quality:</span>
              <div class="md-radio-group">
                <label><input type="radio" name="diagram-scale" value="1" ${currentObsidianSettings.diagramPreviewScale === 1 ? "checked" : ""}> 1x</label>
                <label><input type="radio" name="diagram-scale" value="2" ${currentObsidianSettings.diagramPreviewScale === 2 ? "checked" : ""}> 2x</label>
                <label><input type="radio" name="diagram-scale" value="3" ${currentObsidianSettings.diagramPreviewScale === 3 ? "checked" : ""}> 3x</label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Content Settings Panel -->
        <div class="md-settings-panel">
          <button class="md-settings-toggle" data-action="toggle-settings">
            ${ICONS.settings}
            <span>Content Settings</span>
            <span class="md-chevron">${ICONS.chevron}</span>
          </button>
          <div class="md-settings-content" id="md-settings-content" style="display: none;">
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-images" ${currentSettings.includeImages ? "checked" : ""}>
              <span>Include images</span>
            </label>
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-attachments" ${currentObsidianSettings.downloadAttachments ? "checked" : ""}>
              <span>Download attachments</span>
            </label>
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-metadata" ${currentSettings.includeMetadata ? "checked" : ""}>
              <span>Include metadata (author, date)</span>
            </label>
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-comments" ${currentSettings.includeComments ? "checked" : ""}>
              <span>Include user comments</span>
            </label>
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-links" ${currentSettings.includeSourceLinks ? "checked" : ""}>
              <span>Include source links</span>
            </label>
          </div>
        </div>
        
        <div class="md-progress-section" id="md-progress-section" style="display: none;">
          <div class="md-progress-label">
            <span id="md-progress-text">Preparing...</span>
            <span id="md-progress-count"></span>
          </div>
          <div class="md-progress-bar">
            <div class="md-progress-fill" id="md-progress-fill"></div>
          </div>
          <div class="md-progress-current" id="md-progress-current" style="display: none;">
            <span class="md-progress-page-icon">📄</span>
            <span class="md-progress-page-name" id="md-progress-page-name"></span>
          </div>
        </div>
        
        <!-- Toast notification -->
        <div class="md-toast" id="md-toast" style="display: none;">
          ${ICONS.check}
          <span>Copied to clipboard!</span>
        </div>
        
        <div class="md-modal-footer">
          <div class="md-footer-left">
            <div class="md-shortcuts-hint">
              <span class="md-shortcut"><kbd>Esc</kbd> close</span>
              <span class="md-shortcut"><kbd>Shift</kbd>+click select with children</span>
              <span class="md-shortcut"><kbd>Ctrl</kbd>+<kbd>A</kbd> select all</span>
              <span class="md-shortcut"><kbd>Ctrl</kbd>+<kbd>D</kbd> download</span>
            </div>
          </div>
          <div class="md-footer-right">
            <button class="md-btn md-btn-secondary" data-action="copy" id="md-copy-btn" title="Copy Markdown to clipboard (Ctrl+C)">
              ${ICONS.copy}
              <span>Copy</span>
            </button>
            <button class="md-btn md-btn-secondary" data-action="pdf" id="md-pdf-btn" title="Open print preview for PDF">
              <span>📄 PDF</span>
            </button>
            <button class="md-btn md-btn-primary" data-action="download" id="md-download-btn" title="Download as .md file or Obsidian vault (Ctrl+D)">
              ${ICONS.download}
              <span>Download</span>
              <span class="md-btn-badge" id="md-download-badge">0</span>
            </button>
          </div>
        </div>
      </div>
    `;
      document.body.appendChild(modal);
      currentTheme = getSystemTheme();
      applyTheme(currentTheme);
      updateSelectionCount(modal);
      updateStats(modal, rootNode);
      setTimeout(() => {
        const searchInput2 = modal.querySelector("#md-search-input");
        searchInput2 == null ? void 0 : searchInput2.focus();
      }, 100);
      const keyHandler = (e) => {
        if (e.key === "Escape") {
          cancelModal();
          document.removeEventListener("keydown", keyHandler);
          return;
        }
        if (e.ctrlKey && e.key === "a" && !isInputFocused()) {
          e.preventDefault();
          modal.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
            var _a;
            if (!((_a = cb.closest("li")) == null ? void 0 : _a.classList.contains("hidden"))) cb.checked = true;
          });
          updateSelectionCount(modal);
          updateStats(modal, rootNode);
          return;
        }
        if (e.ctrlKey && e.key === "d") {
          e.preventDefault();
          const downloadBtn = modal.querySelector('[data-action="download"]');
          downloadBtn == null ? void 0 : downloadBtn.click();
          return;
        }
        if (e.ctrlKey && e.key === "c" && !isInputFocused()) {
          e.preventDefault();
          const copyBtn = modal.querySelector('[data-action="copy"]');
          copyBtn == null ? void 0 : copyBtn.click();
          return;
        }
      };
      document.addEventListener("keydown", keyHandler);
      function isInputFocused() {
        const active = document.activeElement;
        return (active == null ? void 0 : active.tagName) === "INPUT" || (active == null ? void 0 : active.tagName) === "TEXTAREA";
      }
      const escHandler = (e) => {
        if (e.key === "Escape") {
          cancelModal();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          cancelModal();
          document.removeEventListener("keydown", escHandler);
        }
      });
      const searchInput = modal.querySelector("#md-search-input");
      const searchClear = modal.querySelector("#md-search-clear");
      searchInput == null ? void 0 : searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        searchClear.style.display = query ? "flex" : "none";
        filterTree(modal, query);
      });
      searchClear == null ? void 0 : searchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchClear.style.display = "none";
        filterTree(modal, "");
        searchInput.focus();
      });
      modal.addEventListener("click", async (e) => {
        const target = e.target;
        const btn = target.closest("[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === "cancel") {
          cancelModal();
          document.removeEventListener("keydown", escHandler);
          return;
        }
        if (action === "download" || action === "copy" || action === "pdf") {
          const selectedIds = getSelectedIds(modal);
          if (selectedIds.length === 0) {
            shakeElement(modal.querySelector(".md-selection-count"));
            return;
          }
          saveCurrentSettings(modal);
          disableModalInteraction(modal);
          document.removeEventListener("keydown", escHandler);
          const isObsidian = currentObsidianSettings.exportFormat === "obsidian" && action === "download";
          resolve({
            selectedIds,
            cancelled: false,
            action: isObsidian ? "obsidian" : action,
            settings: currentSettings,
            obsidianSettings: currentObsidianSettings
          });
          return;
        }
        if (action === "refresh") {
          const refreshBtn = btn;
          refreshBtn.classList.add("spinning");
          try {
            const newTree = await options.onRefresh();
            currentRootNode = newTree;
            const treeRoot = modal.querySelector("#md-tree-root");
            if (treeRoot) {
              treeRoot.innerHTML = buildTreeHtml([newTree]);
            }
            const pageCount = modal.querySelector(".md-page-count");
            if (pageCount) {
              pageCount.textContent = `${countNodes(newTree)} pages`;
            }
            updateSelectionCount(modal);
            updateStats(modal);
          } finally {
            refreshBtn.classList.remove("spinning");
          }
          return;
        }
        if (action === "toggle-theme") {
          const newTheme = currentTheme === "dark" ? "light" : "dark";
          applyTheme(newTheme);
          btn.innerHTML = newTheme === "dark" ? ICONS.sun : ICONS.moon;
          return;
        }
        if (action === "toggle-settings") {
          const content = modal.querySelector("#md-settings-content");
          const chevron = btn.querySelector(".md-chevron");
          if (content) {
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            chevron == null ? void 0 : chevron.classList.toggle("expanded", isHidden);
          }
          return;
        }
        if (action === "toggle-format") {
          const content = modal.querySelector("#md-format-content");
          const chevron = btn.querySelector(".md-chevron");
          if (content) {
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            chevron == null ? void 0 : chevron.classList.toggle("expanded", isHidden);
          }
          return;
        }
        if (action === "toggle-diagrams") {
          const content = modal.querySelector("#md-diagrams-content");
          const chevron = btn.querySelector(".md-chevron");
          if (content) {
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            chevron == null ? void 0 : chevron.classList.toggle("expanded", isHidden);
          }
          return;
        }
        if (action === "expand") {
          modal.querySelectorAll(".md-tree ul").forEach((ul) => ul.classList.remove("collapsed"));
          modal.querySelectorAll(".md-tree-toggler").forEach((t) => t.classList.add("expanded"));
          return;
        }
        if (action === "collapse") {
          modal.querySelectorAll(".md-tree ul ul").forEach((ul) => ul.classList.add("collapsed"));
          modal.querySelectorAll(".md-tree-toggler").forEach((t) => {
            if (!t.classList.contains("empty")) t.classList.remove("expanded");
          });
          return;
        }
        if (action === "select-all") {
          modal.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
            var _a;
            if (!((_a = cb.closest("li")) == null ? void 0 : _a.classList.contains("hidden"))) cb.checked = true;
          });
          updateSelectionCount(modal);
          updateStats(modal);
          return;
        }
        if (action === "deselect-all") {
          modal.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
            cb.checked = false;
          });
          updateSelectionCount(modal);
          updateStats(modal);
          return;
        }
        if (action === "invert") {
          modal.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
            var _a;
            if (!((_a = cb.closest("li")) == null ? void 0 : _a.classList.contains("hidden"))) cb.checked = !cb.checked;
          });
          updateSelectionCount(modal);
          updateStats(modal);
          return;
        }
      });
      modal.addEventListener("click", (e) => {
        const target = e.target;
        if (target.closest(".md-tree-toggler")) {
          const toggler = target.closest(".md-tree-toggler");
          if (toggler.classList.contains("empty")) return;
          const li = toggler.closest("li");
          const childUl = li == null ? void 0 : li.querySelector(":scope > ul");
          if (childUl) {
            childUl.classList.toggle("collapsed");
            toggler.classList.toggle("expanded");
          }
          return;
        }
        const treeItem = target.closest(".md-tree-item");
        if (treeItem && !target.closest(".md-tree-checkbox") && !target.closest(".md-tree-toggler")) {
          const checkbox = treeItem.querySelector(".md-tree-checkbox");
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      });
      modal.addEventListener("change", (e) => {
        const target = e.target;
        if (!target.classList.contains("md-tree-checkbox")) return;
        const isChecked = target.checked;
        const li = target.closest("li");
        if (e.shiftKey && isChecked) {
          li == null ? void 0 : li.querySelectorAll(":scope > ul .md-tree-checkbox").forEach((cb) => {
            cb.checked = true;
          });
        }
        if (!isChecked) {
          li == null ? void 0 : li.querySelectorAll(":scope > ul .md-tree-checkbox").forEach((cb) => {
            cb.checked = false;
          });
        }
        updateSelectionCount(modal);
        updateStats(modal);
      });
      modal.addEventListener("click", (e) => {
        const target = e.target;
        if (target.classList.contains("md-tree-checkbox") && e.shiftKey) {
          e.shiftKey = true;
        }
      }, true);
      modal.addEventListener("click", (e) => {
        const target = e.target;
        const presetBtn = target.closest("[data-preset]");
        if (presetBtn) {
          const preset = presetBtn.dataset.preset;
          currentObsidianSettings.exportFormat = preset;
          modal.querySelectorAll(".md-preset-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-preset") === preset);
          });
          const obsidianOptions = modal.querySelector("#md-obsidian-options");
          if (obsidianOptions) {
            obsidianOptions.style.display = preset === "obsidian" ? "block" : "none";
          }
          return;
        }
        const applyPresetBtn = target.closest("[data-apply-preset]");
        if (applyPresetBtn) {
          const presetName = applyPresetBtn.dataset.applyPreset;
          currentObsidianSettings = applyPreset(presetName);
          updateObsidianSettingsUI(modal);
          return;
        }
        const filterChip = target.closest("[data-filter]");
        if (filterChip) {
          const filter = filterChip.dataset.filter;
          modal.querySelectorAll(".md-filter-chip").forEach((chip) => {
            chip.classList.toggle("active", chip === filterChip);
          });
          const items = modal.querySelectorAll(".md-tree li");
          items.forEach((li) => {
            var _a, _b;
            const hasError = li.querySelector(".md-error-badge") !== null;
            if (filter === "all") {
              li.classList.remove("hidden");
            } else if (filter === "errors") {
              li.classList.toggle("hidden", !hasError);
              if (hasError) {
                let parent = (_a = li.parentElement) == null ? void 0 : _a.closest("li");
                while (parent) {
                  parent.classList.remove("hidden");
                  parent = (_b = parent.parentElement) == null ? void 0 : _b.closest("li");
                }
              }
            }
          });
          updateSelectionCount(modal);
          updateStats(modal);
          return;
        }
      });
      modal.addEventListener("change", (e) => {
        const target = e.target;
        if (target.id === "setting-hierarchical") {
          currentObsidianSettings.folderStructure = target.checked ? "hierarchical" : "flat";
        } else if (target.id === "setting-wikilinks") {
          currentObsidianSettings.linkStyle = target.checked ? "wikilink" : "markdown";
        } else if (target.id === "setting-callouts") {
          currentObsidianSettings.useObsidianCallouts = target.checked;
        } else if (target.id === "setting-frontmatter") {
          currentObsidianSettings.includeFrontmatter = target.checked;
        } else if (target.id === "setting-diagrams") {
          currentObsidianSettings.exportDiagrams = target.checked;
        } else if (target.id === "setting-convert-diagrams") {
          currentObsidianSettings.convertDiagrams = target.checked;
        } else if (target.id === "setting-embed-diagrams") {
          currentObsidianSettings.embedDiagramsAsCode = target.checked;
        } else if (target.id === "setting-diagram-source") {
          currentObsidianSettings.includeDiagramSource = target.checked;
        } else if (target.id === "setting-diagram-preview") {
          currentObsidianSettings.includeDiagramPreview = target.checked;
        } else if (target.id === "setting-attachments") {
          currentObsidianSettings.downloadAttachments = target.checked;
        } else if (target.name === "diagram-scale") {
          currentObsidianSettings.diagramPreviewScale = parseInt(target.value);
        } else if (target.name === "diagram-format") {
          currentObsidianSettings.diagramTargetFormat = target.value;
        }
      });
    });
  }
  function updateObsidianSettingsUI(modal) {
    const setChecked = (id, checked) => {
      const el = modal.querySelector(`#${id}`);
      if (el) el.checked = checked;
    };
    setChecked("setting-hierarchical", currentObsidianSettings.folderStructure === "hierarchical");
    setChecked("setting-wikilinks", currentObsidianSettings.linkStyle === "wikilink");
    setChecked("setting-callouts", currentObsidianSettings.useObsidianCallouts);
    setChecked("setting-frontmatter", currentObsidianSettings.includeFrontmatter);
    setChecked("setting-diagrams", currentObsidianSettings.exportDiagrams);
    setChecked("setting-convert-diagrams", currentObsidianSettings.convertDiagrams);
    setChecked("setting-embed-diagrams", currentObsidianSettings.embedDiagramsAsCode);
    setChecked("setting-diagram-source", currentObsidianSettings.includeDiagramSource);
    setChecked("setting-diagram-preview", currentObsidianSettings.includeDiagramPreview);
    setChecked("setting-attachments", currentObsidianSettings.downloadAttachments);
    setChecked("setting-images", currentObsidianSettings.includeImages);
    setChecked("setting-links", currentObsidianSettings.includeSourceLinks);
    const scaleRadio = modal.querySelector(`input[name="diagram-scale"][value="${currentObsidianSettings.diagramPreviewScale}"]`);
    if (scaleRadio) scaleRadio.checked = true;
    const formatRadio = modal.querySelector(`input[name="diagram-format"][value="${currentObsidianSettings.diagramTargetFormat}"]`);
    if (formatRadio) formatRadio.checked = true;
    modal.querySelectorAll(".md-preset-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-preset") === currentObsidianSettings.exportFormat);
    });
    const obsidianOptions = modal.querySelector("#md-obsidian-options");
    if (obsidianOptions) {
      obsidianOptions.style.display = currentObsidianSettings.exportFormat === "obsidian" ? "block" : "none";
    }
  }
  function filterTree(modal, query) {
    const items = modal.querySelectorAll(".md-tree li");
    if (!query) {
      items.forEach((li) => {
        li.classList.remove("hidden", "highlight");
      });
      return;
    }
    items.forEach((li) => {
      var _a, _b, _c, _d, _e;
      const label = ((_b = (_a = li.querySelector(".md-tree-label")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.toLowerCase()) || "";
      const matches = label.includes(query);
      if (matches) {
        li.classList.remove("hidden");
        li.classList.add("highlight");
        let parent = (_c = li.parentElement) == null ? void 0 : _c.closest("li");
        while (parent) {
          parent.classList.remove("hidden");
          const ul = parent.querySelector(":scope > ul");
          ul == null ? void 0 : ul.classList.remove("collapsed");
          (_d = parent.querySelector(".md-tree-toggler")) == null ? void 0 : _d.classList.add("expanded");
          parent = (_e = parent.parentElement) == null ? void 0 : _e.closest("li");
        }
      } else {
        li.classList.add("hidden");
        li.classList.remove("highlight");
      }
    });
    items.forEach((li) => {
      if (li.classList.contains("hidden")) {
        const hasVisibleChild = li.querySelector("li:not(.hidden)");
        if (hasVisibleChild) {
          li.classList.remove("hidden");
        }
      }
    });
  }
  function shakeElement(el) {
    if (!el) return;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 500);
  }
  function countNodes(node) {
    let count = 1;
    for (const child of node.children) {
      count += countNodes(child);
    }
    return count;
  }
  function updateStats(modal, rootNode) {
    const node = rootNode ?? currentRootNode;
    if (!node) return;
    const selectedIds = getSelectedIds(modal);
    const stats = calculateTreeStats(node, new Set(selectedIds));
    const pagesEl = modal.querySelector("#stat-pages");
    if (pagesEl) pagesEl.textContent = String(stats.selectedPages ?? 0);
    const estimatedMB = (stats.selectedPages ?? 0) * 50 / 1024;
    const sizeEl = modal.querySelector("#stat-size");
    if (sizeEl) sizeEl.textContent = estimatedMB.toFixed(1);
  }
  function updateModalProgress(completed, total, phase, currentPage) {
    if (!modalElement) return;
    const section = modalElement.querySelector("#md-progress-section");
    const text = modalElement.querySelector("#md-progress-text");
    const count = modalElement.querySelector("#md-progress-count");
    const fill = modalElement.querySelector("#md-progress-fill");
    const currentEl = modalElement.querySelector("#md-progress-current");
    modalElement.querySelector("#md-progress-page-name");
    if (!section || !text || !fill) return;
    section.style.display = "block";
    const phaseLabels = {
      tree: "Scanning page tree...",
      content: "Loading page content...",
      convert: "Converting to Markdown...",
      vault: "Creating Obsidian vault...",
      attachments: "Downloading attachments...",
      diagrams: "Processing diagrams..."
    };
    text.textContent = phaseLabels[phase] || phase;
    if (total > 0) {
      count.textContent = `${completed}/${total}`;
      const percent = Math.round(completed / total * 100);
      fill.style.width = `${percent}%`;
      fill.classList.remove("indeterminate");
    } else {
      count.textContent = "";
      fill.classList.add("indeterminate");
    }
    if (currentEl) {
      currentEl.style.display = "none";
    }
  }
  function showToast(message) {
    if (!modalElement) return;
    const toast = modalElement.querySelector("#md-toast");
    if (!toast) return;
    {
      const span = toast.querySelector("span");
      if (span) span.textContent = message;
    }
    toast.style.display = "flex";
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.style.display = "none";
      }, 300);
    }, 2e3);
  }
  function closeModal() {
    if (modalElement) {
      modalElement.remove();
      modalElement = null;
      resolveModal = null;
    }
  }
  function enableModal() {
    if (!modalElement) return;
    const downloadBtn = modalElement.querySelector("#md-download-btn");
    const copyBtn = modalElement.querySelector("#md-copy-btn");
    const pdfBtn = modalElement.querySelector("#md-pdf-btn");
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `${ICONS.download}<span>Download</span><span class="md-btn-badge" id="md-download-badge">0</span>`;
    }
    if (copyBtn) {
      copyBtn.disabled = false;
      copyBtn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
    }
    if (pdfBtn) {
      pdfBtn.disabled = false;
    }
    modalElement.querySelectorAll(".md-controls button").forEach((btn) => {
      btn.disabled = false;
    });
    modalElement.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
      cb.disabled = false;
    });
    const progressSection = modalElement.querySelector("#md-progress-section");
    if (progressSection) {
      progressSection.style.display = "none";
    }
    updateSelectionCount(modalElement);
  }
  function saveCurrentSettings(modal) {
    var _a, _b, _c, _d;
    currentSettings = {
      includeImages: ((_a = modal.querySelector("#setting-images")) == null ? void 0 : _a.checked) ?? true,
      includeMetadata: ((_b = modal.querySelector("#setting-metadata")) == null ? void 0 : _b.checked) ?? true,
      includeComments: ((_c = modal.querySelector("#setting-comments")) == null ? void 0 : _c.checked) ?? false,
      includeSourceLinks: ((_d = modal.querySelector("#setting-links")) == null ? void 0 : _d.checked) ?? true
    };
    saveSettings(currentSettings);
    currentObsidianSettings.includeImages = currentSettings.includeImages;
    currentObsidianSettings.includeMetadata = currentSettings.includeMetadata;
    currentObsidianSettings.includeComments = currentSettings.includeComments;
    currentObsidianSettings.includeSourceLinks = currentSettings.includeSourceLinks;
    saveObsidianSettings(currentObsidianSettings);
  }
  function disableModalInteraction(modal) {
    const downloadBtn = modal.querySelector("#md-download-btn");
    const copyBtn = modal.querySelector("#md-copy-btn");
    const pdfBtn = modal.querySelector("#md-pdf-btn");
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `<span>Processing...</span>`;
    }
    if (copyBtn) copyBtn.disabled = true;
    if (pdfBtn) pdfBtn.disabled = true;
    modal.querySelectorAll(".md-controls button").forEach((btn) => {
      btn.disabled = true;
    });
    modal.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
      cb.disabled = true;
    });
  }
  function buildTreeHtml(nodes, level = 0) {
    let html = `<ul${level === 0 ? "" : ""}>`;
    for (const node of nodes) {
      const hasChildren = node.children.length > 0;
      const childCount = hasChildren ? countNodes(node) - 1 : 0;
      const errorClass = node.error ? " error" : "";
      const togglerClass = hasChildren ? "md-tree-toggler expanded" : "md-tree-toggler empty";
      const iconClass = "md-tree-icon page";
      const icon = ICONS.page;
      html += `<li data-page-id="${node.id}" data-level="${level}">`;
      html += `<div class="md-tree-item" data-level="${level}">`;
      html += `<span class="${togglerClass}">${ICONS.chevron}</span>`;
      html += `<input type="checkbox" class="md-tree-checkbox" data-page-id="${node.id}" checked>`;
      html += `<span class="${iconClass}">${icon}</span>`;
      html += `<span class="md-tree-label${errorClass}">${escapeHtml(node.title)}</span>`;
      if (hasChildren) {
        html += `<span class="md-child-count">${childCount}</span>`;
      }
      if (node.error) {
        html += `<span class="md-error-badge">Error</span>`;
      }
      html += `</div>`;
      if (hasChildren) {
        html += buildTreeHtml(node.children, level + 1);
      }
      html += "</li>";
    }
    html += "</ul>";
    return html;
  }
  function getSelectedIds(modal) {
    const ids = [];
    modal.querySelectorAll(".md-tree-checkbox:checked").forEach((cb) => {
      const li = cb.closest("li");
      if (cb.dataset.pageId && !(li == null ? void 0 : li.classList.contains("hidden"))) {
        ids.push(cb.dataset.pageId);
      }
    });
    return ids;
  }
  function updateSelectionCount(modal) {
    const checkboxes = modal.querySelectorAll(".md-tree-checkbox:checked");
    let count = 0;
    checkboxes.forEach((cb) => {
      var _a;
      if (!((_a = cb.closest("li")) == null ? void 0 : _a.classList.contains("hidden"))) count++;
    });
    const counter = modal.querySelector("#md-selection-count");
    if (counter) {
      counter.textContent = `${count} selected`;
    }
    const badge = modal.querySelector("#md-download-badge");
    if (badge) {
      badge.textContent = String(count);
      badge.classList.toggle("has-count", count > 0);
    }
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function createButton(text, className, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = className;
    btn.addEventListener("click", onClick);
    return btn;
  }
  function createStatus() {
    const span = document.createElement("span");
    span.id = "md-export-status";
    return span;
  }
  function updateStatus(message) {
    const el = document.getElementById("md-export-status");
    if (el) el.textContent = message;
  }
  function setButtonLoading(btn, loading, text) {
    btn.disabled = loading;
    btn.textContent = loading ? "Loading..." : text;
  }
  function getCurrentPageId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("pageId");
  }
  function getErrorMessage(error) {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
  }
  let exportButton = null;
  async function startExport() {
    if (!exportButton || exportButton.disabled) return;
    const pageId = getCurrentPageId();
    if (!pageId) {
      alert("Could not find current page ID!");
      return;
    }
    setButtonLoading(exportButton, true, "Export to Markdown");
    try {
      let rootTree;
      let rootTitle;
      const cached = getCachedTree(pageId);
      if (cached) {
        rootTree = cached.tree;
        rootTitle = cached.rootTitle;
        updateStatus("Loaded from cache");
      } else {
        updateStatus("Scanning page tree...");
        rootTree = await buildPageTree(pageId, updateStatus);
        if (!rootTree || rootTree.error) {
          alert("Failed to load page hierarchy.");
          updateStatus("Error: Could not load hierarchy");
          return;
        }
        rootTitle = rootTree.title;
        setCachedTree(pageId, rootTitle, rootTree);
        updateStatus("Tree cached");
      }
      const { selectedIds, cancelled, action, settings, obsidianSettings } = await showPageSelectorModal(
        rootTree,
        rootTitle,
        {
          onRefresh: async () => {
            updateStatus("Refreshing tree...");
            clearCachedTree(pageId);
            const newTree = await buildPageTree(pageId, updateStatus);
            if (newTree && !newTree.error) {
              setCachedTree(pageId, newTree.title, newTree);
              rootTree = newTree;
              rootTitle = newTree.title;
            }
            updateStatus("Tree refreshed");
            return newTree;
          }
        }
      );
      if (cancelled) {
        updateStatus("Cancelled");
        return;
      }
      if (selectedIds.length === 0) {
        closeModal();
        updateStatus("No pages selected");
        return;
      }
      updateModalProgress(0, selectedIds.length, "content");
      const pagesContent = await fetchPagesContent(selectedIds, settings, (completed, total, phase) => {
        updateModalProgress(completed, total, phase);
      });
      if (action === "obsidian") {
        updateModalProgress(0, 0, "Creating Obsidian vault...");
        const vaultResult = await createObsidianVault(
          pagesContent,
          rootTree,
          rootTitle,
          obsidianSettings,
          (phase, current, total) => {
            updateModalProgress(current, total, phase);
          }
        );
        downloadVaultZip(vaultResult);
        closeModal();
        updateStatus(`Downloaded vault: ${vaultResult.pageCount} pages, ${vaultResult.diagramCount} diagrams`);
      } else if (action === "copy") {
        updateModalProgress(0, 0, "convert");
        const result = await buildMarkdownDocument(
          pagesContent,
          rootTree,
          rootTitle,
          settings,
          obsidianSettings.diagramTargetFormat
        );
        const success = await copyToClipboard(result);
        if (success) {
          showToast("Copied to clipboard!");
          enableModal();
          updateStatus(`Copied ${result.pageCount} pages`);
        } else {
          alert("Failed to copy to clipboard");
          enableModal();
        }
      } else if (action === "pdf") {
        exportToPdf(pagesContent, rootTree, rootTitle, settings);
        closeModal();
        updateStatus(`PDF preview opened for ${pagesContent.length} pages`);
      } else {
        updateModalProgress(0, 0, "convert");
        const result = await buildMarkdownDocument(
          pagesContent,
          rootTree,
          rootTitle,
          settings,
          obsidianSettings.diagramTargetFormat
        );
        downloadMarkdown(result);
        closeModal();
        updateStatus(`Downloaded ${result.pageCount} pages`);
      }
    } catch (error) {
      console.error("Export error:", error);
      closeModal();
      alert(`Export failed: ${getErrorMessage(error)}`);
      updateStatus(`Error: ${getErrorMessage(error)}`);
    } finally {
      if (exportButton) {
        setButtonLoading(exportButton, false, "Export to Markdown");
      }
    }
  }
  function addExportButton() {
    if (document.getElementById("md-export-trigger")) return;
    if (!getCurrentPageId()) return;
    const actionMenu = document.getElementById("action-menu-link");
    if (!(actionMenu == null ? void 0 : actionMenu.parentElement)) return;
    exportButton = createButton("Export to Markdown", "aui-button", startExport);
    exportButton.id = "md-export-trigger";
    const status = createStatus();
    actionMenu.parentElement.insertBefore(exportButton, actionMenu.nextSibling);
    actionMenu.parentElement.insertBefore(status, exportButton.nextSibling);
  }
  function init() {
    addExportButton();
    let lastHref = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        setTimeout(addExportButton, 500);
      } else if (!document.getElementById("md-export-trigger") && document.getElementById("action-menu-link")) {
        setTimeout(addExportButton, 200);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();