import type { ParagraphDialogTab } from '../../core/commandTypes'
import type { MessageKey } from '../../i18n/types'

export type ParagraphDialogTabDef = {
  id: ParagraphDialogTab
  labelKey: MessageKey
  implemented: boolean
}

export const PARAGRAPH_DIALOG_TABS: ParagraphDialogTabDef[] = [
  { id: 'general', labelKey: 'fontDialogTabGeneral', implemented: true },
  { id: 'spacing', labelKey: 'paragraphDialogSpacing', implemented: true },
  { id: 'border', labelKey: 'paragraphDialogTabBorder', implemented: true },
  { id: 'background', labelKey: 'paragraphDialogTabBackground', implemented: true },
  { id: 'backgroundImage', labelKey: 'pageDialogTabBackgroundImage', implemented: true },
]
