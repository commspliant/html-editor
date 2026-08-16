import type { CSSProperties, Ref } from 'react'
import type { FontFace } from '../../core/fontFamily'
import { fontFamiliesEqual, matchFontFace } from '../../core/fontFamily'
import { useT } from '../../i18n/LocaleProvider'
import styles from './FontFamilySelect.module.css'

export type FontFamilyListProps = {
  value: string | null
  mixed?: boolean
  fonts: readonly FontFace[]
  disabled?: boolean
  listId?: string
  listRef?: Ref<HTMLUListElement>
  inline?: boolean
  style?: CSSProperties
  onSelect: (family: string | null) => void
}

export function FontFamilyList({
  value,
  mixed = false,
  fonts,
  disabled,
  listId,
  listRef,
  inline,
  style,
  onSelect,
}: FontFamilyListProps) {
  const t = useT()
  const defaultChecked = !mixed && value === null

  return (
    <ul
      ref={listRef}
      id={listId}
      className={inline ? `${styles.list} ${styles.listInline}` : styles.list}
      role="listbox"
      aria-label={t('commandFontFamilyAria')}
      style={style}
    >
      <li role="presentation">
        <button
          type="button"
          className={styles.option}
          role="option"
          aria-checked={defaultChecked}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(null)}
        >
          {t('fontFamilyDefault')}
        </button>
      </li>
      <li className={styles.separator} role="separator" />
      {fonts.map((font) => {
        const checked = !mixed && fontFamiliesEqual(value, font.family)
        return (
          <li key={font.family} role="presentation">
            <button
              type="button"
              className={styles.option}
              role="option"
              aria-checked={checked}
              disabled={disabled}
              style={{ fontFamily: font.family }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(font.family)}
            >
              {font.name}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function fontFamilyTriggerLabel(
  value: string | null,
  mixed: boolean,
  fonts: readonly FontFace[],
  defaultLabel: string,
): string {
  if (mixed) return ''
  if (value === null) return defaultLabel
  return matchFontFace(value, fonts)?.name ?? value
}
