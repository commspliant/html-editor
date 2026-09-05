import { useId, useRef } from 'react'
import { ChromePortal } from '../../chrome/ChromeTheme'
import {
  formatCapabilityViolationLocation,
  formatCapabilityViolationMessage,
  interpolateMessageParams,
} from '../../capabilities/formatViolation'
import type { CapabilityValidationResult, CapabilityViolation } from '../../capabilities/types'
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap'
import { CloseIcon } from '../../icons'
import { useLocale, useT } from '../../i18n/LocaleProvider'
import styles from './CompatibilityPanel.module.css'

export type CompatibilityPanelProps = {
  open: boolean
  result: CapabilityValidationResult | null
  onClose: () => void
}

function ViolationRow({ violation }: { violation: CapabilityViolation }) {
  const locale = useLocale()
  const message = formatCapabilityViolationMessage(violation, locale)
  const location = formatCapabilityViolationLocation(violation, locale)

  return (
    <li className={`${styles.violation} ${styles[`severity_${violation.severity}`]}`}>
      <span className={styles.violationMessage}>{message}</span>
      {location ? <span className={styles.violationLocation}>{location}</span> : null}
    </li>
  )
}

export function CompatibilityPanel({ open, result, onClose }: CompatibilityPanelProps) {
  const t = useT()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useDialogFocusTrap(dialogRef, {
    open,
    onClose,
    focusableSelector:
      'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled])',
  })

  if (!open) return null

  const violations = result?.violations ?? []
  const errors = violations.filter((item) => item.severity === 'error')
  const warnings = violations.filter((item) => item.severity === 'warning')

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
            <h2 className={styles.header} id={titleId}>
              {t('capabilitiesPanelTitle')}
            </h2>
            <button
              type="button"
              className={styles.close}
              aria-label={t('capabilitiesPanelCloseAria')}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          {violations.length === 0 ? (
            <p className={styles.empty}>{t('capabilitiesPanelEmpty')}</p>
          ) : (
            <div className={styles.body}>
              <p className={styles.summary}>
                {interpolateMessageParams(t('capabilitiesPanelSummary'), {
                  errors: String(result?.errorCount ?? 0),
                  warnings: String(result?.warningCount ?? 0),
                })}
              </p>
              {errors.length > 0 ? (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t('capabilitiesPanelErrors')}</h3>
                  <ul className={styles.list}>
                    {errors.map((violation, index) => (
                      <ViolationRow key={`error-${index}`} violation={violation} />
                    ))}
                  </ul>
                </section>
              ) : null}
              {warnings.length > 0 ? (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t('capabilitiesPanelWarnings')}</h3>
                  <ul className={styles.list}>
                    {warnings.map((violation, index) => (
                      <ViolationRow key={`warning-${index}`} violation={violation} />
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </ChromePortal>
  )
}
