export const DARK_MODE_STORAGE_KEY = 'commspliant-html-editor.darkMode'

export function parseDarkMode(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

export function readDarkModeFromStorage(): boolean | null {
  try {
    const raw = localStorage.getItem(DARK_MODE_STORAGE_KEY)
    if (!raw) return null
    return parseDarkMode(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeDarkModeToStorage(darkMode: boolean): void {
  try {
    localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(darkMode))
  } catch {
    /* ignore quota / private mode */
  }
}
