import { useId, useRef } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import { CloseIcon } from '../../icons'
import { useT } from '../../i18n/LocaleProvider'
import { EDITOR_VERSION } from './version'
import styles from './AboutDialog.module.css'

export type AboutDialogProps = {
  open: boolean
  onClose: () => void
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    escapeIgnoreSelectors: false,
    focusableSelector: 'a[href], button:not([disabled]):not([tabindex="-1"])',
  })

  if (!open) return null

  return (
    <ChromePortal>
      <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
        <div
          ref={dialogRef}
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={styles.headerRow}>
            <h2 id={titleId} className={styles.header}>
              {t('aboutDialogTitle')}
            </h2>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label={t('aboutDialogCloseAria')}
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.body}>
            <p className={styles.product}>{t('brandMarkAria')}</p>
            <p className={styles.meta}>
              {t('aboutDialogVersion').replace('{version}', EDITOR_VERSION)}
            </p>
            <p className={styles.description}>{t('aboutDialogDescription')}</p>
            <div className={styles.website}>
              <p className={styles.cta}>{t('aboutDialogWebsiteCta')}</p>
              <a
                className={styles.link}
                href="https://commspliant.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('aboutDialogWebsiteAria')}
              >
                {t('aboutDialogWebsite')}
              </a>
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.action} onClick={onClose}>
              {t('aboutDialogClose')}
            </button>
          </div>
        </div>
      </div>
    </ChromePortal>
  )
}
