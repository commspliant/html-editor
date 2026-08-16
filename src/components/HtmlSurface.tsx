import { forwardRef } from 'react'
import { useT } from '../i18n/LocaleProvider'
import styles from './Editor.module.css'

type HtmlSurfaceProps = {
  html: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

export const HtmlSurface = forwardRef<HTMLTextAreaElement, HtmlSurfaceProps>(
  function HtmlSurface({ html, onChange, placeholder, disabled }, ref) {
    const t = useT()

    return (
      <textarea
        ref={ref}
        className={`${styles.surface} ${styles.html}`}
        value={html}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={t('htmlEditorAria')}
        spellCheck={false}
      />
    )
  },
)
