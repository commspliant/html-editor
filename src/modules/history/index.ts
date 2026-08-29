export { historyCatalog } from './catalog'
export { createHistoryCommands, createHistoryQueries } from './commands'
export {
  createDocumentHistory,
  HISTORY_COALESCE_MS,
  HISTORY_MAX_PAST_ENTRIES,
  HISTORY_MAX_TOTAL_CHARS,
} from './history'
export type { DocumentHistory, RecordOptions } from './history'
export {
  createMultiPageHistory,
  isMultiPageHistory,
} from './multiPageHistory'
export type { MultiPageHistory } from './multiPageHistory'
