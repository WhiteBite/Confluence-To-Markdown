# Confluence to Markdown

Export Confluence pages to clean Markdown for LLM consumption.

![Version](https://img.shields.io/github/v/release/WhiteBite/Confluence-To-Markdown)
![License](https://img.shields.io/github/license/WhiteBite/Confluence-To-Markdown)

## Features

- 🚀 **Smart Caching** — Page tree is cached locally, instant modal opening on repeat clicks
- 📋 **Copy to Clipboard** — One-click copy to paste directly into ChatGPT/Claude
- 💾 **Download as File** — Export as `.md` file
- ⚙️ **Export Settings** — Toggle images, metadata, comments, source links
- 🔄 **Refresh Button** — Update cached tree when pages change
- 🎯 **Selective Export** — Choose specific pages/branches via tree checkboxes
- 📊 **Progress Feedback** — Real-time progress bar during export
- 🎨 **Modern UI** — Clean Atlassian-inspired design
- 📐 **Diagram Export Modes** — Three modes for handling diagrams (copy-as-is, SVG preview, convert)

## Diagram Export Modes

Confluence to Markdown supports three modes for exporting diagrams:

### 1. Copy As-Is (Default)
Preserves diagrams in their original format without conversion.
- Draw.io → `.drawio` file reference
- PlantUML → code block
- Mermaid → code block

### 2. SVG Preview
Exports inline SVG preview + original source file.
- ✅ See diagram preview directly in markdown
- ✅ Scalable vector graphics
- ✅ Keep editable source

### 3. Convert
Converts diagrams to target format (e.g., Mermaid).
- Draw.io → Mermaid
- PlantUML → Mermaid
- Unified format for all diagrams

📖 **[Full Documentation](./DIAGRAM-EXPORT-MODES.md)**

## Installation

### Option 1: Chrome Extension

1. Download `confluence-to-markdown-extension.zip` from [Releases](https://github.com/WhiteBite/Confluence-To-Markdown/releases)
2. Unzip the archive
3. Go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the unzipped folder

### Option 2: Tampermonkey UserScript

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click on `confluence-to-markdown.user.js` from [Releases](https://github.com/WhiteBite/confluence-to-markdown/releases)
3. Tampermonkey will prompt to install — click "Install"

## Usage

1. Navigate to any Confluence page
2. Click **"Export to Markdown"** button in the page toolbar
3. Select pages to export using the tree checkboxes
4. Configure export settings (optional):
   - ✅ Include images
   - ✅ Include metadata (author, date)
   - ❌ Include user comments (off by default)
   - ✅ Include source links
5. Click **"Copy to Clipboard"** or **"Download"**

## Export Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Include images | ✅ On | Keep image references in Markdown |
| Include metadata | ✅ On | Add author and last update date |
| Include comments | ❌ Off | Include user comments (usually noise for LLM) |
| Include source links | ✅ On | Add link to original Confluence page |

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/WhiteBite/confluence-to-markdown.git
cd confluence-to-markdown
npm install
```

### Build

```bash
# Build Tampermonkey UserScript
npm run build
# Output: dist/confluence-to-markdown.user.js

# Build Chrome Extension
npm run build:ext
# Output: dist-extension/
```

### Development

```bash
# Start dev server with hot reload (Tampermonkey)
npm run dev
```

## Project Structure

```
src/
├── api/
│   ├── confluence.ts    # API requests with pagination
│   └── types.ts         # TypeScript interfaces
├── core/
│   ├── converter.ts     # Turndown HTML→MD conversion
│   ├── content-loader.ts # Batch content fetching
│   ├── exporter.ts      # Final MD assembly
│   └── tree-processor.ts # Page hierarchy traversal
├── storage/
│   ├── storage.ts       # LocalStorage operations
│   └── types.ts         # Settings interfaces
├── ui/
│   ├── modal.ts         # Page selector modal
│   ├── components.ts    # UI components
│   └── styles.css       # Modern CSS
├── utils/
│   ├── env.ts           # Environment detection
│   ├── helpers.ts       # Utility functions
│   └── queue.ts         # Concurrency pool
├── background/
│   └── background.ts    # Extension service worker
├── config.ts            # Configuration constants
└── main.ts              # Entry point
```

## Technical Details

- **Concurrency Pool**: 6 parallel requests with exponential backoff on 429 errors
- **Cache TTL**: 24 hours for page tree
- **Universal Code**: Same codebase for Tampermonkey and Chrome Extension
- **Turndown**: Custom rules for Confluence macros, tables, code blocks

## License

MIT
