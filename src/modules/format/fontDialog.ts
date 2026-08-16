import type { FontDialogTab } from '../../core/commandTypes'
import type { MessageKey } from '../../i18n/types'

export type FontDialogTabDef = {
  id: FontDialogTab
  labelKey: MessageKey
  implemented: boolean
}

export const FONT_DIALOG_TABS: FontDialogTabDef[] = [
  { id: 'general', labelKey: 'fontDialogTabGeneral', implemented: true },
]
