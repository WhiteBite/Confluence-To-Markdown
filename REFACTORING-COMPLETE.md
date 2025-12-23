# Архитектурный рефакторинг завершён

## Что сделано

### 1. Создан `utils/fetch-helper.ts`
- Унифицированная логика fetch (GM_xmlhttpRequest/fetch)
- Функции: `fetchJson`, `fetchBlob`, `fetchText`
- Автоматический выбор метода (Tampermonkey/browser)
- Удалено ~100 строк дублирующегося кода

### 2. Создан `core/sanitizer.ts`
- Вынесена логика санитизации HTML из `converter.ts`
- Экспорты:
  - `sanitizeHtml()` - очистка HTML
  - `extractDiagramInfoFromHtml()` - извлечение диаграмм
  - `DiagramInfo` - тип
  - `SanitizeOptions` - тип

### 3. Создана папка `core/diagrams/`
- `diagrams/types.ts` - типы для диаграмм
- `diagrams/extractor.ts` - `extractDiagramReferences()`
- `diagrams/converter.ts` - `convertDrawioToMermaid()`
- `diagrams/index.ts` - barrel exports

### 4. Рефакторинг `attachment-handler.ts`
- Удалены дублирующиеся fetch функции
- Используется `fetch-helper.ts`
- Re-export функций из `diagrams/`
- Размер: 325 → 150 строк

### 5. Рефакторинг `converter.ts`
- Удалены дублирующиеся интерфейсы `DiagramInfo`, `SanitizeOptions`
- Удалены функции `sanitizeHtml()`, `extractDiagramInfoFromHtml()`
- Re-export из `sanitizer.ts` для обратной совместимости
- Размер: ~600 → ~450 строк

## Результаты

✅ Все 29 тестов проходят (2 skipped)
✅ Проект компилируется: 681.74 KB
✅ Нет TypeScript ошибок
✅ Удалено ~200 строк дублирующегося кода
✅ Улучшена модульность и переиспользуемость

## Структура после рефакторинга

```
src/
├── core/
│   ├── diagrams/
│   │   ├── types.ts          # Типы диаграмм
│   │   ├── extractor.ts      # Извлечение ссылок
│   │   ├── converter.ts      # Конвертация Draw.io → Mermaid
│   │   └── index.ts          # Barrel exports
│   ├── sanitizer.ts          # Санитизация HTML
│   ├── converter.ts          # Turndown конвертация
│   ├── attachment-handler.ts # Работа с вложениями
│   └── exporter.ts           # Экспорт документов
└── utils/
    └── fetch-helper.ts       # Унифицированный fetch
```

## Принципы соблюдены

- ✅ DRY - нет дублирования кода
- ✅ SRP - каждый модуль отвечает за одну задачу
- ✅ Модульность - легко добавлять новые форматы диаграмм
- ✅ Обратная совместимость - re-exports сохранены
