import { type CSSProperties, type Ref } from 'react'
import {
  PARAGRAPH_STYLE_TAGS,
  type ParagraphStyleTag,
} from '../../core/blockFormat'
import { useCapabilitiesProfile } from '../../capabilities/CapabilitiesContext'
import { PlusIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import type { MessageKey } from '../../i18n/types'
import toolbarStyles from '../../toolbar/Toolbar.module.css'
import type { CustomParagraphStyle } from '../../types'
import styles from './ParagraphStyleSelect.module.css'
import dialogStyles from './FontPropertiesDialog.module.css'

export const PARAGRAPH_STYLE_LABEL_KEYS: Record<ParagraphStyleTag, MessageKey> = {
  p: 'styleParagraph',
  h1: 'styleHeading1',
  h2: 'styleHeading2',
  h3: 'styleHeading3',
  h4: 'styleHeading4',
  h5: 'styleHeading5',
  h6: 'styleHeading6',
}

const PARAGRAPH_STYLE_PREVIEW: Record<ParagraphStyleTag, { fontSize: string; fontWeight: string }> = {
  p: { fontSize: '1rem', fontWeight: '400' },
  h1: { fontSize: '1.75rem', fontWeight: '600' },
  h2: { fontSize: '1.5rem', fontWeight: '600' },
  h3: { fontSize: '1.25rem', fontWeight: '600' },
  h4: { fontSize: '1.125rem', fontWeight: '600' },
  h5: { fontSize: '1rem', fontWeight: '600' },
  h6: { fontSize: '0.875rem', fontWeight: '600' },
}

export type ParagraphStyleListProps = {
  value: ParagraphStyleTag | null
  mixed?: boolean
  disabled?: boolean
  menu?: boolean
  listId?: string
  listRef?: Ref<HTMLUListElement>
  style?: CSSProperties
  customStylesEnabled?: boolean
  customStyles?: CustomParagraphStyle[]
  customStylesLoading?: boolean
  onSelect: (tag: ParagraphStyleTag) => void
  onSelectCustom?: (id: string) => void
  onAddNew?: () => void
}

function CustomSectionSpinner() {
  const t = useT()
  return (
    <div className={dialogStyles.spinnerWrap} role="status" aria-live="polite" aria-label={t('customStyleLoading')}>
      <span className={dialogStyles.spinner} aria-hidden="true" />
    </div>
  )
}

export function ParagraphStyleList({
  value,
  mixed = false,
  disabled,
  menu = false,
  listId,
  listRef,
  style,
  customStylesEnabled = false,
  customStyles = [],
  customStylesLoading = false,
  onSelect,
  onSelectCustom,
  onAddNew,
}: ParagraphStyleListProps) {
  const t = useT()
  const capabilityProfile = useCapabilitiesProfile()
  const styleTags = capabilityProfile
    ? PARAGRAPH_STYLE_TAGS.filter((tag) => capabilityProfile.allowedParagraphTags.includes(tag))
    : PARAGRAPH_STYLE_TAGS
  const selected = mixed ? null : value
  const showCustom = customStylesEnabled && styleTags.length > 0
  const showAddNew = Boolean(menu && customStylesEnabled && onAddNew)

  if (menu) {
    return (
      <>
        {styleTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={toolbarStyles.menuItem}
            role="menuitemradio"
            aria-checked={selected === tag}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(tag)}
          >
            {t(PARAGRAPH_STYLE_LABEL_KEYS[tag])}
          </button>
        ))}
        {showCustom ? <div role="separator" className={toolbarStyles.menuSeparator} /> : null}
        {showCustom && customStylesLoading ? <CustomSectionSpinner /> : null}
        {showCustom && !customStylesLoading
          ? customStyles.map((item) => (
              <button
                key={item.id}
                type="button"
                className={toolbarStyles.menuItem}
                role="menuitem"
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelectCustom?.(item.id)}
              >
                {item.name}
              </button>
            ))
          : null}
        {showAddNew ? (
          <>
            {showCustom && (customStylesLoading || customStyles.length > 0) ? (
              <div role="separator" className={toolbarStyles.menuSeparator} />
            ) : null}
            <button
              type="button"
              className={toolbarStyles.menuItem}
              role="menuitem"
              aria-label={t('styleAddNewAria')}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onAddNew?.()}
            >
              <PlusIcon className={toolbarStyles.icon} />
              {t('styleAddNew')}
            </button>
          </>
        ) : null}
      </>
    )
  }

  return (
    <ul
      ref={listRef}
      className={styles.list}
      role="listbox"
      id={listId}
      style={style}
      aria-label={t('commandParagraphStyleAria')}
      aria-busy={showCustom && customStylesLoading ? true : undefined}
    >
      {PARAGRAPH_STYLE_TAGS.map((tag) => (
        <li key={tag} role="presentation">
          <button
            type="button"
            className={styles.option}
            role="option"
            aria-selected={selected === tag}
            disabled={disabled}
            style={PARAGRAPH_STYLE_PREVIEW[tag]}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(tag)}
          >
            {t(PARAGRAPH_STYLE_LABEL_KEYS[tag])}
          </button>
        </li>
      ))}
      {showCustom && (customStylesLoading || customStyles.length > 0) ? (
        <li role="separator" className={styles.separator} />
      ) : null}
      {showCustom && customStylesLoading ? (
        <li role="presentation">
          <CustomSectionSpinner />
        </li>
      ) : null}
      {showCustom && !customStylesLoading
        ? customStyles.map((item) => (
            <li key={item.id} role="presentation">
              <button
                type="button"
                className={styles.option}
                role="option"
                aria-selected={false}
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelectCustom?.(item.id)}
              >
                {item.name}
              </button>
            </li>
          ))
        : null}
    </ul>
  )
}
