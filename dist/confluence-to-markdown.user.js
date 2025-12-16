// ==UserScript==
// @name         Confluence to Markdown Exporter
// @namespace    https://github.com/WhiteBite/confluence-to-markdown
// @version      2.3.0
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

(r=>{if(typeof GM_addStyle=="function"){GM_addStyle(r);return}const e=document.createElement("style");e.textContent=r,document.head.append(e)})(' :root{--md-primary: #0052CC;--md-primary-hover: #0065FF;--md-primary-light: #DEEBFF;--md-success: #00875A;--md-success-light: #E3FCEF;--md-danger: #DE350B;--md-danger-light: #FFEBE6;--md-warning: #FF991F;--md-text: #172B4D;--md-text-subtle: #5E6C84;--md-text-muted: #97A0AF;--md-bg: #FFFFFF;--md-bg-subtle: #F4F5F7;--md-bg-hover: #EBECF0;--md-border: #DFE1E6;--md-shadow: 0 8px 32px rgba(9, 30, 66, .25);--md-shadow-sm: 0 1px 3px rgba(9, 30, 66, .12);--md-radius: 6px;--md-radius-lg: 12px;--md-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;--md-transition: .15s ease}#md-export-modal{position:fixed;top:0;right:0;bottom:0;left:0;background-color:#091e428a;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);z-index:10000;display:flex;justify-content:center;align-items:center;padding:24px;box-sizing:border-box;font-family:var(--md-font);animation:fadeIn .2s ease}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}.md-modal-content{background-color:var(--md-bg);border-radius:var(--md-radius-lg);width:100%;max-width:780px;max-height:90vh;display:flex;flex-direction:column;box-shadow:var(--md-shadow);overflow:hidden;position:relative;animation:slideUp .25s ease}@keyframes slideUp{0%{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.md-modal-header{padding:20px 24px 16px;border-bottom:1px solid var(--md-border);flex-shrink:0}.md-header-row{display:flex;justify-content:space-between;align-items:flex-start}.md-header-title{display:flex;align-items:center;gap:8px}.md-modal-header h3{margin:0;color:var(--md-text);font-size:20px;font-weight:600}.md-modal-header .subtitle{color:var(--md-text-subtle);font-size:14px;margin:8px 0 0;display:flex;align-items:center;gap:6px}.md-modal-header .subtitle svg{width:16px;height:16px;fill:var(--md-text-muted)}.md-page-count{background:var(--md-bg-subtle);padding:2px 8px;border-radius:10px;font-size:12px;color:var(--md-text-muted);margin-left:8px}.md-close-btn{margin:-4px -8px 0 0}.md-btn-icon{width:32px;height:32px;padding:0;border:none;background:transparent;border-radius:var(--md-radius);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-subtle);transition:all var(--md-transition)}.md-btn-icon:hover{background:var(--md-bg-subtle);color:var(--md-text)}.md-btn-icon svg{width:20px;height:20px;fill:currentColor}.md-btn-icon.spinning svg{animation:spin 1s linear infinite}@keyframes spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.md-search-bar{display:flex;align-items:center;padding:8px 24px;background:var(--md-bg);border-bottom:1px solid var(--md-border);gap:8px}.md-search-icon{color:var(--md-text-muted);display:flex}.md-search-icon svg{width:18px;height:18px;fill:currentColor}.md-search-bar input{flex:1;border:none;outline:none;font-size:14px;font-family:var(--md-font);color:var(--md-text);background:transparent}.md-search-bar input::placeholder{color:var(--md-text-muted)}.md-search-clear{width:24px;height:24px;padding:0;border:none;background:var(--md-bg-subtle);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);transition:all var(--md-transition)}.md-search-clear:hover{background:var(--md-bg-hover);color:var(--md-text)}.md-search-clear svg{width:14px;height:14px;fill:currentColor}.md-controls{display:flex;gap:6px;padding:10px 24px;background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);flex-shrink:0;flex-wrap:wrap;align-items:center}.md-controls-divider{width:1px;height:20px;background:var(--md-border);margin:0 4px}.md-tree-container{flex:1;overflow-y:auto;padding:8px 16px;min-height:200px;max-height:400px}.md-tree ul{list-style:none;padding:0;margin:0}.md-tree ul ul{margin-left:20px;padding-left:12px;border-left:1px solid var(--md-border)}.md-tree li{margin:0;transition:opacity var(--md-transition)}.md-tree li.hidden{display:none}.md-tree li.highlight>.md-tree-item{background:var(--md-primary-light)}.md-tree-item{display:flex;align-items:center;padding:6px 10px;margin:1px 0;border-radius:var(--md-radius);cursor:pointer;transition:background-color var(--md-transition);gap:6px}.md-tree-item:hover{background-color:var(--md-bg-hover)}.md-tree-toggler{width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--md-text-muted);flex-shrink:0;transition:transform var(--md-transition);border-radius:4px}.md-tree-toggler:hover{background:var(--md-bg-subtle)}.md-tree-toggler.expanded{transform:rotate(90deg)}.md-tree-toggler svg{width:16px;height:16px;fill:currentColor}.md-tree-toggler.empty{visibility:hidden}.md-tree-checkbox{width:16px;height:16px;margin:0;cursor:pointer;accent-color:var(--md-primary);flex-shrink:0}.md-tree-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.md-tree-icon svg{width:16px;height:16px}.md-tree-icon.folder svg{fill:#ffab00}.md-tree-icon.page svg{fill:var(--md-primary)}.md-tree-label{flex:1;color:var(--md-text);font-size:13px;line-height:1.4;-webkit-user-select:none;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.md-tree-label.error{color:var(--md-danger)}.md-child-count{font-size:11px;color:var(--md-text-muted);background:var(--md-bg-subtle);padding:1px 6px;border-radius:8px;margin-left:4px}.md-error-badge{font-size:10px;color:var(--md-danger);background:var(--md-danger-light);padding:2px 6px;border-radius:4px;font-weight:500}.md-tree ul.collapsed{display:none}.md-tree ul{overflow:hidden}.md-settings-panel{border-top:1px solid var(--md-border);flex-shrink:0}.md-settings-toggle{width:100%;padding:12px 24px;border:none;background:var(--md-bg-subtle);cursor:pointer;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:var(--md-text-subtle);font-family:var(--md-font);transition:background-color var(--md-transition)}.md-settings-toggle:hover{background:var(--md-bg-hover)}.md-settings-toggle svg{width:18px;height:18px;fill:currentColor}.md-settings-toggle .md-chevron{margin-left:auto;transition:transform .2s ease}.md-settings-toggle .md-chevron.expanded{transform:rotate(90deg)}.md-settings-content{padding:16px 24px;background:var(--md-bg);display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.md-checkbox-label{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;color:var(--md-text)}.md-checkbox-label input[type=checkbox]{width:16px;height:16px;accent-color:var(--md-primary);cursor:pointer}.md-progress-section{padding:16px 24px;background:var(--md-bg-subtle);border-top:1px solid var(--md-border);flex-shrink:0}.md-progress-label{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:var(--md-text-subtle)}.md-progress-bar{height:6px;background:var(--md-border);border-radius:3px;overflow:hidden}.md-progress-fill{height:100%;background:linear-gradient(90deg,var(--md-primary),var(--md-primary-hover));border-radius:3px;transition:width .3s ease;width:0%}.md-progress-fill.indeterminate{width:30%;animation:indeterminate 1.5s ease-in-out infinite}@keyframes indeterminate{0%{transform:translate(-100%)}to{transform:translate(400%)}}.md-toast{position:absolute;bottom:80px;left:50%;transform:translate(-50%) translateY(20px);background:var(--md-success);color:#fff;padding:12px 20px;border-radius:var(--md-radius);display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;box-shadow:var(--md-shadow-sm);opacity:0;transition:all .3s ease;z-index:10}.md-toast.show{opacity:1;transform:translate(-50%) translateY(0)}.md-toast svg{width:18px;height:18px;fill:currentColor}.md-modal-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 24px;border-top:1px solid var(--md-border);background:var(--md-bg);flex-shrink:0}.md-footer-left,.md-footer-right{display:flex;gap:8px;align-items:center}.md-hint{font-size:12px;color:var(--md-text-muted)}.md-btn{padding:8px 14px;border-radius:var(--md-radius);border:none;cursor:pointer;font-size:13px;font-weight:500;font-family:var(--md-font);transition:all var(--md-transition);display:inline-flex;align-items:center;gap:6px;position:relative}.md-btn svg{width:16px;height:16px;fill:currentColor}.md-btn-primary{background-color:var(--md-primary);color:#fff}.md-btn-primary:hover:not(:disabled){background-color:var(--md-primary-hover)}.md-btn-primary:disabled{background-color:#b3d4ff;cursor:not-allowed}.md-btn-secondary{background-color:var(--md-bg);color:var(--md-text);border:1px solid var(--md-border)}.md-btn-secondary:hover:not(:disabled){background-color:var(--md-bg-subtle);border-color:var(--md-text-muted)}.md-btn-secondary:disabled{opacity:.6;cursor:not-allowed}.md-btn-link{background:none;color:var(--md-text-subtle);padding:8px 12px}.md-btn-link:hover{color:var(--md-text);background-color:var(--md-bg-subtle)}.md-btn-sm{padding:5px 10px;font-size:12px}.md-btn-badge{background:#fff3;padding:1px 6px;border-radius:8px;font-size:11px;min-width:18px;text-align:center}.md-btn-badge.has-count{background:#ffffff4d}.md-selection-count{font-size:12px;color:var(--md-text-subtle);padding:5px 10px;background:var(--md-bg);border-radius:var(--md-radius);border:1px solid var(--md-border);margin-left:auto;transition:all var(--md-transition)}@keyframes shake{0%,to{transform:translate(0)}20%,60%{transform:translate(-5px)}40%,80%{transform:translate(5px)}}.shake{animation:shake .5s ease;background:var(--md-danger-light)!important;border-color:var(--md-danger)!important;color:var(--md-danger)!important}#md-export-status{margin-left:12px;color:var(--md-text-subtle);font-size:13px;font-family:var(--md-font)}#md-export-trigger{margin-left:10px}.md-tree-container::-webkit-scrollbar{width:8px}.md-tree-container::-webkit-scrollbar-track{background:var(--md-bg-subtle);border-radius:4px}.md-tree-container::-webkit-scrollbar-thumb{background:var(--md-border);border-radius:4px}.md-tree-container::-webkit-scrollbar-thumb:hover{background:var(--md-text-muted)} ');

