import { FontColorIcon } from '../../icons'
import type { ToolbarWidgetProps } from '../../toolbar/types'
import { ColorSelect } from './ColorSelect'

export function FontColorSelect({ commands, queries, disabled }: ToolbarWidgetProps) {
  return (
    <ColorSelect
      icon={FontColorIcon}
      value={queries.getFontColor()}
      mixed={queries.isFontColorMixed()}
      noneKey="colorAutomatic"
      labelKey="commandFontColor"
      ariaKey="commandFontColorAria"
      disabled={Boolean(disabled || !queries.isVisualMode())}
      onChange={(color) => commands.setFontColor(color)}
    />
  )
}
