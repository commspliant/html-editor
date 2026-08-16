import { useT } from '../../i18n/LocaleProvider'
import type { ToolbarWidgetProps } from '../../toolbar/types'
import { FontSizeCombobox } from './FontSizeCombobox'

export function FontSizeSelect({ commands, queries, disabled }: ToolbarWidgetProps) {
  const t = useT()
  const isDisabled = Boolean(disabled || !queries.isVisualMode())
  return (
    <FontSizeCombobox
      size={queries.getFontSize()}
      unit={queries.getFontSizeUnit()}
      disabled={isDisabled}
      tooltip={t('commandFontSize')}
      toolbar
      onSizeChange={(value, unit) => {
        commands.setFontSize(value, unit)
      }}
      onUnitChange={(unit) => {
        commands.setFontSizeUnit(unit)
      }}
    />
  )
}
