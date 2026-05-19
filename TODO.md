# Confluence to Markdown — TODO

## 🔴 Critical Bugs

### 1. Cancel button не работает
AbortController создаётся в `events.ts`, но `signal` НЕ передаётся в pipeline:
`events.ts → callbacks.onAction → dispatchAction → runExportAction → fetchPagesContent → runWithConcurrency`

**Эффект:** Кнопка Cancel мёртвая — пользователь не может прервать экспорт.
**Фикс:** Добавить `signal` в `ModalContext`, пробросить через всю цепочку. `runWithConcurrency` уже поддерживает `signal` в options.

### 2. Backup делает двойной fetch
`action-runner.ts:57-65` ВСЕГДА вызывает `fetchPagesContent` (body.view) перед switch. Для backup это бесполезно — backup-exporter делает свой fetch (body.storage). Каждая страница загружается ДВАЖДЫ.

**Эффект:** Удваивает количество API-запросов и время экспорта.
**Фикс:** Вынести `fetchPagesContent` из общего кода, вызывать только для copy/download/obsidian/pdf. Для backup — сразу `finalizeBackup`.

### 3. zipSync блокирует UI на 30-60 секунд
`obsidian-exporter.ts` и `backup-exporter.ts` используют `fflate.zipSync` — синхронная операция. Для 500MB данных блокирует main thread на десятки секунд. Браузер показывает "Page Unresponsive".

**Эффект:** "Зависло на конвертации показывало 0" — пользователь думает что сломалось.
**Фикс:** Использовать `fflate.Zip` (async streaming API) или Web Worker. Показывать progress по файлам.

### 4. Все attachment blobs в памяти одновременно
`obsidian-exporter.ts` скачивает ВСЕ attachments в массив `attachmentFiles[]`, конвертирует каждый в Uint8Array, и только потом вызывает zipSync. Пиковое потребление: blobs + Uint8Arrays + ZIP output = 3x суммарного размера.

**Эффект:** OOM crash на >500MB attachments.
**Фикс:** Streaming подход — скачал → добавил в zip → освободил blob. Или чанковая обработка.

---

## 🟡 High Priority

### 5. Ctrl+D не работает в Backup mode
Keyboard shortcut ищет `[data-action="download"]`, но при Backup pill кнопка получает `data-action="backup"`.

**Фикс:** Искать по `#md-download-btn` вместо `[data-action="download"]`.

### 6. bailOnError:true убивает весь Obsidian export
В `obsidian-exporter.ts` `runWithConcurrency` для attachment downloads использует default `bailOnError: true`. Один 404 attachment убивает экспорт 500 страниц.

**Фикс:** `bailOnError: false` для attachment downloads. Собирать ошибки в summary.

### 7. 30s timeout для blob downloads
`FETCH_TIMEOUT_MS = 30_000` применяется ко ВСЕМ запросам. Для 50-100MB attachment'ов на медленном соединении — гарантированный timeout.

**Фикс:** Отдельный timeout для blob (5 минут) или динамический на основе fileSize.

### 8. Дублирующиеся чекбоксы "All Attachments"
Два чекбокса с разными ID (`#setting-all-attachments`, `#setting-attachments-all`) для одной настройки. При init могут быть рассинхронизированы.

**Фикс:** Убрать дубликат, оставить один. Синхронизировать при init.

### 9. downloadBackupZip без fallback chain
`backup-exporter.ts` использует только ObjectURL (anchor click). В Tampermonkey sandbox может не работать.

**Фикс:** Использовать тот же 3-уровневый fallback что в obsidian-exporter: GM_download → ObjectURL → DataURL.

### 10. Поиск влияет на экспорт без предупреждения
`getSelectedIds` фильтрует hidden items. Если пользователь ввёл поиск — экспортируются только видимые страницы, а не все выбранные.

**Фикс:** Либо поиск не влияет на экспорт, либо показывать warning "Search active: only N of M pages will be exported".

### 11. Дублирование updateSelectionCount/getSelectedIds
Определены в двух местах (`view.ts` и `tree.ts`) с разной логикой. Footer hint обновляется только из одного.

**Фикс:** Консолидировать в одном месте.

---

## 🟢 Medium Priority

### 12. Двойная санитизация HTML
`content-loader.ts` вызывает `sanitizeHtml`, потом `exporter.ts`/`obsidian-exporter.ts` вызывают повторно.

**Фикс:** Санитизировать один раз — либо в content-loader, либо в exporter.

### 13. blobToUint8Array может зависнуть
FileReader без timeout. На больших blob (>500MB) при memory pressure может не завершиться.

