import { extractEditorFragmentFromHtml } from '../../core/documentStyles'
import { readFileText } from './htmlFile'

const HTML_FILE_TYPE = {
  description: 'HTML',
  accept: { 'text/html': ['.html', '.htm'] },
} as const

const DEFAULT_FILENAME = 'document.html'

type SaveFilePickerOptions = {
  suggestedName?: string
  types?: { description: string; accept: Record<string, readonly string[]> }[]
}

type OpenFilePickerOptions = {
  multiple?: boolean
  types?: { description: string; accept: Record<string, readonly string[]> }[]
}

type WritableFileStream = {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
}

type SaveFileHandle = {
  createWritable: () => Promise<WritableFileStream>
}

type OpenFileHandle = {
  getFile: () => Promise<File>
}

type PickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<OpenFileHandle[]>
}

function pickerWindow(): PickerWindow {
  return window
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function pickHtmlFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html,.htm,text/html'
    input.hidden = true

    const finish = (html: string | null) => {
      input.remove()
      resolve(html)
    }

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) {
        finish(null)
        return
      }
      void readFileText(file).then(
        (text) => finish(extractEditorFragmentFromHtml(text)),
        () => finish(null),
      )
    })
    input.addEventListener('cancel', () => finish(null))

    document.body.append(input)
    input.click()
  })
}

export async function saveHtml(
  html: string,
  suggestedName = DEFAULT_FILENAME,
): Promise<void> {
  const showSaveFilePicker = pickerWindow().showSaveFilePicker
  if (typeof showSaveFilePicker === 'function') {
    try {
      const handle = await showSaveFilePicker({
        suggestedName,
        types: [HTML_FILE_TYPE],
      })
      const writable = await handle.createWritable()
      await writable.write(html)
      await writable.close()
    } catch (error) {
      if (isAbortError(error)) return
      throw error
    }
    return
  }

  downloadHtml(html, suggestedName)
}

export async function loadHtml(): Promise<string | null> {
  const showOpenFilePicker = pickerWindow().showOpenFilePicker
  if (typeof showOpenFilePicker === 'function') {
    try {
      const [handle] = await showOpenFilePicker({
        multiple: false,
        types: [HTML_FILE_TYPE],
      })
      const file = await handle.getFile()
      return extractEditorFragmentFromHtml(await readFileText(file))
    } catch (error) {
      if (isAbortError(error)) return null
      throw error
    }
  }

  return pickHtmlFile()
}
