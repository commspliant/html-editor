import type { ParagraphDialogTab } from '../../core/commandTypes'
import type { MessageKey } from '../../i18n/types'

export type PageDialogTabDef = {
  id: ParagraphDialogTab
  labelKey: MessageKey
  implemented: boolean
}

export const PAGE_DIALOG_TABS: PageDialogTabDef[] = [
  { id: 'spacing', labelKey: 'paragraphDialogSpacing', implemented: true },
  { id: 'border', labelKey: 'paragraphDialogTabBorder', implemented: true },
  { id: 'background', labelKey: 'paragraphDialogTabBackground', implemented: true },
  { id: 'backgroundImage', labelKey: 'pageDialogTabBackgroundImage', implemented: true },
]