(function () {
  'use strict';

  const MAX_CONCURRENCY = 6;
  const PAGE_LIMIT = 50;
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
  function fetchJson(url) {
    return withRetry(async () => {
      if (IS_TAMPERMONKEY) {
        return gmFetch(url);
      }
      return browserFetch(url);
    });
  }
  async function fetchPage(pageId) {
    const url = `${getBaseUrl()}/rest/api/content/${pageId}`;
    return fetchJson(url);
  }
  async function fetchPageWithContent(pageId) {
    const url = `${getBaseUrl()}/rest/api/content/${pageId}?expand=${EXPAND_CONTENT}`;
    return fetchJson(url);
  }
  async function fetchChildren(pageId) {
    var _a, _b;
    const baseUrl = getBaseUrl();
    const children = [];
    let start = 0;
    let hasMore = true;
    while (hasMore) {
      const url = `${baseUrl}/rest/api/content/${pageId}/child/page?limit=${PAGE_LIMIT}&start=${start}`;
      const response = await fetchJson(url);
      if ((_a = response.results) == null ? void 0 : _a.length) {
        children.push(...response.results);
      }
      hasMore = ((_b = response.results) == null ? void 0 : _b.length) === PAGE_LIMIT;
      start += PAGE_LIMIT;
    }
    return children;
  }
  async function buildPageTree(rootPageId, onStatus) {
    const processedIds = /* @__PURE__ */ new Set();
    let counter = 0;
    async function processNode(pageId, level, parentId) {
      if (processedIds.has(pageId)) {
        return { id: pageId, title: "[Duplicate]", level, parentId, children: [], error: true };
      }
      processedIds.add(pageId);
      counter++;
      onStatus == null ? void 0 : onStatus(`Collecting hierarchy: ${counter} pages... (ID: ${pageId})`);
      try {
        const pageInfo = await fetchPage(pageId);
        const children = await fetchChildren(pageId);
        const childNodes = [];
        for (const child of children) {
          const childNode = await processNode(child.id, level + 1, pageId);
          childNodes.push(childNode);
        }
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
    var self = this;
    return reduce.call(parentNode.childNodes, function(output, node) {
      node = new Node(node, self.options);
      var replacement = "";
      if (node.nodeType === 3) {
        replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
      } else if (node.nodeType === 1) {
        replacement = replacementForNode.call(self, node);
      }
      return join(output, replacement);
    }, "");
  }
  function postProcess(output) {
    var self = this;
    this.rules.forEach(function(rule) {
      if (typeof rule.append === "function") {
        output = join(output, rule.append(self.options));
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
  let turndownInstance = null;
  function getTurndown() {
    if (turndownInstance) return turndownInstance;
    turndownInstance = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*"
    });
    turndownInstance.use(gfm);
    turndownInstance.addRule("confluenceMacros", {
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
    turndownInstance.addRule("auiLozenge", {
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains("aui-lozenge");
      },
      replacement: (content) => {
        return content ? `[${content.trim()}]` : "";
      }
    });
    turndownInstance.addRule("taskList", {
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
    turndownInstance.addRule("codeBlock", {
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
    turndownInstance.addRule("emptyLinks", {
      filter: (node) => {
        var _a;
        if (!(node instanceof HTMLElement)) return false;
        return node.tagName === "A" && !((_a = node.textContent) == null ? void 0 : _a.trim());
      },
      replacement: () => ""
    });
    turndownInstance.addRule("confluenceTable", {
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
    return turndownInstance;
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
  function convertToMarkdown(html) {
    if (!html) return "";
    const turndown = getTurndown();
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
  function buildMarkdownDocument(pages, rootNode, exportTitle, settings) {
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
        const markdown = convertToMarkdown(page.htmlContent);
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
    const filename = `${sanitizeFilename(result.title)}.md`;
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
  function sanitizeFilename(name) {
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
  const DEFAULT_SETTINGS = {
    includeImages: true,
    includeMetadata: true,
    includeComments: false,
    includeSourceLinks: true
  };
  const STORAGE_KEYS = {
    SETTINGS: "md_export_settings",
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
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
  };
  let modalElement = null;
  let currentSettings;
  let resolveModal = null;
  function cancelModal() {
    if (modalElement && resolveModal) {
      modalElement.remove();
      modalElement = null;
      resolveModal({ selectedIds: [], cancelled: true, action: "cancel", settings: currentSettings });
      resolveModal = null;
    }
  }
  function showPageSelectorModal(rootNode, rootTitle, options) {
    return new Promise((resolve) => {
      resolveModal = resolve;
      currentSettings = loadSettings();
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
            <button class="md-btn-icon md-close-btn" data-action="cancel" title="Close (Esc)">
              ${ICONS.close}
            </button>
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
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="select-all" title="Select all pages">All</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="deselect-all" title="Deselect all pages">None</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="invert" title="Invert selection">Invert</button>
          <span class="md-selection-count" id="md-selection-count">0 selected</span>
        </div>
        
        <div class="md-tree-container" id="md-tree-container">
          <div class="md-tree" id="md-tree-root">${buildTreeHtml([rootNode])}</div>
        </div>
        
        <!-- Settings Panel -->
        <div class="md-settings-panel">
          <button class="md-settings-toggle" data-action="toggle-settings">
            ${ICONS.settings}
            <span>Export Settings</span>
            <span class="md-chevron">${ICONS.chevron}</span>
          </button>
          <div class="md-settings-content" id="md-settings-content" style="display: none;">
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-images" ${currentSettings.includeImages ? "checked" : ""}>
              <span>Include images</span>
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
        </div>
        
        <!-- Toast notification -->
        <div class="md-toast" id="md-toast" style="display: none;">
          ${ICONS.check}
          <span>Copied to clipboard!</span>
        </div>
        
        <div class="md-modal-footer">
          <div class="md-footer-left">
            <span class="md-hint">Esc to close</span>
          </div>
          <div class="md-footer-right">
            <button class="md-btn md-btn-secondary" data-action="copy" id="md-copy-btn" title="Copy Markdown to clipboard">
              ${ICONS.copy}
              <span>Copy</span>
            </button>
            <button class="md-btn md-btn-secondary" data-action="pdf" id="md-pdf-btn" title="Open print preview for PDF">
              <span>📄 PDF</span>
            </button>
            <button class="md-btn md-btn-primary" data-action="download" id="md-download-btn" title="Download as .md file">
              ${ICONS.download}
              <span>Download</span>
              <span class="md-btn-badge" id="md-download-badge">0</span>
            </button>
          </div>
        </div>
      </div>
    `;
      document.body.appendChild(modal);
      updateSelectionCount(modal);
      setTimeout(() => {
        const searchInput2 = modal.querySelector("#md-search-input");
        searchInput2 == null ? void 0 : searchInput2.focus();
      }, 100);
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
          resolve({
            selectedIds,
            cancelled: false,
            action,
            settings: currentSettings
          });
          return;
        }
        if (action === "refresh") {
          const refreshBtn = btn;
          refreshBtn.classList.add("spinning");
          try {
            const newTree = await options.onRefresh();
            const treeRoot = modal.querySelector("#md-tree-root");
            if (treeRoot) {
              treeRoot.innerHTML = buildTreeHtml([newTree]);
            }
            const pageCount = modal.querySelector(".md-page-count");
            if (pageCount) {
              pageCount.textContent = `${countNodes(newTree)} pages`;
            }
            updateSelectionCount(modal);
          } finally {
            refreshBtn.classList.remove("spinning");
          }
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
          return;
        }
        if (action === "deselect-all") {
          modal.querySelectorAll(".md-tree-checkbox").forEach((cb) => cb.checked = false);
          updateSelectionCount(modal);
          return;
        }
        if (action === "invert") {
          modal.querySelectorAll(".md-tree-checkbox").forEach((cb) => {
            var _a;
            if (!((_a = cb.closest("li")) == null ? void 0 : _a.classList.contains("hidden"))) cb.checked = !cb.checked;
          });
          updateSelectionCount(modal);
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
        var _a, _b;
        const target = e.target;
        if (!target.classList.contains("md-tree-checkbox")) return;
        const isChecked = target.checked;
        const li = target.closest("li");
        li == null ? void 0 : li.querySelectorAll(":scope > ul .md-tree-checkbox").forEach((cb) => {
          cb.checked = isChecked;
        });
        if (isChecked) {
          let parent = (_a = li == null ? void 0 : li.parentElement) == null ? void 0 : _a.closest("li");
          while (parent) {
            const parentCb = parent.querySelector(":scope > .md-tree-item .md-tree-checkbox");
            if (parentCb) parentCb.checked = true;
            parent = (_b = parent.parentElement) == null ? void 0 : _b.closest("li");
          }
        }
        updateSelectionCount(modal);
      });
    });
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
  function updateModalProgress(completed, total, phase) {
    if (!modalElement) return;
    const section = modalElement.querySelector("#md-progress-section");
    const text = modalElement.querySelector("#md-progress-text");
    const count = modalElement.querySelector("#md-progress-count");
    const fill = modalElement.querySelector("#md-progress-fill");
    if (!section || !text || !fill) return;
    section.style.display = "block";
    const phaseLabels = {
      tree: "Scanning page tree...",
      content: "Loading page content...",
      convert: "Converting to Markdown..."
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
      const iconClass = hasChildren ? "md-tree-icon folder" : "md-tree-icon page";
      const icon = hasChildren ? ICONS.folder : ICONS.page;
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
      const { selectedIds, cancelled, action, settings } = await showPageSelectorModal(
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
      updateModalProgress(0, 0, "convert");
      const result = buildMarkdownDocument(pagesContent, rootTree, rootTitle, settings);
      if (action === "copy") {
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
        updateStatus(`PDF preview opened for ${result.pageCount} pages`);
      } else {
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