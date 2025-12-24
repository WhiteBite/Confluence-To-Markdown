/**
 * Internationalization module for Export Modal
 * Supports English and Russian
 * @module ui/i18n
 */

export type Locale = 'en' | 'ru';

export interface Translations {
    // Header
    title: string;
    toggleTheme: string;
    refreshTree: string;
    close: string;

    // Source panel
    searchPlaceholder: string;
    filterAll: string;
    filterSelected: string;
    filterErrors: string;
    expandAll: string;
    collapseAll: string;

    // Stats
    pages: string;
    page: string;
    images: string;
    diagrams: string;

    // Config panel
    exportPreset: string;
    presetObsidian: string;
    presetObsidianDesc: string;
    presetSingle: string;
    presetSingleDesc: string;
    presetGithub: string;
    presetGithubDesc: string;

    // Diagrams section
    diagramsTitle: string;
    diagramCopyAsIs: string;
    diagramCopyAsIsDesc: string;
    diagramConvert: string;
    diagramConvertDesc: string;
    diagramSvgSource: string;
    diagramSvgSourceDesc: string;
    diagramFormat: string;
    includeSource: string;
    includePreview: string;
    embedAsCode: string;

    // Content section
    contentTitle: string;
    optionImages: string;
    optionAttachments: string;
    optionMetadata: string;
    optionComments: string;
    optionSourceLinks: string;
    optionFrontmatter: string;
    optionHierarchical: string;
    optionWikilinks: string;
    optionCallouts: string;

    // Footer
    resetDefaults: string;
    copy: string;
    copyDisabledMultiple: string;
    copyDisabledFormat: string;
    pdf: string;
    download: string;

    // Progress
    progressPreparing: string;
    progressScanning: string;
    progressLoading: string;
    progressConverting: string;
    progressCreatingVault: string;
    progressAttachments: string;
    progressDiagrams: string;

    // Toast
    copiedToClipboard: string;
    downloadComplete: string;
    exportError: string;
}

const en: Translations = {
    // Header
    title: 'Export to Markdown',
    toggleTheme: 'Toggle theme',
    refreshTree: 'Refresh page tree',
    close: 'Close',

    // Source panel
    searchPlaceholder: 'Search pages...',
    filterAll: 'All',
    filterSelected: 'Selected',
    filterErrors: 'Errors',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',

    // Stats
    pages: 'Pages',
    page: 'Page',
    images: 'Images',
    diagrams: 'Diagrams',

    // Config panel
    exportPreset: 'Export Preset',
    presetObsidian: '💎 Obsidian Vault (Zip)',
    presetObsidianDesc: 'Folders, wikilinks, assets in /attachments',
    presetSingle: '📄 Single Markdown File',
    presetSingleDesc: 'Everything in one .md file',
    presetGithub: '🐙 GitHub / GitLab (Zip)',
    presetGithubDesc: 'Standard markdown, repo structure',

    // Diagrams section
    diagramsTitle: 'Diagrams',
    diagramCopyAsIs: 'Copy as-is',
    diagramCopyAsIsDesc: 'Keep original diagram code',
    diagramConvert: 'Convert',
    diagramConvertDesc: 'Convert to target format',
    diagramSvgSource: 'SVG + Source',
    diagramSvgSourceDesc: 'Image with editable source',
    diagramFormat: 'Format',
    includeSource: 'Include source',
    includePreview: 'Include preview',
    embedAsCode: 'Embed as code',

    // Content section
    contentTitle: 'Content',
    optionImages: 'Images',
    optionAttachments: 'Attachments',
    optionMetadata: 'Metadata',
    optionComments: 'Comments',
    optionSourceLinks: 'Source links',
    optionFrontmatter: 'Frontmatter',
    optionHierarchical: 'Hierarchical folders',
    optionWikilinks: '[[Wikilinks]]',
    optionCallouts: 'Callouts',

    // Footer
    resetDefaults: 'Reset to defaults',
    copy: 'Copy',
    copyDisabledMultiple: 'Copy is available only for single page selection',
    copyDisabledFormat: 'Copy is available only for Single File mode',
    pdf: 'PDF',
    download: 'Download',

    // Progress
    progressPreparing: 'Preparing...',
    progressScanning: 'Scanning page tree...',
    progressLoading: 'Loading page content...',
    progressConverting: 'Converting to Markdown...',
    progressCreatingVault: 'Creating Obsidian vault...',
    progressAttachments: 'Downloading attachments...',
    progressDiagrams: 'Processing diagrams...',

    // Toast
    copiedToClipboard: 'Copied to clipboard!',
    downloadComplete: 'Download complete!',
    exportError: 'Export failed',
};

