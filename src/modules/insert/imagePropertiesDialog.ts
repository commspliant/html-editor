import type { ImageDialogTab } from '../../core/commandTypes'
import type { MessageKey } from '../../i18n/types'

export type ImagePropertiesTabDef = {
  id: ImageDialogTab
  labelKey: MessageKey
  implemented: boolean
}

export const IMAGE_PROPERTIES_TABS: ImagePropertiesTabDef[] = [
  { id: 'general', labelKey: 'fontDialogTabGeneral', implemented: true },
  { id: 'alignment', labelKey: 'imagePropertiesTabAlignment', implemented: true },
  { id: 'border', labelKey: 'imagePropertiesTabBorder', implemented: true },
  { id: 'advanced', labelKey: 'imagePropertiesTabAdvanced', implemented: true },
  { id: 'hover', labelKey: 'imagePropertiesTabHover', implemented: true },
]
