import { useId } from 'react'
import type { FontDialogTab, FontPropertiesApply } from '../../core/commandTypes'
import type { FontFace } from '../../core/fontFamily'
import { mergeFontFaces } from '../../core/fontFamily'
import { convertFontSize } from '../../core/fontSizeUnits'
import type { FontMark } from '../../core/marks'
import { FONT_MARKS } from '../../core/marks'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import { ColorField } from './ColorField'
import { FONT_DIALOG_TABS } from './fontDialog'
import { FontFamilyCombobox } from './FontFamilySelect'
import { FontSizeCombobox } from './FontSizeCombobox'
import styles from './FontPropertiesDialog.module.css'

const MARK_KEYS: Record<FontMark, { label: MessageKey }> = {
  bold: { label: 'commandBold' },
  italic: { label: 'commandItalic' },
  underline: { label: 'commandUnderline' },
  strikethrough: { label: 'commandStrikethrough' },
}

export type FontPropertiesFieldsProps = {
  tab: FontDialogTab
  value: FontPropertiesApply
  fonts?: readonly FontFace[]
  disabled?: boolean
  onTabChange: (tab: FontDialogTab) => void
  onChange: (next: FontPropertiesApply) => void
}

export function FontPropertiesFields({
  tab,
  value,
  fonts,
  disabled,
  onTabChange,
  onChange,
}: FontPropertiesFieldsProps) {
  const t = useT()
  const sizeId = useId()
  const familyId = useId()
  const faces = fonts ?? mergeFontFaces()
  const activeTab = FONT_DIALOG_TABS.find((item) => item.id === tab) ?? FONT_DIALOG_TABS[0]

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label={t('fontDialogTitle')}>
        {FONT_DIALOG_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={item.id === tab}
            disabled={!item.implemented}
            onClick={() => onTabChange(item.id)}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
      <div className={styles.body} role="tabpanel">
        {activeTab.implemented ? (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={familyId}>
                {t('fontDialogFamily')}
              </label>
              <FontFamilyCombobox
                family={value.fontFamilyMixed ? null : value.fontFamily}
                mixed={value.fontFamilyMixed}
                fonts={faces}
                disabled={disabled}
                triggerId={familyId}
                onChange={(fontFamily) => {
                  onChange({ ...value, fontFamily, fontFamilyMixed: false })
                }}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={sizeId}>
                {t('fontDialogSize')}
              </label>
              <div className={styles.sizeRow}>
                <FontSizeCombobox
                  size={value.size}
                  unit={value.unit}
                  sizeInputId={sizeId}
                  disabled={disabled}
                  onSizeChange={(size, unit) => {
                    onChange({ ...value, size, unit })
                  }}
                  onUnitChange={(unit) => {
                    const size =
                      value.size !== null
                        ? convertFontSize(value.size, value.unit, unit, 16, 16)
                        : value.size
                    onChange({ ...value, size, unit })
                  }}
                />
              </div>
            </div>
            <div className={styles.field}>
              <ColorField
                label={t('commandFontColor')}
                noneLabel={t('colorAutomatic')}
                value={value.fontColor}
                mixed={value.fontColorMixed}
                disabled={disabled}
                onChange={(fontColor) => {
                  onChange({ ...value, fontColor, fontColorMixed: false })
                }}
              />
            </div>
            <div className={styles.field}>
              <ColorField
                label={t('commandHighlightColor')}
                noneLabel={t('colorNone')}
                value={value.highlightColor}
                mixed={value.highlightColorMixed}
                disabled={disabled}
                fallbackCustom="#ffff00"
                onChange={(highlightColor) => {
                  onChange({ ...value, highlightColor, highlightColorMixed: false })
                }}
              />
            </div>
            <fieldset className={styles.marks}>
              <legend className={styles.label}>{t('fontDialogStyle')}</legend>
              {FONT_MARKS.map((mark) => (
                <label key={mark} className={styles.mark}>
                  <input
                    type="checkbox"
                    checked={value.marks[mark]}
                    disabled={disabled}
                    onChange={() => {
                      onChange({
                        ...value,
                        marks: { ...value.marks, [mark]: !value.marks[mark] },
                      })
                    }}
                  />
                  {t(MARK_KEYS[mark].label)}
                </label>
              ))}
            </fieldset>
          </>
        ) : null}
      </div>
    </>
  )
}
