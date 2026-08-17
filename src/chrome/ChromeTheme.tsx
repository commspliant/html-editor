import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './chromeTheme.module.css'

const ChromeThemeContext = createContext(false)

export function ChromeThemeProvider({
  dark,
  children,
}: {
  dark: boolean
  children: ReactNode
}) {
  return <ChromeThemeContext.Provider value={dark}>{children}</ChromeThemeContext.Provider>
}

export function useChromeTheme() {
  return useContext(ChromeThemeContext)
}

export function chromeThemeProps(dark: boolean) {
  return {
    className: styles.chrome,
    'data-wysiwyg-theme': dark ? 'dark' : 'light',
  } as const
}

export function ChromePortal({ children }: { children: ReactNode }) {
  const dark = useChromeTheme()
  const theme = chromeThemeProps(dark)
  return createPortal(
    <div className={theme.className} data-wysiwyg-theme={theme['data-wysiwyg-theme']}>
      {children}
    </div>,
    document.body,
  )
}