const ru: Translations = {
    // Header
    title: 'Экспорт в Markdown',
    toggleTheme: 'Переключить тему',
    refreshTree: 'Обновить дерево страниц',
    close: 'Закрыть',

    // Source panel
    searchPlaceholder: 'Поиск страниц...',
    filterAll: 'Все',
    filterSelected: 'Выбранные',
    filterErrors: 'Ошибки',
    expandAll: 'Развернуть всё',
    collapseAll: 'Свернуть всё',

    // Stats
    pages: 'Страниц',
    page: 'Страница',
    images: 'Изображений',
    diagrams: 'Диаграмм',

    // Config panel
    exportPreset: 'Формат экспорта',
    presetObsidian: '💎 Obsidian Vault (Zip)',
    presetObsidianDesc: 'Папки, wikilinks, вложения в /attachments',
    presetSingle: '📄 Один Markdown файл',
    presetSingleDesc: 'Всё в одном .md файле',
    presetGithub: '🐙 GitHub / GitLab (Zip)',
    presetGithubDesc: 'Стандартный markdown, структура репозитория',

    // Diagrams section
    diagramsTitle: 'Диаграммы',
    diagramCopyAsIs: 'Как есть',
    diagramCopyAsIsDesc: 'Сохранить исходный код диаграммы',
    diagramConvert: 'Конвертировать',
    diagramConvertDesc: 'Преобразовать в целевой формат',
    diagramSvgSource: 'SVG + Исходник',
    diagramSvgSourceDesc: 'Картинка с редактируемым кодом',
    diagramFormat: 'Формат',
    includeSource: 'Включить исходник',
    includePreview: 'Включить превью',
    embedAsCode: 'Встроить как код',

    // Content section
    contentTitle: 'Контент',
    optionImages: 'Изображения',
    optionAttachments: 'Вложения',
    optionMetadata: 'Метаданные',
    optionComments: 'Комментарии',
    optionSourceLinks: 'Ссылки на источник',
    optionFrontmatter: 'Frontmatter',
    optionHierarchical: 'Иерархия папок',
    optionWikilinks: '[[Wikilinks]]',
    optionCallouts: 'Callouts',

    // Footer
    resetDefaults: 'Сбросить настройки',
    copy: 'Копировать',
    copyDisabledMultiple: 'Копирование доступно только для одной страницы',
    copyDisabledFormat: 'Копирование доступно только в режиме Single File',
    pdf: 'PDF',
    download: 'Скачать',

    // Progress
    progressPreparing: 'Подготовка...',
    progressScanning: 'Сканирование страниц...',
    progressLoading: 'Загрузка контента...',
    progressConverting: 'Конвертация в Markdown...',
    progressCreatingVault: 'Создание Obsidian vault...',
    progressAttachments: 'Загрузка вложений...',
    progressDiagrams: 'Обработка диаграмм...',

    // Toast
    copiedToClipboard: 'Скопировано в буфер!',
    downloadComplete: 'Загрузка завершена!',
    exportError: 'Ошибка экспорта',
};

const translations: Record<Locale, Translations> = { en, ru };

const LOCALE_STORAGE_KEY = 'md-export-locale';

// Current locale (load from storage or auto-detect)
let currentLocale: Locale = loadLocale();

/**
 * Load locale from localStorage or detect from browser
 */
function loadLocale(): Locale {
    try {
        const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (saved === 'en' || saved === 'ru') return saved;
    } catch {
        // localStorage not available
    }
    return detectLocale();
}

/**
 * Detect locale from browser settings
 */
function detectLocale(): Locale {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ru')) return 'ru';
    return 'en';
}

/**
 * Get current locale
 */
export function getLocale(): Locale {
    return currentLocale;
}

/**
 * Set locale and save to localStorage
 */
export function setLocale(locale: Locale): void {
    currentLocale = locale;
    try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
        // localStorage not available
    }
}

/**
 * Toggle between EN and RU
 */
export function toggleLocale(): Locale {
    const newLocale = currentLocale === 'en' ? 'ru' : 'en';
    setLocale(newLocale);
    return newLocale;
}

/**
 * Get translation for key
 */
export function t(key: keyof Translations): string {
    return translations[currentLocale][key] || translations.en[key] || key;
}

/**
 * Get all translations for current locale
 */
export function getTranslations(): Translations {
    return translations[currentLocale];
}
