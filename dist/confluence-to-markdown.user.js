// ==UserScript==
// @name         Confluence to Markdown Exporter
// @namespace    https://github.com/WhiteBite/confluence-to-markdown
// @version      2.5.0
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

(r=>{if(typeof GM_addStyle=="function"){GM_addStyle(r);return}const e=document.createElement("style");e.textContent=r,document.head.append(e)})(` :root{--md-primary: #0052CC;--md-primary-hover: #0065FF;--md-primary-light: #DEEBFF;--md-primary-dark: #003D99;--md-success: #00875A;--md-success-light: #E3FCEF;--md-danger: #DE350B;--md-danger-light: #FFEBE6;--md-warning: #FF991F;--md-warning-light: #FFF7E6;--md-text: #172B4D;--md-text-subtle: #5E6C84;--md-text-muted: #97A0AF;--md-bg: #FFFFFF;--md-bg-subtle: #F4F5F7;--md-bg-hover: #EBECF0;--md-border: #DFE1E6;--md-shadow: 0 8px 32px rgba(9, 30, 66, .25);--md-shadow-sm: 0 1px 3px rgba(9, 30, 66, .12);--md-shadow-lg: 0 12px 48px rgba(9, 30, 66, .3);--md-radius: .375rem;--md-radius-lg: .75rem;--md-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;--md-transition: .15s ease;--md-modal-width: 56.25rem;--md-modal-height: 40.625rem;--md-header-height: 3.5rem;--md-footer-height: 4rem;--md-left-column: 38%;--md-right-column: 62%}#md-export-modal{position:fixed;top:0;right:0;bottom:0;left:0;background-color:#091e428a;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);z-index:10000;display:flex;justify-content:center;align-items:center;padding:1.5rem;box-sizing:border-box;font-family:var(--md-font);animation:fadeIn .2s ease}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}@keyframes slideUp{0%{opacity:0;transform:translateY(1.25rem) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.md-modal-content{background-color:var(--md-bg);border-radius:var(--md-radius-lg);width:var(--md-modal-width);max-width:95vw;height:var(--md-modal-height);max-height:90vh;display:grid;grid-template-rows:var(--md-header-height) 1fr var(--md-footer-height);box-shadow:var(--md-shadow-lg);overflow:hidden;position:relative;animation:slideUp .25s ease}.md-modal-header{display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem;border-bottom:1px solid var(--md-border);background:var(--md-bg);height:var(--md-header-height)}.md-header-title{display:flex;align-items:center;gap:.5rem}.md-modal-header h3{margin:0;color:var(--md-text);font-size:1.125rem;font-weight:600}.md-modal-header .subtitle{display:none}.md-header-actions{display:flex;align-items:center;gap:.25rem}.md-btn-icon{width:2rem;height:2rem;padding:0;border:none;background:transparent;border-radius:var(--md-radius);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-subtle);transition:all var(--md-transition)}.md-btn-icon:hover{background:var(--md-bg-subtle);color:var(--md-text)}.md-btn-icon svg{width:1.25rem;height:1.25rem;fill:currentColor}.md-btn-icon.spinning svg{animation:spin 1s linear infinite}@keyframes spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.md-page-count{background:var(--md-bg-subtle);padding:.125rem .5rem;border-radius:.625rem;font-size:.75rem;color:var(--md-text-muted);margin-left:.5rem}.md-modal-body{display:grid;grid-template-columns:var(--md-left-column) var(--md-right-column);overflow:hidden}.md-source-panel{display:flex;flex-direction:column;border-right:1px solid var(--md-border);background:var(--md-bg-subtle);overflow:hidden}.md-search-bar{display:flex;align-items:center;padding:.625rem 1rem;background:var(--md-bg);border-bottom:1px solid var(--md-border);gap:.5rem;flex-shrink:0}.md-search-icon{color:var(--md-text-muted);display:flex;flex-shrink:0}.md-search-icon svg{width:1rem;height:1rem;fill:currentColor}.md-search-bar input{flex:1;border:none;outline:none;font-size:.8125rem;font-family:var(--md-font);color:var(--md-text);background:transparent;min-width:0}.md-search-bar input::placeholder{color:var(--md-text-muted)}.md-search-clear{width:1.375rem;height:1.375rem;padding:0;border:none;background:var(--md-bg-subtle);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);transition:all var(--md-transition);flex-shrink:0}.md-search-clear:hover{background:var(--md-bg-hover);color:var(--md-text)}.md-search-clear svg{width:.75rem;height:.75rem;fill:currentColor}.md-controls{display:flex;gap:.375rem;padding:.5rem 1rem;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);flex-shrink:0;flex-wrap:wrap;align-items:center}.md-controls-divider{width:1px;height:1.25rem;background:var(--md-border);margin:0 .25rem}.md-segmented-control{display:flex;background:var(--md-bg);border:1px solid var(--md-border);border-radius:var(--md-radius);padding:.125rem;gap:.125rem}.md-segment{padding:.25rem .625rem;background:transparent;border:none;border-radius:calc(var(--md-radius) - .125rem);font-size:.6875rem;font-weight:500;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);font-family:var(--md-font);white-space:nowrap}.md-segment:hover{background:var(--md-bg-hover);color:var(--md-text)}.md-segment.active{background:var(--md-primary);color:#fff}.md-segment .count{margin-left:.25rem;opacity:.7}.md-tree-container{flex:1;overflow-y:auto;padding:.5rem;min-height:0}.md-tree ul{list-style:none;padding:0;margin:0}.md-tree ul ul{margin-left:1rem;padding-left:.75rem;border-left:1px solid var(--md-border)}.md-tree li{margin:0;transition:opacity var(--md-transition)}.md-tree li.hidden{display:none}.md-tree li.highlight>.md-tree-item{background:var(--md-primary-light)}.md-tree-item{display:flex;align-items:center;padding:.375rem .5rem;margin:.0625rem 0;border-radius:var(--md-radius);cursor:pointer;transition:background-color var(--md-transition);gap:.375rem}.md-tree-item:hover{background-color:var(--md-bg-hover)}.md-tree-toggler{width:1.125rem;height:1.125rem;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);flex-shrink:0;transition:transform var(--md-transition);border-radius:.25rem}.md-tree-toggler:hover{background:var(--md-bg)}.md-tree-toggler.expanded{transform:rotate(90deg)}.md-tree-toggler svg{width:.875rem;height:.875rem;fill:currentColor}.md-tree-toggler.empty{visibility:hidden}.md-tree-checkbox{width:.875rem;height:.875rem;margin:0;cursor:pointer;accent-color:var(--md-primary);flex-shrink:0}.md-tree-icon{width:1rem;height:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}.md-tree-icon svg{width:.875rem;height:.875rem}.md-tree-icon.folder svg{fill:#ffab00}.md-tree-icon.page svg{fill:var(--md-primary)}.md-tree-label{flex:1;color:var(--md-text);font-size:.8125rem;line-height:1.4;-webkit-user-select:none;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.md-tree-label.error{color:var(--md-danger)}.md-child-count{font-size:.625rem;color:var(--md-text-muted);background:var(--md-bg);padding:.0625rem .375rem;border-radius:.5rem;margin-left:.25rem}.md-error-badge{font-size:.625rem;color:var(--md-danger);background:var(--md-danger-light);padding:.125rem .375rem;border-radius:.25rem;font-weight:500}.md-tree ul.collapsed{display:none}.md-stats-bar{display:flex;align-items:center;justify-content:space-between;padding:.5rem 1rem;background:var(--md-bg);border-top:1px solid var(--md-border);font-size:.6875rem;color:var(--md-text-muted);flex-shrink:0}.md-stats-bar .stat{display:flex;align-items:center;gap:.25rem}.md-stats-bar .stat-value{font-weight:600;color:var(--md-text-subtle)}.md-stats-bar .stat-icon{font-size:.875rem}.md-selection-count{font-size:.6875rem;color:var(--md-text-subtle);padding:.25rem .5rem;background:var(--md-primary-light);border-radius:var(--md-radius);font-weight:500}.md-config-panel{display:flex;flex-direction:column;overflow:hidden;background:var(--md-bg)}.md-config-tabs{display:flex;border-bottom:1px solid var(--md-border);background:var(--md-bg-subtle);flex-shrink:0}.md-config-tab{flex:1;padding:.75rem 1rem;border:none;background:transparent;font-size:.8125rem;font-weight:500;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);font-family:var(--md-font);position:relative}.md-config-tab:hover{color:var(--md-text);background:var(--md-bg-hover)}.md-config-tab.active{color:var(--md-primary);background:var(--md-bg)}.md-config-tab.active:after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--md-primary)}.md-config-content{flex:1;overflow-y:auto;padding:1rem 1.25rem}.md-settings-section{margin-bottom:1.25rem}.md-settings-section:last-child{margin-bottom:0}.md-settings-title{font-size:.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem}.md-settings-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem}.md-settings-grid.single-column{grid-template-columns:1fr}.md-checkbox-label{display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.8125rem;color:var(--md-text);padding:.375rem .5rem;border-radius:var(--md-radius);transition:background-color var(--md-transition)}.md-checkbox-label:hover{background:var(--md-bg-subtle)}.md-checkbox-label input[type=checkbox]{width:.875rem;height:.875rem;accent-color:var(--md-primary);cursor:pointer;flex-shrink:0}.md-checkbox-label.md-indent{margin-left:1.5rem}.md-radio-group{display:flex;gap:1rem;padding:.375rem .5rem}.md-radio-group label{display:flex;align-items:center;gap:.25rem;font-size:.8125rem;color:var(--md-text);cursor:pointer}.md-radio-group input[type=radio]{accent-color:var(--md-primary);cursor:pointer}.md-option-group{display:flex;align-items:center;gap:.75rem;padding:.375rem .5rem}.md-option-label{font-size:.8125rem;color:var(--md-text-subtle);white-space:nowrap}.md-preset-buttons{display:flex;gap:.5rem;margin-bottom:1rem}.md-preset-btn{flex:1;padding:.625rem .75rem;border:2px solid var(--md-border);border-radius:var(--md-radius);background:var(--md-bg);cursor:pointer;font-size:.8125rem;font-weight:500;font-family:var(--md-font);color:var(--md-text-subtle);transition:all var(--md-transition);text-align:center}.md-preset-btn:hover{border-color:var(--md-primary);color:var(--md-primary);background:var(--md-primary-light)}.md-preset-btn.active{border-color:var(--md-primary);background:var(--md-primary);color:#fff}.md-preset-mini{display:flex;gap:.375rem}.md-btn-xs{padding:.25rem .5rem;font-size:.6875rem;border-radius:.25rem;background:var(--md-bg-subtle);border:1px solid var(--md-border);color:var(--md-text-subtle);cursor:pointer;font-family:var(--md-font);transition:all var(--md-transition)}.md-btn-xs:hover{background:var(--md-primary-light);border-color:var(--md-primary);color:var(--md-primary)}.md-convert-warning{margin:.5rem 0 .5rem 1.5rem;padding:.5rem .75rem;background:var(--md-warning-light);border:1px solid var(--md-warning);border-radius:var(--md-radius);font-size:.75rem;color:var(--md-text);line-height:1.4}.md-convert-warning strong{color:var(--md-primary)}.md-modal-footer{display:flex;justify-content:space-between;align-items:center;padding:0 1.25rem;border-top:1px solid var(--md-border);background:var(--md-bg);height:var(--md-footer-height);flex-shrink:0}.md-footer-left,.md-footer-right{display:flex;align-items:center;gap:.5rem}.md-btn{padding:.5rem .875rem;border-radius:var(--md-radius);border:none;cursor:pointer;font-size:.8125rem;font-weight:500;font-family:var(--md-font);transition:all var(--md-transition);display:inline-flex;align-items:center;gap:.375rem;position:relative}.md-btn svg{width:1rem;height:1rem;fill:currentColor}.md-btn-primary{background-color:var(--md-primary);color:#fff}.md-btn-primary:hover:not(:disabled){background-color:var(--md-primary-hover)}.md-btn-primary:disabled{background-color:#b3d4ff;cursor:not-allowed}.md-btn-secondary{background-color:var(--md-bg);color:var(--md-text);border:1px solid var(--md-border)}.md-btn-secondary:hover:not(:disabled){background-color:var(--md-bg-subtle);border-color:var(--md-text-muted)}.md-btn-secondary:disabled{opacity:.6;cursor:not-allowed}.md-btn-link{background:none;color:var(--md-text-subtle);padding:.5rem .75rem}.md-btn-link:hover{color:var(--md-text);background-color:var(--md-bg-subtle)}.md-btn-sm{padding:.3125rem .625rem;font-size:.75rem}.md-btn-badge{background:#fff3;padding:.0625rem .375rem;border-radius:.5rem;font-size:.6875rem;min-width:1.125rem;text-align:center}.md-btn-badge.has-count{background:#ffffff4d}.md-help-btn{width:1.75rem;height:1.75rem;padding:0;border:1px solid var(--md-border);background:var(--md-bg);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);font-size:.75rem;font-weight:600;transition:all var(--md-transition)}.md-help-btn:hover{background:var(--md-bg-subtle);color:var(--md-text);border-color:var(--md-text-muted)}.md-shortcuts-tooltip{display:none;position:absolute;bottom:100%;left:0;margin-bottom:.5rem;padding:.75rem 1rem;background:var(--md-bg);border:1px solid var(--md-border);border-radius:var(--md-radius);box-shadow:var(--md-shadow-sm);font-size:.6875rem;color:var(--md-text-muted);white-space:nowrap;z-index:100}.md-help-btn:hover+.md-shortcuts-tooltip,.md-shortcuts-tooltip:hover{display:block}.md-shortcut{display:flex;align-items:center;gap:.25rem;margin-bottom:.25rem}.md-shortcut:last-child{margin-bottom:0}.md-shortcut kbd{background:var(--md-bg-subtle);border:1px solid var(--md-border);border-radius:.1875rem;padding:.0625rem .3125rem;font-family:monospace;font-size:.625rem}.md-progress-section{padding:1rem 1.25rem;background:var(--md-bg-subtle);border-top:1px solid var(--md-border);flex-shrink:0}.md-progress-label{display:flex;justify-content:space-between;margin-bottom:.5rem;font-size:.8125rem;color:var(--md-text-subtle)}.md-progress-bar{height:.375rem;background:var(--md-border);border-radius:.1875rem;overflow:hidden}.md-progress-fill{height:100%;background:linear-gradient(90deg,var(--md-primary),var(--md-primary-hover));border-radius:.1875rem;transition:width .3s ease;width:0%}.md-progress-fill.indeterminate{width:30%;animation:indeterminate 1.5s ease-in-out infinite}@keyframes indeterminate{0%{transform:translate(-100%)}to{transform:translate(400%)}}.md-progress-current{display:flex;align-items:center;gap:.5rem;margin-top:.5rem;padding:.375rem .625rem;background:var(--md-bg);border-radius:var(--md-radius);border:1px solid var(--md-border);font-size:.75rem;color:var(--md-text-subtle);overflow:hidden}.md-progress-page-icon{flex-shrink:0}.md-progress-page-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--md-text)}.md-toast{position:absolute;bottom:5rem;left:50%;transform:translate(-50%) translateY(1.25rem);background:var(--md-success);color:#fff;padding:.75rem 1.25rem;border-radius:var(--md-radius);display:flex;align-items:center;gap:.5rem;font-size:.875rem;font-weight:500;box-shadow:var(--md-shadow-sm);opacity:0;transition:all .3s ease;z-index:10}.md-toast.show{opacity:1;transform:translate(-50%) translateY(0)}.md-toast svg{width:1.125rem;height:1.125rem;fill:currentColor}.md-skeleton{background:linear-gradient(90deg,var(--md-bg-subtle) 25%,var(--md-bg-hover) 50%,var(--md-bg-subtle) 75%);background-size:200% 100%;animation:skeleton-loading 1.5s infinite;border-radius:var(--md-radius)}@keyframes skeleton-loading{0%{background-position:200% 0}to{background-position:-200% 0}}.md-skeleton-text{height:.875rem;margin:.5rem 0}.md-skeleton-text.short{width:60%}.md-skeleton-text.medium{width:80%}@keyframes shake{0%,to{transform:translate(0)}20%,60%{transform:translate(-.3125rem)}40%,80%{transform:translate(.3125rem)}}.shake{animation:shake .5s ease;background:var(--md-danger-light)!important;border-color:var(--md-danger)!important;color:var(--md-danger)!important}.md-tree-container::-webkit-scrollbar,.md-config-content::-webkit-scrollbar{width:.5rem}.md-tree-container::-webkit-scrollbar-track,.md-config-content::-webkit-scrollbar-track{background:var(--md-bg-subtle);border-radius:.25rem}.md-tree-container::-webkit-scrollbar-thumb,.md-config-content::-webkit-scrollbar-thumb{background:var(--md-border);border-radius:.25rem}.md-tree-container::-webkit-scrollbar-thumb:hover,.md-config-content::-webkit-scrollbar-thumb:hover{background:var(--md-text-muted)}#md-export-modal[data-theme=dark]{--md-primary: #4C9AFF;--md-primary-hover: #79B8FF;--md-primary-light: #1C2B41;--md-primary-dark: #0052CC;--md-success: #36B37E;--md-success-light: #1C3829;--md-danger: #FF5630;--md-danger-light: #3D1F1F;--md-warning: #FFAB00;--md-warning-light: #3D3519;--md-text: #E6E6E6;--md-text-subtle: #A6A6A6;--md-text-muted: #6B6B6B;--md-bg: #1D2125;--md-bg-subtle: #22272B;--md-bg-hover: #2D2D2D;--md-border: #3C3C3C}#md-export-modal[data-theme=dark]{background-color:#000000b3}#md-export-modal[data-theme=dark] .md-tree-icon.folder svg{fill:#ffd54f}.md-settings-panel{border-top:1px solid var(--md-border);flex-shrink:0}.md-settings-toggle{width:100%;padding:.75rem 1.25rem;border:none;background:var(--md-bg-subtle);cursor:pointer;display:flex;align-items:center;gap:.5rem;font-size:.8125rem;font-weight:500;color:var(--md-text-subtle);font-family:var(--md-font);transition:background-color var(--md-transition)}.md-settings-toggle:hover{background:var(--md-bg-hover)}.md-settings-toggle svg{width:1.125rem;height:1.125rem;fill:currentColor}.md-settings-toggle .md-chevron{margin-left:auto;transition:transform .2s ease}.md-settings-toggle .md-chevron.expanded{transform:rotate(90deg)}.md-settings-content{padding:1rem 1.25rem;background:var(--md-bg);display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}.md-settings-content.md-single-column{grid-template-columns:1fr}.md-filter-chips{display:flex;gap:.375rem;flex-wrap:wrap;margin-left:auto}.md-filter-chip{padding:.25rem .625rem;background:var(--md-bg);border:1px solid var(--md-border);border-radius:.75rem;font-size:.6875rem;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);display:flex;align-items:center;gap:.25rem}.md-filter-chip:hover{border-color:var(--md-primary);color:var(--md-primary)}.md-filter-chip.active{background:var(--md-primary);border-color:var(--md-primary);color:#fff}.md-filter-chip .count{background:#0000001a;padding:.0625rem .3125rem;border-radius:.5rem;font-size:.625rem}.md-filter-chip.active .count{background:#fff3}.md-stats-section{padding:.75rem 1.5rem;background:linear-gradient(135deg,var(--md-bg-subtle) 0%,var(--md-bg) 100%);border-bottom:1px solid var(--md-border)}.md-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.md-stat-item{display:flex;flex-direction:column;align-items:center;padding:.5rem;background:var(--md-bg);border-radius:var(--md-radius);border:1px solid var(--md-border);transition:all var(--md-transition)}.md-stat-item:hover{border-color:var(--md-primary);box-shadow:0 .125rem .5rem #0052cc1a}.md-stat-icon{font-size:1.25rem;margin-bottom:.25rem}.md-stat-value{font-size:1.125rem;font-weight:600;color:var(--md-text)}.md-stat-label{font-size:.6875rem;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:.5px}.md-shortcuts-hint{display:none}.md-header-row{display:flex;justify-content:space-between;align-items:flex-start}.md-obsidian-options{padding-top:.5rem;border-top:1px solid var(--md-border);margin-top:.5rem}#md-export-status{margin-left:.75rem;color:var(--md-text-subtle);font-size:.8125rem;font-family:var(--md-font)}#md-export-trigger{margin-left:.625rem}.md-hint{font-size:.75rem;color:var(--md-text-muted)}@media (max-width: 768px){:root{--md-modal-width: 100%;--md-modal-height: auto;--md-header-height: 3rem;--md-footer-height: auto}#md-export-modal{padding:.75rem}.md-modal-content{max-height:95vh;grid-template-rows:var(--md-header-height) 1fr auto}.md-modal-body{grid-template-columns:1fr;grid-template-rows:auto 1fr}.md-source-panel{border-right:none;border-bottom:1px solid var(--md-border);max-height:40vh}.md-config-panel{max-height:50vh}.md-modal-header{padding:0 1rem}.md-modal-header h3{font-size:1rem}.md-controls{padding:.5rem .75rem}.md-segmented-control{flex-wrap:wrap}.md-tree-container{max-height:25vh;min-height:8rem}.md-config-content{padding:.75rem 1rem}.md-settings-grid{grid-template-columns:1fr}.md-modal-footer{flex-direction:column;padding:.75rem 1rem;gap:.75rem;height:auto}.md-footer-left,.md-footer-right{width:100%;justify-content:center}.md-footer-right{flex-direction:column;gap:.5rem}.md-footer-right .md-btn{width:100%;justify-content:center}.md-help-btn{display:none}}@media (max-width: 480px){#md-export-modal{padding:.5rem}.md-modal-header h3{font-size:.9375rem}.md-btn-icon{width:1.75rem;height:1.75rem}.md-btn-icon svg{width:1rem;height:1rem}.md-tree-item{padding:.3125rem .375rem;font-size:.75rem}.md-checkbox-label{font-size:.75rem}.md-btn{padding:.625rem 1rem;font-size:.875rem}.md-preset-btn{padding:.5rem;font-size:.75rem}}@media (max-height: 700px){:root{--md-header-height: 3rem;--md-footer-height: 3.5rem}.md-modal-content{max-height:95vh}.md-modal-header h3{font-size:1rem}.md-tree-container{min-height:6rem}.md-config-content{padding:.75rem 1rem}.md-settings-section{margin-bottom:.75rem}.md-checkbox-label{padding:.25rem .375rem}.md-btn{padding:.375rem .75rem}}@media (max-height: 600px){:root{--md-header-height: 2.75rem;--md-footer-height: 3rem}.md-modal-content{max-height:98vh}.md-modal-header h3{font-size:.9375rem}.md-page-count{display:none}.md-controls{padding:.375rem .75rem}.md-tree-container{min-height:5rem}.md-tree-item{padding:.25rem .375rem;font-size:.75rem}.md-config-content{padding:.5rem .75rem}.md-settings-title{font-size:.625rem;margin-bottom:.5rem}.md-checkbox-label{font-size:.75rem;padding:.1875rem .25rem}.md-preset-btn{padding:.375rem .5rem;font-size:.75rem}.md-btn{padding:.3125rem .625rem;font-size:.75rem}.md-stats-bar{display:none}}@media (max-height: 500px){.md-modal-content{max-height:98vh}.md-modal-header h3{font-size:.875rem}.md-search-bar{padding:.375rem .75rem}.md-tree-container{min-height:4rem;max-height:30vh}.md-config-tabs{display:none}.md-settings-section{margin-bottom:.5rem}.md-modal-footer{padding:0 .75rem}}@media (max-height: 500px) and (orientation: landscape){.md-modal-body{grid-template-columns:45% 55%}.md-source-panel,.md-config-panel{max-height:none}}.md-modal-content.with-preview{--md-modal-width: 75rem}.md-split-view{display:flex;flex:1;min-height:0;overflow:hidden}.md-split-left{flex:1;display:flex;flex-direction:column;border-right:1px solid var(--md-border);min-width:0}.md-split-right{flex:1;display:flex;flex-direction:column;min-width:0}.md-preview-header{padding:.75rem 1rem;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);font-size:.8125rem;font-weight:500;color:var(--md-text-subtle);display:flex;align-items:center;gap:.5rem}.md-preview-content{flex:1;overflow-y:auto;padding:1rem;font-family:SF Mono,Monaco,Cascadia Code,monospace;font-size:.75rem;line-height:1.5;white-space:pre-wrap;word-break:break-word;background:var(--md-bg);color:var(--md-text)}.md-preview-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--md-text-muted);text-align:center;padding:1.5rem}.md-preview-placeholder .icon{font-size:3rem;margin-bottom:.75rem;opacity:.5}.md-preview-content .mermaid-block{background:var(--md-bg-subtle);border:1px solid var(--md-border);border-radius:var(--md-radius);padding:.75rem;margin:.5rem 0}.md-preview-content .mermaid-header{color:var(--md-primary);font-weight:500;margin-bottom:.5rem}@media (max-width: 800px){.md-split-view{flex-direction:column}.md-split-left,.md-split-right{border-right:none;border-bottom:1px solid var(--md-border)}}.md-history-section{padding:.5rem 1.5rem;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border)}.md-history-title{font-size:.6875rem;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem}.md-history-list{display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.25rem}.md-history-item{flex-shrink:0;padding:.375rem .75rem;background:var(--md-bg);border:1px solid var(--md-border);border-radius:var(--md-radius);font-size:.75rem;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);display:flex;align-items:center;gap:.375rem}.md-history-item:hover{border-color:var(--md-primary);color:var(--md-primary)}.md-history-item .date{color:var(--md-text-muted);font-size:.625rem}.md-progress-details{margin-top:.75rem;max-height:7.5rem;overflow-y:auto;font-size:.75rem}.md-progress-item{display:flex;align-items:center;gap:.5rem;padding:.25rem 0;color:var(--md-text-subtle)}.md-progress-item.done{color:var(--md-success)}.md-progress-item.active{color:var(--md-primary);font-weight:500}.md-progress-item.error{color:var(--md-danger)}.md-progress-item .status-icon{width:1rem;text-align:center}.md-header-subtitle{display:flex;align-items:center;gap:.375rem;font-size:.75rem;color:var(--md-text-muted);margin:0;padding:0}.md-header-subtitle .icon{width:.875rem;height:.875rem;fill:currentColor}.md-header-row{display:flex;justify-content:space-between;align-items:center;width:100%}.md-modal-header{flex-direction:column;justify-content:center;gap:.25rem}.md-source-toolbar{display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);gap:.5rem;flex-shrink:0}.md-filter-tabs{display:flex;background:var(--md-bg);border:1px solid var(--md-border);border-radius:var(--md-radius);padding:.125rem;gap:.125rem}.md-filter-tab{padding:.25rem .625rem;background:transparent;border:none;border-radius:calc(var(--md-radius) - .125rem);font-size:.6875rem;font-weight:500;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);font-family:var(--md-font);white-space:nowrap}.md-filter-tab:hover{background:var(--md-bg-hover);color:var(--md-text)}.md-filter-tab.active{background:var(--md-primary);color:#fff}.md-tree-controls{display:flex;gap:.25rem}.md-btn-icon-sm{width:1.5rem;height:1.5rem;padding:0;border:1px solid var(--md-border);background:var(--md-bg);border-radius:var(--md-radius);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);transition:all var(--md-transition)}.md-btn-icon-sm:hover:not(:disabled){background:var(--md-bg-hover);color:var(--md-text);border-color:var(--md-text-muted)}.md-btn-icon-sm:disabled{opacity:.5;cursor:not-allowed}.md-btn-icon-sm svg{width:.875rem;height:.875rem;fill:currentColor}.md-status-bar{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.25rem;padding:.5rem .75rem;background:var(--md-bg);border-top:1px solid var(--md-border);font-size:.6875rem;color:var(--md-text-muted);flex-shrink:0}.md-status-item{display:flex;align-items:center;gap:.25rem}.md-status-icon{font-size:.75rem}.md-status-divider{color:var(--md-border);margin:0 .125rem}.md-config-panel{padding:1rem 1.25rem;overflow-y:auto}.md-config-section{margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--md-border)}.md-config-section:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}.md-config-label{display:block;font-size:.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem}.md-config-hint{font-size:.6875rem;color:var(--md-text-muted);margin-top:.375rem;margin-bottom:0}.md-select-wrapper{position:relative}.md-select{width:100%;padding:.5rem 2rem .5rem .75rem;border:1px solid var(--md-border);border-radius:var(--md-radius);background:var(--md-bg);font-size:.8125rem;font-family:var(--md-font);color:var(--md-text);cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%235E6C84'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .5rem center;background-size:1.25rem}.md-select:hover{border-color:var(--md-text-muted)}.md-select:focus{outline:none;border-color:var(--md-primary);box-shadow:0 0 0 2px var(--md-primary-light)}.md-section-header{display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem}.md-section-icon{font-size:1rem}.md-section-icon .icon{width:1rem;height:1rem;fill:var(--md-text-muted)}.md-section-title{font-size:.8125rem;font-weight:600;color:var(--md-text);flex:1}.md-toggle-switch{position:relative;display:inline-block;width:2.25rem;height:1.25rem}.md-toggle-switch input{opacity:0;width:0;height:0}.md-toggle-slider{position:absolute;cursor:pointer;top:0;right:0;bottom:0;left:0;background-color:var(--md-border);border-radius:.625rem;transition:all var(--md-transition)}.md-toggle-slider:before{position:absolute;content:"";height:.875rem;width:.875rem;left:.1875rem;bottom:.1875rem;background-color:#fff;border-radius:50%;transition:all var(--md-transition);box-shadow:var(--md-shadow-sm)}.md-toggle-switch input:checked+.md-toggle-slider{background-color:var(--md-primary)}.md-toggle-switch input:checked+.md-toggle-slider:before{transform:translate(1rem)}.md-card-select{display:flex;gap:.5rem;margin-bottom:.75rem}.md-card-option{flex:1;display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.625rem .5rem;border:2px solid var(--md-border);border-radius:var(--md-radius);background:var(--md-bg);cursor:pointer;transition:all var(--md-transition);font-family:var(--md-font)}.md-card-option:hover{border-color:var(--md-primary);background:var(--md-primary-light)}.md-card-option.active{border-color:var(--md-primary);background:var(--md-primary-light);color:var(--md-primary)}.md-card-icon{font-size:1.25rem}.md-card-label{font-size:.6875rem;font-weight:500;color:var(--md-text-subtle)}.md-card-option.active .md-card-label{color:var(--md-primary)}.md-inline-option{display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem}.md-option-label{font-size:.75rem;color:var(--md-text-subtle);white-space:nowrap}.md-toggle-group{display:flex;background:var(--md-bg-subtle);border:1px solid var(--md-border);border-radius:var(--md-radius);padding:.125rem}.md-toggle-btn{padding:.25rem .625rem;border:none;background:transparent;border-radius:calc(var(--md-radius) - .125rem);font-size:.6875rem;font-weight:500;color:var(--md-text-subtle);cursor:pointer;transition:all var(--md-transition);font-family:var(--md-font)}.md-toggle-btn:hover{color:var(--md-text)}.md-toggle-btn.active{background:var(--md-bg);color:var(--md-primary);box-shadow:var(--md-shadow-sm)}.md-options-grid{display:grid;gap:.375rem}.md-options-2col{grid-template-columns:repeat(2,1fr)}.md-options-3col{grid-template-columns:repeat(3,1fr)}.md-checkbox-compact{display:flex;align-items:center;gap:.375rem;cursor:pointer;font-size:.75rem;color:var(--md-text);padding:.25rem .375rem;border-radius:var(--md-radius);transition:background-color var(--md-transition)}.md-checkbox-compact:hover{background:var(--md-bg-subtle)}.md-checkbox-compact input[type=checkbox]{width:.875rem;height:.875rem;accent-color:var(--md-primary);cursor:pointer;flex-shrink:0;margin:0}.md-diagrams-options{padding-top:.5rem}.md-btn-text{display:inline-flex;align-items:center;gap:.375rem;padding:.375rem .625rem;border:none;background:transparent;color:var(--md-text-subtle);font-size:.75rem;font-family:var(--md-font);cursor:pointer;border-radius:var(--md-radius);transition:all var(--md-transition)}.md-btn-text:hover{background:var(--md-bg-subtle);color:var(--md-text)}.md-btn-text .icon{width:.875rem;height:.875rem;fill:currentColor}@media (max-width: 768px){.md-source-toolbar{flex-wrap:wrap}.md-filter-tabs{order:2;width:100%;justify-content:center}.md-tree-controls{order:1}.md-status-bar{font-size:.625rem}.md-card-select{flex-direction:column}.md-options-2col{grid-template-columns:1fr}}@media (max-height: 600px){.md-status-bar{padding:.375rem .5rem}.md-config-section{margin-bottom:.75rem;padding-bottom:.75rem}}.md-checkbox-compact.disabled{opacity:.5;pointer-events:none}.md-checkbox-compact.disabled input{cursor:not-allowed}.md-diagrams-options.disabled{opacity:.4;pointer-events:none}.md-card-option.active{border-color:var(--md-primary);background:#0052cc1a;color:var(--md-primary)}#md-export-modal[data-theme=dark] .md-card-option.active{background:#4c9aff26}.md-status-bar{color:var(--md-text-muted);opacity:.85}.md-status-item{font-size:.6875rem}.md-btn-secondary:disabled{opacity:.5;cursor:not-allowed}.md-btn-secondary:disabled:hover{background-color:var(--md-bg);border-color:var(--md-border)}.md-tree-container{scrollbar-width:thin;scrollbar-color:var(--md-border) transparent}.md-tree-item .md-tree-icon.error svg,.md-tree-label.error+.md-tree-icon svg{fill:var(--md-warning)}.md-tree li[data-has-error=true] .md-tree-icon svg{fill:var(--md-warning)}.md-tree-label.draft:after{content:" \u270F\uFE0F";font-size:.625rem;opacity:.6}.md-btn-lang{min-width:2rem;height:2rem;padding:0 .375rem;border:1px solid var(--md-border);background:var(--md-bg);border-radius:var(--md-radius);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-subtle);font-size:.6875rem;font-weight:600;font-family:var(--md-font);text-transform:uppercase;letter-spacing:.5px;transition:all var(--md-transition)}.md-btn-lang:hover{background:var(--md-bg-subtle);color:var(--md-text);border-color:var(--md-text-muted)}.md-btn-lang:active{background:var(--md-primary-light);border-color:var(--md-primary);color:var(--md-primary)}.md-status-approx{opacity:.6} `);

