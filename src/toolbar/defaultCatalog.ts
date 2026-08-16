import { fileCatalog } from '../modules/file'
import { formatCatalog } from '../modules/format'
import { historyCatalog } from '../modules/history'
import { insertCatalog } from '../modules/insert'
import { tableCatalog } from '../modules/table'
import { viewCatalog } from '../modules/view'
import type { ToolbarCatalog } from './types'

export function mergeCatalogs(...parts: ToolbarCatalog[]): ToolbarCatalog {
  return {
    menus: Object.assign({}, ...parts.map((part) => part.menus)),
    submenus: Object.assign({}, ...parts.map((part) => part.submenus ?? {})),
    groups: Object.assign({}, ...parts.map((part) => part.groups)),
    items: Object.assign({}, ...parts.map((part) => part.items)),
  }
}

export const defaultToolbarCatalog = mergeCatalogs(
  fileCatalog,
  historyCatalog,
  insertCatalog,
  tableCatalog,
  viewCatalog,
  formatCatalog,
)