**Фикс:** Добавить timeout 60s, или использовать `blob.arrayBuffer()` с fallback.

### 14. Race condition — параллельные export actions
Клик на Download, потом быстро на Copy — оба запускаются параллельно.

**Фикс:** Проверять наличие ЛЮБОГО `[data-processing]` в modal.

### 15. Race condition в async updateStats
Несколько `updateStats` могут запуститься параллельно при быстрых кликах.

**Фикс:** Debounce 300ms или generation counter.

### 16. saveCurrentSettings не читает оба чекбокса attachments
Читает только `#setting-attachments-all`, игнорирует `#setting-all-attachments`.

**Фикс:** Читать OR обоих.

### 17. spaceKey=null в backup manifest
`finalizeBackup` всегда передаёт `spaceKey = null`.

**Фикс:** Получить реальный spaceKey из `getSpaceKey()`.

---

## 🔵 Low Priority / Tech Debt

### 18. Blob size limit ~2GB в Chrome
Для экспортов >1.5GB ZIP может превысить лимит.

**Фикс:** StreamSaver.js или File System Access API для больших файлов.

### 19. Single-file download OOM на 1000+ страниц
`Blob([result.markdown])` для 100MB+ строки.

**Фикс:** Streaming Blob construction.

### 20. hub-client.ts — FormData multipart через transport
Текущий workaround с Response wrapper работает, но не элегантен.

### 21. Грамматика статус-бара
"2 Изображений" → "2 изображения" (склонение по числу).

### 22. Tree indent lines
Нет вертикальных линий для визуализации глубины дерева.

---

## 🚀 Вау-фичи (Feature Ideas)

### Incremental / Streaming Export
Вместо "скачать всё в RAM → zipSync → download" — streaming:
- Использовать `fflate.Zip` (async) + `ReadableStream` + `StreamSaver.js`
- Файлы добавляются в ZIP по мере скачивания
- Пользователь видит прогресс в реальном времени
- Нет лимита на размер (работает для 10GB+)
- Partial download: если прервал — уже скачанная часть сохранена

### Diff Export (только изменения)
- Хранить timestamp последнего экспорта в localStorage
- При повторном экспорте — скачивать только страницы изменённые после timestamp
- Показывать diff: "12 pages changed, 3 new, 1 deleted"
- Экономит 90% трафика при регулярных бэкапах

### Scheduled Auto-Backup
- Настроить расписание (раз в день/неделю)
- Background script делает backup автоматически
- Хранит N последних версий
- Уведомление: "Backup completed: 407 pages, 2.4 GB"

### Live Preview
- При наведении на страницу в дереве — показать preview markdown
- Popup с первыми 500 символами конвертированного контента
- Помогает понять что экспортируется

### Selective Diagram Conversion
- Вместо "все диаграммы конвертировать" — per-diagram choice
- В дереве рядом с каждой диаграммой: [Keep] [Convert] [Skip]
- Preview конвертированного Mermaid рядом с оригиналом

### Export Templates / Presets
- Сохранять комбинации настроек как named presets
- "Quick text" (только MD, без attachments)
- "Full backup" (всё включено)
- "LLM context" (только текст, без метаданных, максимально чистый)
- Пользователь может создавать свои

### Confluence → Obsidian Sync (двусторонний)
- Не просто export, а sync: отслеживать изменения в обе стороны
- Obsidian vault как "зеркало" Confluence space
- При изменении в Obsidian — push обратно в Confluence
- Conflict resolution UI

### Multi-Space Export
- Выбрать несколько пространств для экспорта одним кликом
- Общий ZIP с папками по space
- Полезно для полного бэкапа организации

### Export to Notion / GitHub Wiki / GitBook
- Не только Obsidian — конвертация в другие форматы
- Notion: через Notion API (создание pages)
- GitHub Wiki: .md файлы + push в repo
- GitBook: SUMMARY.md + структура

### AI-Powered Export
- Суммаризация страниц при экспорте (через LLM API)
- Автоматическое тегирование (определение тем)
- Генерация README/INDEX на основе контента
- "Smart export": AI выбирает какие страницы релевантны запросу

### Offline Mode
- Кэшировать контент страниц в IndexedDB
- Работать без подключения к Confluence
- Синхронизировать при восстановлении связи

### Export Analytics Dashboard
- Статистика: сколько экспортировано за всё время
- Какие пространства/страницы экспортируются чаще
- Размер экспортов по времени (график)
- "Your Confluence has grown 15% since last backup"