(function () {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
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
    var _a2;
    if (typeof GM_xmlhttpRequest !== "undefined") {
      return "tampermonkey";
    }
    if (typeof chrome !== "undefined" && ((_a2 = chrome.runtime) == null ? void 0 : _a2.id)) {
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
    var _a2;
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
      if (typeof chrome !== "undefined" && ((_a2 = chrome.runtime) == null ? void 0 : _a2.sendMessage)) {
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
    var _a2, _b2;
    const baseUrl = getBaseUrl();
    const children = [];
    let start = 0;
    let hasMore = true;
    while (hasMore) {
      const url = `${baseUrl}/rest/api/content/${pageId}/child/page?limit=${PAGE_LIMIT}&start=${start}`;
      const response = await fetchJson$1(url);
      if ((_a2 = response.results) == null ? void 0 : _a2.length) {
        children.push(...response.results);
      }
      hasMore = ((_b2 = response.results) == null ? void 0 : _b2.length) === PAGE_LIMIT;
      start += PAGE_LIMIT;
    }
    return children;
  }
  async function fetchAllDescendants(rootPageId) {
    var _a2, _b2;
    const baseUrl = getBaseUrl();
    const descendants = [];
    let start = 0;
    const limit = 200;
    let hasMore = true;
    while (hasMore) {
      const cql = encodeURIComponent(`ancestor=${rootPageId}`);
      const url = `${baseUrl}/rest/api/content/search?cql=${cql}&expand=ancestors&limit=${limit}&start=${start}`;
      try {
        const response = await fetchJson$1(url);
        if ((_a2 = response.results) == null ? void 0 : _a2.length) {
          descendants.push(...response.results);
        }
        hasMore = ((_b2 = response.results) == null ? void 0 : _b2.length) === limit;
        start += limit;
      } catch (error) {
        console.error("[API] CQL search failed:", error);
        throw error;
      }
    }
    return descendants;
  }
  const TREE_CONCURRENCY = 8;
  function buildTreeFromDescendants(rootPage, descendants) {
    const pageMap = /* @__PURE__ */ new Map();
    const rootNode = {
      id: rootPage.id,
      title: rootPage.title,
      level: 0,
      parentId: null,
      children: [],
      error: false
    };
    pageMap.set(rootPage.id, rootNode);
    for (const page of descendants) {
      const ancestors = page.ancestors || [];
      const parentId = ancestors.length > 0 ? ancestors[ancestors.length - 1].id : rootPage.id;
      const rootIndex = ancestors.findIndex((a) => a.id === rootPage.id);
      const level = rootIndex >= 0 ? ancestors.length - rootIndex : 1;
      const node = {
        id: page.id,
        title: page.title,
        level,
        parentId,
        children: [],
        error: false
      };
      pageMap.set(page.id, node);
    }
    for (const page of descendants) {
      const node = pageMap.get(page.id);
      if (!node) continue;
      const parent = pageMap.get(node.parentId || rootPage.id);
      if (parent && parent.id !== node.id) {
        parent.children.push(node);
      }
    }
    function sortChildren(node) {
      node.children.sort((a, b) => a.title.localeCompare(b.title));
      node.children.forEach(sortChildren);
    }
    sortChildren(rootNode);
    return rootNode;
  }
  async function buildPageTree(rootPageId, onStatus) {
    onStatus == null ? void 0 : onStatus("Loading page tree...");
    try {
      const [rootPage, descendants] = await Promise.all([
        fetchPage(rootPageId),
        fetchAllDescendants(rootPageId)
      ]);
      onStatus == null ? void 0 : onStatus(`Found ${descendants.length + 1} pages`);
      if (DEBUG) ;
      return buildTreeFromDescendants(
        { id: rootPage.id, title: rootPage.title },
        descendants
      );
    } catch (error) {
      console.warn("[Tree] CQL search failed, falling back to recursive:", error);
      onStatus == null ? void 0 : onStatus("Scanning pages (slow mode)...");
      return buildPageTreeRecursive(rootPageId, onStatus);
    }
  }
  async function buildPageTreeRecursive(rootPageId, onStatus) {
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
      var output = process.call(this, new RootNode(input, this.options));
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
  function process(parentNode) {
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
    var content = process.call(this, node);
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
    const cleanLabel = cleanMermaidLabel(label);
    const safeLabel = cleanLabel || "node";
    switch (shape) {
      case "rectangle":
        return `["${safeLabel}"]`;
      case "rounded-rectangle":
        return `("${safeLabel}")`;
      case "circle":
        return `(("${safeLabel}"))`;
      case "ellipse":
        return `(["${safeLabel}"])`;
      case "diamond":
        return `{"${safeLabel}"}`;
      case "hexagon":
        return `{{"${safeLabel}"}}`;
      case "parallelogram":
        return `[/"${safeLabel}"/]`;
      case "trapezoid":
        return `[/"${safeLabel}"\\]`;
      case "cylinder":
        return `[("${safeLabel}")]`;
      case "note":
        return `["${safeLabel}"]`;
      default:
        return `["${safeLabel}"]`;
    }
  }
  function cleanMermaidLabel(label) {
    if (!label) return "";
    let clean = label.replace(/<[^>]*>/g, "");
    clean = clean.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
    clean = clean.replace(/"/g, "'").replace(/\[/g, "(").replace(/\]/g, ")").replace(/\{/g, "(").replace(/\}/g, ")").replace(/\|/g, "/").replace(/#/g, "").replace(/\n/g, " ").replace(/\r/g, "");
    clean = clean.trim().replace(/\s+/g, " ");
    return clean;
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
    var _a2, _b2, _c, _d;
    return {
      x: ((_a2 = node.position) == null ? void 0 : _a2.x) ?? 0,
      y: ((_b2 = node.position) == null ? void 0 : _b2.y) ?? 0,
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
  /*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
  const Z_FIXED$1 = 4;
  const Z_BINARY = 0;
  const Z_TEXT = 1;
  const Z_UNKNOWN$1 = 2;
  function zero$1(buf) {
    let len = buf.length;
    while (--len >= 0) {
      buf[len] = 0;
    }
  }
  const STORED_BLOCK = 0;
  const STATIC_TREES = 1;
  const DYN_TREES = 2;
  const MIN_MATCH$1 = 3;
  const MAX_MATCH$1 = 258;
  const LENGTH_CODES$1 = 29;
  const LITERALS$1 = 256;
  const L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
  const D_CODES$1 = 30;
  const BL_CODES$1 = 19;
  const HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
  const MAX_BITS$1 = 15;
  const Buf_size = 16;
  const MAX_BL_BITS = 7;
  const END_BLOCK = 256;
  const REP_3_6 = 16;
  const REPZ_3_10 = 17;
  const REPZ_11_138 = 18;
  const extra_lbits = (
    /* extra bits for each length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
  );
  const extra_dbits = (
    /* extra bits for each distance code */
    new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
  );
  const extra_blbits = (
    /* extra bits for each bit length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
  );
  const bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  const DIST_CODE_LEN = 512;
  const static_ltree = new Array((L_CODES$1 + 2) * 2);
  zero$1(static_ltree);
  const static_dtree = new Array(D_CODES$1 * 2);
  zero$1(static_dtree);
  const _dist_code = new Array(DIST_CODE_LEN);
  zero$1(_dist_code);
  const _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
  zero$1(_length_code);
  const base_length = new Array(LENGTH_CODES$1);
  zero$1(base_length);
  const base_dist = new Array(D_CODES$1);
  zero$1(base_dist);
  function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
    this.static_tree = static_tree;
    this.extra_bits = extra_bits;
    this.extra_base = extra_base;
    this.elems = elems;
    this.max_length = max_length;
    this.has_stree = static_tree && static_tree.length;
  }
  let static_l_desc;
  let static_d_desc;
  let static_bl_desc;
  function TreeDesc(dyn_tree, stat_desc) {
    this.dyn_tree = dyn_tree;
    this.max_code = 0;
    this.stat_desc = stat_desc;
  }
  const d_code = (dist) => {
    return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
  };
  const put_short = (s, w) => {
    s.pending_buf[s.pending++] = w & 255;
    s.pending_buf[s.pending++] = w >>> 8 & 255;
  };
  const send_bits = (s, value, length) => {
    if (s.bi_valid > Buf_size - length) {
      s.bi_buf |= value << s.bi_valid & 65535;
      put_short(s, s.bi_buf);
      s.bi_buf = value >> Buf_size - s.bi_valid;
      s.bi_valid += length - Buf_size;
    } else {
      s.bi_buf |= value << s.bi_valid & 65535;
      s.bi_valid += length;
    }
  };
  const send_code = (s, c, tree) => {
    send_bits(
      s,
      tree[c * 2],
      tree[c * 2 + 1]
      /*.Len*/
    );
  };
  const bi_reverse = (code, len) => {
    let res = 0;
    do {
      res |= code & 1;
      code >>>= 1;
      res <<= 1;
    } while (--len > 0);
    return res >>> 1;
  };
  const bi_flush = (s) => {
    if (s.bi_valid === 16) {
      put_short(s, s.bi_buf);
      s.bi_buf = 0;
      s.bi_valid = 0;
    } else if (s.bi_valid >= 8) {
      s.pending_buf[s.pending++] = s.bi_buf & 255;
      s.bi_buf >>= 8;
      s.bi_valid -= 8;
    }
  };
  const gen_bitlen = (s, desc) => {
    const tree = desc.dyn_tree;
    const max_code = desc.max_code;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const extra = desc.stat_desc.extra_bits;
    const base = desc.stat_desc.extra_base;
    const max_length = desc.stat_desc.max_length;
    let h;
    let n, m;
    let bits;
    let xbits;
    let f;
    let overflow = 0;
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      s.bl_count[bits] = 0;
    }
    tree[s.heap[s.heap_max] * 2 + 1] = 0;
    for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
      n = s.heap[h];
      bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
      if (bits > max_length) {
        bits = max_length;
        overflow++;
      }
      tree[n * 2 + 1] = bits;
      if (n > max_code) {
        continue;
      }
      s.bl_count[bits]++;
      xbits = 0;
      if (n >= base) {
        xbits = extra[n - base];
      }
      f = tree[n * 2];
      s.opt_len += f * (bits + xbits);
      if (has_stree) {
        s.static_len += f * (stree[n * 2 + 1] + xbits);
      }
    }
    if (overflow === 0) {
      return;
    }
    do {
      bits = max_length - 1;
      while (s.bl_count[bits] === 0) {
        bits--;
      }
      s.bl_count[bits]--;
      s.bl_count[bits + 1] += 2;
      s.bl_count[max_length]--;
      overflow -= 2;
    } while (overflow > 0);
    for (bits = max_length; bits !== 0; bits--) {
      n = s.bl_count[bits];
      while (n !== 0) {
        m = s.heap[--h];
        if (m > max_code) {
          continue;
        }
        if (tree[m * 2 + 1] !== bits) {
          s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
          tree[m * 2 + 1] = bits;
        }
        n--;
      }
    }
  };
  const gen_codes = (tree, max_code, bl_count) => {
    const next_code = new Array(MAX_BITS$1 + 1);
    let code = 0;
    let bits;
    let n;
    for (bits = 1; bits <= MAX_BITS$1; bits++) {
      code = code + bl_count[bits - 1] << 1;
      next_code[bits] = code;
    }
    for (n = 0; n <= max_code; n++) {
      let len = tree[n * 2 + 1];
      if (len === 0) {
        continue;
      }
      tree[n * 2] = bi_reverse(next_code[len]++, len);
    }
  };
  const tr_static_init = () => {
    let n;
    let bits;
    let length;
    let code;
    let dist;
    const bl_count = new Array(MAX_BITS$1 + 1);
    length = 0;
    for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
      base_length[code] = length;
      for (n = 0; n < 1 << extra_lbits[code]; n++) {
        _length_code[length++] = code;
      }
    }
    _length_code[length - 1] = code;
    dist = 0;
    for (code = 0; code < 16; code++) {
      base_dist[code] = dist;
      for (n = 0; n < 1 << extra_dbits[code]; n++) {
        _dist_code[dist++] = code;
      }
    }
    dist >>= 7;
    for (; code < D_CODES$1; code++) {
      base_dist[code] = dist << 7;
      for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
        _dist_code[256 + dist++] = code;
      }
    }
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      bl_count[bits] = 0;
    }
    n = 0;
    while (n <= 143) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    while (n <= 255) {
      static_ltree[n * 2 + 1] = 9;
      n++;
      bl_count[9]++;
    }
    while (n <= 279) {
      static_ltree[n * 2 + 1] = 7;
      n++;
      bl_count[7]++;
    }
    while (n <= 287) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
    for (n = 0; n < D_CODES$1; n++) {
      static_dtree[n * 2 + 1] = 5;
      static_dtree[n * 2] = bi_reverse(n, 5);
    }
    static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
    static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
    static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
  };
  const init_block = (s) => {
    let n;
    for (n = 0; n < L_CODES$1; n++) {
      s.dyn_ltree[n * 2] = 0;
    }
    for (n = 0; n < D_CODES$1; n++) {
      s.dyn_dtree[n * 2] = 0;
    }
    for (n = 0; n < BL_CODES$1; n++) {
      s.bl_tree[n * 2] = 0;
    }
    s.dyn_ltree[END_BLOCK * 2] = 1;
    s.opt_len = s.static_len = 0;
    s.sym_next = s.matches = 0;
  };
  const bi_windup = (s) => {
    if (s.bi_valid > 8) {
      put_short(s, s.bi_buf);
    } else if (s.bi_valid > 0) {
      s.pending_buf[s.pending++] = s.bi_buf;
    }
    s.bi_buf = 0;
    s.bi_valid = 0;
  };
  const smaller = (tree, n, m, depth) => {
    const _n2 = n * 2;
    const _m2 = m * 2;
    return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
  };
  const pqdownheap = (s, tree, k) => {
    const v = s.heap[k];
    let j = k << 1;
    while (j <= s.heap_len) {
      if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
        j++;
      }
      if (smaller(tree, v, s.heap[j], s.depth)) {
        break;
      }
      s.heap[k] = s.heap[j];
      k = j;
      j <<= 1;
    }
    s.heap[k] = v;
  };
  const compress_block = (s, ltree, dtree) => {
    let dist;
    let lc2;
    let sx = 0;
    let code;
    let extra;
    if (s.sym_next !== 0) {
      do {
        dist = s.pending_buf[s.sym_buf + sx++] & 255;
        dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
        lc2 = s.pending_buf[s.sym_buf + sx++];
        if (dist === 0) {
          send_code(s, lc2, ltree);
        } else {
          code = _length_code[lc2];
          send_code(s, code + LITERALS$1 + 1, ltree);
          extra = extra_lbits[code];
          if (extra !== 0) {
            lc2 -= base_length[code];
            send_bits(s, lc2, extra);
          }
          dist--;
          code = d_code(dist);
          send_code(s, code, dtree);
          extra = extra_dbits[code];
          if (extra !== 0) {
            dist -= base_dist[code];
            send_bits(s, dist, extra);
          }
        }
      } while (sx < s.sym_next);
    }
    send_code(s, END_BLOCK, ltree);
  };
  const build_tree = (s, desc) => {
    const tree = desc.dyn_tree;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const elems = desc.stat_desc.elems;
    let n, m;
    let max_code = -1;
    let node;
    s.heap_len = 0;
    s.heap_max = HEAP_SIZE$1;
    for (n = 0; n < elems; n++) {
      if (tree[n * 2] !== 0) {
        s.heap[++s.heap_len] = max_code = n;
        s.depth[n] = 0;
      } else {
        tree[n * 2 + 1] = 0;
      }
    }
    while (s.heap_len < 2) {
      node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
      tree[node * 2] = 1;
      s.depth[node] = 0;
      s.opt_len--;
      if (has_stree) {
        s.static_len -= stree[node * 2 + 1];
      }
    }
    desc.max_code = max_code;
    for (n = s.heap_len >> 1; n >= 1; n--) {
      pqdownheap(s, tree, n);
    }
    node = elems;
    do {
      n = s.heap[
        1
        /*SMALLEST*/
      ];
      s.heap[
        1
        /*SMALLEST*/
      ] = s.heap[s.heap_len--];
      pqdownheap(
        s,
        tree,
        1
        /*SMALLEST*/
      );
      m = s.heap[
        1
        /*SMALLEST*/
      ];
      s.heap[--s.heap_max] = n;
      s.heap[--s.heap_max] = m;
      tree[node * 2] = tree[n * 2] + tree[m * 2];
      s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
      tree[n * 2 + 1] = tree[m * 2 + 1] = node;
      s.heap[
        1
        /*SMALLEST*/
      ] = node++;
      pqdownheap(
        s,
        tree,
        1
        /*SMALLEST*/
      );
    } while (s.heap_len >= 2);
    s.heap[--s.heap_max] = s.heap[
      1
      /*SMALLEST*/
    ];
    gen_bitlen(s, desc);
    gen_codes(tree, max_code, s.bl_count);
  };
  const scan_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    tree[(max_code + 1) * 2 + 1] = 65535;
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        s.bl_tree[curlen * 2] += count;
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          s.bl_tree[curlen * 2]++;
        }
        s.bl_tree[REP_3_6 * 2]++;
      } else if (count <= 10) {
        s.bl_tree[REPZ_3_10 * 2]++;
      } else {
        s.bl_tree[REPZ_11_138 * 2]++;
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  const send_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        do {
          send_code(s, curlen, s.bl_tree);
        } while (--count !== 0);
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          send_code(s, curlen, s.bl_tree);
          count--;
        }
        send_code(s, REP_3_6, s.bl_tree);
        send_bits(s, count - 3, 2);
      } else if (count <= 10) {
        send_code(s, REPZ_3_10, s.bl_tree);
        send_bits(s, count - 3, 3);
      } else {
        send_code(s, REPZ_11_138, s.bl_tree);
        send_bits(s, count - 11, 7);
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  const build_bl_tree = (s) => {
    let max_blindex;
    scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
    scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
    build_tree(s, s.bl_desc);
    for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
      if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
        break;
      }
    }
    s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
    return max_blindex;
  };
  const send_all_trees = (s, lcodes, dcodes, blcodes) => {
    let rank2;
    send_bits(s, lcodes - 257, 5);
    send_bits(s, dcodes - 1, 5);
    send_bits(s, blcodes - 4, 4);
    for (rank2 = 0; rank2 < blcodes; rank2++) {
      send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
    }
    send_tree(s, s.dyn_ltree, lcodes - 1);
    send_tree(s, s.dyn_dtree, dcodes - 1);
  };
  const detect_data_type = (s) => {
    let block_mask = 4093624447;
    let n;
    for (n = 0; n <= 31; n++, block_mask >>>= 1) {
      if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
        return Z_BINARY;
      }
    }
    if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
      return Z_TEXT;
    }
    for (n = 32; n < LITERALS$1; n++) {
      if (s.dyn_ltree[n * 2] !== 0) {
        return Z_TEXT;
      }
    }
    return Z_BINARY;
  };
  let static_init_done = false;
  const _tr_init$1 = (s) => {
    if (!static_init_done) {
      tr_static_init();
      static_init_done = true;
    }
    s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
    s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
    s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
    s.bi_buf = 0;
    s.bi_valid = 0;
    init_block(s);
  };
  const _tr_stored_block$1 = (s, buf, stored_len, last) => {
    send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
    bi_windup(s);
    put_short(s, stored_len);
    put_short(s, ~stored_len);
    if (stored_len) {
      s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
    }
    s.pending += stored_len;
  };
  const _tr_align$1 = (s) => {
    send_bits(s, STATIC_TREES << 1, 3);
    send_code(s, END_BLOCK, static_ltree);
    bi_flush(s);
  };
  const _tr_flush_block$1 = (s, buf, stored_len, last) => {
    let opt_lenb, static_lenb;
    let max_blindex = 0;
    if (s.level > 0) {
      if (s.strm.data_type === Z_UNKNOWN$1) {
        s.strm.data_type = detect_data_type(s);
      }
      build_tree(s, s.l_desc);
      build_tree(s, s.d_desc);
      max_blindex = build_bl_tree(s);
      opt_lenb = s.opt_len + 3 + 7 >>> 3;
      static_lenb = s.static_len + 3 + 7 >>> 3;
      if (static_lenb <= opt_lenb) {
        opt_lenb = static_lenb;
      }
    } else {
      opt_lenb = static_lenb = stored_len + 5;
    }
    if (stored_len + 4 <= opt_lenb && buf !== -1) {
      _tr_stored_block$1(s, buf, stored_len, last);
    } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
      send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
      compress_block(s, static_ltree, static_dtree);
    } else {
      send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
      send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
      compress_block(s, s.dyn_ltree, s.dyn_dtree);
    }
    init_block(s);
    if (last) {
      bi_windup(s);
    }
  };
  const _tr_tally$1 = (s, dist, lc2) => {
    s.pending_buf[s.sym_buf + s.sym_next++] = dist;
    s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
    s.pending_buf[s.sym_buf + s.sym_next++] = lc2;
    if (dist === 0) {
      s.dyn_ltree[lc2 * 2]++;
    } else {
      s.matches++;
      dist--;
      s.dyn_ltree[(_length_code[lc2] + LITERALS$1 + 1) * 2]++;
      s.dyn_dtree[d_code(dist) * 2]++;
    }
    return s.sym_next === s.sym_end;
  };
  var _tr_init_1 = _tr_init$1;
  var _tr_stored_block_1 = _tr_stored_block$1;
  var _tr_flush_block_1 = _tr_flush_block$1;
  var _tr_tally_1 = _tr_tally$1;
  var _tr_align_1 = _tr_align$1;
  var trees = {
    _tr_init: _tr_init_1,
    _tr_stored_block: _tr_stored_block_1,
    _tr_flush_block: _tr_flush_block_1,
    _tr_tally: _tr_tally_1,
    _tr_align: _tr_align_1
  };
  const adler32 = (adler, buf, len, pos) => {
    let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
    while (len !== 0) {
      n = len > 2e3 ? 2e3 : len;
      len -= n;
      do {
        s1 = s1 + buf[pos++] | 0;
        s2 = s2 + s1 | 0;
      } while (--n);
      s1 %= 65521;
      s2 %= 65521;
    }
    return s1 | s2 << 16 | 0;
  };
  var adler32_1 = adler32;
  const makeTable = () => {
    let c, table = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  };
  const crcTable = new Uint32Array(makeTable());
  const crc32 = (crc2, buf, len, pos) => {
    const t2 = crcTable;
    const end = pos + len;
    crc2 ^= -1;
    for (let i = pos; i < end; i++) {
      crc2 = crc2 >>> 8 ^ t2[(crc2 ^ buf[i]) & 255];
    }
    return crc2 ^ -1;
  };
  var crc32_1 = crc32;
  var messages = {
    2: "need dictionary",
    /* Z_NEED_DICT       2  */
    1: "stream end",
    /* Z_STREAM_END      1  */
    0: "",
    /* Z_OK              0  */
    "-1": "file error",
    /* Z_ERRNO         (-1) */
    "-2": "stream error",
    /* Z_STREAM_ERROR  (-2) */
    "-3": "data error",
    /* Z_DATA_ERROR    (-3) */
    "-4": "insufficient memory",
    /* Z_MEM_ERROR     (-4) */
    "-5": "buffer error",
    /* Z_BUF_ERROR     (-5) */
    "-6": "incompatible version"
    /* Z_VERSION_ERROR (-6) */
  };
  var constants$2 = {
    /* Allowed flush values; see deflate() and inflate() below for details */
    Z_NO_FLUSH: 0,
    Z_PARTIAL_FLUSH: 1,
    Z_SYNC_FLUSH: 2,
    Z_FULL_FLUSH: 3,
    Z_FINISH: 4,
    Z_BLOCK: 5,
    Z_TREES: 6,
    /* Return codes for the compression/decompression functions. Negative values
    * are errors, positive values are used for special but normal events.
    */
    Z_OK: 0,
    Z_STREAM_END: 1,
    Z_NEED_DICT: 2,
    Z_ERRNO: -1,
    Z_STREAM_ERROR: -2,
    Z_DATA_ERROR: -3,
    Z_MEM_ERROR: -4,
    Z_BUF_ERROR: -5,
    //Z_VERSION_ERROR: -6,
    /* compression levels */
    Z_NO_COMPRESSION: 0,
    Z_BEST_SPEED: 1,
    Z_BEST_COMPRESSION: 9,
    Z_DEFAULT_COMPRESSION: -1,
    Z_FILTERED: 1,
    Z_HUFFMAN_ONLY: 2,
    Z_RLE: 3,
    Z_FIXED: 4,
    Z_DEFAULT_STRATEGY: 0,
    /* Possible values of the data_type field (though see inflate()) */
    Z_BINARY: 0,
    Z_TEXT: 1,
    //Z_ASCII:                1, // = Z_TEXT (deprecated)
    Z_UNKNOWN: 2,
    /* The deflate compression method */
    Z_DEFLATED: 8
    //Z_NULL:                 null // Use -1 or null inline, depending on var type
  };
  const { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
  const {
    Z_NO_FLUSH: Z_NO_FLUSH$2,
    Z_PARTIAL_FLUSH,
    Z_FULL_FLUSH: Z_FULL_FLUSH$1,
    Z_FINISH: Z_FINISH$3,
    Z_BLOCK: Z_BLOCK$1,
    Z_OK: Z_OK$3,
    Z_STREAM_END: Z_STREAM_END$3,
    Z_STREAM_ERROR: Z_STREAM_ERROR$2,
    Z_DATA_ERROR: Z_DATA_ERROR$2,
    Z_BUF_ERROR: Z_BUF_ERROR$1,
    Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
    Z_FILTERED,
    Z_HUFFMAN_ONLY,
    Z_RLE,
    Z_FIXED,
    Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
    Z_UNKNOWN,
    Z_DEFLATED: Z_DEFLATED$2
  } = constants$2;
  const MAX_MEM_LEVEL = 9;
  const MAX_WBITS$1 = 15;
  const DEF_MEM_LEVEL = 8;
  const LENGTH_CODES = 29;
  const LITERALS = 256;
  const L_CODES = LITERALS + 1 + LENGTH_CODES;
  const D_CODES = 30;
  const BL_CODES = 19;
  const HEAP_SIZE = 2 * L_CODES + 1;
  const MAX_BITS = 15;
  const MIN_MATCH = 3;
  const MAX_MATCH = 258;
  const MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
  const PRESET_DICT = 32;
  const INIT_STATE = 42;
  const GZIP_STATE = 57;
  const EXTRA_STATE = 69;
  const NAME_STATE = 73;
  const COMMENT_STATE = 91;
  const HCRC_STATE = 103;
  const BUSY_STATE = 113;
  const FINISH_STATE = 666;
  const BS_NEED_MORE = 1;
  const BS_BLOCK_DONE = 2;
  const BS_FINISH_STARTED = 3;
  const BS_FINISH_DONE = 4;
  const OS_CODE = 3;
  const err$1 = (strm, errorCode) => {
    strm.msg = messages[errorCode];
    return errorCode;
  };
  const rank$2 = (f) => {
    return f * 2 - (f > 4 ? 9 : 0);
  };
  const zero = (buf) => {
    let len = buf.length;
    while (--len >= 0) {
      buf[len] = 0;
    }
  };
  const slide_hash = (s) => {
    let n, m;
    let p;
    let wsize = s.w_size;
    n = s.hash_size;
    p = n;
    do {
      m = s.head[--p];
      s.head[p] = m >= wsize ? m - wsize : 0;
    } while (--n);
    n = wsize;
    p = n;
    do {
      m = s.prev[--p];
      s.prev[p] = m >= wsize ? m - wsize : 0;
    } while (--n);
  };
  let HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
  let HASH = HASH_ZLIB;
  const flush_pending = (strm) => {
    const s = strm.state;
    let len = s.pending;
    if (len > strm.avail_out) {
      len = strm.avail_out;
    }
    if (len === 0) {
      return;
    }
    strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
    strm.next_out += len;
    s.pending_out += len;
    strm.total_out += len;
    strm.avail_out -= len;
    s.pending -= len;
    if (s.pending === 0) {
      s.pending_out = 0;
    }
  };
  const flush_block_only = (s, last) => {
    _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
    s.block_start = s.strstart;
    flush_pending(s.strm);
  };
  const put_byte = (s, b) => {
    s.pending_buf[s.pending++] = b;
  };
  const putShortMSB = (s, b) => {
    s.pending_buf[s.pending++] = b >>> 8 & 255;
    s.pending_buf[s.pending++] = b & 255;
  };
  const read_buf = (strm, buf, start, size) => {
    let len = strm.avail_in;
    if (len > size) {
      len = size;
    }
    if (len === 0) {
      return 0;
    }
    strm.avail_in -= len;
    buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
    if (strm.state.wrap === 1) {
      strm.adler = adler32_1(strm.adler, buf, len, start);
    } else if (strm.state.wrap === 2) {
      strm.adler = crc32_1(strm.adler, buf, len, start);
    }
    strm.next_in += len;
    strm.total_in += len;
    return len;
  };
  const longest_match = (s, cur_match) => {
    let chain_length = s.max_chain_length;
    let scan = s.strstart;
    let match;
    let len;
    let best_len = s.prev_length;
    let nice_match = s.nice_match;
    const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
    const _win = s.window;
    const wmask = s.w_mask;
    const prev = s.prev;
    const strend = s.strstart + MAX_MATCH;
    let scan_end1 = _win[scan + best_len - 1];
    let scan_end = _win[scan + best_len];
    if (s.prev_length >= s.good_match) {
      chain_length >>= 2;
    }
    if (nice_match > s.lookahead) {
      nice_match = s.lookahead;
    }
    do {
      match = cur_match;
      if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
        continue;
      }
      scan += 2;
      match++;
      do {
      } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
      len = MAX_MATCH - (strend - scan);
      scan = strend - MAX_MATCH;
      if (len > best_len) {
        s.match_start = cur_match;
        best_len = len;
        if (len >= nice_match) {
          break;
        }
        scan_end1 = _win[scan + best_len - 1];
        scan_end = _win[scan + best_len];
      }
    } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
    if (best_len <= s.lookahead) {
      return best_len;
    }
    return s.lookahead;
  };
  const fill_window = (s) => {
    const _w_size = s.w_size;
    let n, more, str;
    do {
      more = s.window_size - s.lookahead - s.strstart;
      if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
        s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
        s.match_start -= _w_size;
        s.strstart -= _w_size;
        s.block_start -= _w_size;
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
        slide_hash(s);
        more += _w_size;
      }
      if (s.strm.avail_in === 0) {
        break;
      }
      n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
      s.lookahead += n;
      if (s.lookahead + s.insert >= MIN_MATCH) {
        str = s.strstart - s.insert;
        s.ins_h = s.window[str];
        s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
        while (s.insert) {
          s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
          s.prev[str & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str;
          str++;
          s.insert--;
          if (s.lookahead + s.insert < MIN_MATCH) {
            break;
          }
        }
      }
    } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
  };
  const deflate_stored = (s, flush) => {
    let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
    let len, left, have, last = 0;
    let used = s.strm.avail_in;
    do {
      len = 65535;
      have = s.bi_valid + 42 >> 3;
      if (s.strm.avail_out < have) {
        break;
      }
      have = s.strm.avail_out - have;
      left = s.strstart - s.block_start;
      if (len > left + s.strm.avail_in) {
        len = left + s.strm.avail_in;
      }
      if (len > have) {
        len = have;
      }
      if (len < min_block && (len === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len !== left + s.strm.avail_in)) {
        break;
      }
      last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
      _tr_stored_block(s, 0, 0, last);
      s.pending_buf[s.pending - 4] = len;
      s.pending_buf[s.pending - 3] = len >> 8;
      s.pending_buf[s.pending - 2] = ~len;
      s.pending_buf[s.pending - 1] = ~len >> 8;
      flush_pending(s.strm);
      if (left) {
        if (left > len) {
          left = len;
        }
        s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
        s.strm.next_out += left;
        s.strm.avail_out -= left;
        s.strm.total_out += left;
        s.block_start += left;
        len -= left;
      }
      if (len) {
        read_buf(s.strm, s.strm.output, s.strm.next_out, len);
        s.strm.next_out += len;
        s.strm.avail_out -= len;
        s.strm.total_out += len;
      }
    } while (last === 0);
    used -= s.strm.avail_in;
    if (used) {
      if (used >= s.w_size) {
        s.matches = 2;
        s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
        s.strstart = s.w_size;
        s.insert = s.strstart;
      } else {
        if (s.window_size - s.strstart <= used) {
          s.strstart -= s.w_size;
          s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
          if (s.matches < 2) {
            s.matches++;
          }
          if (s.insert > s.strstart) {
            s.insert = s.strstart;
          }
        }
        s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
        s.strstart += used;
        s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
      }
      s.block_start = s.strstart;
    }
    if (s.high_water < s.strstart) {
      s.high_water = s.strstart;
    }
    if (last) {
      return BS_FINISH_DONE;
    }
    if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
      return BS_BLOCK_DONE;
    }
    have = s.window_size - s.strstart;
    if (s.strm.avail_in > have && s.block_start >= s.w_size) {
      s.block_start -= s.w_size;
      s.strstart -= s.w_size;
      s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
      if (s.matches < 2) {
        s.matches++;
      }
      have += s.w_size;
      if (s.insert > s.strstart) {
        s.insert = s.strstart;
      }
    }
    if (have > s.strm.avail_in) {
      have = s.strm.avail_in;
    }
    if (have) {
      read_buf(s.strm, s.window, s.strstart, have);
      s.strstart += have;
      s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
    }
    if (s.high_water < s.strstart) {
      s.high_water = s.strstart;
    }
    have = s.bi_valid + 42 >> 3;
    have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
    min_block = have > s.w_size ? s.w_size : have;
    left = s.strstart - s.block_start;
    if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
      len = left > have ? have : left;
      last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len === left ? 1 : 0;
      _tr_stored_block(s, s.block_start, len, last);
      s.block_start += len;
      flush_pending(s.strm);
    }
    return last ? BS_FINISH_STARTED : BS_NEED_MORE;
  };
  const deflate_fast = (s, flush) => {
    let hash_head;
    let bflush;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
      }
      if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
          s.match_length--;
          do {
            s.strstart++;
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          } while (--s.match_length !== 0);
          s.strstart++;
        } else {
          s.strstart += s.match_length;
          s.match_length = 0;
          s.ins_h = s.window[s.strstart];
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
        }
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  const deflate_slow = (s, flush) => {
    let hash_head;
    let bflush;
    let max_insert;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
      }
      s.prev_length = s.match_length;
      s.prev_match = s.match_start;
      s.match_length = MIN_MATCH - 1;
      if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
        if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
          s.match_length = MIN_MATCH - 1;
        }
      }
      if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
        max_insert = s.strstart + s.lookahead - MIN_MATCH;
        bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
        s.lookahead -= s.prev_length - 1;
        s.prev_length -= 2;
        do {
          if (++s.strstart <= max_insert) {
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
        } while (--s.prev_length !== 0);
        s.match_available = 0;
        s.match_length = MIN_MATCH - 1;
        s.strstart++;
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      } else if (s.match_available) {
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        if (bflush) {
          flush_block_only(s, false);
        }
        s.strstart++;
        s.lookahead--;
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      } else {
        s.match_available = 1;
        s.strstart++;
        s.lookahead--;
      }
    }
    if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      s.match_available = 0;
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  const deflate_rle = (s, flush) => {
    let bflush;
    let prev;
    let scan, strend;
    const _win = s.window;
    for (; ; ) {
      if (s.lookahead <= MAX_MATCH) {
        fill_window(s);
        if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      s.match_length = 0;
      if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
        scan = s.strstart - 1;
        prev = _win[scan];
        if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
          strend = s.strstart + MAX_MATCH;
          do {
          } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
          s.match_length = MAX_MATCH - (strend - scan);
          if (s.match_length > s.lookahead) {
            s.match_length = s.lookahead;
          }
        }
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        s.strstart += s.match_length;
        s.match_length = 0;
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  const deflate_huff = (s, flush) => {
    let bflush;
    for (; ; ) {
      if (s.lookahead === 0) {
        fill_window(s);
        if (s.lookahead === 0) {
          if (flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }
          break;
        }
      }
      s.match_length = 0;
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  function Config(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }
  const configuration_table = [
    /*      good lazy nice chain */
    new Config(0, 0, 0, 0, deflate_stored),
    /* 0 store only */
    new Config(4, 4, 8, 4, deflate_fast),
    /* 1 max speed, no lazy matches */
    new Config(4, 5, 16, 8, deflate_fast),
    /* 2 */
    new Config(4, 6, 32, 32, deflate_fast),
    /* 3 */
    new Config(4, 4, 16, 16, deflate_slow),
    /* 4 lazy matches */
    new Config(8, 16, 32, 32, deflate_slow),
    /* 5 */
    new Config(8, 16, 128, 128, deflate_slow),
    /* 6 */
    new Config(8, 32, 128, 256, deflate_slow),
    /* 7 */
    new Config(32, 128, 258, 1024, deflate_slow),
    /* 8 */
    new Config(32, 258, 258, 4096, deflate_slow)
    /* 9 max compression */
  ];
  const lm_init = (s) => {
    s.window_size = 2 * s.w_size;
    zero(s.head);
    s.max_lazy_match = configuration_table[s.level].max_lazy;
    s.good_match = configuration_table[s.level].good_length;
    s.nice_match = configuration_table[s.level].nice_length;
    s.max_chain_length = configuration_table[s.level].max_chain;
    s.strstart = 0;
    s.block_start = 0;
    s.lookahead = 0;
    s.insert = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    s.ins_h = 0;
  };
  function DeflateState() {
    this.strm = null;
    this.status = 0;
    this.pending_buf = null;
    this.pending_buf_size = 0;
    this.pending_out = 0;
    this.pending = 0;
    this.wrap = 0;
    this.gzhead = null;
    this.gzindex = 0;
    this.method = Z_DEFLATED$2;
    this.last_flush = -1;
    this.w_size = 0;
    this.w_bits = 0;
    this.w_mask = 0;
    this.window = null;
    this.window_size = 0;
    this.prev = null;
    this.head = null;
    this.ins_h = 0;
    this.hash_size = 0;
    this.hash_bits = 0;
    this.hash_mask = 0;
    this.hash_shift = 0;
    this.block_start = 0;
    this.match_length = 0;
    this.prev_match = 0;
    this.match_available = 0;
    this.strstart = 0;
    this.match_start = 0;
    this.lookahead = 0;
    this.prev_length = 0;
    this.max_chain_length = 0;
    this.max_lazy_match = 0;
    this.level = 0;
    this.strategy = 0;
    this.good_match = 0;
    this.nice_match = 0;
    this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
    this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
    this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
    zero(this.dyn_ltree);
    zero(this.dyn_dtree);
    zero(this.bl_tree);
    this.l_desc = null;
    this.d_desc = null;
    this.bl_desc = null;
    this.bl_count = new Uint16Array(MAX_BITS + 1);
    this.heap = new Uint16Array(2 * L_CODES + 1);
    zero(this.heap);
    this.heap_len = 0;
    this.heap_max = 0;
    this.depth = new Uint16Array(2 * L_CODES + 1);
    zero(this.depth);
    this.sym_buf = 0;
    this.lit_bufsize = 0;
    this.sym_next = 0;
    this.sym_end = 0;
    this.opt_len = 0;
    this.static_len = 0;
    this.matches = 0;
    this.insert = 0;
    this.bi_buf = 0;
    this.bi_valid = 0;
  }
  const deflateStateCheck = (strm) => {
    if (!strm) {
      return 1;
    }
    const s = strm.state;
    if (!s || s.strm !== strm || s.status !== INIT_STATE && //#ifdef GZIP
    s.status !== GZIP_STATE && //#endif
    s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
      return 1;
    }
    return 0;
  };
  const deflateResetKeep = (strm) => {
    if (deflateStateCheck(strm)) {
      return err$1(strm, Z_STREAM_ERROR$2);
    }
    strm.total_in = strm.total_out = 0;
    strm.data_type = Z_UNKNOWN;
    const s = strm.state;
    s.pending = 0;
    s.pending_out = 0;
    if (s.wrap < 0) {
      s.wrap = -s.wrap;
    }
    s.status = //#ifdef GZIP
    s.wrap === 2 ? GZIP_STATE : (
      //#endif
      s.wrap ? INIT_STATE : BUSY_STATE
    );
    strm.adler = s.wrap === 2 ? 0 : 1;
    s.last_flush = -2;
    _tr_init(s);
    return Z_OK$3;
  };
  const deflateReset = (strm) => {
    const ret = deflateResetKeep(strm);
    if (ret === Z_OK$3) {
      lm_init(strm.state);
    }
    return ret;
  };
  const deflateSetHeader = (strm, head) => {
    if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
      return Z_STREAM_ERROR$2;
    }
    strm.state.gzhead = head;
    return Z_OK$3;
  };
  const deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
    if (!strm) {
      return Z_STREAM_ERROR$2;
    }
    let wrap = 1;
    if (level === Z_DEFAULT_COMPRESSION$1) {
      level = 6;
    }
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else if (windowBits > 15) {
      wrap = 2;
      windowBits -= 16;
    }
    if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
      return err$1(strm, Z_STREAM_ERROR$2);
    }
    if (windowBits === 8) {
      windowBits = 9;
    }
    const s = new DeflateState();
    strm.state = s;
    s.strm = strm;
    s.status = INIT_STATE;
    s.wrap = wrap;
    s.gzhead = null;
    s.w_bits = windowBits;
    s.w_size = 1 << s.w_bits;
    s.w_mask = s.w_size - 1;
    s.hash_bits = memLevel + 7;
    s.hash_size = 1 << s.hash_bits;
    s.hash_mask = s.hash_size - 1;
    s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
    s.window = new Uint8Array(s.w_size * 2);
    s.head = new Uint16Array(s.hash_size);
    s.prev = new Uint16Array(s.w_size);
    s.lit_bufsize = 1 << memLevel + 6;
    s.pending_buf_size = s.lit_bufsize * 4;
    s.pending_buf = new Uint8Array(s.pending_buf_size);
    s.sym_buf = s.lit_bufsize;
    s.sym_end = (s.lit_bufsize - 1) * 3;
    s.level = level;
    s.strategy = strategy;
    s.method = method;
    return deflateReset(strm);
  };
  const deflateInit = (strm, level) => {
    return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
  };
  const deflate$2 = (strm, flush) => {
    if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
      return strm ? err$1(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
      return err$1(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
    }
    const old_flush = s.last_flush;
    s.last_flush = flush;
    if (s.pending !== 0) {
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    } else if (strm.avail_in === 0 && rank$2(flush) <= rank$2(old_flush) && flush !== Z_FINISH$3) {
      return err$1(strm, Z_BUF_ERROR$1);
    }
    if (s.status === FINISH_STATE && strm.avail_in !== 0) {
      return err$1(strm, Z_BUF_ERROR$1);
    }
    if (s.status === INIT_STATE && s.wrap === 0) {
      s.status = BUSY_STATE;
    }
    if (s.status === INIT_STATE) {
      let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
      let level_flags = -1;
      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= level_flags << 6;
      if (s.strstart !== 0) {
        header |= PRESET_DICT;
      }
      header += 31 - header % 31;
      putShortMSB(s, header);
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      strm.adler = 1;
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
    if (s.status === GZIP_STATE) {
      strm.adler = 0;
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) {
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      } else {
        put_byte(
          s,
          (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
        );
        put_byte(s, s.gzhead.time & 255);
        put_byte(s, s.gzhead.time >> 8 & 255);
        put_byte(s, s.gzhead.time >> 16 & 255);
        put_byte(s, s.gzhead.time >> 24 & 255);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, s.gzhead.os & 255);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 255);
          put_byte(s, s.gzhead.extra.length >> 8 & 255);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    if (s.status === EXTRA_STATE) {
      if (s.gzhead.extra) {
        let beg = s.pending;
        let left = (s.gzhead.extra.length & 65535) - s.gzindex;
        while (s.pending + left > s.pending_buf_size) {
          let copy = s.pending_buf_size - s.pending;
          s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
          s.pending = s.pending_buf_size;
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          s.gzindex += copy;
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
          left -= copy;
        }
        let gzhead_extra = new Uint8Array(s.gzhead.extra);
        s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
        s.pending += left;
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex = 0;
      }
      s.status = NAME_STATE;
    }
    if (s.status === NAME_STATE) {
      if (s.gzhead.name) {
        let beg = s.pending;
        let val;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
            beg = 0;
          }
          if (s.gzindex < s.gzhead.name.length) {
            val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex = 0;
      }
      s.status = COMMENT_STATE;
    }
    if (s.status === COMMENT_STATE) {
      if (s.gzhead.comment) {
        let beg = s.pending;
        let val;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
            beg = 0;
          }
          if (s.gzindex < s.gzhead.comment.length) {
            val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
      }
      s.status = HCRC_STATE;
    }
    if (s.status === HCRC_STATE) {
      if (s.gzhead.hcrc) {
        if (s.pending + 2 > s.pending_buf_size) {
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        }
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        strm.adler = 0;
      }
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
    if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
      let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
      if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
        s.status = FINISH_STATE;
      }
      if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
        if (strm.avail_out === 0) {
          s.last_flush = -1;
        }
        return Z_OK$3;
      }
      if (bstate === BS_BLOCK_DONE) {
        if (flush === Z_PARTIAL_FLUSH) {
          _tr_align(s);
        } else if (flush !== Z_BLOCK$1) {
          _tr_stored_block(s, 0, 0, false);
          if (flush === Z_FULL_FLUSH$1) {
            zero(s.head);
            if (s.lookahead === 0) {
              s.strstart = 0;
              s.block_start = 0;
              s.insert = 0;
            }
          }
        }
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
    }
    if (flush !== Z_FINISH$3) {
      return Z_OK$3;
    }
    if (s.wrap <= 0) {
      return Z_STREAM_END$3;
    }
    if (s.wrap === 2) {
      put_byte(s, strm.adler & 255);
      put_byte(s, strm.adler >> 8 & 255);
      put_byte(s, strm.adler >> 16 & 255);
      put_byte(s, strm.adler >> 24 & 255);
      put_byte(s, strm.total_in & 255);
      put_byte(s, strm.total_in >> 8 & 255);
      put_byte(s, strm.total_in >> 16 & 255);
      put_byte(s, strm.total_in >> 24 & 255);
    } else {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 65535);
    }
    flush_pending(strm);
    if (s.wrap > 0) {
      s.wrap = -s.wrap;
    }
    return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
  };
  const deflateEnd = (strm) => {
    if (deflateStateCheck(strm)) {
      return Z_STREAM_ERROR$2;
    }
    const status = strm.state.status;
    strm.state = null;
    return status === BUSY_STATE ? err$1(strm, Z_DATA_ERROR$2) : Z_OK$3;
  };
  const deflateSetDictionary = (strm, dictionary) => {
    let dictLength = dictionary.length;
    if (deflateStateCheck(strm)) {
      return Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    const wrap = s.wrap;
    if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
      return Z_STREAM_ERROR$2;
    }
    if (wrap === 1) {
      strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
    }
    s.wrap = 0;
    if (dictLength >= s.w_size) {
      if (wrap === 0) {
        zero(s.head);
        s.strstart = 0;
        s.block_start = 0;
        s.insert = 0;
      }
      let tmpDict = new Uint8Array(s.w_size);
      tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
      dictionary = tmpDict;
      dictLength = s.w_size;
    }
    const avail = strm.avail_in;
    const next2 = strm.next_in;
    const input = strm.input;
    strm.avail_in = dictLength;
    strm.next_in = 0;
    strm.input = dictionary;
    fill_window(s);
    while (s.lookahead >= MIN_MATCH) {
      let str = s.strstart;
      let n = s.lookahead - (MIN_MATCH - 1);
      do {
        s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
      } while (--n);
      s.strstart = str;
      s.lookahead = MIN_MATCH - 1;
      fill_window(s);
    }
    s.strstart += s.lookahead;
    s.block_start = s.strstart;
    s.insert = s.lookahead;
    s.lookahead = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    strm.next_in = next2;
    strm.input = input;
    strm.avail_in = avail;
    s.wrap = wrap;
    return Z_OK$3;
  };
  var deflateInit_1 = deflateInit;
  var deflateInit2_1 = deflateInit2;
  var deflateReset_1 = deflateReset;
  var deflateResetKeep_1 = deflateResetKeep;
  var deflateSetHeader_1 = deflateSetHeader;
  var deflate_2$1 = deflate$2;
  var deflateEnd_1 = deflateEnd;
  var deflateSetDictionary_1 = deflateSetDictionary;
  var deflateInfo = "pako deflate (from Nodeca project)";
  var deflate_1$2 = {
    deflateInit: deflateInit_1,
    deflateInit2: deflateInit2_1,
    deflateReset: deflateReset_1,
    deflateResetKeep: deflateResetKeep_1,
    deflateSetHeader: deflateSetHeader_1,
    deflate: deflate_2$1,
    deflateEnd: deflateEnd_1,
    deflateSetDictionary: deflateSetDictionary_1,
    deflateInfo
  };
  const _has = (obj, key) => {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };
  var assign = function(obj) {
    const sources = Array.prototype.slice.call(arguments, 1);
    while (sources.length) {
      const source = sources.shift();
      if (!source) {
        continue;
      }
      if (typeof source !== "object") {
        throw new TypeError(source + "must be non-object");
      }
      for (const p in source) {
        if (_has(source, p)) {
          obj[p] = source[p];
        }
      }
    }
    return obj;
  };
  var flattenChunks = (chunks) => {
    let len = 0;
    for (let i = 0, l = chunks.length; i < l; i++) {
      len += chunks[i].length;
    }
    const result = new Uint8Array(len);
    for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
      let chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }
    return result;
  };
  var common = {
    assign,
    flattenChunks
  };
  let STR_APPLY_UIA_OK = true;
  try {
    String.fromCharCode.apply(null, new Uint8Array(1));
  } catch (__) {
    STR_APPLY_UIA_OK = false;
  }
  const _utf8len = new Uint8Array(256);
  for (let q = 0; q < 256; q++) {
    _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
  }
  _utf8len[254] = _utf8len[254] = 1;
  var string2buf = (str) => {
    if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
      return new TextEncoder().encode(str);
    }
    let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
    for (m_pos = 0; m_pos < str_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
    }
    buf = new Uint8Array(buf_len);
    for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      if (c < 128) {
        buf[i++] = c;
      } else if (c < 2048) {
        buf[i++] = 192 | c >>> 6;
        buf[i++] = 128 | c & 63;
      } else if (c < 65536) {
        buf[i++] = 224 | c >>> 12;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      } else {
        buf[i++] = 240 | c >>> 18;
        buf[i++] = 128 | c >>> 12 & 63;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      }
    }
    return buf;
  };
  const buf2binstring = (buf, len) => {
    if (len < 65534) {
      if (buf.subarray && STR_APPLY_UIA_OK) {
        return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
      }
    }
    let result = "";
    for (let i = 0; i < len; i++) {
      result += String.fromCharCode(buf[i]);
    }
    return result;
  };
  var buf2string = (buf, max) => {
    const len = max || buf.length;
    if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
      return new TextDecoder().decode(buf.subarray(0, max));
    }
    let i, out;
    const utf16buf = new Array(len * 2);
    for (out = 0, i = 0; i < len; ) {
      let c = buf[i++];
      if (c < 128) {
        utf16buf[out++] = c;
        continue;
      }
      let c_len = _utf8len[c];
      if (c_len > 4) {
        utf16buf[out++] = 65533;
        i += c_len - 1;
        continue;
      }
      c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
      while (c_len > 1 && i < len) {
        c = c << 6 | buf[i++] & 63;
        c_len--;
      }
      if (c_len > 1) {
        utf16buf[out++] = 65533;
        continue;
      }
      if (c < 65536) {
        utf16buf[out++] = c;
      } else {
        c -= 65536;
        utf16buf[out++] = 55296 | c >> 10 & 1023;
        utf16buf[out++] = 56320 | c & 1023;
      }
    }
    return buf2binstring(utf16buf, out);
  };
  var utf8border = (buf, max) => {
    max = max || buf.length;
    if (max > buf.length) {
      max = buf.length;
    }
    let pos = max - 1;
    while (pos >= 0 && (buf[pos] & 192) === 128) {
      pos--;
    }
    if (pos < 0) {
      return max;
    }
    if (pos === 0) {
      return max;
    }
    return pos + _utf8len[buf[pos]] > max ? pos : max;
  };
  var strings = {
    string2buf,
    buf2string,
    utf8border
  };
  function ZStream() {
    this.input = null;
    this.next_in = 0;
    this.avail_in = 0;
    this.total_in = 0;
    this.output = null;
    this.next_out = 0;
    this.avail_out = 0;
    this.total_out = 0;
    this.msg = "";
    this.state = null;
    this.data_type = 2;
    this.adler = 0;
  }
  var zstream = ZStream;
  const toString$1 = Object.prototype.toString;
  const {
    Z_NO_FLUSH: Z_NO_FLUSH$1,
    Z_SYNC_FLUSH,
    Z_FULL_FLUSH,
    Z_FINISH: Z_FINISH$2,
    Z_OK: Z_OK$2,
    Z_STREAM_END: Z_STREAM_END$2,
    Z_DEFAULT_COMPRESSION,
    Z_DEFAULT_STRATEGY,
    Z_DEFLATED: Z_DEFLATED$1
  } = constants$2;
  function Deflate$1(options) {
    this.options = common.assign({
      level: Z_DEFAULT_COMPRESSION,
      method: Z_DEFLATED$1,
      chunkSize: 16384,
      windowBits: 15,
      memLevel: 8,
      strategy: Z_DEFAULT_STRATEGY
    }, options || {});
    let opt = this.options;
    if (opt.raw && opt.windowBits > 0) {
      opt.windowBits = -opt.windowBits;
    } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
      opt.windowBits += 16;
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = deflate_1$2.deflateInit2(
      this.strm,
      opt.level,
      opt.method,
      opt.windowBits,
      opt.memLevel,
      opt.strategy
    );
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    if (opt.header) {
      deflate_1$2.deflateSetHeader(this.strm, opt.header);
    }
    if (opt.dictionary) {
      let dict;
      if (typeof opt.dictionary === "string") {
        dict = strings.string2buf(opt.dictionary);
      } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
        dict = new Uint8Array(opt.dictionary);
      } else {
        dict = opt.dictionary;
      }
      status = deflate_1$2.deflateSetDictionary(this.strm, dict);
      if (status !== Z_OK$2) {
        throw new Error(messages[status]);
      }
      this._dict_set = true;
    }
  }
  Deflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    let status, _flush_mode;
    if (this.ended) {
      return false;
    }
    if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
    else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
    if (typeof data === "string") {
      strm.input = strings.string2buf(data);
    } else if (toString$1.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      status = deflate_1$2.deflate(strm, _flush_mode);
      if (status === Z_STREAM_END$2) {
        if (strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
        }
        status = deflate_1$2.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK$2;
      }
      if (strm.avail_out === 0) {
        this.onData(strm.output);
        continue;
      }
      if (_flush_mode > 0 && strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      if (strm.avail_in === 0) break;
    }
    return true;
  };
  Deflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Deflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK$2) {
      this.result = common.flattenChunks(this.chunks);
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function deflate$1(input, options) {
    const deflator = new Deflate$1(options);
    deflator.push(input, true);
    if (deflator.err) {
      throw deflator.msg || messages[deflator.err];
    }
    return deflator.result;
  }
  function deflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return deflate$1(input, options);
  }
  function gzip$1(input, options) {
    options = options || {};
    options.gzip = true;
    return deflate$1(input, options);
  }
  var Deflate_1$1 = Deflate$1;
  var deflate_2 = deflate$1;
  var deflateRaw_1$1 = deflateRaw$1;
  var gzip_1$1 = gzip$1;
  var deflate_1$1 = {
    Deflate: Deflate_1$1,
    deflate: deflate_2,
    deflateRaw: deflateRaw_1$1,
    gzip: gzip_1$1
  };
  const BAD$1 = 16209;
  const TYPE$1 = 16191;
  var inffast = function inflate_fast(strm, start) {
    let _in;
    let last;
    let _out;
    let beg;
    let end;
    let dmax;
    let wsize;
    let whave;
    let wnext;
    let s_window;
    let hold;
    let bits;
    let lcode;
    let dcode;
    let lmask;
    let dmask;
    let here;
    let op;
    let len;
    let dist;
    let from;
    let from_source;
    let input, output;
    const state = strm.state;
    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257);
    dmax = state.dmax;
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    top:
      do {
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = lcode[hold & lmask];
        dolen:
          for (; ; ) {
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op === 0) {
              output[_out++] = here & 65535;
            } else if (op & 16) {
              len = here & 65535;
              op &= 15;
              if (op) {
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                len += hold & (1 << op) - 1;
                hold >>>= op;
                bits -= op;
              }
              if (bits < 15) {
                hold += input[_in++] << bits;
                bits += 8;
                hold += input[_in++] << bits;
                bits += 8;
              }
              here = dcode[hold & dmask];
              dodist:
                for (; ; ) {
                  op = here >>> 24;
                  hold >>>= op;
                  bits -= op;
                  op = here >>> 16 & 255;
                  if (op & 16) {
                    dist = here & 65535;
                    op &= 15;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                      }
                    }
                    dist += hold & (1 << op) - 1;
                    if (dist > dmax) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD$1;
                      break top;
                    }
                    hold >>>= op;
                    bits -= op;
                    op = _out - beg;
                    if (dist > op) {
                      op = dist - op;
                      if (op > whave) {
                        if (state.sane) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD$1;
                          break top;
                        }
                      }
                      from = 0;
                      from_source = s_window;
                      if (wnext === 0) {
                        from += wsize - op;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      } else if (wnext < op) {
                        from += wsize + wnext - op;
                        op -= wnext;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = 0;
                          if (wnext < len) {
                            op = wnext;
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        }
                      } else {
                        from += wnext - op;
                        if (op < len) {
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      }
                      while (len > 2) {
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        len -= 3;
                      }
                      if (len) {
                        output[_out++] = from_source[from++];
                        if (len > 1) {
                          output[_out++] = from_source[from++];
                        }
                      }
                    } else {
                      from = _out - dist;
                      do {
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        len -= 3;
                      } while (len > 2);
                      if (len) {
                        output[_out++] = output[from++];
                        if (len > 1) {
                          output[_out++] = output[from++];
                        }
                      }
                    }
                  } else if ((op & 64) === 0) {
                    here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                    continue dodist;
                  } else {
                    strm.msg = "invalid distance code";
                    state.mode = BAD$1;
                    break top;
                  }
                  break;
                }
            } else if ((op & 64) === 0) {
              here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
              continue dolen;
            } else if (op & 32) {
              state.mode = TYPE$1;
              break top;
            } else {
              strm.msg = "invalid literal/length code";
              state.mode = BAD$1;
              break top;
            }
            break;
          }
      } while (_in < last && _out < end);
    len = bits >> 3;
    _in -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;
    strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
  };
  const MAXBITS = 15;
  const ENOUGH_LENS$1 = 852;
  const ENOUGH_DISTS$1 = 592;
  const CODES$1 = 0;
  const LENS$1 = 1;
  const DISTS$1 = 2;
  const lbase = new Uint16Array([
    /* Length codes 257..285 base */
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258,
    0,
    0
  ]);
  const lext = new Uint8Array([
    /* Length codes 257..285 extra */
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    16,
    72,
    78
  ]);
  const dbase = new Uint16Array([
    /* Distance codes 0..29 base */
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577,
    0,
    0
  ]);
  const dext = new Uint8Array([
    /* Distance codes 0..29 extra */
    16,
    16,
    16,
    16,
    17,
    17,
    18,
    18,
    19,
    19,
    20,
    20,
    21,
    21,
    22,
    22,
    23,
    23,
    24,
    24,
    25,
    25,
    26,
    26,
    27,
    27,
    28,
    28,
    29,
    29,
    64,
    64
  ]);
  const inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
    const bits = opts.bits;
    let len = 0;
    let sym = 0;
    let min = 0, max = 0;
    let root2 = 0;
    let curr = 0;
    let drop = 0;
    let left = 0;
    let used = 0;
    let huff = 0;
    let incr;
    let fill;
    let low;
    let mask;
    let next2;
    let base = null;
    let match;
    const count = new Uint16Array(MAXBITS + 1);
    const offs = new Uint16Array(MAXBITS + 1);
    let extra = null;
    let here_bits, here_op, here_val;
    for (len = 0; len <= MAXBITS; len++) {
      count[len] = 0;
    }
    for (sym = 0; sym < codes; sym++) {
      count[lens[lens_index + sym]]++;
    }
    root2 = bits;
    for (max = MAXBITS; max >= 1; max--) {
      if (count[max] !== 0) {
        break;
      }
    }
    if (root2 > max) {
      root2 = max;
    }
    if (max === 0) {
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      opts.bits = 1;
      return 0;
    }
    for (min = 1; min < max; min++) {
      if (count[min] !== 0) {
        break;
      }
    }
    if (root2 < min) {
      root2 = min;
    }
    left = 1;
    for (len = 1; len <= MAXBITS; len++) {
      left <<= 1;
      left -= count[len];
      if (left < 0) {
        return -1;
      }
    }
    if (left > 0 && (type === CODES$1 || max !== 1)) {
      return -1;
    }
    offs[1] = 0;
    for (len = 1; len < MAXBITS; len++) {
      offs[len + 1] = offs[len] + count[len];
    }
    for (sym = 0; sym < codes; sym++) {
      if (lens[lens_index + sym] !== 0) {
        work[offs[lens[lens_index + sym]]++] = sym;
      }
    }
    if (type === CODES$1) {
      base = extra = work;
      match = 20;
    } else if (type === LENS$1) {
      base = lbase;
      extra = lext;
      match = 257;
    } else {
      base = dbase;
      extra = dext;
      match = 0;
    }
    huff = 0;
    sym = 0;
    len = min;
    next2 = table_index;
    curr = root2;
    drop = 0;
    low = -1;
    used = 1 << root2;
    mask = used - 1;
    if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
      return 1;
    }
    for (; ; ) {
      here_bits = len - drop;
      if (work[sym] + 1 < match) {
        here_op = 0;
        here_val = work[sym];
      } else if (work[sym] >= match) {
        here_op = extra[work[sym] - match];
        here_val = base[work[sym] - match];
      } else {
        here_op = 32 + 64;
        here_val = 0;
      }
      incr = 1 << len - drop;
      fill = 1 << curr;
      min = fill;
      do {
        fill -= incr;
        table[next2 + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
      } while (fill !== 0);
      incr = 1 << len - 1;
      while (huff & incr) {
        incr >>= 1;
      }
      if (incr !== 0) {
        huff &= incr - 1;
        huff += incr;
      } else {
        huff = 0;
      }
      sym++;
      if (--count[len] === 0) {
        if (len === max) {
          break;
        }
        len = lens[lens_index + work[sym]];
      }
      if (len > root2 && (huff & mask) !== low) {
        if (drop === 0) {
          drop = root2;
        }
        next2 += min;
        curr = len - drop;
        left = 1 << curr;
        while (curr + drop < max) {
          left -= count[curr + drop];
          if (left <= 0) {
            break;
          }
          curr++;
          left <<= 1;
        }
        used += 1 << curr;
        if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
          return 1;
        }
        low = huff & mask;
        table[low] = root2 << 24 | curr << 16 | next2 - table_index | 0;
      }
    }
    if (huff !== 0) {
      table[next2 + huff] = len - drop << 24 | 64 << 16 | 0;
    }
    opts.bits = root2;
    return 0;
  };
  var inftrees = inflate_table;
  const CODES = 0;
  const LENS = 1;
  const DISTS = 2;
  const {
    Z_FINISH: Z_FINISH$1,
    Z_BLOCK,
    Z_TREES,
    Z_OK: Z_OK$1,
    Z_STREAM_END: Z_STREAM_END$1,
    Z_NEED_DICT: Z_NEED_DICT$1,
    Z_STREAM_ERROR: Z_STREAM_ERROR$1,
    Z_DATA_ERROR: Z_DATA_ERROR$1,
    Z_MEM_ERROR: Z_MEM_ERROR$1,
    Z_BUF_ERROR,
    Z_DEFLATED
  } = constants$2;
  const HEAD = 16180;
  const FLAGS = 16181;
  const TIME = 16182;
  const OS = 16183;
  const EXLEN = 16184;
  const EXTRA = 16185;
  const NAME = 16186;
  const COMMENT = 16187;
  const HCRC = 16188;
  const DICTID = 16189;
  const DICT = 16190;
  const TYPE = 16191;
  const TYPEDO = 16192;
  const STORED = 16193;
  const COPY_ = 16194;
  const COPY = 16195;
  const TABLE = 16196;
  const LENLENS = 16197;
  const CODELENS = 16198;
  const LEN_ = 16199;
  const LEN = 16200;
  const LENEXT = 16201;
  const DIST = 16202;
  const DISTEXT = 16203;
  const MATCH = 16204;
  const LIT = 16205;
  const CHECK = 16206;
  const LENGTH = 16207;
  const DONE = 16208;
  const BAD = 16209;
  const MEM = 16210;
  const SYNC = 16211;
  const ENOUGH_LENS = 852;
  const ENOUGH_DISTS = 592;
  const MAX_WBITS = 15;
  const DEF_WBITS = MAX_WBITS;
  const zswap32 = (q) => {
    return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
  };
  function InflateState() {
    this.strm = null;
    this.mode = 0;
    this.last = false;
    this.wrap = 0;
    this.havedict = false;
    this.flags = 0;
    this.dmax = 0;
    this.check = 0;
    this.total = 0;
    this.head = null;
    this.wbits = 0;
    this.wsize = 0;
    this.whave = 0;
    this.wnext = 0;
    this.window = null;
    this.hold = 0;
    this.bits = 0;
    this.length = 0;
    this.offset = 0;
    this.extra = 0;
    this.lencode = null;
    this.distcode = null;
    this.lenbits = 0;
    this.distbits = 0;
    this.ncode = 0;
    this.nlen = 0;
    this.ndist = 0;
    this.have = 0;
    this.next = null;
    this.lens = new Uint16Array(320);
    this.work = new Uint16Array(288);
    this.lendyn = null;
    this.distdyn = null;
    this.sane = 0;
    this.back = 0;
    this.was = 0;
  }
  const inflateStateCheck = (strm) => {
    if (!strm) {
      return 1;
    }
    const state = strm.state;
    if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
      return 1;
    }
    return 0;
  };
  const inflateResetKeep = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = "";
    if (state.wrap) {
      strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.flags = -1;
    state.dmax = 32768;
    state.head = null;
    state.hold = 0;
    state.bits = 0;
    state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
    state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
    state.sane = 1;
    state.back = -1;
    return Z_OK$1;
  };
  const inflateReset = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
  };
  const inflateReset2 = (strm, windowBits) => {
    let wrap;
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else {
      wrap = (windowBits >> 4) + 5;
      if (windowBits < 48) {
        windowBits &= 15;
      }
    }
    if (windowBits && (windowBits < 8 || windowBits > 15)) {
      return Z_STREAM_ERROR$1;
    }
    if (state.window !== null && state.wbits !== windowBits) {
      state.window = null;
    }
    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
  };
  const inflateInit2 = (strm, windowBits) => {
    if (!strm) {
      return Z_STREAM_ERROR$1;
    }
    const state = new InflateState();
    strm.state = state;
    state.strm = strm;
    state.window = null;
    state.mode = HEAD;
    const ret = inflateReset2(strm, windowBits);
    if (ret !== Z_OK$1) {
      strm.state = null;
    }
    return ret;
  };
  const inflateInit = (strm) => {
    return inflateInit2(strm, DEF_WBITS);
  };
  let virgin = true;
  let lenfix, distfix;
  const fixedtables = (state) => {
    if (virgin) {
      lenfix = new Int32Array(512);
      distfix = new Int32Array(32);
      let sym = 0;
      while (sym < 144) {
        state.lens[sym++] = 8;
      }
      while (sym < 256) {
        state.lens[sym++] = 9;
      }
      while (sym < 280) {
        state.lens[sym++] = 7;
      }
      while (sym < 288) {
        state.lens[sym++] = 8;
      }
      inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
      sym = 0;
      while (sym < 32) {
        state.lens[sym++] = 5;
      }
      inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
      virgin = false;
    }
    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
  };
  const updatewindow = (strm, src, end, copy) => {
    let dist;
    const state = strm.state;
    if (state.window === null) {
      state.wsize = 1 << state.wbits;
      state.wnext = 0;
      state.whave = 0;
      state.window = new Uint8Array(state.wsize);
    }
    if (copy >= state.wsize) {
      state.window.set(src.subarray(end - state.wsize, end), 0);
      state.wnext = 0;
      state.whave = state.wsize;
    } else {
      dist = state.wsize - state.wnext;
      if (dist > copy) {
        dist = copy;
      }
      state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
      copy -= dist;
      if (copy) {
        state.window.set(src.subarray(end - copy, end), 0);
        state.wnext = copy;
        state.whave = state.wsize;
      } else {
        state.wnext += dist;
        if (state.wnext === state.wsize) {
          state.wnext = 0;
        }
        if (state.whave < state.wsize) {
          state.whave += dist;
        }
      }
    }
    return 0;
  };
  const inflate$2 = (strm, flush) => {
    let state;
    let input, output;
    let next2;
    let put;
    let have, left;
    let hold;
    let bits;
    let _in, _out;
    let copy;
    let from;
    let from_source;
    let here = 0;
    let here_bits, here_op, here_val;
    let last_bits, last_op, last_val;
    let len;
    let ret;
    const hbuf = new Uint8Array(4);
    let opts;
    let n;
    const order2 = (
      /* permutation of code lengths */
      new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
    );
    if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.mode === TYPE) {
      state.mode = TYPEDO;
    }
    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next2 = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    _in = have;
    _out = left;
    ret = Z_OK$1;
    inf_leave:
      for (; ; ) {
        switch (state.mode) {
          case HEAD:
            if (state.wrap === 0) {
              state.mode = TYPEDO;
              break;
            }
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            if (state.wrap & 2 && hold === 35615) {
              if (state.wbits === 0) {
                state.wbits = 15;
              }
              state.check = 0;
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
              hold = 0;
              bits = 0;
              state.mode = FLAGS;
              break;
            }
            if (state.head) {
              state.head.done = false;
            }
            if (!(state.wrap & 1) || /* check if zlib header allowed */
            (((hold & 255) << 8) + (hold >> 8)) % 31) {
              strm.msg = "incorrect header check";
              state.mode = BAD;
              break;
            }
            if ((hold & 15) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            hold >>>= 4;
            bits -= 4;
            len = (hold & 15) + 8;
            if (state.wbits === 0) {
              state.wbits = len;
            }
            if (len > 15 || len > state.wbits) {
              strm.msg = "invalid window size";
              state.mode = BAD;
              break;
            }
            state.dmax = 1 << state.wbits;
            state.flags = 0;
            strm.adler = state.check = 1;
            state.mode = hold & 512 ? DICTID : TYPE;
            hold = 0;
            bits = 0;
            break;
          case FLAGS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            state.flags = hold;
            if ((state.flags & 255) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            if (state.flags & 57344) {
              strm.msg = "unknown header flags set";
              state.mode = BAD;
              break;
            }
            if (state.head) {
              state.head.text = hold >> 8 & 1;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = TIME;
          case TIME:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.time = hold;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              hbuf[2] = hold >>> 16 & 255;
              hbuf[3] = hold >>> 24 & 255;
              state.check = crc32_1(state.check, hbuf, 4, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = OS;
          case OS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.xflags = hold & 255;
              state.head.os = hold >> 8;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = EXLEN;
          case EXLEN:
            if (state.flags & 1024) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              state.length = hold;
              if (state.head) {
                state.head.extra_len = hold;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32_1(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
            } else if (state.head) {
              state.head.extra = null;
            }
            state.mode = EXTRA;
          case EXTRA:
            if (state.flags & 1024) {
              copy = state.length;
              if (copy > have) {
                copy = have;
              }
              if (copy) {
                if (state.head) {
                  len = state.head.extra_len - state.length;
                  if (!state.head.extra) {
                    state.head.extra = new Uint8Array(state.head.extra_len);
                  }
                  state.head.extra.set(
                    input.subarray(
                      next2,
                      // extra field is limited to 65536 bytes
                      // - no need for additional size check
                      next2 + copy
                    ),
                    /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                    len
                  );
                }
                if (state.flags & 512 && state.wrap & 4) {
                  state.check = crc32_1(state.check, input, copy, next2);
                }
                have -= copy;
                next2 += copy;
                state.length -= copy;
              }
              if (state.length) {
                break inf_leave;
              }
            }
            state.length = 0;
            state.mode = NAME;
          case NAME:
            if (state.flags & 2048) {
              if (have === 0) {
                break inf_leave;
              }
              copy = 0;
              do {
                len = input[next2 + copy++];
                if (state.head && len && state.length < 65536) {
                  state.head.name += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy, next2);
              }
              have -= copy;
              next2 += copy;
              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.name = null;
            }
            state.length = 0;
            state.mode = COMMENT;
          case COMMENT:
            if (state.flags & 4096) {
              if (have === 0) {
                break inf_leave;
              }
              copy = 0;
              do {
                len = input[next2 + copy++];
                if (state.head && len && state.length < 65536) {
                  state.head.comment += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy, next2);
              }
              have -= copy;
              next2 += copy;
              if (len) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.comment = null;
            }
            state.mode = HCRC;
          case HCRC:
            if (state.flags & 512) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              if (state.wrap & 4 && hold !== (state.check & 65535)) {
                strm.msg = "header crc mismatch";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            if (state.head) {
              state.head.hcrc = state.flags >> 9 & 1;
              state.head.done = true;
            }
            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;
          case DICTID:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            strm.adler = state.check = zswap32(hold);
            hold = 0;
            bits = 0;
            state.mode = DICT;
          case DICT:
            if (state.havedict === 0) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next2;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              return Z_NEED_DICT$1;
            }
            strm.adler = state.check = 1;
            state.mode = TYPE;
          case TYPE:
            if (flush === Z_BLOCK || flush === Z_TREES) {
              break inf_leave;
            }
          case TYPEDO:
            if (state.last) {
              hold >>>= bits & 7;
              bits -= bits & 7;
              state.mode = CHECK;
              break;
            }
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            state.last = hold & 1;
            hold >>>= 1;
            bits -= 1;
            switch (hold & 3) {
              case 0:
                state.mode = STORED;
                break;
              case 1:
                fixedtables(state);
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  hold >>>= 2;
                  bits -= 2;
                  break inf_leave;
                }
                break;
              case 2:
                state.mode = TABLE;
                break;
              case 3:
                strm.msg = "invalid block type";
                state.mode = BAD;
            }
            hold >>>= 2;
            bits -= 2;
            break;
          case STORED:
            hold >>>= bits & 7;
            bits -= bits & 7;
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
              strm.msg = "invalid stored block lengths";
              state.mode = BAD;
              break;
            }
            state.length = hold & 65535;
            hold = 0;
            bits = 0;
            state.mode = COPY_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          case COPY_:
            state.mode = COPY;
          case COPY:
            copy = state.length;
            if (copy) {
              if (copy > have) {
                copy = have;
              }
              if (copy > left) {
                copy = left;
              }
              if (copy === 0) {
                break inf_leave;
              }
              output.set(input.subarray(next2, next2 + copy), put);
              have -= copy;
              next2 += copy;
              left -= copy;
              put += copy;
              state.length -= copy;
              break;
            }
            state.mode = TYPE;
            break;
          case TABLE:
            while (bits < 14) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            state.nlen = (hold & 31) + 257;
            hold >>>= 5;
            bits -= 5;
            state.ndist = (hold & 31) + 1;
            hold >>>= 5;
            bits -= 5;
            state.ncode = (hold & 15) + 4;
            hold >>>= 4;
            bits -= 4;
            if (state.nlen > 286 || state.ndist > 30) {
              strm.msg = "too many length or distance symbols";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = LENLENS;
          case LENLENS:
            while (state.have < state.ncode) {
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              state.lens[order2[state.have++]] = hold & 7;
              hold >>>= 3;
              bits -= 3;
            }
            while (state.have < 19) {
              state.lens[order2[state.have++]] = 0;
            }
            state.lencode = state.lendyn;
            state.lenbits = 7;
            opts = { bits: state.lenbits };
            ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid code lengths set";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = CODELENS;
          case CODELENS:
            while (state.have < state.nlen + state.ndist) {
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              if (here_val < 16) {
                hold >>>= here_bits;
                bits -= here_bits;
                state.lens[state.have++] = here_val;
              } else {
                if (here_val === 16) {
                  n = here_bits + 2;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next2++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  if (state.have === 0) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  len = state.lens[state.have - 1];
                  copy = 3 + (hold & 3);
                  hold >>>= 2;
                  bits -= 2;
                } else if (here_val === 17) {
                  n = here_bits + 3;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next2++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len = 0;
                  copy = 3 + (hold & 7);
                  hold >>>= 3;
                  bits -= 3;
                } else {
                  n = here_bits + 7;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next2++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len = 0;
                  copy = 11 + (hold & 127);
                  hold >>>= 7;
                  bits -= 7;
                }
                if (state.have + copy > state.nlen + state.ndist) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                while (copy--) {
                  state.lens[state.have++] = len;
                }
              }
            }
            if (state.mode === BAD) {
              break;
            }
            if (state.lens[256] === 0) {
              strm.msg = "invalid code -- missing end-of-block";
              state.mode = BAD;
              break;
            }
            state.lenbits = 9;
            opts = { bits: state.lenbits };
            ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid literal/lengths set";
              state.mode = BAD;
              break;
            }
            state.distbits = 6;
            state.distcode = state.distdyn;
            opts = { bits: state.distbits };
            ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
            state.distbits = opts.bits;
            if (ret) {
              strm.msg = "invalid distances set";
              state.mode = BAD;
              break;
            }
            state.mode = LEN_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          case LEN_:
            state.mode = LEN;
          case LEN:
            if (have >= 6 && left >= 258) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next2;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              inffast(strm, _out);
              put = strm.next_out;
              output = strm.output;
              left = strm.avail_out;
              next2 = strm.next_in;
              input = strm.input;
              have = strm.avail_in;
              hold = state.hold;
              bits = state.bits;
              if (state.mode === TYPE) {
                state.back = -1;
              }
              break;
            }
            state.back = 0;
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            if (here_op && (here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            state.length = here_val;
            if (here_op === 0) {
              state.mode = LIT;
              break;
            }
            if (here_op & 32) {
              state.back = -1;
              state.mode = TYPE;
              break;
            }
            if (here_op & 64) {
              strm.msg = "invalid literal/length code";
              state.mode = BAD;
              break;
            }
            state.extra = here_op & 15;
            state.mode = LENEXT;
          case LENEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              state.length += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            state.was = state.length;
            state.mode = DIST;
          case DIST:
            for (; ; ) {
              here = state.distcode[hold & (1 << state.distbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next2++] << bits;
              bits += 8;
            }
            if ((here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            if (here_op & 64) {
              strm.msg = "invalid distance code";
              state.mode = BAD;
              break;
            }
            state.offset = here_val;
            state.extra = here_op & 15;
            state.mode = DISTEXT;
          case DISTEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              state.offset += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            if (state.offset > state.dmax) {
              strm.msg = "invalid distance too far back";
              state.mode = BAD;
              break;
            }
            state.mode = MATCH;
          case MATCH:
            if (left === 0) {
              break inf_leave;
            }
            copy = _out - left;
            if (state.offset > copy) {
              copy = state.offset - copy;
              if (copy > state.whave) {
                if (state.sane) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
              }
              if (copy > state.wnext) {
                copy -= state.wnext;
                from = state.wsize - copy;
              } else {
                from = state.wnext - copy;
              }
              if (copy > state.length) {
                copy = state.length;
              }
              from_source = state.window;
            } else {
              from_source = output;
              from = put - state.offset;
              copy = state.length;
            }
            if (copy > left) {
              copy = left;
            }
            left -= copy;
            state.length -= copy;
            do {
              output[put++] = from_source[from++];
            } while (--copy);
            if (state.length === 0) {
              state.mode = LEN;
            }
            break;
          case LIT:
            if (left === 0) {
              break inf_leave;
            }
            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;
          case CHECK:
            if (state.wrap) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold |= input[next2++] << bits;
                bits += 8;
              }
              _out -= left;
              strm.total_out += _out;
              state.total += _out;
              if (state.wrap & 4 && _out) {
                strm.adler = state.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
                state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
              }
              _out = left;
              if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
                strm.msg = "incorrect data check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = LENGTH;
          case LENGTH:
            if (state.wrap && state.flags) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next2++] << bits;
                bits += 8;
              }
              if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
                strm.msg = "incorrect length check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = DONE;
          case DONE:
            ret = Z_STREAM_END$1;
            break inf_leave;
          case BAD:
            ret = Z_DATA_ERROR$1;
            break inf_leave;
          case MEM:
            return Z_MEM_ERROR$1;
          case SYNC:
          default:
            return Z_STREAM_ERROR$1;
        }
      }
    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next2;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
      if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap & 4 && _out) {
      strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
      state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
    if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
      ret = Z_BUF_ERROR;
    }
    return ret;
  };
  const inflateEnd = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    let state = strm.state;
    if (state.window) {
      state.window = null;
    }
    strm.state = null;
    return Z_OK$1;
  };
  const inflateGetHeader = (strm, head) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if ((state.wrap & 2) === 0) {
      return Z_STREAM_ERROR$1;
    }
    state.head = head;
    head.done = false;
    return Z_OK$1;
  };
  const inflateSetDictionary = (strm, dictionary) => {
    const dictLength = dictionary.length;
    let state;
    let dictid;
    let ret;
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.wrap !== 0 && state.mode !== DICT) {
      return Z_STREAM_ERROR$1;
    }
    if (state.mode === DICT) {
      dictid = 1;
      dictid = adler32_1(dictid, dictionary, dictLength, 0);
      if (dictid !== state.check) {
        return Z_DATA_ERROR$1;
      }
    }
    ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret) {
      state.mode = MEM;
      return Z_MEM_ERROR$1;
    }
    state.havedict = 1;
    return Z_OK$1;
  };
  var inflateReset_1 = inflateReset;
  var inflateReset2_1 = inflateReset2;
  var inflateResetKeep_1 = inflateResetKeep;
  var inflateInit_1 = inflateInit;
  var inflateInit2_1 = inflateInit2;
  var inflate_2$1 = inflate$2;
  var inflateEnd_1 = inflateEnd;
  var inflateGetHeader_1 = inflateGetHeader;
  var inflateSetDictionary_1 = inflateSetDictionary;
  var inflateInfo = "pako inflate (from Nodeca project)";
  var inflate_1$2 = {
    inflateReset: inflateReset_1,
    inflateReset2: inflateReset2_1,
    inflateResetKeep: inflateResetKeep_1,
    inflateInit: inflateInit_1,
    inflateInit2: inflateInit2_1,
    inflate: inflate_2$1,
    inflateEnd: inflateEnd_1,
    inflateGetHeader: inflateGetHeader_1,
    inflateSetDictionary: inflateSetDictionary_1,
    inflateInfo
  };
  function GZheader() {
    this.text = 0;
    this.time = 0;
    this.xflags = 0;
    this.os = 0;
    this.extra = null;
    this.extra_len = 0;
    this.name = "";
    this.comment = "";
    this.hcrc = 0;
    this.done = false;
  }
  var gzheader = GZheader;
  const toString = Object.prototype.toString;
  const {
    Z_NO_FLUSH,
    Z_FINISH,
    Z_OK,
    Z_STREAM_END,
    Z_NEED_DICT,
    Z_STREAM_ERROR,
    Z_DATA_ERROR,
    Z_MEM_ERROR
  } = constants$2;
  function Inflate$1(options) {
    this.options = common.assign({
      chunkSize: 1024 * 64,
      windowBits: 15,
      to: ""
    }, options || {});
    const opt = this.options;
    if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
      opt.windowBits = -opt.windowBits;
      if (opt.windowBits === 0) {
        opt.windowBits = -15;
      }
    }
    if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
      opt.windowBits += 32;
    }
    if (opt.windowBits > 15 && opt.windowBits < 48) {
      if ((opt.windowBits & 15) === 0) {
        opt.windowBits |= 15;
      }
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = inflate_1$2.inflateInit2(
      this.strm,
      opt.windowBits
    );
    if (status !== Z_OK) {
      throw new Error(messages[status]);
    }
    this.header = new gzheader();
    inflate_1$2.inflateGetHeader(this.strm, this.header);
    if (opt.dictionary) {
      if (typeof opt.dictionary === "string") {
        opt.dictionary = strings.string2buf(opt.dictionary);
      } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
        opt.dictionary = new Uint8Array(opt.dictionary);
      }
      if (opt.raw) {
        status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
        if (status !== Z_OK) {
          throw new Error(messages[status]);
        }
      }
    }
  }
  Inflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    const dictionary = this.options.dictionary;
    let status, _flush_mode, last_avail_out;
    if (this.ended) return false;
    if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
    else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
    if (toString.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      status = inflate_1$2.inflate(strm, _flush_mode);
      if (status === Z_NEED_DICT && dictionary) {
        status = inflate_1$2.inflateSetDictionary(strm, dictionary);
        if (status === Z_OK) {
          status = inflate_1$2.inflate(strm, _flush_mode);
        } else if (status === Z_DATA_ERROR) {
          status = Z_NEED_DICT;
        }
      }
      while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
        inflate_1$2.inflateReset(strm);
        status = inflate_1$2.inflate(strm, _flush_mode);
      }
      switch (status) {
        case Z_STREAM_ERROR:
        case Z_DATA_ERROR:
        case Z_NEED_DICT:
        case Z_MEM_ERROR:
          this.onEnd(status);
          this.ended = true;
          return false;
      }
      last_avail_out = strm.avail_out;
      if (strm.next_out) {
        if (strm.avail_out === 0 || status === Z_STREAM_END) {
          if (this.options.to === "string") {
            let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
            let tail = strm.next_out - next_out_utf8;
            let utf8str = strings.buf2string(strm.output, next_out_utf8);
            strm.next_out = tail;
            strm.avail_out = chunkSize - tail;
            if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
            this.onData(utf8str);
          } else {
            this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
          }
        }
      }
      if (status === Z_OK && last_avail_out === 0) continue;
      if (status === Z_STREAM_END) {
        status = inflate_1$2.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return true;
      }
      if (strm.avail_in === 0) break;
    }
    return true;
  };
  Inflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Inflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK) {
      if (this.options.to === "string") {
        this.result = this.chunks.join("");
      } else {
        this.result = common.flattenChunks(this.chunks);
      }
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function inflate$1(input, options) {
    const inflator = new Inflate$1(options);
    inflator.push(input);
    if (inflator.err) throw inflator.msg || messages[inflator.err];
    return inflator.result;
  }
  function inflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return inflate$1(input, options);
  }
  var Inflate_1$1 = Inflate$1;
  var inflate_2 = inflate$1;
  var inflateRaw_1$1 = inflateRaw$1;
  var ungzip$1 = inflate$1;
  var inflate_1$1 = {
    Inflate: Inflate_1$1,
    inflate: inflate_2,
    inflateRaw: inflateRaw_1$1,
    ungzip: ungzip$1
  };
  const { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
  const { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
  var Deflate_1 = Deflate;
  var deflate_1 = deflate;
  var deflateRaw_1 = deflateRaw;
  var gzip_1 = gzip;
  var Inflate_1 = Inflate;
  var inflate_1 = inflate;
  var inflateRaw_1 = inflateRaw;
  var ungzip_1 = ungzip;
  var constants_1 = constants$2;
  var pako = {
    Deflate: Deflate_1,
    deflate: deflate_1,
    deflateRaw: deflateRaw_1,
    gzip: gzip_1,
    Inflate: Inflate_1,
    inflate: inflate_1,
    inflateRaw: inflateRaw_1,
    ungzip: ungzip_1,
    constants: constants_1
  };
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
    const decompressedSource = decompressDrawioXml(source);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decompressedSource, "text/xml");
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
  function decompressDrawioXml(source) {
    if (!source.includes("<mxfile")) {
      return source;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "text/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      return source;
    }
    const diagrams = doc.querySelectorAll("diagram");
    if (diagrams.length === 0) {
      return source;
    }
    let modified = false;
    diagrams.forEach((diagram) => {
      var _a2;
      if (diagram.querySelector("mxGraphModel")) {
        return;
      }
      const content = ((_a2 = diagram.textContent) == null ? void 0 : _a2.trim()) || "";
      if (!content || content.length < 20) {
        return;
      }
      if (content.includes("<") || content.includes(">")) {
        return;
      }
      try {
        const decompressed = decompressBase64Content(content);
        if (decompressed && decompressed.includes("<mxGraphModel")) {
          const decompressedDoc = parser.parseFromString(decompressed, "text/xml");
          const graphModel = decompressedDoc.querySelector("mxGraphModel");
          if (graphModel && !decompressedDoc.querySelector("parsererror")) {
            diagram.textContent = "";
            diagram.appendChild(doc.importNode(graphModel, true));
            modified = true;
          }
        }
      } catch (error) {
        console.warn("[DrawioParser] Decompression failed:", error);
      }
    });
    if (modified) {
      const serializer = new XMLSerializer();
      return serializer.serializeToString(doc);
    }
    return source;
  }
  function decompressBase64Content(encoded) {
    try {
      const decoded = atob(encoded);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      const inflated = pako.inflateRaw(bytes, { to: "string" });
      try {
        return decodeURIComponent(inflated);
      } catch {
        return inflated;
      }
    } catch (error) {
      console.warn("[DrawioParser] Base64 decompression failed:", error);
      return null;
    }
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
    var _a2, _b2;
    const sourceExcalidrawId = (_a2 = element.startBinding) == null ? void 0 : _a2.elementId;
    const targetExcalidrawId = (_b2 = element.endBinding) == null ? void 0 : _b2.elementId;
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
    var _a2;
    validateInput(source, "dot");
    const diagram = createEmptyDiagram("flowchart", "dot");
    const nodeMap = /* @__PURE__ */ new Map();
    const graphAttrs2 = parseGraphAttributes(source);
    diagram.metadata = {
      source: "dot",
      direction: ((_a2 = graphAttrs2.rankdir) == null ? void 0 : _a2.toUpperCase()) || "TB",
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
    var _a2;
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
        fill: attrs.fillcolor || (((_a2 = attrs.style) == null ? void 0 : _a2.includes("filled")) ? attrs.color : void 0),
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
  function parseD2(code) {
    const lines = code.split("\n");
    const nodes = /* @__PURE__ */ new Map();
    const edges = [];
    const groups = [];
    let edgeId = 0;
    const groupStack = [];
    const nodeToGroup = /* @__PURE__ */ new Map();
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const groupMatch = line.match(/^(\w+)\s*:\s*\{?\s*$/) || line.match(/^(\w+)\s*\{\s*$/);
      if (groupMatch && line.includes("{")) {
        const groupId = groupMatch[1];
        groups.push({
          id: groupId,
          type: "group",
          label: groupId,
          children: [],
          style: {}
        });
        groupStack.push(groupId);
        continue;
      }
      if (line === "}") {
        groupStack.pop();
        continue;
      }
      const edgeMatch = line.match(/^(\w+)\s*(->|<->|--|<-)\s*(\w+)(?:\s*:\s*(.+))?$/);
      if (edgeMatch) {
        const [, sourceId, arrow, targetId, label] = edgeMatch;
        ensureNode3(nodes, sourceId, groupStack, nodeToGroup);
        ensureNode3(nodes, targetId, groupStack, nodeToGroup);
        edges.push({
          id: `edge-${edgeId++}`,
          type: "edge",
          source: sourceId,
          target: targetId,
          label: label == null ? void 0 : label.trim(),
          arrow: {
            sourceType: arrow === "<->" || arrow === "<-" ? "arrow" : "none",
            targetType: arrow === "->" || arrow === "<->" ? "arrow" : "none",
            lineType: arrow === "--" ? "dashed" : "solid"
          },
          style: {}
        });
        continue;
      }
      const nodeMatch = line.match(/^(\w+)\s*:\s*(.+)$/);
      if (nodeMatch) {
        const [, id, value] = nodeMatch;
        const shape = detectD2Shape(value);
        const label = value.replace(/\{.*\}/, "").trim();
        const node = ensureNode3(nodes, id, groupStack, nodeToGroup);
        node.label = label || id;
        node.shape = shape;
        continue;
      }
      const simpleNode = line.match(/^(\w+)$/);
      if (simpleNode) {
        ensureNode3(nodes, simpleNode[1], groupStack, nodeToGroup);
      }
    }
    for (const [nodeId, groupId] of nodeToGroup) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        group.children.push(nodeId);
      }
    }
    return {
      id: "d2-diagram",
      type: "flowchart",
      nodes: Array.from(nodes.values()),
      edges,
      groups,
      metadata: { source: "d2" }
    };
  }
  function ensureNode3(nodes, id, groupStack, nodeToGroup) {
    if (!nodes.has(id)) {
      const node = {
        id,
        type: "node",
        label: id,
        shape: "rectangle",
        style: {}
      };
      nodes.set(id, node);
      if (groupStack.length > 0) {
        nodeToGroup.set(id, groupStack[groupStack.length - 1]);
      }
    }
    return nodes.get(id);
  }
  function detectD2Shape(value) {
    const lower = value.toLowerCase();
    if (lower.includes("circle") || lower.includes("oval")) return "circle";
    if (lower.includes("diamond")) return "diamond";
    if (lower.includes("cylinder") || lower.includes("database")) return "cylinder";
    if (lower.includes("hexagon")) return "hexagon";
    if (lower.includes("cloud")) return "cloud";
    if (lower.includes("person") || lower.includes("actor")) return "actor";
    return "rectangle";
  }
  function parseStructurizr(code) {
    const lines = code.split("\n");
    const nodes = /* @__PURE__ */ new Map();
    const edges = [];
    const groups = [];
    let edgeId = 0;
    const containerStack = [];
    const nodeToContainer = /* @__PURE__ */ new Map();
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("#")) continue;
      const personMatch = line.match(/^person\s+(\w+)\s+"([^"]+)"(?:\s+"([^"]+)")?/i);
      if (personMatch) {
        const [, id, name] = personMatch;
        nodes.set(id, createNode3(id, name, "actor"));
        addToContainer(id, containerStack, nodeToContainer);
        continue;
      }
      const systemMatch = line.match(/^softwareSystem\s+(\w+)\s+"([^"]+)"(?:\s+"([^"]+)")?/i);
      if (systemMatch) {
        const [, id, name] = systemMatch;
        nodes.set(id, createNode3(id, name, "rectangle"));
        addToContainer(id, containerStack, nodeToContainer);
        continue;
      }
      const containerMatch = line.match(/^container\s+(\w+)\s+"([^"]+)"(?:\s+"([^"]+)")?/i);
      if (containerMatch) {
        const [, id, name, tech] = containerMatch;
        const node = createNode3(id, tech ? `${name}
[${tech}]` : name, "rectangle");
        nodes.set(id, node);
        addToContainer(id, containerStack, nodeToContainer);
        continue;
      }
      const componentMatch = line.match(/^component\s+(\w+)\s+"([^"]+)"(?:\s+"([^"]+)")?/i);
      if (componentMatch) {
        const [, id, name, tech] = componentMatch;
        const node = createNode3(id, tech ? `${name}
[${tech}]` : name, "rectangle");
        nodes.set(id, node);
        addToContainer(id, containerStack, nodeToContainer);
        continue;
      }
      const relMatch = line.match(/^(\w+)\s*->\s*(\w+)(?:\s+"([^"]+)")?(?:\s+"([^"]+)")?/);
      if (relMatch) {
        const [, sourceId, targetId, desc, tech] = relMatch;
        const label = tech ? `${desc || ""} [${tech}]`.trim() : desc;
        edges.push({
          id: `edge-${edgeId++}`,
          type: "edge",
          source: sourceId,
          target: targetId,
          label,
          arrow: { sourceType: "none", targetType: "arrow", lineType: "solid" },
          style: {}
        });
        continue;
      }
      const groupMatch = line.match(/^(enterprise|group|softwareSystemBoundary|containerBoundary)\s+(\w+)(?:\s+"([^"]+)")?\s*\{/i);
      if (groupMatch) {
        const [, type, id, name] = groupMatch;
        groups.push({
          id,
          type: "group",
          label: name || id,
          children: [],
          style: {},
          metadata: { structurizrType: type }
        });
        containerStack.push(id);
        continue;
      }
      if (line === "}") {
        containerStack.pop();
      }
    }
    for (const [nodeId, groupId] of nodeToContainer) {
      const group = groups.find((g) => g.id === groupId);
      if (group) group.children.push(nodeId);
    }
    return {
      id: "structurizr-diagram",
      type: "flowchart",
      nodes: Array.from(nodes.values()),
      edges,
      groups,
      metadata: { source: "structurizr" }
    };
  }
  function createNode3(id, label, shape) {
    return { id, type: "node", label, shape, style: {} };
  }
  function addToContainer(nodeId, stack, map) {
    if (stack.length > 0) {
      map.set(nodeId, stack[stack.length - 1]);
    }
  }
  function parseBpmn(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const nodes = [];
    const edges = [];
    const groups = [];
    const processes = doc.querySelectorAll("process, bpmn\\:process");
    processes.forEach((process2) => {
      process2.getAttribute("id") || "process";
      const tasks = process2.querySelectorAll("task, userTask, serviceTask, scriptTask, manualTask, businessRuleTask, sendTask, receiveTask, bpmn\\:task, bpmn\\:userTask, bpmn\\:serviceTask");
      tasks.forEach((task) => {
        nodes.push(createBpmnNode(task, "rectangle"));
      });
      const startEvents = process2.querySelectorAll("startEvent, bpmn\\:startEvent");
      startEvents.forEach((event) => {
        nodes.push(createBpmnNode(event, "circle", "start"));
      });
      const endEvents = process2.querySelectorAll("endEvent, bpmn\\:endEvent");
      endEvents.forEach((event) => {
        nodes.push(createBpmnNode(event, "circle", "end"));
      });
      const intermediateEvents = process2.querySelectorAll("intermediateCatchEvent, intermediateThrowEvent, bpmn\\:intermediateCatchEvent, bpmn\\:intermediateThrowEvent");
      intermediateEvents.forEach((event) => {
        nodes.push(createBpmnNode(event, "circle", "intermediate"));
      });
      const exclusiveGateways = process2.querySelectorAll("exclusiveGateway, bpmn\\:exclusiveGateway");
      exclusiveGateways.forEach((gw) => {
        nodes.push(createBpmnNode(gw, "diamond", "exclusive"));
      });
      const parallelGateways = process2.querySelectorAll("parallelGateway, bpmn\\:parallelGateway");
      parallelGateways.forEach((gw) => {
        nodes.push(createBpmnNode(gw, "diamond", "parallel"));
      });
      const inclusiveGateways = process2.querySelectorAll("inclusiveGateway, bpmn\\:inclusiveGateway");
      inclusiveGateways.forEach((gw) => {
        nodes.push(createBpmnNode(gw, "diamond", "inclusive"));
      });
      const flows = process2.querySelectorAll("sequenceFlow, bpmn\\:sequenceFlow");
      flows.forEach((flow) => {
        const id = flow.getAttribute("id") || `flow-${edges.length}`;
        const sourceRef = flow.getAttribute("sourceRef") || "";
        const targetRef = flow.getAttribute("targetRef") || "";
        const name = flow.getAttribute("name") || "";
        if (sourceRef && targetRef) {
          edges.push({
            id,
            type: "edge",
            source: sourceRef,
            target: targetRef,
            label: name,
            arrow: { sourceType: "none", targetType: "arrow", lineType: "solid" },
            style: {}
          });
        }
      });
      const lanes = process2.querySelectorAll("lane, bpmn\\:lane");
      lanes.forEach((lane) => {
        const id = lane.getAttribute("id") || `lane-${groups.length}`;
        const name = lane.getAttribute("name") || id;
        const flowNodeRefs = lane.querySelectorAll("flowNodeRef, bpmn\\:flowNodeRef");
        const children = Array.from(flowNodeRefs).map((ref) => ref.textContent || "").filter(Boolean);
        groups.push({
          id,
          type: "group",
          label: name,
          children,
          style: {},
          metadata: { bpmnType: "lane" }
        });
      });
      const subprocesses = process2.querySelectorAll("subProcess, bpmn\\:subProcess");
      subprocesses.forEach((sp) => {
        const id = sp.getAttribute("id") || `subprocess-${groups.length}`;
        const name = sp.getAttribute("name") || id;
        groups.push({
          id,
          type: "group",
          label: name,
          children: [],
          style: {},
          metadata: { bpmnType: "subprocess" }
        });
      });
    });
    return {
      id: "bpmn-diagram",
      type: "flowchart",
      nodes,
      edges,
      groups,
      metadata: { source: "bpmn" }
    };
  }
  function createBpmnNode(element, shape, subtype) {
    const id = element.getAttribute("id") || `node-${Date.now()}`;
    const name = element.getAttribute("name") || id;
    return {
      id,
      type: "node",
      label: name,
      shape,
      style: {},
      metadata: { bpmnType: element.tagName, bpmnSubtype: subtype }
    };
  }
  function parseGraphml(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const nodes = [];
    const edges = [];
    const groups = [];
    const keys = /* @__PURE__ */ new Map();
    doc.querySelectorAll("key").forEach((key) => {
      const id = key.getAttribute("id") || "";
      const forAttr = key.getAttribute("for") || "all";
      const name = key.getAttribute("attr.name") || id;
      keys.set(id, { for: forAttr, name });
    });
    const nodeElements = doc.querySelectorAll("graph > node");
    nodeElements.forEach((nodeEl) => {
      const id = nodeEl.getAttribute("id") || `node-${nodes.length}`;
      const nestedGraph = nodeEl.querySelector("graph");
      if (nestedGraph) {
        const label = getDataValue(nodeEl, "label", keys) || id;
        groups.push({
          id,
          type: "group",
          label,
          children: [],
          style: {}
        });
        nestedGraph.querySelectorAll(":scope > node").forEach((nested) => {
          const nestedId = nested.getAttribute("id") || "";
          const nestedLabel = getDataValue(nested, "label", keys) || nestedId;
          const shape = detectGraphmlShape(nested, keys);
          nodes.push({ id: nestedId, type: "node", label: nestedLabel, shape, style: {} });
          const group = groups.find((g) => g.id === id);
          if (group) group.children.push(nestedId);
        });
      } else {
        const label = getDataValue(nodeEl, "label", keys) || id;
        const shape = detectGraphmlShape(nodeEl, keys);
        nodes.push({ id, type: "node", label, shape, style: {} });
      }
    });
    const edgeElements = doc.querySelectorAll("graph > edge");
    edgeElements.forEach((edgeEl) => {
      var _a2;
      const id = edgeEl.getAttribute("id") || `edge-${edges.length}`;
      const source = edgeEl.getAttribute("source") || "";
      const target = edgeEl.getAttribute("target") || "";
      const label = getDataValue(edgeEl, "label", keys) || "";
      const directed = ((_a2 = edgeEl.closest("graph")) == null ? void 0 : _a2.getAttribute("edgedefault")) !== "undirected";
      if (source && target) {
        edges.push({
          id,
          type: "edge",
          source,
          target,
          label: label || void 0,
          arrow: {
            sourceType: "none",
            targetType: directed ? "arrow" : "none",
            lineType: "solid"
          },
          style: {}
        });
      }
    });
    return {
      id: "graphml-diagram",
      type: "flowchart",
      nodes,
      edges,
      groups,
      metadata: { source: "graphml" }
    };
  }
  function getDataValue(element, attrName, keys) {
    for (const [keyId, keyInfo] of keys) {
      if (keyInfo.name === attrName || keyId === attrName) {
        const dataEl = element.querySelector(`data[key="${keyId}"]`);
        if (dataEl) return dataEl.textContent;
      }
    }
    const directData = element.querySelector(`data[key="${attrName}"]`);
    return (directData == null ? void 0 : directData.textContent) || null;
  }
  function detectGraphmlShape(element, keys) {
    const shapeData = getDataValue(element, "shape", keys) || getDataValue(element, "type", keys) || "";
    const lower = shapeData.toLowerCase();
    if (lower.includes("ellipse") || lower.includes("circle")) return "ellipse";
    if (lower.includes("diamond")) return "diamond";
    if (lower.includes("hexagon")) return "hexagon";
    if (lower.includes("cylinder") || lower.includes("database")) return "cylinder";
    if (lower.includes("rounded")) return "rounded-rectangle";
    return "rectangle";
  }
  function parseLucidchart(json2) {
    var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j;
    const data = JSON.parse(json2);
    const nodes = [];
    const edges = [];
    const groups = [];
    const shapes = data.shapes || ((_b2 = (_a2 = data.pages) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.shapes) || [];
    const lines = data.lines || ((_d = (_c = data.pages) == null ? void 0 : _c[0]) == null ? void 0 : _d.lines) || [];
    const lucidGroups = data.groups || ((_f = (_e = data.pages) == null ? void 0 : _e[0]) == null ? void 0 : _f.groups) || [];
    for (const shape of shapes) {
      const nodeShape = detectLucidShape(shape);
      const position2 = shape.boundingBox ? { x: shape.boundingBox.x, y: shape.boundingBox.y } : void 0;
      const size = shape.boundingBox ? { width: shape.boundingBox.w, height: shape.boundingBox.h } : void 0;
      nodes.push({
        id: shape.id,
        type: "node",
        label: shape.text || shape.id,
        shape: nodeShape,
        position: position2,
        size,
        style: {},
        metadata: { lucidClass: shape.class, lucidType: shape.type }
      });
    }
    for (const line of lines) {
      const sourceId = (_g = line.endpoint1) == null ? void 0 : _g.shapeId;
      const targetId = (_h = line.endpoint2) == null ? void 0 : _h.shapeId;
      if (sourceId && targetId) {
        edges.push({
          id: line.id,
          type: "edge",
          source: sourceId,
          target: targetId,
          label: line.text,
          arrow: {
            sourceType: detectArrowHead((_i = line.endpoint1) == null ? void 0 : _i.style),
            targetType: detectArrowHead((_j = line.endpoint2) == null ? void 0 : _j.style),
            lineType: "solid"
          },
          style: {}
        });
      }
    }
    for (const group of lucidGroups) {
      groups.push({
        id: group.id,
        type: "group",
        label: group.text || group.id,
        children: group.members || [],
        style: {}
      });
    }
    return {
      id: "lucidchart-diagram",
      type: "flowchart",
      nodes,
      edges,
      groups,
      metadata: { source: "lucidchart" }
    };
  }
  function detectLucidShape(shape) {
    const type = (shape.type || shape.class || "").toLowerCase();
    if (type.includes("diamond") || type.includes("decision")) return "diamond";
    if (type.includes("ellipse") || type.includes("oval") || type.includes("circle")) return "ellipse";
    if (type.includes("cylinder") || type.includes("database") || type.includes("data")) return "cylinder";
    if (type.includes("hexagon")) return "hexagon";
    if (type.includes("parallelogram")) return "parallelogram";
    if (type.includes("cloud")) return "cloud";
    if (type.includes("actor") || type.includes("person") || type.includes("user")) return "actor";
    if (type.includes("document")) return "document";
    if (type.includes("rounded")) return "rounded-rectangle";
    return "rectangle";
  }
  function detectArrowHead(style) {
    if (!style) return "none";
    const lower = style.toLowerCase();
    if (lower.includes("arrow") || lower.includes("filled")) return "arrow";
    if (lower.includes("diamond")) return "diamond";
    if (lower.includes("circle") || lower.includes("dot")) return "circle";
    return "none";
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
    var _a2;
    const parts = [];
    parts.push("edgeStyle=orthogonalEdgeStyle");
    parts.push("rounded=1");
    parts.push("orthogonalLoop=1");
    parts.push("jettySize=auto");
    parts.push("html=1");
    const arrowStyle = generateDrawioArrowStyle(edge.arrow);
    parts.push(arrowStyle);
    const lineType = ((_a2 = edge.arrow) == null ? void 0 : _a2.lineType) || "solid";
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
    var _a2;
    const lines = [];
    const direction = ((_a2 = diagram.metadata) == null ? void 0 : _a2.direction) || "TB";
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
    var _a2;
    const lines = [];
    const rawLabel = group.label || group.id;
    const label = rawLabel.replace(/<[^>]*>/g, "").trim() || "Group";
    const safeGroupId = sanitizeMermaidId(group.id);
    const groupDirection = ((_a2 = group.metadata) == null ? void 0 : _a2.direction) || "";
    lines.push(`    subgraph ${safeGroupId}[${label}]`);
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
    const safeId = sanitizeMermaidId(node.id);
    return `${safeId}${generateMermaidShape(node.shape, node.label)}`;
  }
  function sanitizeMermaidId(id) {
    let safe = id.replace(/[^a-zA-Z0-9_]/g, "_");
    if (!/^[a-zA-Z]/.test(safe)) {
      safe = "n_" + safe;
    }
    if (safe.length > 30) {
      safe = safe.substring(0, 30);
    }
    return safe;
  }
  function generateEdge(edge) {
    const arrow = generateMermaidArrow(edge.arrow);
    const sourceId = sanitizeMermaidId(edge.source);
    const targetId = sanitizeMermaidId(edge.target);
    if (edge.label) {
      const cleanLabel = edge.label.replace(/<[^>]*>/g, "").replace(/\|/g, "/").replace(/\n/g, " ").trim();
      return `${sourceId} ${arrow}|${cleanLabel}| ${targetId}`;
    }
    return `${sourceId} ${arrow} ${targetId}`;
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
      styleGroups.get(signature).nodeIds.push(sanitizeMermaidId(node.id));
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
    var _a2;
    const lines = [];
    const direction = ((_a2 = diagram.metadata) == null ? void 0 : _a2.direction) || "TB";
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
    var _a2;
    const lines = [];
    const direction = ((_a2 = diagram.metadata) == null ? void 0 : _a2.direction) || "TB";
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
    var _a2, _b2, _c, _d;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of diagram.nodes) {
      const x = ((_a2 = node.position) == null ? void 0 : _a2.x) ?? 0;
      const y = ((_b2 = node.position) == null ? void 0 : _b2.y) ?? 0;
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
    var _a2, _b2, _c, _d;
    const x = ((_a2 = node.position) == null ? void 0 : _a2.x) ?? 0;
    const y = ((_b2 = node.position) == null ? void 0 : _b2.y) ?? 0;
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
    var _a2, _b2, _c, _d;
    const x = ((_a2 = group.position) == null ? void 0 : _a2.x) ?? 0;
    const y = ((_b2 = group.position) == null ? void 0 : _b2.y) ?? 0;
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
    var _a2, _b2, _c, _d;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of diagram.nodes) {
      const x = ((_a2 = node.position) == null ? void 0 : _a2.x) ?? 0;
      const y = ((_b2 = node.position) == null ? void 0 : _b2.y) ?? 0;
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
    var _a2, _b2, _c, _d;
    const x = ((_a2 = node.position) == null ? void 0 : _a2.x) ?? 0;
    const y = ((_b2 = node.position) == null ? void 0 : _b2.y) ?? 0;
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
    var _a2, _b2, _c, _d;
    const x = ((_a2 = group.position) == null ? void 0 : _a2.x) ?? 0;
    const y = ((_b2 = group.position) == null ? void 0 : _b2.y) ?? 0;
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
  function generateD2(diagram) {
    var _a2;
    const lines = [];
    const direction = ((_a2 = diagram.metadata) == null ? void 0 : _a2.direction) || "right";
    if (direction === "TB" || direction === "down") {
      lines.push("direction: down");
    } else if (direction === "BT" || direction === "up") {
      lines.push("direction: up");
    } else if (direction === "RL" || direction === "left") {
      lines.push("direction: left");
    }
    if (lines.length > 0) lines.push("");
    const nodesInGroups = /* @__PURE__ */ new Set();
    for (const group of diagram.groups) {
      for (const childId of group.children) {
        nodesInGroups.add(childId);
      }
    }
    for (const group of diagram.groups) {
      lines.push(`${group.id}: ${group.label || group.id} {`);
      for (const childId of group.children) {
        const node = diagram.nodes.find((n) => n.id === childId);
        if (node) {
          const shape = mapShapeToD2(node.shape);
          if (shape) {
            lines.push(`  ${node.id}: ${node.label} { shape: ${shape} }`);
          } else {
            lines.push(`  ${node.id}: ${node.label}`);
          }
        }
      }
      lines.push("}");
      lines.push("");
    }
    for (const node of diagram.nodes) {
      if (nodesInGroups.has(node.id)) continue;
      const shape = mapShapeToD2(node.shape);
      if (shape) {
        lines.push(`${node.id}: ${node.label} { shape: ${shape} }`);
      } else {
        lines.push(`${node.id}: ${node.label}`);
      }
    }
    if (diagram.nodes.length > 0) lines.push("");
    for (const edge of diagram.edges) {
      const arrow = generateD2Arrow(edge.arrow);
      if (edge.label) {
        lines.push(`${edge.source} ${arrow} ${edge.target}: ${edge.label}`);
      } else {
        lines.push(`${edge.source} ${arrow} ${edge.target}`);
      }
    }
    return lines.join("\n");
  }
  function mapShapeToD2(shape) {
    const shapeMap = {
      "rectangle": "rectangle",
      "rounded-rectangle": "rectangle",
      "circle": "circle",
      "ellipse": "oval",
      "diamond": "diamond",
      "hexagon": "hexagon",
      "cylinder": "cylinder",
      "cloud": "cloud",
      "parallelogram": "parallelogram",
      "document": "document",
      "actor": "person"
    };
    return shapeMap[shape] || null;
  }
  function generateD2Arrow(arrow) {
    const hasSource = arrow.sourceType !== "none";
    const hasTarget = arrow.targetType !== "none";
    if (arrow.lineType === "dashed") {
      if (hasSource && hasTarget) return "<-->";
      if (hasSource) return "<--";
      return "-->";
    }
    if (hasSource && hasTarget) return "<->";
    if (hasSource) return "<-";
    if (!hasTarget) return "--";
    return "->";
  }
  function generateStructurizr(diagram) {
    const lines = [];
    lines.push("workspace {");
    lines.push("    model {");
    const nodesInGroups = /* @__PURE__ */ new Set();
    for (const group of diagram.groups) {
      for (const childId of group.children) {
        nodesInGroups.add(childId);
      }
    }
    for (const node of diagram.nodes) {
      if (nodesInGroups.has(node.id)) continue;
      const type = detectStructurizrType(node.shape, node.metadata);
      const indent = "        ";
      if (type === "person") {
        lines.push(`${indent}${node.id} = person "${node.label}"`);
      } else {
        lines.push(`${indent}${node.id} = softwareSystem "${node.label}"`);
      }
    }
    for (const group of diagram.groups) {
      lines.push(`        ${group.id} = softwareSystem "${group.label || group.id}" {`);
      for (const childId of group.children) {
        const node = diagram.nodes.find((n) => n.id === childId);
        if (node) {
          lines.push(`            ${node.id} = container "${node.label}"`);
        }
      }
      lines.push("        }");
    }
    lines.push("");
    for (const edge of diagram.edges) {
      const label = edge.label ? ` "${edge.label}"` : "";
      lines.push(`        ${edge.source} -> ${edge.target}${label}`);
    }
    lines.push("    }");
    lines.push("");
    lines.push("    views {");
    lines.push("        systemContext * {");
    lines.push("            include *");
    lines.push("            autoLayout");
    lines.push("        }");
    lines.push("    }");
    lines.push("}");
    return lines.join("\n");
  }
  function detectStructurizrType(shape, metadata) {
    if (metadata == null ? void 0 : metadata.structurizrType) return metadata.structurizrType;
    if (shape === "actor") return "person";
    if (shape === "cylinder") return "container";
    return "softwareSystem";
  }
  function generateBpmn(diagram) {
    var _a2, _b2, _c, _d;
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"');
    lines.push('             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"');
    lines.push('             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"');
    lines.push('             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"');
    lines.push(`             id="definitions-${diagram.id}">`);
    lines.push("");
    lines.push(`  <process id="process-${diagram.id}" isExecutable="false">`);
    for (const node of diagram.nodes) {
      const element = generateBpmnElement(node);
      lines.push(`    ${element}`);
    }
    lines.push("");
    for (const edge of diagram.edges) {
      const name = edge.label ? ` name="${escapeXml3(edge.label)}"` : "";
      lines.push(`    <sequenceFlow id="${edge.id}" sourceRef="${edge.source}" targetRef="${edge.target}"${name}/>`);
    }
    lines.push("  </process>");
    lines.push("");
    lines.push(`  <bpmndi:BPMNDiagram id="diagram-${diagram.id}">`);
    lines.push(`    <bpmndi:BPMNPlane id="plane-${diagram.id}" bpmnElement="process-${diagram.id}">`);
    for (const node of diagram.nodes) {
      const x = ((_a2 = node.position) == null ? void 0 : _a2.x) ?? 0;
      const y = ((_b2 = node.position) == null ? void 0 : _b2.y) ?? 0;
      const w = ((_c = node.size) == null ? void 0 : _c.width) ?? 100;
      const h = ((_d = node.size) == null ? void 0 : _d.height) ?? 80;
      lines.push(`      <bpmndi:BPMNShape id="shape-${node.id}" bpmnElement="${node.id}">`);
      lines.push(`        <dc:Bounds x="${x}" y="${y}" width="${w}" height="${h}"/>`);
      lines.push("      </bpmndi:BPMNShape>");
    }
    for (const edge of diagram.edges) {
      lines.push(`      <bpmndi:BPMNEdge id="edge-${edge.id}" bpmnElement="${edge.id}">`);
      lines.push("      </bpmndi:BPMNEdge>");
    }
    lines.push("    </bpmndi:BPMNPlane>");
    lines.push("  </bpmndi:BPMNDiagram>");
    lines.push("</definitions>");
    return lines.join("\n");
  }
  function generateBpmnElement(node) {
    var _a2, _b2;
    const name = ` name="${escapeXml3(node.label)}"`;
    const bpmnType = (_a2 = node.metadata) == null ? void 0 : _a2.bpmnType;
    const bpmnSubtype = (_b2 = node.metadata) == null ? void 0 : _b2.bpmnSubtype;
    if (bpmnType) {
      return `<${bpmnType} id="${node.id}"${name}/>`;
    }
    if (node.shape === "circle") {
      if (bpmnSubtype === "end") {
        return `<endEvent id="${node.id}"${name}/>`;
      }
      if (bpmnSubtype === "intermediate") {
        return `<intermediateCatchEvent id="${node.id}"${name}/>`;
      }
      return `<startEvent id="${node.id}"${name}/>`;
    }
    if (node.shape === "diamond") {
      if (bpmnSubtype === "parallel") {
        return `<parallelGateway id="${node.id}"${name}/>`;
      }
      if (bpmnSubtype === "inclusive") {
        return `<inclusiveGateway id="${node.id}"${name}/>`;
      }
      return `<exclusiveGateway id="${node.id}"${name}/>`;
    }
    return `<task id="${node.id}"${name}/>`;
  }
  function escapeXml3(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function generateGraphML(diagram) {
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<graphml xmlns="http://graphml.graphdrawing.org/xmlns"');
    lines.push('  xmlns:y="http://www.yworks.com/xml/graphml"');
    lines.push('  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">');
    lines.push('  <key id="d0" for="node" yfiles.type="nodegraphics"/>');
    lines.push('  <key id="d1" for="edge" yfiles.type="edgegraphics"/>');
    lines.push('  <key id="d2" for="node" attr.name="label" attr.type="string"/>');
    lines.push('  <key id="d3" for="edge" attr.name="label" attr.type="string"/>');
    lines.push("");
    const edgeDefault = "directed";
    lines.push(`  <graph id="G" edgedefault="${edgeDefault}">`);
    const nodesInGroups = /* @__PURE__ */ new Set();
    for (const group of diagram.groups) {
      for (const childId of group.children) {
        nodesInGroups.add(childId);
      }
    }
    for (const group of diagram.groups) {
      lines.push(...generateGroupNode(group, diagram.nodes, "    "));
    }
    for (const node of diagram.nodes) {
      if (nodesInGroups.has(node.id)) continue;
      lines.push(...generateNode(node, "    "));
    }
    for (const edge of diagram.edges) {
      lines.push(...generateEdge3(edge, "    "));
    }
    lines.push("  </graph>");
    lines.push("</graphml>");
    return lines.join("\n");
  }
  function generateNode(node, indent) {
    var _a2, _b2, _c, _d, _e, _f, _g;
    const lines = [];
    const shape = mapShapeToGraphML(node.shape);
    const width2 = ((_a2 = node.size) == null ? void 0 : _a2.width) || 120;
    const height = ((_b2 = node.size) == null ? void 0 : _b2.height) || 60;
    const x = ((_c = node.position) == null ? void 0 : _c.x) || 0;
    const y = ((_d = node.position) == null ? void 0 : _d.y) || 0;
    lines.push(`${indent}<node id="${escapeXml4(node.id)}">`);
    lines.push(`${indent}  <data key="d2">${escapeXml4(node.label)}</data>`);
    lines.push(`${indent}  <data key="d0">`);
    lines.push(`${indent}    <y:ShapeNode>`);
    lines.push(`${indent}      <y:Geometry height="${height}" width="${width2}" x="${x}" y="${y}"/>`);
    lines.push(`${indent}      <y:Fill color="${((_e = node.style) == null ? void 0 : _e.fill) || "#FFFFFF"}" transparent="false"/>`);
    lines.push(`${indent}      <y:BorderStyle color="${((_f = node.style) == null ? void 0 : _f.stroke) || "#000000"}" type="line" width="${((_g = node.style) == null ? void 0 : _g.strokeWidth) || 1}"/>`);
    lines.push(`${indent}      <y:NodeLabel>${escapeXml4(node.label)}</y:NodeLabel>`);
    lines.push(`${indent}      <y:Shape type="${shape}"/>`);
    lines.push(`${indent}    </y:ShapeNode>`);
    lines.push(`${indent}  </data>`);
    lines.push(`${indent}</node>`);
    return lines;
  }
  function generateGroupNode(group, nodes, indent) {
    var _a2, _b2;
    const lines = [];
    lines.push(`${indent}<node id="${escapeXml4(group.id)}" yfiles.foldertype="group">`);
    lines.push(`${indent}  <data key="d2">${escapeXml4(group.label || group.id)}</data>`);
    lines.push(`${indent}  <data key="d0">`);
    lines.push(`${indent}    <y:ProxyAutoBoundsNode>`);
    lines.push(`${indent}      <y:Realizers active="0">`);
    lines.push(`${indent}        <y:GroupNode>`);
    lines.push(`${indent}          <y:Fill color="${((_a2 = group.style) == null ? void 0 : _a2.fill) || "#F5F5F5"}" transparent="false"/>`);
    lines.push(`${indent}          <y:BorderStyle color="${((_b2 = group.style) == null ? void 0 : _b2.stroke) || "#CCCCCC"}" type="line" width="1"/>`);
    lines.push(`${indent}          <y:NodeLabel>${escapeXml4(group.label || group.id)}</y:NodeLabel>`);
    lines.push(`${indent}          <y:State closed="false"/>`);
    lines.push(`${indent}        </y:GroupNode>`);
    lines.push(`${indent}      </y:Realizers>`);
    lines.push(`${indent}    </y:ProxyAutoBoundsNode>`);
    lines.push(`${indent}  </data>`);
    lines.push(`${indent}  <graph id="${escapeXml4(group.id)}:" edgedefault="directed">`);
    for (const childId of group.children) {
      const node = nodes.find((n) => n.id === childId);
      if (node) {
        lines.push(...generateNode(node, indent + "    "));
      }
    }
    lines.push(`${indent}  </graph>`);
    lines.push(`${indent}</node>`);
    return lines;
  }
  function generateEdge3(edge, indent) {
    var _a2, _b2, _c, _d, _e;
    const lines = [];
    const hasSourceArrow = ((_a2 = edge.arrow) == null ? void 0 : _a2.sourceType) !== "none";
    const hasTargetArrow = ((_b2 = edge.arrow) == null ? void 0 : _b2.targetType) !== "none";
    const lineStyle = ((_c = edge.arrow) == null ? void 0 : _c.lineType) === "dashed" ? "dashed" : "line";
    lines.push(`${indent}<edge id="${escapeXml4(edge.id)}" source="${escapeXml4(edge.source)}" target="${escapeXml4(edge.target)}">`);
    if (edge.label) {
      lines.push(`${indent}  <data key="d3">${escapeXml4(edge.label)}</data>`);
    }
    lines.push(`${indent}  <data key="d1">`);
    lines.push(`${indent}    <y:PolyLineEdge>`);
    lines.push(`${indent}      <y:LineStyle color="${((_d = edge.style) == null ? void 0 : _d.stroke) || "#000000"}" type="${lineStyle}" width="${((_e = edge.style) == null ? void 0 : _e.strokeWidth) || 1}"/>`);
    lines.push(`${indent}      <y:Arrows source="${hasSourceArrow ? "standard" : "none"}" target="${hasTargetArrow ? "standard" : "none"}"/>`);
    if (edge.label) {
      lines.push(`${indent}      <y:EdgeLabel>${escapeXml4(edge.label)}</y:EdgeLabel>`);
    }
    lines.push(`${indent}    </y:PolyLineEdge>`);
    lines.push(`${indent}  </data>`);
    lines.push(`${indent}</edge>`);
    return lines;
  }
  function mapShapeToGraphML(shape) {
    const shapeMap = {
      "rectangle": "rectangle",
      "rounded-rectangle": "roundrectangle",
      "circle": "ellipse",
      "ellipse": "ellipse",
      "diamond": "diamond",
      "hexagon": "hexagon",
      "parallelogram": "parallelogram",
      "trapezoid": "trapezoid",
      "triangle": "triangle",
      "cylinder": "rectangle",
      // GraphML doesn't have cylinder
      "cloud": "rectangle",
      "actor": "rectangle"
    };
    return shapeMap[shape] || "rectangle";
  }
  function escapeXml4(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
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
    var Symbol2 = root2.Symbol;
    _Symbol = Symbol2;
    return _Symbol;
  }
  var _getRawTag;
  var hasRequired_getRawTag;
  function require_getRawTag() {
    if (hasRequired_getRawTag) return _getRawTag;
    hasRequired_getRawTag = 1;
    var Symbol2 = require_Symbol();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
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
    var Symbol2 = require_Symbol(), getRawTag = require_getRawTag(), objectToString = require_objectToString();
    var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
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
    var Symbol2 = require_Symbol();
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
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
    var Symbol2 = require_Symbol(), Uint8Array2 = require_Uint8Array(), eq = requireEq(), equalArrays = require_equalArrays(), mapToArray = require_mapToArray(), setToArray = require_setToArray();
    var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
    var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]";
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
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
    var Symbol2 = require_Symbol(), arrayMap = require_arrayMap(), isArray = requireIsArray(), isSymbol = requireIsSymbol();
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
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
    function toString2(value) {
      return value == null ? "" : baseToString(value);
    }
    toString_1 = toString2;
    return toString_1;
  }
  var _castPath;
  var hasRequired_castPath;
  function require_castPath() {
    if (hasRequired_castPath) return _castPath;
    hasRequired_castPath = 1;
    var isArray = requireIsArray(), isKey = require_isKey(), stringToPath = require_stringToPath(), toString2 = requireToString();
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString2(value));
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
    var Symbol2 = require_Symbol(), isArguments = requireIsArguments(), isArray = requireIsArray();
    var spreadableSymbol = Symbol2 ? Symbol2.isConcatSpreadable : void 0;
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
    var toString2 = requireToString();
    var idCounter = 0;
    function uniqueId(prefix) {
      var id = ++idCounter;
      return toString2(prefix) + id;
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
    var t2 = new Graph$5({ directed: false });
    var start = g.nodes()[0];
    var size = g.nodeCount();
    t2.setNode(start, {});
    var edge, delta;
    while (tightTree(t2, g) < size) {
      edge = findMinSlackEdge(t2, g);
      delta = t2.hasNode(edge.v) ? slack$1(g, edge) : -slack$1(g, edge);
      shiftRanks(t2, g, delta);
    }
    return t2;
  }
  function tightTree(t2, g) {
    function dfs2(v) {
      _$i.forEach(g.nodeEdges(v), function(e) {
        var edgeV = e.v, w = v === edgeV ? e.w : edgeV;
        if (!t2.hasNode(w) && !slack$1(g, e)) {
          t2.setNode(w, {});
          t2.setEdge(v, w, {});
          dfs2(w);
        }
      });
    }
    _$i.forEach(t2.nodes(), dfs2);
    return t2.nodeCount();
  }
  function findMinSlackEdge(t2, g) {
    return _$i.minBy(g.edges(), function(e) {
      if (t2.hasNode(e.v) !== t2.hasNode(e.w)) {
        return slack$1(g, e);
      }
    });
  }
  function shiftRanks(t2, g, delta) {
    _$i.forEach(t2.nodes(), function(v) {
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
    var t2 = feasibleTree$1(g);
    initLowLimValues(t2);
    initCutValues(t2, g);
    var e, f;
    while (e = leaveEdge(t2)) {
      f = enterEdge(t2, g, e);
      exchangeEdges(t2, g, e, f);
    }
  }
  function initCutValues(t2, g) {
    var vs = postorder$1(t2, t2.nodes());
    vs = vs.slice(0, vs.length - 1);
    _$h.forEach(vs, function(v) {
      assignCutValue(t2, g, v);
    });
  }
  function assignCutValue(t2, g, child) {
    var childLab = t2.node(child);
    var parent = childLab.parent;
    t2.edge(child, parent).cutvalue = calcCutValue(t2, g, child);
  }
  function calcCutValue(t2, g, child) {
    var childLab = t2.node(child);
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
        if (isTreeEdge(t2, child, other)) {
          var otherCutValue = t2.edge(child, other).cutvalue;
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
  function enterEdge(t2, g, edge) {
    var v = edge.v;
    var w = edge.w;
    if (!g.hasEdge(v, w)) {
      v = edge.w;
      w = edge.v;
    }
    var vLabel = t2.node(v);
    var wLabel = t2.node(w);
    var tailLabel = vLabel;
    var flip = false;
    if (vLabel.lim > wLabel.lim) {
      tailLabel = wLabel;
      flip = true;
    }
    var candidates = _$h.filter(g.edges(), function(edge2) {
      return flip === isDescendant(t2, t2.node(edge2.v), tailLabel) && flip !== isDescendant(t2, t2.node(edge2.w), tailLabel);
    });
    return _$h.minBy(candidates, function(edge2) {
      return slack(g, edge2);
    });
  }
  function exchangeEdges(t2, g, e, f) {
    var v = e.v;
    var w = e.w;
    t2.removeEdge(v, w);
    t2.setEdge(f.v, f.w, {});
    initLowLimValues(t2);
    initCutValues(t2, g);
    updateRanks(t2, g);
  }
  function updateRanks(t2, g) {
    var root2 = _$h.find(t2.nodes(), function(v) {
      return !g.node(v).parent;
    });
    var vs = preorder(t2, root2);
    vs = vs.slice(1);
    _$h.forEach(vs, function(v) {
      var parent = t2.node(v).parent, edge = g.edge(v, parent), flipped = false;
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
        var t2 = g.node(node.borderTop);
        var b = g.node(node.borderBottom);
        var l = g.node(_$1.last(node.borderLeft));
        var r = g.node(_$1.last(node.borderRight));
        node.width = Math.abs(r.x - l.x);
        node.height = Math.abs(b.y - t2.y);
        node.x = l.x + node.width / 2;
        node.y = t2.y + node.height / 2;
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
    dot: parseDot,
    d2: parseD2,
    structurizr: parseStructurizr,
    bpmn: parseBpmn,
    graphml: parseGraphml,
    lucidchart: parseLucidchart
  };
  var generators = {
    mermaid: generateMermaid,
    drawio: generateDrawio,
    excalidraw: generateExcalidraw,
    plantuml: generatePlantUML,
    dot: generateDot,
    svg: generateSvg,
    png: generatePng,
    d2: generateD2,
    structurizr: generateStructurizr,
    bpmn: generateBpmn,
    graphml: generateGraphML
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
    includePngFallback: true,
    exportMode: "copy-as-is"
  };
  function extractDiagramFromMacro(element) {
    var _a2, _b2, _c;
    const macroName = element.getAttribute("data-macro-name") || "";
    const classList = element.classList;
    if (macroName === "drawio" || classList.contains("drawio-macro") || classList.contains("drawio-diagram")) {
      const name = element.getAttribute("data-diagram-name") || ((_a2 = element.dataset) == null ? void 0 : _a2.diagramName) || "diagram";
      const content = element.getAttribute("data-diagram-content") || ((_b2 = element.querySelector("[data-diagram-content]")) == null ? void 0 : _b2.getAttribute("data-diagram-content")) || "";
      const renderedSvg = extractRenderedSvg(element);
      return {
        format: "drawio",
        name,
        content,
        sourceElement: element,
        renderedSvg
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
      const renderedSvg = extractRenderedSvg(element);
      return {
        format: "plantuml",
        name: "plantuml-diagram",
        content,
        sourceElement: element,
        renderedSvg
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
  function extractRenderedSvg(element) {
    const container = element.querySelector(".geDiagramContainer");
    if (container) {
      const svg2 = container.querySelector("svg");
      if (svg2) {
        return svg2.outerHTML;
      }
    }
    const svg = element.querySelector("svg");
    if (svg) {
      return svg.outerHTML;
    }
    const img = element.querySelector('img[src^="data:image/svg"]');
    if (img) {
      const src = img.getAttribute("src");
      if (src == null ? void 0 : src.startsWith("data:image/svg+xml")) {
        try {
          const base64Data = src.split(",")[1];
          return atob(base64Data);
        } catch {
        }
      }
    }
    return void 0;
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
    if (opts.exportMode === "copy-as-is") {
      result.fileContent = info.content;
      result.fileExtension = getFileExtension(info.format);
      return result;
    }
    if (opts.exportMode === "svg-preview") {
      if (info.renderedSvg) {
        result.svgPreview = info.renderedSvg;
      }
      result.fileContent = info.content;
      result.fileExtension = getFileExtension(info.format);
      return result;
    }
    if (opts.exportMode === "convert") {
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
    result.fileContent = info.content;
    result.fileExtension = getFileExtension(info.format);
    return result;
  }
  function generateMermaidCodeBlock(code, title) {
    const header = title ? `%% ${title}
` : "";
    return `\`\`\`mermaid
${header}${code.trim()}
\`\`\``;
  }
  function generateDiagramWithSvgPreview(diagram, options = {}) {
    const { inlineSvg = true, includeSourceLink = true } = options;
    const parts = [];
    if (diagram.svgPreview) {
      if (inlineSvg) {
        parts.push(`<details open>`);
        parts.push(`<summary>Preview</summary>
`);
        parts.push(diagram.svgPreview);
        parts.push(`</details>
`);
      } else {
        parts.push(`![[${diagram.name}.svg]]`);
      }
    }
    if (includeSourceLink && diagram.fileExtension) {
      const sourceExt = diagram.fileExtension;
      parts.push(`%% Editable source: ${diagram.name}.${sourceExt} %%`);
    }
    return parts.join("\n");
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
    const contentSelectors = [
      ".wiki-content",
      // Main Confluence content
      "#main-content",
      // Alternative selector
      ".page-content",
      // Another variant
      ".confluence-content"
      // Server/DC format
    ];
    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = doc.querySelector(selector);
      if (contentElement) {
        break;
      }
    }
    if (!contentElement) {
      contentElement = doc.body;
      const uiSelectors = [
        "#header",
        ".aui-header",
        ".aui-nav",
        "#navigation",
        ".ia-fixed-sidebar",
        ".ia-splitter-left",
        "#breadcrumbs",
        ".breadcrumbs",
        "#sidebar",
        ".ia-secondary-sidebar",
        ".space-tools-section",
        "#footer",
        ".footer",
        ".aui-footer",
        "#action-menu-link",
        ".page-metadata",
        ".page-metadata-banner",
        ".aui-page-panel-nav",
        ".aui-page-header",
        ".aui-page-header-inner"
      ];
      uiSelectors.forEach((selector) => {
        contentElement == null ? void 0 : contentElement.querySelectorAll(selector).forEach((el) => el.remove());
      });
    }
    const cleanDoc = parser.parseFromString("<html><body></body></html>", "text/html");
    cleanDoc.body.innerHTML = contentElement.innerHTML;
    cleanDoc.querySelectorAll(".aui-expander-content, .expand-content").forEach((el) => {
      el.style.display = "block";
      el.removeAttribute("aria-hidden");
      const expander = el.closest(".aui-expander-container, .expand-container");
      if (expander) {
        expander.classList.remove("collapsed");
        expander.classList.add("expanded");
      }
    });
    cleanDoc.querySelectorAll(DIAGRAM_SELECTORS).forEach((el, index) => {
      const htmlEl = el;
      let name = htmlEl.dataset.diagramName || htmlEl.getAttribute("data-diagram-name") || htmlEl.getAttribute("data-extracted-diagram-name") || "";
      if (!name) {
        name = extractDiagramNameFromScript(htmlEl);
      }
      if (name) {
        htmlEl.setAttribute("data-extracted-diagram-name", name);
      }
      htmlEl.setAttribute("data-diagram-index", String(index));
      const marker = cleanDoc.createElement("span");
      marker.style.display = "none";
      marker.setAttribute("data-diagram-marker", "true");
      marker.textContent = `DIAGRAM:${name || `diagram-${index + 1}`}`;
      htmlEl.appendChild(marker);
    });
    BASE_SELECTORS_TO_REMOVE.forEach((selector) => {
      cleanDoc.querySelectorAll(selector).forEach((el) => el.remove());
    });
    if (!options.includeComments) {
      cleanDoc.querySelectorAll("#comments-section, .comment-thread, .inline-comment").forEach((el) => {
        el.remove();
      });
    }
    if (!options.includeImages) {
      cleanDoc.querySelectorAll("img, .confluence-embedded-image, .image-wrap").forEach((el) => {
        el.remove();
      });
    } else {
      cleanDoc.querySelectorAll("img").forEach((img) => {
        var _a2, _b2;
        if (!((_a2 = img.alt) == null ? void 0 : _a2.trim())) {
          const src = img.src || "";
          const filename = ((_b2 = src.split("/").pop()) == null ? void 0 : _b2.split("?")[0]) || "image";
          img.alt = `[Image: ${filename}]`;
        }
      });
    }
    return cleanDoc.body.innerHTML;
  }
  let turndownInstance = null;
  let obsidianTurndownInstance = null;
  let diagramConvertInstance = null;
  function getTurndown(options) {
    const useObsidian = (options == null ? void 0 : options.useObsidianCallouts) ?? false;
    const convertDiagrams = (options == null ? void 0 : options.convertDiagrams) ?? false;
    const diagramTarget = (options == null ? void 0 : options.diagramTargetFormat) ?? "mermaid";
    const embedAsCode = (options == null ? void 0 : options.embedDiagramsAsCode) ?? true;
    const exportMode = (options == null ? void 0 : options.diagramExportMode) ?? "copy-as-is";
    console.log("[Converter] getTurndown called with options:", {
      useObsidian,
      convertDiagrams,
      diagramTarget,
      embedAsCode,
      exportMode,
      rawExportMode: options == null ? void 0 : options.diagramExportMode
    });
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
          var _a2, _b2, _c;
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
          const title = ((_a2 = titleEl == null ? void 0 : titleEl.textContent) == null ? void 0 : _a2.trim()) || "";
          const bodyEl = el.querySelector(".confluence-information-macro-body, .panelContent");
          const body = ((_b2 = bodyEl == null ? void 0 : bodyEl.textContent) == null ? void 0 : _b2.trim()) || ((_c = el.textContent) == null ? void 0 : _c.trim()) || "";
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
          var _a2, _b2, _c;
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
          const title = ((_a2 = titleEl == null ? void 0 : titleEl.textContent) == null ? void 0 : _a2.trim()) || "";
          const bodyEl = el.querySelector(".confluence-information-macro-body, .panelContent");
          const body = ((_b2 = bodyEl == null ? void 0 : bodyEl.textContent) == null ? void 0 : _b2.trim()) || ((_c = el.textContent) == null ? void 0 : _c.trim()) || "";
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
        var _a2, _b2;
        const el = node;
        const titleEl = el.querySelector(".expand-control-text, .aui-expander-trigger");
        const title = ((_a2 = titleEl == null ? void 0 : titleEl.textContent) == null ? void 0 : _a2.trim()) || "Details";
        const contentEl = el.querySelector(".expand-content, .aui-expander-content");
        const content = ((_b2 = contentEl == null ? void 0 : contentEl.textContent) == null ? void 0 : _b2.trim()) || "";
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
        var _a2, _b2, _c;
        const el = node;
        console.log("[Draw.io] replacement called with content:", _content);
        let diagramName = el.getAttribute("data-extracted-diagram-name") || el.dataset.diagramName || el.getAttribute("data-diagram-name") || "";
        if (!diagramName) {
          const index = el.getAttribute("data-diagram-index");
          diagramName = index ? `diagram-${parseInt(index) + 1}` : "diagram";
        }
        console.log("[Draw.io] Processing diagram:", {
          name: diagramName,
          exportMode,
          hasElement: !!el,
          classList: Array.from(el.classList)
        });
        if (exportMode === "copy-as-is") {
          console.log("[Draw.io] Mode: copy-as-is, returning wikilink");
          const result = `
![[_attachments/${diagramName}.png]]

%% Editable source: ${diagramName}.drawio %%

`;
          console.log("[Draw.io] Returning:", result);
          return result;
        }
        if (exportMode === "svg-preview") {
          console.log("[Draw.io] Mode: svg-preview");
          const diagramInfo = extractDiagramFromMacro(el);
          console.log("[Draw.io] Extracted info:", {
            hasInfo: !!diagramInfo,
            hasSvg: !!(diagramInfo == null ? void 0 : diagramInfo.renderedSvg),
            svgLength: (_a2 = diagramInfo == null ? void 0 : diagramInfo.renderedSvg) == null ? void 0 : _a2.length
          });
          if (diagramInfo) {
            const processed = processDiagram(diagramInfo, {
              targetFormat: diagramTarget,
              embedAsCodeBlocks: embedAsCode,
              keepOriginalOnError: true,
              includePngFallback: true,
              exportMode: "svg-preview"
            });
            if (processed.svgPreview) {
              console.log("[Draw.io] Returning SVG preview");
              return `
${generateDiagramWithSvgPreview(processed, {
              inlineSvg: true,
              includeSourceLink: true
            })}

`;
            }
          }
          console.log("[Draw.io] SVG preview failed, returning wikilink");
          return `
![[_attachments/${diagramName}.png]]

%% Editable source: ${diagramName}.drawio %%

`;
        }
        if (exportMode === "convert") {
          console.log("[Draw.io] Mode: convert to", diagramTarget);
          const diagramInfo = extractDiagramFromMacro(el);
          console.log("[Draw.io] Extracted info:", {
            hasInfo: !!diagramInfo,
            hasContent: !!(diagramInfo == null ? void 0 : diagramInfo.content),
            contentLength: (_b2 = diagramInfo == null ? void 0 : diagramInfo.content) == null ? void 0 : _b2.length
          });
          if (diagramInfo && diagramInfo.content) {
            const processed = processDiagram(diagramInfo, {
              targetFormat: diagramTarget,
              embedAsCodeBlocks: embedAsCode,
              keepOriginalOnError: true,
              includePngFallback: true,
              exportMode: "convert"
            });
            console.log("[Draw.io] Processed:", {
              hasCode: !!processed.code,
              codeLength: (_c = processed.code) == null ? void 0 : _c.length,
              error: processed.error
            });
            if (processed.code && embedAsCode) {
              console.log("[Draw.io] Returning mermaid code block");
              return `
${generateMermaidCodeBlock(processed.code, diagramName)}

`;
            }
          }
          console.log("[Draw.io] Convert failed, returning wikilink");
          return `
![[_attachments/${diagramName}.png]]

%% Editable source: ${diagramName}.drawio %%
%% Note: Conversion requires Download (Obsidian vault) mode to fetch diagram source %%

`;
        }
        console.log("[Draw.io] No mode matched, returning wikilink");
        return `
![[_attachments/${diagramName}.png]]

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
![[_attachments/${diagramName}.png]]

`;
      }
    });
    instance.addRule("plantumlMacro", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("plantuml-macro") || node.dataset.macroName === "plantuml";
      },
      replacement: (_content, node) => {
        var _a2;
        const el = node;
        const code = ((_a2 = el.textContent) == null ? void 0 : _a2.trim()) || "";
        if (exportMode === "copy-as-is") {
          return `
\`\`\`plantuml
${code}
\`\`\`

`;
        }
        if (exportMode === "svg-preview") {
          const diagramInfo = extractDiagramFromMacro(el);
          if (diagramInfo && diagramInfo.renderedSvg) {
            const processed = processDiagram(diagramInfo, {
              targetFormat: "original",
              embedAsCodeBlocks: true,
              keepOriginalOnError: true,
              includePngFallback: false,
              exportMode: "svg-preview"
            });
            if (processed.svgPreview) {
              return `
${generateDiagramWithSvgPreview(processed, {
              inlineSvg: true,
              includeSourceLink: false
            })}

\`\`\`plantuml
${code}
\`\`\`

`;
            }
          }
          return `
\`\`\`plantuml
${code}
\`\`\`

`;
        }
        if (exportMode === "convert" && diagramTarget === "mermaid" && code) {
          const diagramInfo = { format: "plantuml", name: "plantuml", content: code };
          const processed = processDiagram(diagramInfo, {
            targetFormat: "mermaid",
            embedAsCodeBlocks: true,
            keepOriginalOnError: true,
            includePngFallback: false,
            exportMode: "convert"
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
        var _a2;
        const el = node;
        const code = ((_a2 = el.textContent) == null ? void 0 : _a2.trim()) || "";
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
        var _a2;
        const el = node;
        const lang = el.dataset.language || ((_a2 = el.className.match(/language-(\w+)/)) == null ? void 0 : _a2[1]) || "";
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
        var _a2;
        if (!(node instanceof HTMLElement)) return false;
        return node.tagName === "A" && !((_a2 = node.textContent) == null ? void 0 : _a2.trim());
      },
      replacement: () => ""
    });
    if (useObsidian) {
      instance.addRule("obsidianImages", {
        filter: "img",
        replacement: (_content, node) => {
          var _a2;
          const img = node;
          const src = img.getAttribute("src") || "";
          const alt = img.getAttribute("alt") || "";
          let filename = "";
          try {
            const url = new URL(src, "https://example.com");
            const pathParts = url.pathname.split("/");
            filename = pathParts[pathParts.length - 1];
            filename = filename.split("?")[0];
            filename = decodeURIComponent(filename);
          } catch {
            filename = ((_a2 = src.split("/").pop()) == null ? void 0 : _a2.split("?")[0]) || "image.png";
            try {
              filename = decodeURIComponent(filename);
            } catch {
            }
          }
          if (alt && alt !== `[Image: ${filename}]`) {
            return `
![[_attachments/${filename}|${alt}]]
`;
          }
          return `
![[_attachments/${filename}]]
`;
        }
      });
    }
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
  function isEmptyMermaidDiagram(mermaidCode) {
    const trimmed = mermaidCode.trim();
    const emptyFlowchartPattern = /^flowchart\s+(TB|BT|LR|RL|TD)\s*$/;
    if (emptyFlowchartPattern.test(trimmed)) {
      return true;
    }
    const lines = trimmed.split("\n").slice(1);
    const hasContent = lines.some((line) => {
      const l = line.trim();
      if (!l || l.startsWith("%%") || l === "end") return false;
      return l.length > 0;
    });
    return !hasContent;
  }
  async function convertDrawioToMermaid(pageId, diagramName) {
    var _a2, _b2, _c, _d, _e, _f, _g;
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
      console.log(`[DiagramConverter] Downloaded XML for ${diagramName}, length: ${xmlText.length}`);
      console.log(`[DiagramConverter] XML first 500 chars:`, xmlText.substring(0, 500));
      console.log(`[DiagramConverter] XML last 200 chars:`, xmlText.substring(xmlText.length - 200));
      const hasCompressedContent = xmlText.includes("<diagram") && !xmlText.includes("<mxGraphModel");
      console.log(`[DiagramConverter] Has compressed content: ${hasCompressedContent}`);
      const diagramMatch = xmlText.match(/<diagram[^>]*>([\s\S]*?)<\/diagram>/);
      if (diagramMatch) {
        const diagramContent = diagramMatch[1].trim();
        console.log(`[DiagramConverter] Diagram element content (first 200):`, diagramContent.substring(0, 200));
        console.log(`[DiagramConverter] Diagram content length:`, diagramContent.length);
      }
      const result = convert(xmlText, {
        from: "drawio",
        to: "mermaid",
        layout: {
          algorithm: "dagre",
          direction: "TB"
        }
      });
      console.log(`[DiagramConverter] Conversion result for ${diagramName}:`, {
        hasOutput: !!result.output,
        outputLength: (_a2 = result.output) == null ? void 0 : _a2.length,
        outputPreview: (_b2 = result.output) == null ? void 0 : _b2.substring(0, 100),
        diagramNodes: (_d = (_c = result.diagram) == null ? void 0 : _c.nodes) == null ? void 0 : _d.length,
        diagramEdges: (_f = (_e = result.diagram) == null ? void 0 : _e.edges) == null ? void 0 : _f.length
      });
      const output = (_g = result.output) == null ? void 0 : _g.trim();
      if (!output || isEmptyMermaidDiagram(output)) {
        console.warn(`[DiagramConverter] Empty diagram for ${diagramName}, output: "${output}"`);
        return null;
      }
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
        var _a2, _b2, _c, _d;
        return {
          id: att.id,
          title: att.title,
          filename: att.title,
          mediaType: ((_a2 = att.extensions) == null ? void 0 : _a2.mediaType) || ((_b2 = att.metadata) == null ? void 0 : _b2.mediaType) || "application/octet-stream",
          fileSize: ((_c = att.extensions) == null ? void 0 : _c.fileSize) || 0,
          downloadUrl: ((_d = att._links) == null ? void 0 : _d.download) ? `${baseUrl}${att._links.download}` : "",
          pageId
        };
      });
    } catch (error) {
      return [];
    }
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
  function isEmptyMermaidOutput(mermaidCode) {
    const trimmed = mermaidCode.trim();
    const emptyFlowchartPattern = /^flowchart\s+(TB|BT|LR|RL|TD)\s*$/;
    if (emptyFlowchartPattern.test(trimmed)) {
      return true;
    }
    const lines = trimmed.split("\n").slice(1);
    const hasContent = lines.some((line) => {
      const l = line.trim();
      if (!l || l.startsWith("%%") || l === "end") return false;
      return l.length > 0;
    });
    return !hasContent;
  }
  function isValidPlantUmlCode(code) {
    const trimmed = code.trim();
    if (trimmed.includes("@startuml") || trimmed.includes("@startmindmap") || trimmed.includes("@startwbs") || trimmed.includes("@startgantt") || trimmed.includes("@startsalt") || trimmed.includes("@startjson") || trimmed.includes("@startyaml")) {
      return true;
    }
    const hasArrow = /\w+\s*-+>|<-+\s*\w+/.test(trimmed);
    const hasClassDef = /^(class|interface|abstract|enum)\s+\w+/m.test(trimmed);
    const hasUseCaseDef = /^\s*\([^)]+\)\s*$/m.test(trimmed);
    if (hasArrow || hasClassDef || hasUseCaseDef) {
      return true;
    }
    if (trimmed.includes("Welcome to PlantUML") || trimmed.includes("You can start with") || trimmed.includes("plantuml.com")) {
      return false;
    }
    if (trimmed.length < 10) {
      return false;
    }
    return false;
  }
  async function convertDiagramsInMarkdown(markdown, pageId, format) {
    if (format === "wikilink") {
      return markdown;
    }
    let result = markdown;
    const diagramPattern = /!\[\[([^\]]+)\.png\]\]\s*(?:\n\s*)*(?:%% Editable source: ([^\s]+)\.drawio %%)?(?:\s*%% Note:[^%]*%%)?/g;
    const conversions = [];
    let match;
    while ((match = diagramPattern.exec(markdown)) !== null) {
      const [fullMatch, diagramName] = match;
      console.log(`[Exporter] Found diagram: ${diagramName}, converting to ${format}`);
      if (format === "mermaid") {
        const mermaidCode = await convertDrawioToMermaid(pageId, diagramName);
        if (mermaidCode) {
          console.log(`[Exporter] Successfully converted ${diagramName} to Mermaid`);
          const replacement = `\`\`\`mermaid
${mermaidCode}
\`\`\``;
          conversions.push({ original: fullMatch, replacement });
        } else {
          console.log(`[Exporter] Failed to convert ${diagramName}, keeping wikilink`);
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
            console.log(`[Exporter] Successfully downloaded ${diagramName} XML`);
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
        const code = plantumlCode.trim();
        if (!isValidPlantUmlCode(code)) {
          console.warn("[Exporter] Invalid PlantUML code (placeholder or garbage), keeping original");
          return fullMatch;
        }
        try {
          const converted = convert(code, {
            from: "plantuml",
            to: "mermaid",
            layout: {
              algorithm: "dagre",
              direction: "TB"
            }
          });
          if (converted.output && !isEmptyMermaidOutput(converted.output)) {
            console.log("[Exporter] Successfully converted PlantUML to Mermaid");
            return `\`\`\`mermaid
${converted.output}
\`\`\``;
          } else {
            console.warn("[Exporter] PlantUML conversion produced empty diagram, keeping original");
          }
        } catch (error) {
          console.warn("Failed to convert PlantUML to Mermaid:", error);
        }
        return fullMatch;
      });
    }
    return result;
  }
  async function buildMarkdownDocument(pages, rootNode, exportTitle, settings, diagramFormat = "wikilink", diagramExportMode = "copy-as-is") {
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
        let markdown = convertToMarkdown(sanitizedHtml, {
          diagramExportMode,
          diagramTargetFormat: diagramFormat,
          embedDiagramsAsCode: true
        });
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
  var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
      b[i] = start += 1 << eb[i - 1];
    }
    var r = new i32(b[30]);
    for (var i = 1; i < 30; ++i) {
      for (var j = b[i]; j < b[i + 1]; ++j) {
        r[j] = j - b[i] << 5 | i;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0), revfd = _b.r;
  var rev = new u16(32768);
  for (var i = 0; i < 32768; ++i) {
    var x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var hMap = function(cd, mb, r) {
    var s = cd.length;
    var i = 0;
    var l = new u16(mb);
    for (; i < s; ++i) {
      if (cd[i])
        ++l[cd[i] - 1];
    }
    var le = new u16(mb);
    for (i = 1; i < mb; ++i) {
      le[i] = le[i - 1] + l[i - 1] << 1;
    }
    var co;
    {
      co = new u16(s);
      for (i = 0; i < s; ++i) {
        if (cd[i]) {
          co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
        }
      }
    }
    return co;
  };
  var flt = new u8(288);
  for (var i = 0; i < 144; ++i)
    flt[i] = 8;
  for (var i = 144; i < 256; ++i)
    flt[i] = 9;
  for (var i = 256; i < 280; ++i)
    flt[i] = 7;
  for (var i = 280; i < 288; ++i)
    flt[i] = 8;
  var fdt = new u8(32);
  for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
  var flm = /* @__PURE__ */ hMap(flt, 9);
  var fdm = /* @__PURE__ */ hMap(fdt, 5);
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var wbits = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
  };
  var wbits16 = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
    d[o + 2] |= v >> 16;
  };
  var hTree = function(d, mb) {
    var t2 = [];
    for (var i = 0; i < d.length; ++i) {
      if (d[i])
        t2.push({ s: i, f: d[i] });
    }
    var s = t2.length;
    var t22 = t2.slice();
    if (!s)
      return { t: et, l: 0 };
    if (s == 1) {
      var v = new u8(t2[0].s + 1);
      v[t2[0].s] = 1;
      return { t: v, l: 1 };
    }
    t2.sort(function(a, b) {
      return a.f - b.f;
    });
    t2.push({ s: -1, f: 25001 });
    var l = t2[0], r = t2[1], i0 = 0, i1 = 1, i2 = 2;
    t2[0] = { s: -1, f: l.f + r.f, l, r };
    while (i1 != s - 1) {
      l = t2[t2[i0].f < t2[i2].f ? i0++ : i2++];
      r = t2[i0 != i1 && t2[i0].f < t2[i2].f ? i0++ : i2++];
      t2[i1++] = { s: -1, f: l.f + r.f, l, r };
    }
    var maxSym = t22[0].s;
    for (var i = 1; i < s; ++i) {
      if (t22[i].s > maxSym)
        maxSym = t22[i].s;
    }
    var tr = new u16(maxSym + 1);
    var mbt = ln(t2[i1 - 1], tr, 0);
    if (mbt > mb) {
      var i = 0, dt = 0;
      var lft = mbt - mb, cst = 1 << lft;
      t22.sort(function(a, b) {
        return tr[b.s] - tr[a.s] || a.f - b.f;
      });
      for (; i < s; ++i) {
        var i2_1 = t22[i].s;
        if (tr[i2_1] > mb) {
          dt += cst - (1 << mbt - tr[i2_1]);
          tr[i2_1] = mb;
        } else
          break;
      }
      dt >>= lft;
      while (dt > 0) {
        var i2_2 = t22[i].s;
        if (tr[i2_2] < mb)
          dt -= 1 << mb - tr[i2_2]++ - 1;
        else
          ++i;
      }
      for (; i >= 0 && dt; --i) {
        var i2_3 = t22[i].s;
        if (tr[i2_3] == mb) {
          --tr[i2_3];
          ++dt;
        }
      }
      mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
  };
  var ln = function(n, l, d) {
    return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
  };
  var lc = function(c) {
    var s = c.length;
    while (s && !c[--s])
      ;
    var cl = new u16(++s);
    var cli = 0, cln = c[0], cls = 1;
    var w = function(v) {
      cl[cli++] = v;
    };
    for (var i = 1; i <= s; ++i) {
      if (c[i] == cln && i != s)
        ++cls;
      else {
        if (!cln && cls > 2) {
          for (; cls > 138; cls -= 138)
            w(32754);
          if (cls > 2) {
            w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
            cls = 0;
          }
        } else if (cls > 3) {
          w(cln), --cls;
          for (; cls > 6; cls -= 6)
            w(8304);
          if (cls > 2)
            w(cls - 3 << 5 | 8208), cls = 0;
        }
        while (cls--)
          w(cln);
        cls = 1;
        cln = c[i];
      }
    }
    return { c: cl.subarray(0, cli), n: s };
  };
  var clen = function(cf, cl) {
    var l = 0;
    for (var i = 0; i < cl.length; ++i)
      l += cf[i] * cl[i];
    return l;
  };
  var wfblk = function(out, pos, dat) {
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i = 0; i < s; ++i)
      out[o + i + 4] = dat[i];
    return (o + 4 + s) * 8;
  };
  var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
    var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i = 0; i < lclt.length; ++i)
      ++lcfreq[lclt[i] & 31];
    for (var i = 0; i < lcdt.length; ++i)
      ++lcfreq[lcdt[i] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
      ;
    var flen = bl + 5 << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
      return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
      lm = hMap(dlt, mlb), ll = dlt, dm = hMap(ddt, mdb), dl = ddt;
      var llm = hMap(lct, mlcb);
      wbits(out, p, nlc - 257);
      wbits(out, p + 5, ndc - 1);
      wbits(out, p + 10, nlcc - 4);
      p += 14;
      for (var i = 0; i < nlcc; ++i)
        wbits(out, p + 3 * i, lct[clim[i]]);
      p += 3 * nlcc;
      var lcts = [lclt, lcdt];
      for (var it = 0; it < 2; ++it) {
        var clct = lcts[it];
        for (var i = 0; i < clct.length; ++i) {
          var len = clct[i] & 31;
          wbits(out, p, llm[len]), p += lct[len];
          if (len > 15)
            wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
        }
      }
    } else {
      lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i = 0; i < li; ++i) {
      var sym = syms[i];
      if (sym > 255) {
        var len = sym >> 18 & 31;
        wbits16(out, p, lm[len + 257]), p += ll[len + 257];
        if (len > 7)
          wbits(out, p, sym >> 23 & 31), p += fleb[len];
        var dst = sym & 31;
        wbits16(out, p, dm[dst]), p += dl[dst];
        if (dst > 3)
          wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
      } else {
        wbits16(out, p, lm[sym]), p += ll[sym];
      }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
  };
  var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
  var et = /* @__PURE__ */ new u8(0);
  var dflt = function(dat, lvl, plvl, pre, post, st) {
    var s = st.z || dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
    var w = o.subarray(pre, o.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
      if (pos)
        w[0] = st.r >> 3;
      var opt = deo[lvl - 1];
      var n = opt >> 13, c = opt & 8191;
      var msk_1 = (1 << plvl) - 1;
      var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
      var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
      var hsh = function(i2) {
        return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
      };
      var syms = new i32(25e3);
      var lf = new u16(288), df = new u16(32);
      var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
      for (; i + 2 < s; ++i) {
        var hv = hsh(i);
        var imod = i & 32767, pimod = head[hv];
        prev[imod] = pimod;
        head[hv] = imod;
        if (wi <= i) {
          var rem = s - i;
          if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
            pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
            li = lc_1 = eb = 0, bs = i;
            for (var j = 0; j < 286; ++j)
              lf[j] = 0;
            for (var j = 0; j < 30; ++j)
              df[j] = 0;
          }
          var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
          if (rem > 2 && hv == hsh(i - dif)) {
            var maxn = Math.min(n, rem) - 1;
            var maxd = Math.min(32767, i);
            var ml = Math.min(258, rem);
            while (dif <= maxd && --ch_1 && imod != pimod) {
              if (dat[i + l] == dat[i + l - dif]) {
                var nl = 0;
                for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                  ;
                if (nl > l) {
                  l = nl, d = dif;
                  if (nl > maxn)
                    break;
                  var mmd = Math.min(dif, nl - 2);
                  var md = 0;
                  for (var j = 0; j < mmd; ++j) {
                    var ti = i - dif + j & 32767;
                    var pti = prev[ti];
                    var cd = ti - pti & 32767;
                    if (cd > md)
                      md = cd, pimod = ti;
                  }
                }
              }
              imod = pimod, pimod = prev[imod];
              dif += imod - pimod & 32767;
            }
          }
          if (d) {
            syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
            var lin = revfl[l] & 31, din = revfd[d] & 31;
            eb += fleb[lin] + fdeb[din];
            ++lf[257 + lin];
            ++df[din];
            wi = i + l;
            ++lc_1;
          } else {
            syms[li++] = dat[i];
            ++lf[dat[i]];
          }
        }
      }
      for (i = Math.max(i, wi); i < s; ++i) {
        syms[li++] = dat[i];
        ++lf[dat[i]];
      }
      pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
      if (!lst) {
        st.r = pos & 7 | w[pos / 8 | 0] << 3;
        pos -= 7;
        st.h = head, st.p = prev, st.i = i, st.w = wi;
      }
    } else {
      for (var i = st.w || 0; i < s + lst; i += 65535) {
        var e = i + 65535;
        if (e >= s) {
          w[pos / 8 | 0] = lst;
          e = s;
        }
        pos = wfblk(w, pos + 1, dat.subarray(i, e));
      }
      st.i = s;
    }
    return slc(o, 0, pre + shft(pos) + post);
  };
  var crct = /* @__PURE__ */ function() {
    var t2 = new Int32Array(256);
    for (var i = 0; i < 256; ++i) {
      var c = i, k = 9;
      while (--k)
        c = (c & 1 && -306674912) ^ c >>> 1;
      t2[i] = c;
    }
    return t2;
  }();
  var crc = function() {
    var c = -1;
    return {
      p: function(d) {
        var cr = c;
        for (var i = 0; i < d.length; ++i)
          cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
        c = cr;
      },
      d: function() {
        return ~c;
      }
    };
  };
  var dopt = function(dat, opt, pre, post, st) {
    if (!st) {
      st = { l: 1 };
      if (opt.dictionary) {
        var dict = opt.dictionary.subarray(-32768);
        var newDat = new u8(dict.length + dat.length);
        newDat.set(dict);
        newDat.set(dat, dict.length);
        dat = newDat;
        st.w = dict.length;
      }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
  };
  var mrg = function(a, b) {
    var o = {};
    for (var k in a)
      o[k] = a[k];
    for (var k in b)
      o[k] = b[k];
    return o;
  };
  var wbytes = function(d, b, v) {
    for (; v; ++b)
      d[b] = v, v >>>= 8;
  };
  function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
  }
  var fltn = function(d, p, t2, o) {
    for (var k in d) {
      var val = d[k], n = p + k, op = o;
      if (Array.isArray(val))
        op = mrg(o, val[1]), val = val[0];
      if (val instanceof u8)
        t2[n] = [val, op];
      else {
        t2[n += "/"] = [new u8(0), op];
        fltn(val, n, t2, o);
      }
    }
  };
  var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  function strToU8(str, latin1) {
    var i;
    if (te)
      return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function(v) {
      ar[ai++] = v;
    };
    for (var i = 0; i < l; ++i) {
      if (ai + 5 > ar.length) {
        var n = new u8(ai + 8 + (l - i << 1));
        n.set(ar);
        ar = n;
      }
      var c = str.charCodeAt(i);
      if (c < 128 || latin1)
        w(c);
      else if (c < 2048)
        w(192 | c >> 6), w(128 | c & 63);
      else if (c > 55295 && c < 57344)
        c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
      else
        w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
    }
    return slc(ar, 0, ai);
  }
  var exfl = function(ex) {
    var le = 0;
    if (ex) {
      for (var k in ex) {
        var l = ex[k].length;
        if (l > 65535)
          err(9);
        le += l + 4;
      }
    }
    return le;
  };
  var wzh = function(d, b, f, fn, u, c, ce, co) {
    var fl2 = fn.length, ex = f.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
    if (ce != null)
      d[b++] = 20, d[b++] = f.os;
    d[b] = 20, b += 2;
    d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
    d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
    var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
    if (y < 0 || y > 119)
      err(10);
    wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
    if (c != -1) {
      wbytes(d, b, f.crc);
      wbytes(d, b + 4, c < 0 ? -c - 2 : c);
      wbytes(d, b + 8, f.size);
    }
    wbytes(d, b + 12, fl2);
    wbytes(d, b + 14, exl), b += 16;
    if (ce != null) {
      wbytes(d, b, col);
      wbytes(d, b + 6, f.attrs);
      wbytes(d, b + 10, ce), b += 14;
    }
    d.set(fn, b);
    b += fl2;
    if (exl) {
      for (var k in ex) {
        var exf = ex[k], l = exf.length;
        wbytes(d, b, +k);
        wbytes(d, b + 2, l);
        d.set(exf, b + 4), b += 4 + l;
      }
    }
    if (col)
      d.set(co, b), b += col;
    return b;
  };
  var wzf = function(o, b, c, d, e) {
    wbytes(o, b, 101010256);
    wbytes(o, b + 8, c);
    wbytes(o, b + 10, c);
    wbytes(o, b + 12, d);
    wbytes(o, b + 16, e);
  };
  function zipSync(data, opts) {
    if (!opts)
      opts = {};
    var r = {};
    var files = [];
    fltn(data, "", r, opts);
    var o = 0;
    var tot = 0;
    for (var fn in r) {
      var _a2 = r[fn], file = _a2[0], p = _a2[1];
      var compression = p.level == 0 ? 0 : 8;
      var f = strToU8(fn), s = f.length;
      var com = p.comment, m = com && strToU8(com), ms = m && m.length;
      var exl = exfl(p.extra);
      if (s > 65535)
        err(11);
      var d = compression ? deflateSync(file, p) : file, l = d.length;
      var c = crc();
      c.p(file);
      files.push(mrg(p, {
        size: file.length,
        crc: c.d(),
        c: d,
        f,
        m,
        u: s != fn.length || m && com.length != ms,
        o,
        compression
      }));
      o += 30 + s + exl + l;
      tot += 76 + 2 * (s + exl) + (ms || 0) + l;
    }
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    for (var i = 0; i < files.length; ++i) {
      var f = files[i];
      wzh(out, f.o, f, f.f, f.u, f.c.length);
      var badd = 30 + f.f.length + exfl(f.extra);
      out.set(f.c, f.o + badd);
      wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
    }
    wzf(out, o, files.length, cdl, oe);
    return out;
  }
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
    var _a2;
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
    if ((_a2 = page.version) == null ? void 0 : _a2.when) {
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
      diagramExportMode: settings.diagramExportMode,
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
    function renderTree2(node, indent = "") {
      const link = makeWikilink(node.title);
      const childCount = node.children.length > 0 ? ` (${node.children.length})` : "";
      lines.push(`${indent}- ${link}${childCount}`);
      for (const child of node.children) {
        renderTree2(child, indent + "  ");
      }
    }
    renderTree2(rootNode);
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
    const zipFiles = {};
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
        console.log(`[Export] Fetching attachments for page ${page.id}`);
        const attachments = await fetchPageAttachments(page.id);
        console.log(`[Export] Found ${attachments.length} attachments`);
        const diagramSourceNames = /* @__PURE__ */ new Set();
        for (const att of attachments) {
          if (att.mediaType === "application/vnd.jgraph.mxfile") {
            diagramSourceNames.add(att.filename);
            console.log(`[Export] Found diagram source: ${att.filename}`);
          }
        }
        for (const att of attachments) {
          if (settings.maxAttachmentSizeMB > 0 && att.fileSize > settings.maxAttachmentSizeMB * 1024 * 1024) {
            console.log(`[Export] Skipping ${att.filename} - too large`);
            continue;
          }
          if (att.mediaType === "application/vnd.jgraph.mxfile") {
            continue;
          }
          const nameWithoutExt = att.filename.replace(/\.png$/i, "");
          const isDiagramPng = diagramSourceNames.has(nameWithoutExt);
          if (isDiagramPng) {
            if (settings.exportDiagrams) {
              console.log(`[Export] Downloading diagram PNG: ${att.filename}`);
              const exported = await exportImageAttachment(att);
              if (exported) {
                attachmentFiles.push({
                  path: `_attachments/${exported.filename}`,
                  blob: exported.blob
                });
                diagramCount++;
                attachmentCount++;
                console.log(`[Export] Downloaded diagram: ${att.filename}`);
              }
            }
          } else if (isImageAttachment(att)) {
            if (settings.downloadAttachments && settings.includeImages) {
              console.log(`[Export] Downloading image: ${att.filename}`);
              const exported = await exportImageAttachment(att);
              if (exported) {
                attachmentFiles.push({
                  path: `_attachments/${exported.filename}`,
                  blob: exported.blob
                });
                attachmentCount++;
                console.log(`[Export] Downloaded image: ${att.filename}`);
              }
            }
          }
        }
        processedPages++;
      }
    }
    console.log(`[Export] Building ZIP with ${pageFiles.length} pages, ${attachmentFiles.length} attachments`);
    onProgress == null ? void 0 : onProgress("Creating ZIP archive...", 0, 1);
    for (const file of pageFiles) {
      console.log(`[Export] Adding page: ${file.path}`);
      zipFiles[file.path] = strToU8(file.content);
    }
    for (const file of attachmentFiles) {
      console.log(`[Export] Adding attachment: ${file.path}, size: ${file.blob.size} bytes, type: ${file.blob.type}`);
      try {
        const arrayBuffer = await file.blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log(`[Export] Converted to Uint8Array: ${uint8Array.length} bytes`);
        zipFiles[file.path] = uint8Array;
      } catch (err2) {
        console.error(`[Export] Failed to convert blob for ${file.path}:`, err2);
        throw err2;
      }
    }
    console.log(`[Export] All ${attachmentFiles.length} attachments added to ZIP object`);
    const indexContent = generateIndexFile(rootNode, pages, {
      attachments: attachmentCount,
      diagrams: diagramCount
    });
    zipFiles["_Index.md"] = strToU8(indexContent);
    console.log("[Export] Starting ZIP generation with fflate...");
    console.log(`[Export] Total files in ZIP:`, Object.keys(zipFiles).length);
    let zipBlob;
    try {
      console.log("[Export] Calling zipSync...");
      const zipData = zipSync(zipFiles, { level: 0 });
      console.log(`[Export] zipSync completed! Length: ${zipData.length}`);
      zipBlob = new Blob([zipData], { type: "application/zip" });
    } catch (error) {
      console.error("[Export] ZIP generation failed:", error);
      throw error;
    }
    console.log(`[Export] ZIP generated, size: ${zipBlob.size} bytes`);
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
  const VALID_TRANSITIONS = {
    idle: ["ready"],
    ready: ["processing", "idle"],
    processing: ["ready", "error", "idle"],
    error: ["ready", "idle"]
  };
  class ModalStateMachine {
    constructor() {
      __publicField(this, "state", "idle");
      __publicField(this, "listeners", /* @__PURE__ */ new Set());
    }
    /**
     * Get current state
     */
    getState() {
      return this.state;
    }
    /**
     * Attempt to transition to a new state
     * 
     * @param newState - Target state to transition to
     * @returns true if transition was successful, false if invalid
     */
    setState(newState) {
      if (this.state === newState) {
        return true;
      }
      if (!this.isValidTransition(this.state, newState)) {
        console.warn(
          `[ModalStateMachine] Invalid state transition: ${this.state} -> ${newState}. Valid transitions from '${this.state}': [${VALID_TRANSITIONS[this.state].join(", ")}]`
        );
        return false;
      }
      const previousState = this.state;
      this.state = newState;
      this.notifyListeners(previousState, newState);
      return true;
    }
    /**
     * Check if a transition is valid
     * 
     * @param from - Current state
     * @param to - Target state
     * @returns true if transition is allowed
     */
    isValidTransition(from, to) {
      const validTargets = VALID_TRANSITIONS[from];
      return (validTargets == null ? void 0 : validTargets.includes(to)) ?? false;
    }
    /**
     * Get valid transitions from current state
     * 
     * @returns Array of valid target states
     */
    getValidTransitions() {
      return VALID_TRANSITIONS[this.state] ?? [];
    }
    /**
     * Subscribe to state changes
     * 
     * @param listener - Callback function for state changes
     * @returns Unsubscribe function
     */
    subscribe(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    /**
     * Reset state machine to initial state
     * Forces reset without transition validation (use for cleanup)
     */
    reset() {
      const previousState = this.state;
      this.state = "idle";
      if (previousState !== "idle") {
        this.notifyListeners(previousState, "idle");
      }
    }
    /**
     * Check if currently in a specific state
     * 
     * @param state - State to check
     * @returns true if current state matches
     */
    isInState(state) {
      return this.state === state;
    }
    /**
     * Check if modal is in an active state (not idle)
     */
    isActive() {
      return this.state !== "idle";
    }
    /**
     * Check if modal is processing
     */
    isProcessing() {
      return this.state === "processing";
    }
    /**
     * Check if modal has an error
     */
    hasError() {
      return this.state === "error";
    }
    /**
     * Notify all listeners of state change
     */
    notifyListeners(from, to) {
      const event = {
        from,
        to,
        timestamp: Date.now()
      };
      this.listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("[ModalStateMachine] Error in state change listener:", error);
        }
      });
    }
    /**
     * Get number of active listeners
     * Useful for debugging/testing
     */
    getListenerCount() {
      return this.listeners.size;
    }
    /**
     * Clear all listeners
     * Use for cleanup when destroying the modal
     */
    clearListeners() {
      this.listeners.clear();
    }
  }
  const en = {
    // Header
    title: "Export to Markdown",
    toggleTheme: "Toggle theme",
    refreshTree: "Refresh page tree",
    close: "Close",
    // Source panel
    searchPlaceholder: "Search pages...",
    filterAll: "All",
    filterSelected: "Selected",
    filterErrors: "Errors",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    // Stats
    pages: "Pages",
    page: "Page",
    images: "Images",
    diagrams: "Diagrams",
    // Config panel
    exportPreset: "Export Preset",
    presetObsidian: "💎 Obsidian Vault (Zip)",
    presetObsidianDesc: "Folders, wikilinks, assets in /attachments",
    presetSingle: "📄 Single Markdown File",
    presetSingleDesc: "Everything in one .md file",
    presetGithub: "🐙 GitHub / GitLab (Zip)",
    presetGithubDesc: "Standard markdown, repo structure",
    // Diagrams section
    diagramsTitle: "Diagrams",
    diagramCopyAsIs: "Copy as-is",
    diagramCopyAsIsDesc: "Keep original diagram code",
    diagramConvert: "Convert",
    diagramConvertDesc: "Convert to target format",
    diagramSvgSource: "SVG + Source",
    diagramSvgSourceDesc: "Image with editable source",
    diagramFormat: "Format",
    includeSource: "Include source",
    includePreview: "Include preview",
    embedAsCode: "Embed as code",
    // Content section
    contentTitle: "Content",
    optionImages: "Images",
    optionAttachments: "Attachments",
    optionMetadata: "Metadata",
    optionComments: "Comments",
    optionSourceLinks: "Source links",
    optionFrontmatter: "Frontmatter",
    optionHierarchical: "Hierarchical folders",
    optionWikilinks: "[[Wikilinks]]",
    optionCallouts: "Callouts",
    // Footer
    resetDefaults: "Reset to defaults",
    copy: "Copy",
    copyDisabledMultiple: "Copy is available only for single page selection",
    copyDisabledFormat: "Copy is available only for Single File mode",
    pdf: "PDF",
    download: "Download",
    // Progress
    progressPreparing: "Preparing...",
    progressScanning: "Scanning page tree...",
    progressLoading: "Loading page content...",
    progressConverting: "Converting to Markdown...",
    progressCreatingVault: "Creating Obsidian vault...",
    progressAttachments: "Downloading attachments...",
    progressDiagrams: "Processing diagrams...",
    // Toast
    copiedToClipboard: "Copied to clipboard!",
    downloadComplete: "Download complete!",
    exportError: "Export failed"
  };
  const ru = {
    // Header
    title: "Экспорт в Markdown",
    toggleTheme: "Переключить тему",
    refreshTree: "Обновить дерево страниц",
    close: "Закрыть",
    // Source panel
    searchPlaceholder: "Поиск страниц...",
    filterAll: "Все",
    filterSelected: "Выбранные",
    filterErrors: "Ошибки",
    expandAll: "Развернуть всё",
    collapseAll: "Свернуть всё",
    // Stats
    pages: "Страниц",
    page: "Страница",
    images: "Изображений",
    diagrams: "Диаграмм",
    // Config panel
    exportPreset: "Формат экспорта",
    presetObsidian: "💎 Obsidian Vault (Zip)",
    presetObsidianDesc: "Папки, wikilinks, вложения в /attachments",
    presetSingle: "📄 Один Markdown файл",
    presetSingleDesc: "Всё в одном .md файле",
    presetGithub: "🐙 GitHub / GitLab (Zip)",
    presetGithubDesc: "Стандартный markdown, структура репозитория",
    // Diagrams section
    diagramsTitle: "Диаграммы",
    diagramCopyAsIs: "Как есть",
    diagramCopyAsIsDesc: "Сохранить исходный код диаграммы",
    diagramConvert: "Конвертировать",
    diagramConvertDesc: "Преобразовать в целевой формат",
    diagramSvgSource: "SVG + Исходник",
    diagramSvgSourceDesc: "Картинка с редактируемым кодом",
    diagramFormat: "Формат",
    includeSource: "Включить исходник",
    includePreview: "Включить превью",
    embedAsCode: "Встроить как код",
    // Content section
    contentTitle: "Контент",
    optionImages: "Изображения",
    optionAttachments: "Вложения",
    optionMetadata: "Метаданные",
    optionComments: "Комментарии",
    optionSourceLinks: "Ссылки на источник",
    optionFrontmatter: "Frontmatter",
    optionHierarchical: "Иерархия папок",
    optionWikilinks: "[[Wikilinks]]",
    optionCallouts: "Callouts",
    // Footer
    resetDefaults: "Сбросить настройки",
    copy: "Копировать",
    copyDisabledMultiple: "Копирование доступно только для одной страницы",
    copyDisabledFormat: "Копирование доступно только в режиме Single File",
    pdf: "PDF",
    download: "Скачать",
    // Progress
    progressPreparing: "Подготовка...",
    progressScanning: "Сканирование страниц...",
    progressLoading: "Загрузка контента...",
    progressConverting: "Конвертация в Markdown...",
    progressCreatingVault: "Создание Obsidian vault...",
    progressAttachments: "Загрузка вложений...",
    progressDiagrams: "Обработка диаграмм...",
    // Toast
    copiedToClipboard: "Скопировано в буфер!",
    downloadComplete: "Загрузка завершена!",
    exportError: "Ошибка экспорта"
  };
  const translations = { en, ru };
  const LOCALE_STORAGE_KEY = "md-export-locale";
  let currentLocale = loadLocale();
  function loadLocale() {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "en" || saved === "ru") return saved;
    } catch {
    }
    return detectLocale();
  }
  function detectLocale() {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("ru")) return "ru";
    return "en";
  }
  function getLocale() {
    return currentLocale;
  }
  function setLocale(locale) {
    currentLocale = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
    }
  }
  function toggleLocale() {
    const newLocale = currentLocale === "en" ? "ru" : "en";
    setLocale(newLocale);
    return newLocale;
  }
  function t(key) {
    return translations[currentLocale][key] || translations.en[key] || key;
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
    sun: `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
    moon: `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`,
    expand: `<svg viewBox="0 0 24 24"><path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/></svg>`,
    collapse: `<svg viewBox="0 0 24 24"><path d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"/></svg>`,
    reset: `<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`
  };
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function countNodes(node) {
    let count = 1;
    for (const child of node.children) {
      count += countNodes(child);
    }
    return count;
  }
  function renderTree(nodes, level = 0) {
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
        html += renderTree(node.children, level + 1);
      }
      html += "</li>";
    }
    html += "</ul>";
    return html;
  }
  function renderModal(options) {
    const { rootNode, rootTitle, theme, settings, obsidianSettings } = options;
    return `
    <div id="md-export-modal-content" class="md-modal-content">
      ${renderHeader(rootTitle, theme)}
      <div class="md-modal-body">
        ${renderSourcePanel(rootNode)}
        ${renderConfigPanel(settings, obsidianSettings)}
      </div>
      ${renderProgressSection()}
      ${renderToast()}
      ${renderFooter()}
    </div>
  `;
  }
  function renderHeader(rootTitle, theme) {
    const locale = getLocale();
    return `
    <div class="md-modal-header">
      <div class="md-header-row">
        <h3 class="md-header-title">${t("title")}</h3>
        <div class="md-header-actions">
          <button class="md-btn-lang" data-action="toggle-locale" title="EN / RU">
            ${locale.toUpperCase()}
          </button>
          <button class="md-btn-icon" data-action="toggle-theme" title="${t("toggleTheme")}">
            ${theme === "dark" ? ICONS.sun : ICONS.moon}
          </button>
          <button class="md-btn-icon" data-action="refresh" title="${t("refreshTree")}">
            ${ICONS.refresh}
          </button>
          <button class="md-btn-icon md-close-btn" data-action="cancel" title="${t("close")} (Esc)">
            ${ICONS.close}
          </button>
        </div>
      </div>
      <p class="md-header-subtitle">
        ${ICONS.folder.replace("<svg", '<svg class="icon"')}
        <span>${escapeHtml(rootTitle)}</span>
      </p>
    </div>
  `;
  }
  function renderSourcePanel(rootNode) {
    return `
    <div class="md-source-panel">
      <!-- Search Bar -->
      <div class="md-search-bar">
        <span class="md-search-icon">${ICONS.search}</span>
        <input type="text" id="md-search-input" placeholder="${t("searchPlaceholder")}" autocomplete="off">
        <button class="md-search-clear" id="md-search-clear" style="display:none">${ICONS.close}</button>
      </div>
      
      <!-- Filter Tabs + Tree Controls -->
      <div class="md-source-toolbar">
        <div class="md-filter-tabs">
          <button class="md-filter-tab active" data-filter="all">${t("filterAll")}</button>
          <button class="md-filter-tab" data-filter="selected">${t("filterSelected")}</button>
          <button class="md-filter-tab" data-filter="errors">${t("filterErrors")}</button>
        </div>
        <div class="md-tree-controls">
          <button class="md-btn-icon-sm" data-action="expand" title="${t("expandAll")}">
            ${ICONS.expand}
          </button>
          <button class="md-btn-icon-sm" data-action="collapse" title="${t("collapseAll")}">
            ${ICONS.collapse}
          </button>
        </div>
      </div>
      
      <!-- Tree Container -->
      <div class="md-tree-container" id="md-tree-container">
        <div class="md-tree" id="md-tree-root">${renderTree([rootNode])}</div>
      </div>
      
      <!-- Status Bar -->
      ${renderStatusBar()}
    </div>
  `;
  }
  function renderStatusBar() {
    return `
    <div class="md-status-bar">
      <span class="md-status-item">
        <span id="stat-pages">0</span> ${t("page")}
      </span>
      <span class="md-status-divider">•</span>
      <span class="md-status-item">
        <span id="stat-images">0</span> ${t("images")}
      </span>
      <span class="md-status-divider">•</span>
      <span class="md-status-item">
        <span id="stat-diagrams">0</span> ${t("diagrams")}
      </span>
      <span class="md-status-divider">•</span>
      <span class="md-status-item">
        <span class="md-status-approx">~</span><span id="stat-size">0.0</span> MB
      </span>
    </div>
  `;
  }
  function renderConfigPanel(settings, obsidianSettings) {
    return `
    <div class="md-config-panel">
      ${renderPlatformSelect(obsidianSettings)}
      ${renderDiagramsSection(obsidianSettings)}
      ${renderContentSettings(settings, obsidianSettings)}
    </div>
  `;
  }
  function renderPlatformSelect(obsidianSettings) {
    const platforms = [
      { value: "obsidian", label: t("presetObsidian"), desc: t("presetObsidianDesc") },
      { value: "single", label: t("presetSingle"), desc: t("presetSingleDesc") },
      { value: "github", label: t("presetGithub"), desc: t("presetGithubDesc") }
    ];
    const current = obsidianSettings.exportFormat;
    const currentPlatform = platforms.find((p) => p.value === current) || platforms[0];
    return `
    <div class="md-config-section">
      <label class="md-config-label">${t("exportPreset")}</label>
      <div class="md-select-wrapper">
        <select id="setting-platform" class="md-select" data-setting="platform">
          ${platforms.map((p) => `
            <option value="${p.value}" ${p.value === current ? "selected" : ""}>
              ${p.label}
            </option>
          `).join("")}
        </select>
      </div>
      <p class="md-config-hint" id="platform-hint">${currentPlatform.desc}</p>
    </div>
  `;
  }
  function renderDiagramsSection(obsidianSettings) {
    const exportModes = [
      { value: "copy-as-is", label: t("diagramCopyAsIs"), icon: "📋", desc: t("diagramCopyAsIsDesc") },
      { value: "convert", label: t("diagramConvert"), icon: "🔄", desc: t("diagramConvertDesc") },
      { value: "svg-preview", label: t("diagramSvgSource"), icon: "🖼️", desc: t("diagramSvgSourceDesc") }
    ];
    const targetFormats = [
      { value: "mermaid", label: "Mermaid" },
      { value: "drawio-xml", label: "Draw.io XML" }
    ];
    const mode = obsidianSettings.diagramExportMode;
    const sourceDisabled = mode === "copy-as-is";
    const previewDisabled = mode === "copy-as-is";
    const embedDisabled = mode === "svg-preview";
    return `
    <div class="md-config-section">
      <div class="md-section-header">
        <span class="md-section-icon">🎨</span>
        <span class="md-section-title">${t("diagramsTitle")}</span>
        <label class="md-toggle-switch">
          <input type="checkbox" id="setting-diagrams" ${obsidianSettings.exportDiagrams ? "checked" : ""}>
          <span class="md-toggle-slider"></span>
        </label>
      </div>
      
      <div class="md-diagrams-options ${obsidianSettings.exportDiagrams ? "" : "disabled"}" id="md-diagrams-options">
        <!-- Export Mode Cards -->
        <div class="md-card-select" id="diagram-export-mode">
          ${exportModes.map((m) => `
            <button class="md-card-option ${obsidianSettings.diagramExportMode === m.value ? "active" : ""}" 
                    data-value="${m.value}" data-setting="diagram-export-mode" title="${m.desc}">
              <span class="md-card-icon">${m.icon}</span>
              <span class="md-card-label">${m.label}</span>
            </button>
          `).join("")}
        </div>
        
        <!-- Target Format (shown only for convert mode) -->
        <div class="md-inline-option" id="convert-format-options" 
             style="display: ${obsidianSettings.diagramExportMode === "convert" ? "flex" : "none"};">
          <span class="md-option-label">${t("diagramFormat")}:</span>
          <div class="md-toggle-group">
            ${targetFormats.map((fmt) => `
              <button class="md-toggle-btn ${obsidianSettings.diagramTargetFormat === fmt.value ? "active" : ""}"
                      data-value="${fmt.value}" data-setting="diagram-format">
                ${fmt.label}
              </button>
            `).join("")}
          </div>
        </div>
        
        <!-- Diagram Options Grid with conditional disable -->
        <div class="md-options-grid md-options-2col">
          <label class="md-checkbox-compact ${sourceDisabled ? "disabled" : ""}">
            <input type="checkbox" id="setting-diagram-source" 
                   ${obsidianSettings.includeDiagramSource || sourceDisabled ? "checked" : ""} 
                   ${sourceDisabled ? "disabled" : ""}>
            <span>${t("includeSource")}</span>
          </label>
          <label class="md-checkbox-compact ${previewDisabled ? "disabled" : ""}">
            <input type="checkbox" id="setting-diagram-preview" 
                   ${obsidianSettings.includeDiagramPreview && !previewDisabled ? "checked" : ""} 
                   ${previewDisabled ? "disabled" : ""}>
            <span>${t("includePreview")}</span>
          </label>
          <label class="md-checkbox-compact ${embedDisabled ? "disabled" : ""}">
            <input type="checkbox" id="setting-embed-diagrams" 
                   ${obsidianSettings.embedDiagramsAsCode || embedDisabled ? "checked" : ""} 
                   ${embedDisabled ? "disabled" : ""}>
            <span>${t("embedAsCode")}</span>
          </label>
        </div>
      </div>
    </div>
  `;
  }
  function renderContentSettings(settings, obsidianSettings) {
    return `
    <div class="md-config-section">
      <div class="md-section-header">
        <span class="md-section-icon">${ICONS.settings.replace("<svg", '<svg class="icon"')}</span>
        <span class="md-section-title">${t("contentTitle")}</span>
      </div>
      
      <div class="md-options-grid md-options-2col">
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-images" ${settings.includeImages ? "checked" : ""}>
          <span>${t("optionImages")}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-attachments" ${obsidianSettings.downloadAttachments ? "checked" : ""}>
          <span>${t("optionAttachments")}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-metadata" ${settings.includeMetadata ? "checked" : ""}>
          <span>${t("optionMetadata")}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-comments" ${settings.includeComments ? "checked" : ""}>
          <span>${t("optionComments")}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-links" ${settings.includeSourceLinks ? "checked" : ""}>
          <span>${t("optionSourceLinks")}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-frontmatter" ${obsidianSettings.includeFrontmatter ? "checked" : ""}>
          <span>${t("optionFrontmatter")}</span>
        </label>
      </div>
      
      <!-- Obsidian-specific options -->
      <div class="md-obsidian-options" id="md-obsidian-options" 
           style="display: ${obsidianSettings.exportFormat === "obsidian" ? "block" : "none"};">
        <div class="md-options-grid md-options-2col">
          <label class="md-checkbox-compact">
            <input type="checkbox" id="setting-hierarchical" ${obsidianSettings.folderStructure === "hierarchical" ? "checked" : ""}>
            <span>${t("optionHierarchical")}</span>
          </label>
          <label class="md-checkbox-compact">
            <input type="checkbox" id="setting-wikilinks" ${obsidianSettings.linkStyle === "wikilink" ? "checked" : ""}>
            <span>${t("optionWikilinks")}</span>
          </label>
          <label class="md-checkbox-compact">
            <input type="checkbox" id="setting-callouts" ${obsidianSettings.useObsidianCallouts ? "checked" : ""}>
            <span>${t("optionCallouts")}</span>
          </label>
        </div>
      </div>
    </div>
  `;
  }
  function renderProgressSection() {
    return `
    <div class="md-progress-section" id="md-progress-section" style="display: none;">
      <div class="md-progress-label">
        <span id="md-progress-text">${t("progressPreparing")}</span>
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
  `;
  }
  function renderToast() {
    return `
    <div class="md-toast" id="md-toast" style="display: none;">
      ${ICONS.check}
      <span>${t("copiedToClipboard")}</span>
    </div>
  `;
  }
  function renderFooter() {
    return `
    <div class="md-modal-footer">
      <div class="md-footer-left">
        <button class="md-btn-text" data-action="reset-defaults" title="${t("resetDefaults")}">
          ${ICONS.reset.replace("<svg", '<svg class="icon"')}
          ${t("resetDefaults")}
        </button>
      </div>
      <div class="md-footer-right">
        <button class="md-btn md-btn-secondary" data-action="copy" id="md-copy-btn" title="${t("copy")}">
          ${ICONS.copy}
          <span>${t("copy")}</span>
        </button>
        <button class="md-btn md-btn-secondary" data-action="pdf" id="md-pdf-btn" title="${t("pdf")}">
          <span>${t("pdf")}</span>
        </button>
        <button class="md-btn md-btn-primary" data-action="download" id="md-download-btn" title="${t("download")}">
          ${ICONS.download}
          <span>${t("download")}</span>
          <span class="md-btn-badge" id="md-download-badge">0</span>
        </button>
      </div>
    </div>
  `;
  }
  function getPhaseLabel(phase) {
    const labels = {
      tree: "progressScanning",
      content: "progressLoading",
      convert: "progressConverting",
      vault: "progressCreatingVault",
      attachments: "progressAttachments",
      diagrams: "progressDiagrams"
    };
    const key = labels[phase];
    if (key) return t(key);
    return phase;
  }
  function updateModalUI(element, state) {
    const downloadBtn = element.querySelector("#md-download-btn");
    const copyBtn = element.querySelector("#md-copy-btn");
    const pdfBtn = element.querySelector("#md-pdf-btn");
    const isProcessing = state === "processing";
    if (downloadBtn) {
      downloadBtn.disabled = isProcessing;
      if (isProcessing) {
        downloadBtn.innerHTML = "<span>Processing...</span>";
      } else {
        downloadBtn.innerHTML = `${ICONS.download}<span>Download</span><span class="md-btn-badge" id="md-download-badge">0</span>`;
      }
    }
    if (copyBtn) copyBtn.disabled = isProcessing;
    if (pdfBtn) pdfBtn.disabled = isProcessing;
    element.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
      cb.disabled = isProcessing;
    });
    element.querySelectorAll(".md-tree-controls button").forEach((btn) => {
      btn.disabled = isProcessing;
    });
  }
  function showProgress(element, phase, current, total, currentPage) {
    const section = element.querySelector("#md-progress-section");
    const text = element.querySelector("#md-progress-text");
    const count = element.querySelector("#md-progress-count");
    const fill = element.querySelector("#md-progress-fill");
    const currentEl = element.querySelector("#md-progress-current");
    element.querySelector("#md-progress-page-name");
    if (!section || !text || !fill) return;
    section.style.display = "block";
    text.textContent = getPhaseLabel(phase);
    if (total > 0) {
      count.textContent = `${current}/${total}`;
      const percent = Math.round(current / total * 100);
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
  function hideProgress(element) {
    const section = element.querySelector("#md-progress-section");
    if (section) section.style.display = "none";
  }
  function showToast(element, message) {
    const toast = element.querySelector("#md-toast");
    if (!toast) return;
    const span = toast.querySelector("span");
    if (span) span.textContent = message;
    toast.style.display = "flex";
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.style.display = "none";
      }, 300);
    }, 2e3);
  }
  function updateSelectionCount$1(element) {
    const checkboxes = element.querySelectorAll(".md-tree-checkbox:checked");
    let count = 0;
    checkboxes.forEach((cb) => {
      var _a2;
      if (!((_a2 = cb.closest("li")) == null ? void 0 : _a2.classList.contains("hidden"))) count++;
    });
    const badge = element.querySelector("#md-download-badge");
    if (badge) {
      badge.textContent = String(count);
      badge.classList.toggle("has-count", count > 0);
    }
    const pagesStat = element.querySelector("#stat-pages");
    if (pagesStat) {
      pagesStat.textContent = String(count);
    }
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
    convertDiagrams: false,
    // deprecated
    diagramExportMode: "copy-as-is",
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
      diagramExportMode: "copy-as-is",
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
      convertDiagrams: false,
      diagramExportMode: "copy-as-is",
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
      convertDiagrams: false,
      diagramExportMode: "convert",
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
      diagramExportMode: "copy-as-is",
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
        const storedData = JSON.parse(stored);
        const settings = { ...DEFAULT_OBSIDIAN_SETTINGS, ...storedData };
        const needsMigration = !storedData.diagramExportMode && storedData.convertDiagrams !== void 0;
        if (needsMigration) {
          if (storedData.convertDiagrams === true) {
            settings.diagramExportMode = "convert";
            console.log("[Storage] Migrated convertDiagrams=true → diagramExportMode=convert");
          } else {
            settings.diagramExportMode = "copy-as-is";
            console.log("[Storage] Migrated convertDiagrams=false → diagramExportMode=copy-as-is");
          }
          settings.convertDiagrams = false;
          saveObsidianSettings(settings);
          console.log("[Storage] Migration saved to localStorage");
        }
        return settings;
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
  let currentSettings;
  let currentObsidianSettings;
  function initSettings(rootNode) {
    currentSettings = loadSettings();
    currentObsidianSettings = loadObsidianSettings();
  }
  function getSettings() {
    return { settings: currentSettings, obsidianSettings: currentObsidianSettings };
  }
  function setRootNode(node) {
  }
  function saveCurrentSettings(element) {
    var _a2, _b2, _c, _d;
    currentSettings = {
      includeImages: ((_a2 = element.querySelector("#setting-images")) == null ? void 0 : _a2.checked) ?? true,
      includeMetadata: ((_b2 = element.querySelector("#setting-metadata")) == null ? void 0 : _b2.checked) ?? true,
      includeComments: ((_c = element.querySelector("#setting-comments")) == null ? void 0 : _c.checked) ?? false,
      includeSourceLinks: ((_d = element.querySelector("#setting-links")) == null ? void 0 : _d.checked) ?? true
    };
    saveSettings(currentSettings);
    currentObsidianSettings.includeImages = currentSettings.includeImages;
    currentObsidianSettings.includeMetadata = currentSettings.includeMetadata;
    currentObsidianSettings.includeComments = currentSettings.includeComments;
    currentObsidianSettings.includeSourceLinks = currentSettings.includeSourceLinks;
    saveObsidianSettings(currentObsidianSettings);
  }
  function getSelectedIds(element) {
    const ids = [];
    element.querySelectorAll(".md-tree-checkbox:checked").forEach((cb) => {
      const li = cb.closest("li");
      if (cb.dataset.pageId && !(li == null ? void 0 : li.classList.contains("hidden"))) {
        ids.push(cb.dataset.pageId);
      }
    });
    return ids;
  }
  function updateSelectionCount(element) {
    const checkboxes = element.querySelectorAll(".md-tree-checkbox:checked");
    let count = 0;
    checkboxes.forEach((cb) => {
      var _a2;
      if (!((_a2 = cb.closest("li")) == null ? void 0 : _a2.classList.contains("hidden"))) count++;
    });
    const counter = element.querySelector("#md-selection-count");
    if (counter) {
      counter.textContent = `${count} selected`;
    }
    const badge = element.querySelector("#md-download-badge");
    if (badge) {
      badge.textContent = String(count);
      badge.classList.toggle("has-count", count > 0);
    }
    updateCopyButtonState(element);
  }
  function shakeElement(el) {
    if (!el) return;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 500);
  }
  function isInputFocused() {
    const active = document.activeElement;
    return (active == null ? void 0 : active.tagName) === "INPUT" || (active == null ? void 0 : active.tagName) === "TEXTAREA";
  }
  function updateObsidianSettingsUI(element) {
    const setChecked = (id, checked) => {
      const el = element.querySelector(`#${id}`);
      if (el) el.checked = checked;
    };
    setChecked("setting-hierarchical", currentObsidianSettings.folderStructure === "hierarchical");
    setChecked("setting-wikilinks", currentObsidianSettings.linkStyle === "wikilink");
    setChecked("setting-callouts", currentObsidianSettings.useObsidianCallouts);
    setChecked("setting-frontmatter", currentObsidianSettings.includeFrontmatter);
    setChecked("setting-diagrams", currentObsidianSettings.exportDiagrams);
    setChecked("setting-embed-diagrams", currentObsidianSettings.embedDiagramsAsCode);
    setChecked("setting-diagram-source", currentObsidianSettings.includeDiagramSource);
    setChecked("setting-diagram-preview", currentObsidianSettings.includeDiagramPreview);
    setChecked("setting-attachments", currentObsidianSettings.downloadAttachments);
    setChecked("setting-images", currentObsidianSettings.includeImages);
    setChecked("setting-links", currentObsidianSettings.includeSourceLinks);
    setChecked("setting-metadata", currentObsidianSettings.includeMetadata);
    setChecked("setting-comments", currentObsidianSettings.includeComments);
    const scaleRadio = element.querySelector(
      `input[name="diagram-scale"][value="${currentObsidianSettings.diagramPreviewScale}"]`
    );
    if (scaleRadio) scaleRadio.checked = true;
    const formatRadio = element.querySelector(
      `input[name="diagram-format"][value="${currentObsidianSettings.diagramTargetFormat}"]`
    );
    if (formatRadio) formatRadio.checked = true;
    const exportModeRadio = element.querySelector(
      `input[name="diagram-export-mode"][value="${currentObsidianSettings.diagramExportMode}"]`
    );
    if (exportModeRadio) exportModeRadio.checked = true;
    element.querySelectorAll('.md-card-option[data-setting="diagram-export-mode"]').forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-value") === currentObsidianSettings.diagramExportMode);
    });
    element.querySelectorAll('.md-toggle-btn[data-setting="diagram-format"]').forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-value") === currentObsidianSettings.diagramTargetFormat);
    });
    updateDiagramOptionsVisibility(element);
    element.querySelectorAll(".md-preset-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-preset") === currentObsidianSettings.exportFormat);
    });
    const platformSelect = element.querySelector("#setting-platform");
    if (platformSelect) {
      platformSelect.value = currentObsidianSettings.exportFormat;
    }
    const obsidianOptions = element.querySelector("#md-obsidian-options");
    if (obsidianOptions) {
      obsidianOptions.style.display = currentObsidianSettings.exportFormat === "obsidian" ? "block" : "none";
    }
  }
  function updateDiagramOptionsVisibility(element) {
    const mode = currentObsidianSettings.diagramExportMode;
    const isDiagramsEnabled = currentObsidianSettings.exportDiagrams;
    const diagramsOptions = element.querySelector("#md-diagrams-options");
    if (diagramsOptions) {
      diagramsOptions.classList.toggle("disabled", !isDiagramsEnabled);
    }
    const isConvertMode = mode === "convert";
    const convertOptions = element.querySelector("#convert-format-options");
    const embedOption = element.querySelector("#embed-diagrams-option");
    const convertWarning = element.querySelector("#md-convert-warning");
    if (convertOptions) convertOptions.style.display = isConvertMode ? "flex" : "none";
    if (embedOption) embedOption.style.display = isConvertMode ? "block" : "none";
    if (convertWarning) convertWarning.style.display = isConvertMode ? "block" : "none";
    updateDiagramCheckboxStates(element, mode);
  }
  function updateDiagramCheckboxStates(element, mode) {
    const sourceCheckbox = element.querySelector("#setting-diagram-source");
    const previewCheckbox = element.querySelector("#setting-diagram-preview");
    const embedCheckbox = element.querySelector("#setting-embed-diagrams");
    const sourceLabel = sourceCheckbox == null ? void 0 : sourceCheckbox.closest(".md-checkbox-compact");
    const previewLabel = previewCheckbox == null ? void 0 : previewCheckbox.closest(".md-checkbox-compact");
    const embedLabel = embedCheckbox == null ? void 0 : embedCheckbox.closest(".md-checkbox-compact");
    if (mode === "copy-as-is") {
      if (sourceCheckbox) {
        sourceCheckbox.checked = true;
        sourceCheckbox.disabled = true;
      }
      if (previewCheckbox) {
        previewCheckbox.checked = false;
        previewCheckbox.disabled = true;
      }
      if (embedCheckbox) {
        embedCheckbox.disabled = false;
      }
      sourceLabel == null ? void 0 : sourceLabel.classList.add("disabled");
      previewLabel == null ? void 0 : previewLabel.classList.add("disabled");
      embedLabel == null ? void 0 : embedLabel.classList.remove("disabled");
    } else if (mode === "svg-preview") {
      if (sourceCheckbox) {
        sourceCheckbox.disabled = false;
      }
      if (previewCheckbox) {
        previewCheckbox.disabled = false;
      }
      if (embedCheckbox) {
        embedCheckbox.checked = true;
        embedCheckbox.disabled = true;
      }
      sourceLabel == null ? void 0 : sourceLabel.classList.remove("disabled");
      previewLabel == null ? void 0 : previewLabel.classList.remove("disabled");
      embedLabel == null ? void 0 : embedLabel.classList.add("disabled");
    } else {
      if (sourceCheckbox) sourceCheckbox.disabled = false;
      if (previewCheckbox) previewCheckbox.disabled = false;
      if (embedCheckbox) embedCheckbox.disabled = false;
      sourceLabel == null ? void 0 : sourceLabel.classList.remove("disabled");
      previewLabel == null ? void 0 : previewLabel.classList.remove("disabled");
      embedLabel == null ? void 0 : embedLabel.classList.remove("disabled");
    }
  }
  function updateCopyButtonState(element) {
    const copyBtn = element.querySelector("#md-copy-btn");
    if (!copyBtn) return;
    const selectedCount = getSelectedIds(element).length;
    const format = currentObsidianSettings.exportFormat;
    const canCopy = format === "single" && selectedCount === 1;
    copyBtn.disabled = !canCopy;
    if (!canCopy && selectedCount > 0) {
      if (format !== "single") {
        copyBtn.title = t("copyDisabledFormat");
      } else if (selectedCount > 1) {
        copyBtn.title = t("copyDisabledMultiple");
      }
    } else {
      copyBtn.title = t("copy");
    }
  }
  function filterTree(element, query) {
    const items = element.querySelectorAll(".md-tree li");
    if (!query) {
      items.forEach((li) => {
        li.classList.remove("hidden", "highlight");
      });
      return;
    }
    items.forEach((li) => {
      var _a2, _b2, _c, _d, _e;
      const label = ((_b2 = (_a2 = li.querySelector(".md-tree-label")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.toLowerCase()) || "";
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
  function disableModalInteraction(element) {
    const downloadBtn = element.querySelector("#md-download-btn");
    const copyBtn = element.querySelector("#md-copy-btn");
    const pdfBtn = element.querySelector("#md-pdf-btn");
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `<span>Processing...</span>`;
    }
    if (copyBtn) copyBtn.disabled = true;
    if (pdfBtn) pdfBtn.disabled = true;
    element.querySelectorAll(".md-controls button").forEach((btn) => {
      btn.disabled = true;
    });
    element.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
      cb.disabled = true;
    });
  }
  function enableModalInteraction(element, icons) {
    const downloadBtn = element.querySelector("#md-download-btn");
    const copyBtn = element.querySelector("#md-copy-btn");
    const pdfBtn = element.querySelector("#md-pdf-btn");
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `${icons.download}<span>Download</span><span class="md-btn-badge" id="md-download-badge">0</span>`;
    }
    if (copyBtn) {
      copyBtn.disabled = false;
      copyBtn.innerHTML = `${icons.copy}<span>Copy</span>`;
    }
    if (pdfBtn) {
      pdfBtn.disabled = false;
    }
    element.querySelectorAll(".md-controls button").forEach((btn) => {
      btn.disabled = false;
    });
    element.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
      cb.disabled = false;
    });
    const progressSection = element.querySelector("#md-progress-section");
    if (progressSection) {
      progressSection.style.display = "none";
    }
    updateSelectionCount(element);
  }
  function setupEventListeners(deps) {
    const { element, callbacks, getState, setState, close, updateTree, updateStats: updateStats2 } = deps;
    const cleanups = [];
    const handleActionClick = async (e) => {
      const target = e.target;
      const btn = target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (getState() === "processing") {
        console.log("[Modal] Ignoring click - processing in progress");
        return;
      }
      if (action === "cancel") {
        close();
        return;
      }
      if (action === "download" || action === "copy" || action === "pdf") {
        const selectedIds = getSelectedIds(element);
        if (selectedIds.length === 0) {
          shakeElement(element.querySelector(".md-selection-count"));
          return;
        }
        saveCurrentSettings(element);
        setState("processing");
        disableModalInteraction(element);
        console.log("[Modal] Export action:", action);
        console.log("[Modal] exportFormat:", currentObsidianSettings.exportFormat);
        const isObsidian = currentObsidianSettings.exportFormat === "obsidian" && action === "download";
        const modalAction = isObsidian ? "obsidian" : action;
        console.log("[Modal] isObsidian:", isObsidian, "→ modalAction:", modalAction);
        const ctx = {
          selectedIds,
          settings: currentSettings,
          obsidianSettings: currentObsidianSettings
        };
        await callbacks.onAction(modalAction, ctx);
        return;
      }
      if (action === "refresh") {
        const refreshBtn = btn;
        refreshBtn.classList.add("spinning");
        try {
          const newTree = await callbacks.onRefresh();
          setRootNode(newTree);
          updateTree(newTree);
          updateSelectionCount(element);
          updateStats2();
        } finally {
          refreshBtn.classList.remove("spinning");
        }
        return;
      }
      if (action === "toggle-theme") {
        handleToggleTheme(element, btn);
        return;
      }
      if (action === "toggle-locale") {
        const newLocale = toggleLocale();
        btn.textContent = newLocale.toUpperCase();
        updateLocalizedText(element);
        return;
      }
      if (action === "toggle-settings") {
        togglePanel(element, "#md-settings-content", btn);
        return;
      }
      if (action === "toggle-format") {
        togglePanel(element, "#md-format-content", btn);
        return;
      }
      if (action === "toggle-diagrams") {
        togglePanel(element, "#md-diagrams-content", btn);
        return;
      }
      if (action === "expand") {
        element.querySelectorAll(".md-tree ul").forEach((ul) => ul.classList.remove("collapsed"));
        element.querySelectorAll(".md-tree-toggler").forEach((t2) => t2.classList.add("expanded"));
        return;
      }
      if (action === "collapse") {
        element.querySelectorAll(".md-tree ul ul").forEach((ul) => ul.classList.add("collapsed"));
        element.querySelectorAll(".md-tree-toggler").forEach((t2) => {
          if (!t2.classList.contains("empty")) t2.classList.remove("expanded");
        });
        return;
      }
      if (action === "select-all") {
        element.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
          var _a2;
          if (!((_a2 = cb.closest("li")) == null ? void 0 : _a2.classList.contains("hidden"))) cb.checked = true;
        });
        updateSelectionCount(element);
        updateStats2();
        return;
      }
      if (action === "deselect-all") {
        element.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
          cb.checked = false;
        });
        updateSelectionCount(element);
        updateStats2();
        return;
      }
      if (action === "invert") {
        element.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
          var _a2;
          if (!((_a2 = cb.closest("li")) == null ? void 0 : _a2.classList.contains("hidden"))) cb.checked = !cb.checked;
        });
        updateSelectionCount(element);
        updateStats2();
        return;
      }
      if (action === "reset-defaults") {
        currentSettings = loadSettings();
        currentObsidianSettings = loadObsidianSettings();
        updateObsidianSettingsUI(element);
        return;
      }
    };
    element.addEventListener("click", handleActionClick);
    cleanups.push(() => element.removeEventListener("click", handleActionClick));
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.ctrlKey && e.key === "a" && !isInputFocused()) {
        e.preventDefault();
        element.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
          var _a2;
          if (!((_a2 = cb.closest("li")) == null ? void 0 : _a2.classList.contains("hidden"))) cb.checked = true;
        });
        updateSelectionCount(element);
        updateStats2();
        return;
      }
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        const downloadBtn = element.querySelector('[data-action="download"]');
        downloadBtn == null ? void 0 : downloadBtn.click();
        return;
      }
      if (e.ctrlKey && e.key === "c" && !isInputFocused()) {
        e.preventDefault();
        const copyBtn = element.querySelector('[data-action="copy"]');
        copyBtn == null ? void 0 : copyBtn.click();
        return;
      }
    };
    document.addEventListener("keydown", handleKeydown);
    cleanups.push(() => document.removeEventListener("keydown", handleKeydown));
    const handleBackdropClick = (e) => {
      if (e.target === element) {
        close();
      }
    };
    element.addEventListener("click", handleBackdropClick);
    cleanups.push(() => element.removeEventListener("click", handleBackdropClick));
    const searchInput = element.querySelector("#md-search-input");
    const searchClear = element.querySelector("#md-search-clear");
    const handleSearchInput = () => {
      const query = searchInput.value.toLowerCase().trim();
      searchClear.style.display = query ? "flex" : "none";
      filterTree(element, query);
    };
    const handleSearchClear = () => {
      searchInput.value = "";
      searchClear.style.display = "none";
      filterTree(element, "");
      searchInput.focus();
    };
    if (searchInput) {
      searchInput.addEventListener("input", handleSearchInput);
      cleanups.push(() => searchInput.removeEventListener("input", handleSearchInput));
    }
    if (searchClear) {
      searchClear.addEventListener("click", handleSearchClear);
      cleanups.push(() => searchClear.removeEventListener("click", handleSearchClear));
    }
    const handleTreeItemClick = (e) => {
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
    };
    element.addEventListener("click", handleTreeItemClick);
    cleanups.push(() => element.removeEventListener("click", handleTreeItemClick));
    const handleCheckboxChange = (e) => {
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
      updateSelectionCount(element);
      updateStats2();
    };
    element.addEventListener("change", handleCheckboxChange);
    cleanups.push(() => element.removeEventListener("change", handleCheckboxChange));
    const handleShiftClick = (e) => {
      const target = e.target;
      if (target.classList.contains("md-tree-checkbox") && e.shiftKey) {
        e.shiftKey = true;
      }
    };
    element.addEventListener("click", handleShiftClick, true);
    cleanups.push(() => element.removeEventListener("click", handleShiftClick, true));
    const handlePresetClick = (e) => {
      const target = e.target;
      const presetBtn = target.closest("[data-preset]");
      if (presetBtn) {
        const preset = presetBtn.dataset.preset;
        currentObsidianSettings.exportFormat = preset;
        element.querySelectorAll(".md-preset-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.getAttribute("data-preset") === preset);
        });
        const obsidianOptions = element.querySelector("#md-obsidian-options");
        if (obsidianOptions) {
          obsidianOptions.style.display = preset === "obsidian" ? "block" : "none";
        }
        saveObsidianSettings(currentObsidianSettings);
        return;
      }
      const applyPresetBtn = target.closest("[data-apply-preset]");
      if (applyPresetBtn) {
        const presetName = applyPresetBtn.dataset.applyPreset;
        currentObsidianSettings = applyPreset(presetName);
        updateObsidianSettingsUI(element);
        saveObsidianSettings(currentObsidianSettings);
        return;
      }
      const filterChip = target.closest("[data-filter].md-filter-chip");
      if (filterChip) {
        const filter = filterChip.dataset.filter;
        element.querySelectorAll(".md-filter-chip").forEach((chip) => {
          chip.classList.toggle("active", chip === filterChip);
        });
        applyFilter(element, filter || "all");
        updateSelectionCount(element);
        updateStats2();
        return;
      }
      const filterTab = target.closest("[data-filter].md-filter-tab");
      if (filterTab) {
        const filter = filterTab.dataset.filter;
        element.querySelectorAll(".md-filter-tab").forEach((tab) => {
          tab.classList.toggle("active", tab === filterTab);
        });
        applyFilter(element, filter || "all");
        updateSelectionCount(element);
        updateStats2();
        return;
      }
      const cardOption = target.closest('.md-card-option[data-setting="diagram-export-mode"]');
      if (cardOption) {
        const value = cardOption.dataset.value;
        currentObsidianSettings.diagramExportMode = value;
        element.querySelectorAll('.md-card-option[data-setting="diagram-export-mode"]').forEach((btn) => {
          btn.classList.toggle("active", btn === cardOption);
        });
        updateDiagramOptionsVisibility(element);
        saveObsidianSettings(currentObsidianSettings);
        return;
      }
      const toggleBtn = target.closest('.md-toggle-btn[data-setting="diagram-format"]');
      if (toggleBtn) {
        const value = toggleBtn.dataset.value;
        currentObsidianSettings.diagramTargetFormat = value;
        element.querySelectorAll('.md-toggle-btn[data-setting="diagram-format"]').forEach((btn) => {
          btn.classList.toggle("active", btn === toggleBtn);
        });
        saveObsidianSettings(currentObsidianSettings);
        return;
      }
      const platformSelect2 = target.closest("#setting-platform");
      if (platformSelect2) {
        const value = platformSelect2.value;
        currentObsidianSettings.exportFormat = value === "github" ? "single" : value;
        const obsidianOptions = element.querySelector("#md-obsidian-options");
        if (obsidianOptions) {
          obsidianOptions.style.display = value === "obsidian" ? "block" : "none";
        }
        const hintEl = element.querySelector("#platform-hint");
        if (hintEl) {
          const hints = {
            obsidian: t("presetObsidianDesc"),
            single: t("presetSingleDesc"),
            github: t("presetGithubDesc")
          };
          hintEl.textContent = hints[value] || "";
        }
        updateCopyButtonState(element);
        saveObsidianSettings(currentObsidianSettings);
        return;
      }
    };
    element.addEventListener("click", handlePresetClick);
    cleanups.push(() => element.removeEventListener("click", handlePresetClick));
    const platformSelect = element.querySelector("#setting-platform");
    if (platformSelect) {
      const handlePlatformChange = () => {
        const value = platformSelect.value;
        currentObsidianSettings.exportFormat = value === "github" ? "single" : value;
        const obsidianOptions = element.querySelector("#md-obsidian-options");
        if (obsidianOptions) {
          obsidianOptions.style.display = value === "obsidian" ? "block" : "none";
        }
        const hintEl = element.querySelector("#platform-hint");
        if (hintEl) {
          const hints = {
            obsidian: t("presetObsidianDesc"),
            single: t("presetSingleDesc"),
            github: t("presetGithubDesc")
          };
          hintEl.textContent = hints[value] || "";
        }
        updateCopyButtonState(element);
        saveObsidianSettings(currentObsidianSettings);
      };
      platformSelect.addEventListener("change", handlePlatformChange);
      cleanups.push(() => platformSelect.removeEventListener("change", handlePlatformChange));
    }
    const handleSettingsChange = (e) => {
      const target = e.target;
      let settingsChanged = false;
      if (target.id === "setting-images") {
        currentSettings.includeImages = target.checked;
        currentObsidianSettings.includeImages = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-metadata") {
        currentSettings.includeMetadata = target.checked;
        currentObsidianSettings.includeMetadata = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-comments") {
        currentSettings.includeComments = target.checked;
        currentObsidianSettings.includeComments = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-links") {
        currentSettings.includeSourceLinks = target.checked;
        currentObsidianSettings.includeSourceLinks = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-hierarchical") {
        currentObsidianSettings.folderStructure = target.checked ? "hierarchical" : "flat";
        settingsChanged = true;
      } else if (target.id === "setting-wikilinks") {
        currentObsidianSettings.linkStyle = target.checked ? "wikilink" : "markdown";
        settingsChanged = true;
      } else if (target.id === "setting-callouts") {
        currentObsidianSettings.useObsidianCallouts = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-frontmatter") {
        currentObsidianSettings.includeFrontmatter = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-diagrams") {
        currentObsidianSettings.exportDiagrams = target.checked;
        updateDiagramOptionsVisibility(element);
        settingsChanged = true;
      } else if (target.id === "setting-embed-diagrams") {
        currentObsidianSettings.embedDiagramsAsCode = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-diagram-source") {
        currentObsidianSettings.includeDiagramSource = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-diagram-preview") {
        currentObsidianSettings.includeDiagramPreview = target.checked;
        settingsChanged = true;
      } else if (target.id === "setting-attachments") {
        currentObsidianSettings.downloadAttachments = target.checked;
        settingsChanged = true;
      } else if (target.name === "diagram-scale") {
        currentObsidianSettings.diagramPreviewScale = parseInt(target.value);
        settingsChanged = true;
      } else if (target.name === "diagram-format") {
        currentObsidianSettings.diagramTargetFormat = target.value;
        settingsChanged = true;
      } else if (target.name === "diagram-export-mode") {
        currentObsidianSettings.diagramExportMode = target.value;
        updateDiagramOptionsVisibility(element);
        settingsChanged = true;
      }
      if (settingsChanged) {
        saveSettings(currentSettings);
        saveObsidianSettings(currentObsidianSettings);
      }
    };
    element.addEventListener("change", handleSettingsChange);
    cleanups.push(() => element.removeEventListener("change", handleSettingsChange));
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }
  function togglePanel(element, contentSelector, btn) {
    const content = element.querySelector(contentSelector);
    const chevron = btn.querySelector(".md-chevron");
    if (content) {
      const isHidden = content.style.display === "none";
      content.style.display = isHidden ? "block" : "none";
      chevron == null ? void 0 : chevron.classList.toggle("expanded", isHidden);
    }
  }
  function handleToggleTheme(element, btn) {
    const currentTheme2 = element.getAttribute("data-theme") || "light";
    const newTheme = currentTheme2 === "dark" ? "light" : "dark";
    element.setAttribute("data-theme", newTheme);
    const sunIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
    const moonIcon = `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`;
    btn.innerHTML = newTheme === "dark" ? sunIcon : moonIcon;
  }
  function updateLocalizedText(element) {
    var _a2;
    const title = element.querySelector(".md-header-title");
    if (title) title.textContent = t("title");
    const searchInput = element.querySelector("#md-search-input");
    if (searchInput) searchInput.placeholder = t("searchPlaceholder");
    const filterTabs = element.querySelectorAll(".md-filter-tab");
    filterTabs.forEach((tab) => {
      const filter = tab.getAttribute("data-filter");
      if (filter === "all") tab.textContent = t("filterAll");
      else if (filter === "selected") tab.textContent = t("filterSelected");
      else if (filter === "errors") tab.textContent = t("filterErrors");
    });
    const expandBtn = element.querySelector('[data-action="expand"]');
    const collapseBtn = element.querySelector('[data-action="collapse"]');
    if (expandBtn) expandBtn.setAttribute("title", t("expandAll"));
    if (collapseBtn) collapseBtn.setAttribute("title", t("collapseAll"));
    const exportPresetLabel = element.querySelector(".md-config-label");
    if (exportPresetLabel) exportPresetLabel.textContent = t("exportPreset");
    const platformSelect = element.querySelector("#setting-platform");
    if (platformSelect) {
      const options = platformSelect.querySelectorAll("option");
      options.forEach((opt) => {
        if (opt.value === "obsidian") opt.textContent = t("presetObsidian");
        else if (opt.value === "single") opt.textContent = t("presetSingle");
        else if (opt.value === "github") opt.textContent = t("presetGithub");
      });
    }
    const diagramsTitle = element.querySelector(".md-section-title");
    if (diagramsTitle) diagramsTitle.textContent = t("diagramsTitle");
    const cardOptions = element.querySelectorAll('.md-card-option[data-setting="diagram-export-mode"]');
    cardOptions.forEach((card) => {
      const value = card.getAttribute("data-value");
      const label = card.querySelector(".md-card-label");
      if (label) {
        if (value === "copy-as-is") label.textContent = t("diagramCopyAsIs");
        else if (value === "convert") label.textContent = t("diagramConvert");
        else if (value === "svg-preview") label.textContent = t("diagramSvgSource");
      }
    });
    const checkboxLabels = {
      "setting-images": "optionImages",
      "setting-attachments": "optionAttachments",
      "setting-metadata": "optionMetadata",
      "setting-comments": "optionComments",
      "setting-links": "optionSourceLinks",
      "setting-frontmatter": "optionFrontmatter",
      "setting-hierarchical": "optionHierarchical",
      "setting-wikilinks": "optionWikilinks",
      "setting-callouts": "optionCallouts",
      "setting-diagram-source": "includeSource",
      "setting-diagram-preview": "includePreview",
      "setting-embed-diagrams": "embedAsCode"
    };
    Object.entries(checkboxLabels).forEach(([id, key]) => {
      var _a3;
      const checkbox = element.querySelector(`#${id}`);
      const label = (_a3 = checkbox == null ? void 0 : checkbox.closest(".md-checkbox-compact")) == null ? void 0 : _a3.querySelector("span");
      if (label) label.textContent = t(key);
    });
    const resetBtn = element.querySelector('[data-action="reset-defaults"]');
    if (resetBtn) {
      resetBtn.querySelector("span") || resetBtn;
      if ((_a2 = resetBtn.textContent) == null ? void 0 : _a2.includes("Reset")) {
        resetBtn.innerHTML = resetBtn.innerHTML.replace(/Reset to defaults|Сбросить настройки/, t("resetDefaults"));
      }
    }
    const copyBtn = element.querySelector("#md-copy-btn span");
    if (copyBtn) copyBtn.textContent = t("copy");
    const pdfBtn = element.querySelector("#md-pdf-btn span");
    if (pdfBtn) pdfBtn.textContent = t("pdf");
    const downloadBtn = element.querySelector("#md-download-btn span:not(.md-btn-badge)");
    if (downloadBtn) downloadBtn.textContent = t("download");
    const themeBtn = element.querySelector('[data-action="toggle-theme"]');
    const refreshBtn = element.querySelector('[data-action="refresh"]');
    const closeBtn = element.querySelector('[data-action="cancel"]');
    if (themeBtn) themeBtn.setAttribute("title", t("toggleTheme"));
    if (refreshBtn) refreshBtn.setAttribute("title", t("refreshTree"));
    if (closeBtn) closeBtn.setAttribute("title", `${t("close")} (Esc)`);
    updateCopyButtonState(element);
  }
  function applyFilter(element, filter) {
    const items = element.querySelectorAll(".md-tree li");
    items.forEach((li) => {
      var _a2, _b2, _c, _d;
      const hasError = li.querySelector(".md-error-badge") !== null;
      const checkbox = li.querySelector(".md-tree-checkbox");
      const isSelected = (checkbox == null ? void 0 : checkbox.checked) ?? false;
      if (filter === "all") {
        li.classList.remove("hidden");
      } else if (filter === "errors") {
        li.classList.toggle("hidden", !hasError);
        if (hasError) {
          let parent = (_a2 = li.parentElement) == null ? void 0 : _a2.closest("li");
          while (parent) {
            parent.classList.remove("hidden");
            parent = (_b2 = parent.parentElement) == null ? void 0 : _b2.closest("li");
          }
        }
      } else if (filter === "selected") {
        li.classList.toggle("hidden", !isSelected);
        if (isSelected) {
          let parent = (_c = li.parentElement) == null ? void 0 : _c.closest("li");
          while (parent) {
            parent.classList.remove("hidden");
            parent = (_d = parent.parentElement) == null ? void 0 : _d.closest("li");
          }
        }
      }
    });
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
  let modalElement = null;
  let stateMachine = null;
  let cleanupListeners = null;
  let currentTheme = "light";
  let currentRootNode = null;
  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function updateStats(element, rootNode) {
    const selectedIds = getSelectedIdsFromElement(element);
    const stats = calculateTreeStats(rootNode, new Set(selectedIds));
    const selectedCount = stats.selectedPages ?? 0;
    const pagesEl = element.querySelector("#stat-pages");
    if (pagesEl) pagesEl.textContent = String(selectedCount);
    const estimatedImages = Math.round(selectedCount * 2);
    const estimatedDiagrams = Math.round(selectedCount * 0.5);
    const imagesEl = element.querySelector("#stat-images");
    if (imagesEl) {
      imagesEl.textContent = String(estimatedImages);
    }
    const diagramsEl = element.querySelector("#stat-diagrams");
    if (diagramsEl) {
      diagramsEl.textContent = String(estimatedDiagrams);
    }
    const estimatedSizeKB = selectedCount * 50 + estimatedImages * 200 + estimatedDiagrams * 100;
    const estimatedMB = estimatedSizeKB / 1024;
    const sizeEl = element.querySelector("#stat-size");
    if (sizeEl) {
      sizeEl.textContent = estimatedMB.toFixed(1);
    }
  }
  function getSelectedIdsFromElement(element) {
    const ids = [];
    element.querySelectorAll(".md-tree-checkbox:checked").forEach((cb) => {
      const li = cb.closest("li");
      if (cb.dataset.pageId && !(li == null ? void 0 : li.classList.contains("hidden"))) {
        ids.push(cb.dataset.pageId);
      }
    });
    return ids;
  }
  function createExportModal(options) {
    const { rootNode, rootTitle, callbacks } = options;
    if (modalElement) {
      cleanupListeners == null ? void 0 : cleanupListeners();
      modalElement.remove();
    }
    stateMachine = new ModalStateMachine();
    currentRootNode = rootNode;
    currentTheme = getSystemTheme();
    initSettings();
    const { settings, obsidianSettings } = getSettings();
    const modal = document.createElement("div");
    modal.id = "md-export-modal";
    modal.setAttribute("data-theme", currentTheme);
    const renderOptions = {
      rootNode,
      rootTitle,
      theme: currentTheme,
      settings,
      obsidianSettings: {
        ...obsidianSettings,
        // Ensure diagramTargetFormat is compatible with view types
        diagramTargetFormat: obsidianSettings.diagramTargetFormat === "wikilink" ? "mermaid" : obsidianSettings.diagramTargetFormat
      }
    };
    modal.innerHTML = renderModal(renderOptions);
    modalElement = modal;
    const controller = {
      show: () => {
        if (modalElement && !document.body.contains(modalElement)) {
          document.body.appendChild(modalElement);
          stateMachine == null ? void 0 : stateMachine.setState("ready");
          setTimeout(() => {
            const searchInput = modalElement == null ? void 0 : modalElement.querySelector("#md-search-input");
            searchInput == null ? void 0 : searchInput.focus();
          }, 100);
        }
      },
      close: () => {
        var _a2;
        cleanupListeners == null ? void 0 : cleanupListeners();
        cleanupListeners = null;
        if (modalElement) {
          modalElement.remove();
          modalElement = null;
        }
        stateMachine == null ? void 0 : stateMachine.reset();
        stateMachine = null;
        currentRootNode = null;
        (_a2 = callbacks.onClose) == null ? void 0 : _a2.call(callbacks);
      },
      setState: (state) => {
        if (!stateMachine || !modalElement) return;
        const success = stateMachine.setState(state);
        if (success) {
          updateModalUI(modalElement, state);
          if (state === "ready") {
            enableModalInteraction(modalElement, { download: ICONS.download, copy: ICONS.copy });
          }
        }
      },
      getState: () => {
        return (stateMachine == null ? void 0 : stateMachine.getState()) ?? "idle";
      },
      showProgress: (phase, current, total) => {
        if (modalElement) {
          showProgress(modalElement, phase, current, total);
        }
      },
      hideProgress: () => {
        if (modalElement) {
          hideProgress(modalElement);
        }
      },
      showToast: (message) => {
        if (modalElement) {
          showToast(modalElement, message);
        }
      },
      updateTree: (node) => {
        if (!modalElement) return;
        currentRootNode = node;
        const treeRoot = modalElement.querySelector("#md-tree-root");
        if (treeRoot) {
          treeRoot.innerHTML = renderTree([node]);
        }
        const pageCount = modalElement.querySelector(".md-page-count");
        if (pageCount) {
          pageCount.textContent = `${countNodes(node)} pages`;
        }
        updateSelectionCount$1(modalElement);
        updateStats(modalElement, node);
      }
    };
    cleanupListeners = setupEventListeners({
      element: modal,
      callbacks,
      getState: () => (stateMachine == null ? void 0 : stateMachine.getState()) ?? "idle",
      setState: (state) => controller.setState(state),
      close: () => controller.close(),
      updateTree: (node) => controller.updateTree(node),
      updateStats: () => {
        if (modalElement && currentRootNode) {
          updateStats(modalElement, currentRootNode);
        }
      }
    });
    stateMachine.subscribe((event) => {
      console.log(`[Modal] State: ${event.from} -> ${event.to}`);
    });
    controller.show();
    updateSelectionCount$1(modal);
    updateStats(modal, rootNode);
    return controller;
  }
  function closeModal() {
    if (modalElement) {
      cleanupListeners == null ? void 0 : cleanupListeners();
      modalElement.remove();
      modalElement = null;
      stateMachine == null ? void 0 : stateMachine.reset();
      stateMachine = null;
    }
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
  async function handleCopy(controller, ctx, rootTree, rootTitle) {
    try {
      console.log("[Main] Copy action started");
      controller.showProgress("content", 0, ctx.selectedIds.length);
      const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => controller.showProgress(phase, completed, total)
      );
      controller.showProgress("convert", 0, 0);
      let diagramFormat = "wikilink";
      if (ctx.obsidianSettings.diagramExportMode === "convert") {
        diagramFormat = ctx.obsidianSettings.diagramTargetFormat;
      }
      const result = await buildMarkdownDocument(
        pagesContent,
        rootTree,
        rootTitle,
        ctx.settings,
        diagramFormat,
        ctx.obsidianSettings.diagramExportMode
      );
      const success = await copyToClipboard(result);
      if (success) {
        controller.showToast("Copied to clipboard!");
        updateStatus(`Copied ${result.pageCount} pages`);
      } else {
        throw new Error("Failed to copy to clipboard");
      }
    } catch (error) {
      console.error("[Main] Copy failed:", error);
      controller.showToast("Copy failed!");
      throw error;
    }
  }
  async function handleDownload(controller, ctx, rootTree, rootTitle) {
    controller.showProgress("content", 0, ctx.selectedIds.length);
    const pagesContent = await fetchPagesContent(
      ctx.selectedIds,
      ctx.settings,
      (completed, total, phase) => controller.showProgress(phase, completed, total)
    );
    controller.showProgress("convert", 0, 0);
    let diagramFormat = "wikilink";
    if (ctx.obsidianSettings.diagramExportMode === "convert") {
      diagramFormat = ctx.obsidianSettings.diagramTargetFormat;
    }
    const result = await buildMarkdownDocument(
      pagesContent,
      rootTree,
      rootTitle,
      ctx.settings,
      diagramFormat,
      ctx.obsidianSettings.diagramExportMode
    );
    downloadMarkdown(result);
    updateStatus(`Downloaded ${result.pageCount} pages`);
  }
  async function handleObsidian(controller, ctx, rootTree, rootTitle) {
    controller.showProgress("content", 0, ctx.selectedIds.length);
    const pagesContent = await fetchPagesContent(
      ctx.selectedIds,
      ctx.settings,
      (completed, total, phase) => controller.showProgress(phase, completed, total)
    );
    controller.showProgress("vault", 0, 0);
    const vaultResult = await createObsidianVault(
      pagesContent,
      rootTree,
      rootTitle,
      ctx.obsidianSettings,
      (phase, current, total) => controller.showProgress(phase, current, total)
    );
    downloadVaultZip(vaultResult);
    updateStatus(`Downloaded vault: ${vaultResult.pageCount} pages, ${vaultResult.diagramCount} diagrams`);
  }
  async function handlePdf(controller, ctx, rootTree, rootTitle) {
    controller.showProgress("content", 0, ctx.selectedIds.length);
    const pagesContent = await fetchPagesContent(
      ctx.selectedIds,
      ctx.settings,
      (completed, total, phase) => controller.showProgress(phase, completed, total)
    );
    exportToPdf(pagesContent, rootTree, rootTitle, ctx.settings);
    updateStatus(`PDF preview opened for ${pagesContent.length} pages`);
  }
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
      let controller;
      controller = createExportModal({
        rootNode: rootTree,
        rootTitle,
        callbacks: {
          onAction: async (action, ctx) => {
            try {
              console.log("[Main] Received action:", action);
              console.log("[Main] ctx.obsidianSettings.exportFormat:", ctx.obsidianSettings.exportFormat);
              switch (action) {
                case "copy":
                  await handleCopy(controller, ctx, rootTree, rootTitle);
                  controller.setState("ready");
                  break;
                case "download":
                  await handleDownload(controller, ctx, rootTree, rootTitle);
                  controller.close();
                  break;
                case "obsidian":
                  await handleObsidian(controller, ctx, rootTree, rootTitle);
                  controller.close();
                  break;
                case "pdf":
                  await handlePdf(controller, ctx, rootTree, rootTitle);
                  controller.close();
                  break;
              }
            } catch (error) {
              console.error(`[Main] ${action} failed:`, error);
              alert(`Export failed: ${getErrorMessage(error)}`);
              controller.setState("ready");
            }
          },
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
          },
          onClose: () => {
            updateStatus("Closed");
          }
        }
      });
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