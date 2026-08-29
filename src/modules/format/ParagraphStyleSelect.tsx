import { useEffect, useId, useRef, useState } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useViewportAnchoredPosition } from '../../hooks/useViewportAnchoredPosition'
import { useT } from '../../i18n/LocaleProvider'
import type { ToolbarWidgetProps } from '../../toolbar/types'
import { Tooltip } from '../../toolbar/Tooltip'
import { ParagraphStyleList, PARAGRAPH_STYLE_LABEL_KEYS } from './ParagraphStyleList'
import styles from './ParagraphStyleSelect.module.css'

export function ParagraphStyleSelect({ commands, queries, disabled }: ToolbarWidgetProps) {
  const t = useT()
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const isDisabled = Boolean(disabled || !queries.isVisualMode())
  const mixed = queries.isParagraphStyleMixed()
  const tag = mixed ? null : queries.getParagraphStyle()
  const label = tag ? t(PARAGRAPH_STYLE_LABEL_KEYS[tag]) : ''
  const customStylesEnabled = queries.customParagraphStylesEnabled()
  const customStyles = customStylesEnabled ? queries.getCustomParagraphStyles() : []
  const customStylesLoading = customStylesEnabled && queries.isCustomParagraphStylesLoading()

  const coords = useViewportAnchoredPosition(open, fieldRef, listRef, {
    matchAnchorWidth: true,
    deps: [customStyles.length, customStylesLoading],
  })

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (wrapRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  const control = (
    <div className={`${styles.wrap} ${styles.wrapToolbar}`} ref={wrapRef}>
      <div className={styles.field} ref={fieldRef}>
        <button
          type="button"
          className={styles.trigger}
          disabled={isDisabled}
          aria-label={t('commandParagraphStyleAria')}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((next) => !next)}
        >
          {label}
        </button>
        <span className={styles.chevron} aria-hidden="true" />
      </div>
      {open
        ? (
      <ChromePortal>

            <ParagraphStyleList
              listRef={listRef}
              listId={listId}
              value={tag}
              mixed={mixed}
              disabled={isDisabled}
              customStylesEnabled={customStylesEnabled}
              customStyles={customStyles}
              customStylesLoading={customStylesLoading}
              style={{ top: coords.top, left: coords.left, minWidth: coords.width }}
              onSelect={(next) => {
                commands.setParagraphStyle(next)
                setOpen(false)
              }}
              onSelectCustom={(id) => {
                commands.applyCustomParagraphStyle(id)
                setOpen(false)
              }}
            />
      </ChromePortal>
    )
        : null}
    </div>
  )

  return <Tooltip label={t('commandParagraphStyle')}>{control}</Tooltip>
}

export function ParagraphStyleMenuPanel({
  commands,
  queries,
  disabled,
  onMenuClose,
}: ToolbarWidgetProps) {
  const unavailable = Boolean(disabled || !queries.isVisualMode())
  const mixed = queries.isParagraphStyleMixed()
  const tag = mixed ? null : queries.getParagraphStyle()
  const customStylesEnabled = queries.customParagraphStylesEnabled()
  const customStyles = customStylesEnabled ? queries.getCustomParagraphStyles() : []
  const customStylesLoading = customStylesEnabled && queries.isCustomParagraphStylesLoading()
  return (
    <ParagraphStyleList
      menu
      value={tag}
      mixed={mixed}
      disabled={unavailable}
      customStylesEnabled={customStylesEnabled}
      customStyles={customStyles}
      customStylesLoading={customStylesLoading}
      onSelect={(next) => {
        commands.setParagraphStyle(next)
        onMenuClose?.()
      }}
      onSelectCustom={(id) => {
        commands.openCustomParagraphStyleDialog(id)
        onMenuClose?.()
      }}
      onAddNew={() => {
        commands.openCustomParagraphStyleDialog()
        onMenuClose?.()
      }}
    />
  )
}
