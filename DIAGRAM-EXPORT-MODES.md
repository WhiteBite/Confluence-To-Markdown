# Diagram Export Modes

Confluence to Markdown поддерживает три режима экспорта диаграмм:

## 1. Copy As-Is (по умолчанию)

Сохраняет диаграммы в оригинальном формате без конвертации.

**Когда использовать:**
- Нужно сохранить исходные файлы диаграмм
- Планируется редактирование в оригинальных редакторах
- Не требуется конвертация форматов

**Пример использования:**

```typescript
import { convertToMarkdown } from './core/converter';

const markdown = convertToMarkdown(html, {
  diagramExportMode: 'copy-as-is',
});
```

**Результат:**

```markdown
![[diagram-1.png]]

%% Editable source: diagram-1.drawio %%
```

**Форматы:**
- Draw.io → `.drawio` файл
- PlantUML → `.puml` файл в code block
- Mermaid → `.md` файл в code block

---

## 2. SVG Preview

Экспортирует SVG превью + исходный файл диаграммы.

**Когда использовать:**
- Нужно видеть превью диаграммы прямо в markdown
- Хочется сохранить возможность редактирования
- Работа в Obsidian или другом markdown редакторе с поддержкой SVG

**Пример использования:**

```typescript
const markdown = convertToMarkdown(html, {
  diagramExportMode: 'svg-preview',
});
```

**Результат:**

```markdown
<details open>
<summary>Preview</summary>

<svg style="width: 100%; height: 100%;">
  <rect x="110" y="330" width="190" height="120"/>
  <ellipse cx="380" cy="400" rx="60" ry="40"/>
</svg>
</details>

%% Editable source: diagram-1.drawio %%
```

**Преимущества:**
- ✅ Видно превью без открытия файла
- ✅ SVG масштабируется без потери качества
- ✅ Сохраняется исходник для редактирования
- ✅ Работает в большинстве markdown редакторов

---

## 3. Convert

Конвертирует диаграммы в целевой формат (например, Mermaid).

**Когда использовать:**
- Нужна унификация форматов
- Целевая система поддерживает только определённый формат
- Хочется редактировать диаграммы как код

**Пример использования:**

```typescript
const markdown = convertToMarkdown(html, {
  diagramExportMode: 'convert',
  diagramTargetFormat: 'mermaid',
  embedDiagramsAsCode: true,
});
```

**Результат:**

```markdown
\`\`\`mermaid
%% diagram-1
flowchart TB
  A[Heading] --> B((Ellipse))
\`\`\`
```

**Поддерживаемые конвертации:**
- Draw.io → Mermaid
- PlantUML → Mermaid
- Draw.io → Draw.io (нормализация)

**Fallback:**
Если конвертация не удалась и `keepOriginalOnError: true`, сохраняется оригинальный формат.

---

## Сравнение режимов

| Режим | Превью | Редактирование | Конвертация | Размер |
|-------|--------|----------------|-------------|--------|
| **copy-as-is** | PNG/ссылка | ✅ Оригинальный редактор | ❌ | Средний |
| **svg-preview** | ✅ Inline SVG | ✅ Оригинальный редактор | ❌ | Большой |
| **convert** | Code block | ✅ Текстовый редактор | ✅ | Маленький |

---

## Примеры для разных сценариев

### Сценарий 1: Документация для команды

**Требования:**
- Видеть диаграммы в Obsidian
- Редактировать в Draw.io

**Решение:**

```typescript
convertToMarkdown(html, {
  diagramExportMode: 'svg-preview',
});
```

### Сценарий 2: Миграция в GitHub

**Требования:**
- Диаграммы как код
- Поддержка GitHub Mermaid

**Решение:**

```typescript
convertToMarkdown(html, {
  diagramExportMode: 'convert',
  diagramTargetFormat: 'mermaid',
  embedDiagramsAsCode: true,
});
```

### Сценарий 3: Архив документации

**Требования:**
- Сохранить всё как есть
- Возможность восстановления

**Решение:**

```typescript
convertToMarkdown(html, {
  diagramExportMode: 'copy-as-is',
});
```

---

## API Reference

### ConvertOptions

```typescript
interface ConvertOptions {
  /** Diagram export mode */
  diagramExportMode?: 'copy-as-is' | 'convert' | 'svg-preview';
  
  /** Target format for conversion (only for 'convert' mode) */
  diagramTargetFormat?: 'mermaid' | 'drawio' | 'excalidraw' | 'original';
  
  /** Embed as code blocks vs file references */
  embedDiagramsAsCode?: boolean;
  
  /** Keep original format if conversion fails */
  keepOriginalOnError?: boolean;
  
  /** Include PNG fallback */
  includePngFallback?: boolean;
}
```

### Defaults

```typescript
{
  diagramExportMode: 'copy-as-is',
  diagramTargetFormat: 'mermaid',
  embedDiagramsAsCode: true,
  keepOriginalOnError: true,
  includePngFallback: true,
}
```

---

## Технические детали

### Извлечение SVG

SVG извлекается из отрендеренных диаграмм в DOM:

1. **Draw.io**: из `.geDiagramContainer > svg`
2. **PlantUML**: из прямого `svg` потомка
3. **Mermaid**: из `svg` с классом `.mermaid`

### Обработка ошибок

При ошибке конвертации:
- Если `keepOriginalOnError: true` → сохраняется оригинал
- Если `keepOriginalOnError: false` → возвращается ошибка

### Производительность

- **copy-as-is**: Самый быстрый (без обработки)
- **svg-preview**: Средний (извлечение SVG из DOM)
- **convert**: Самый медленный (парсинг + конвертация)

---

## Roadmap

Планируемые улучшения:

- [ ] Поддержка Gliffy диаграмм
- [ ] Конвертация в Excalidraw
- [ ] Оптимизация SVG (удаление лишних атрибутов)
- [ ] Batch обработка диаграмм
- [ ] Кэширование конвертированных диаграмм
