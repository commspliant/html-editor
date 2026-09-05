import { CommspliantShieldIcon } from '../../icons'
import type { ToolbarCatalog } from '../../toolbar/types'

export const capabilitiesCatalog: ToolbarCatalog = {
  items: {
    compatibilityCheck: {
      id: 'compatibilityCheck',
      command: 'openCompatibilityCheck',
      icon: CommspliantShieldIcon,
      labelKey: 'commandCompatibilityCheck',
      ariaKey: 'commandCompatibilityCheckAria',
      enabled: 'isVisualMode',
    },
  },
}
