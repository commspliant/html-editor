import { HighlightColorIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { ToolbarWidgetProps } from '../../toolbar/types'
import { ColorPicker } from './ColorPicker'
import { ColorSelect } from './ColorSelect'

export function HighlightColorSelect({ commands, queries, disabled }: ToolbarWidgetProps) {
  return (
    <ColorSelect
      icon={HighlightColorIcon}
      value={queries.getHighlightColor()}
      mixed={queries.isHighlightColorMixed()}
      noneKey="colorNone"
      labelKey="commandHighlightColor"
      ariaKey="commandHighlightColorAria"
      fallbackCustom="#ffff00"
      disabled={Boolean(disabled || !queries.isVisualMode())}
      onChange={(color) => commands.setHighlightColor(color)}
    />
  )
}

export function HighlightColorMenuPanel({
  commands,
  queries,
  disabled,
  onMenuClose,
}: ToolbarWidgetProps) {
  const t = useT()
  const unavailable = Boolean(disabled || !queries.isVisualMode())
  return (
    <ColorPicker
      value={queries.getHighlightColor()}
      mixed={queries.isHighlightColorMixed()}
      noneLabel={t('colorNone')}
      ariaLabel={t('commandHighlightColorAria')}
      disabled={unavailable}
      menu
      fallbackCustom="#ffff00"
      onChange={(color) => commands.setHighlightColor(color)}
      onCommit={() => onMenuClose?.()}
    />
  )
}
