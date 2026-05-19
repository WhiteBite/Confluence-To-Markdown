import TurndownService from 'turndown';
import type { ConvertOptions } from '../converter';
import { applyDiagramRules } from './diagrams';
import { applyConfluenceRules } from './confluence';
import { applyMediaRules } from './media';

export { applyDiagramRules } from './diagrams';
export { applyConfluenceRules } from './confluence';
export { applyMediaRules } from './media';

export function applyAllRules(turndown: TurndownService, options?: ConvertOptions): void {
    applyConfluenceRules(turndown, options);
    applyDiagramRules(turndown, options);
    applyMediaRules(turndown, options);
}
