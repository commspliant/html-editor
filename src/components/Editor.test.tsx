import { act, createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useState } from 'react'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { loadHtml, saveHtml } from '../modules/file/fileDialogs'
import { printHtml } from '../modules/file/printHtml'
import { TOOLTIP_HOVER_DELAY_MS } from '../toolbar/Tooltip'
import type { CustomAction, CustomActionApi, CustomImageInsert, CustomParagraphStyle, EditorMode, ToolbarCustomization } from '../types'
import { TOOLBAR_CUSTOMIZATION_STORAGE_KEY } from '../toolbar/toolbarCustomization'
import { DARK_MODE_STORAGE_KEY } from '../modules/view/darkModePersistence'
import { PAGE_ZOOM_STORAGE_KEY } from '../modules/view/pageZoomPersistence'
import { TOOLBAR_POSITION_STORAGE_KEY } from '../modules/view/toolbarPositionPersistence'
import { Editor } from './Editor'
import styles from './Editor.module.css'

vi.mock('../modules/file/fileDialogs', () => ({
  saveHtml: vi.fn(async () => undefined),
  loadHtml: vi.fn(async () => null),
}))

vi.mock('../modules/file/printHtml', () => ({
  printHtml: vi.fn(),
}))

async function flushSelectionRefresh(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  })
}

async function selectVisualText(visual: HTMLElement, start: number, end: number): Promise<void> {
  const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT)
  let startNode: Text | null = null
  let endNode: Text | null = null
  let startOffset = 0
  let endOffset = 0
  let remainingStart = start
  let remainingEnd = end
  let current: Node | null
  while ((current = walker.nextNode())) {
    const text = current as Text
    const len = text.data.length
    if (!startNode && remainingStart <= len) {
      startNode = text
      startOffset = remainingStart
    }
    if (!startNode) remainingStart -= len
    if (!endNode && remainingEnd <= len) {
      endNode = text
      endOffset = remainingEnd
      break
    }
    remainingEnd -= len
  }
  if (!startNode || !endNode) throw new Error('expected text nodes')
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
  await flushSelectionRefresh()
}

describe('Editor', () => {
  it('defaults to visual mode with a contenteditable surface', () => {
    render(<Editor />)

    expect(screen.getByRole('button', { name: 'Switch to visual mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toHaveAttribute(
      'contenteditable',
      'true',
    )
  })

  it('locks both surfaces and chrome when readOnly', () => {
    render(<Editor defaultValue="<p>Hello</p>" readOnly />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).toHaveAttribute('contenteditable', 'false')
    expect(visual).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'File menu' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Switch to visual mode' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Switch to HTML mode' })).toBeDisabled()
  })

  it('disables the HTML surface when readOnly', () => {
    render(<Editor defaultValue="<p>Hello</p>" defaultMode="html" readOnly />)

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toBeDisabled()
  })

  it('loads customFonts stylesheets into the document head', () => {
    const href = 'https://example.com/roboto.css'
    const { unmount } = render(
      <Editor
        customFonts={[{ name: 'Roboto', family: 'Roboto, sans-serif', css: href }]}
      />,
    )
    expect(document.head.querySelector(`link[data-wysiwyg-font][href="${href}"]`)).not.toBeNull()
    unmount()
    expect(document.head.querySelector(`link[data-wysiwyg-font][href="${href}"]`)).toBeNull()
  })

  it('prepends used custom font css to exported html', () => {
    const onChange = vi.fn()
    const href = 'https://example.com/pacifico.css'
    render(
      <Editor
        customFonts={[{ name: 'Pacifico', family: 'Pacifico, cursive', css: href }]}
        onChange={onChange}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p><span style="font-family: Pacifico, cursive">Hello</span></p>'
    fireEvent.input(visual)

    expect(onChange).toHaveBeenCalled()
    const html = onChange.mock.calls.at(-1)?.[0] as string
    expect(html).toContain(href)
    expect(html).toContain('data-wysiwyg-font')
    expect(html).toContain('Pacifico')
  })

  it('toggles to HTML mode and shows the same markup in a textarea', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>Hello</p>')

    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(screen.getByRole('button', { name: 'Switch to HTML mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<p>Hello</p>')
  })

  it('renders HTML edits in visual mode after switching', async () => {
    const user = userEvent.setup()
    render(<Editor defaultMode="html" />)

    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<p>Hello</p>' },
    })
    await user.click(screen.getByRole('button', { name: 'Switch to visual mode' }))

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>Hello</p>')
  })

  it('serializes visual edits into the HTML textarea after switching', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<strong>Bold</strong>'
    fireEvent.input(visual)
    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<strong>Bold</strong>')
  })

  it('respects a controlled mode prop', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    const { rerender } = render(<Editor mode="visual" onModeChange={onModeChange} />)

    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(onModeChange).toHaveBeenCalledWith('html')
    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toBeInTheDocument()

    rerender(<Editor mode="html" onModeChange={onModeChange} />)

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toBeInTheDocument()
  })

  it('respects a controlled value prop', () => {
    const { rerender } = render(<Editor value="<p>One</p>" />)

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>One</p>')

    rerender(<Editor value="<p>Two</p>" />)

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>Two</p>')
  })

  it('renders Spanish chrome when locale is es', () => {
    render(<Editor locale="es" />)

    expect(screen.getByRole('button', { name: 'Menú Vista' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menú Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cambiar al modo visual' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Editor visual' })).toBeInTheDocument()
  })

  it('toggles mode from the View menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'HTML' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<p>Hello</p>')
  })

  it('notifies onChange when the HTML surface is edited', () => {
    const onChange = vi.fn()
    render(<Editor defaultMode="html" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<em>Hi</em>' },
    })

    expect(onChange).toHaveBeenCalledWith('<em>Hi</em>')
  })

  it('applies toolbarBackground as a CSS custom property on the root', () => {
    const { container } = render(<Editor toolbarBackground="#ddeeff" />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--wysiwyg-toolbar-background')).toBe('#ddeeff')
  })

  it('uses the default toolbar background when the prop is omitted', () => {
    const { container } = render(<Editor />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--wysiwyg-toolbar-background')).toBe('')
  })

  it('applies menu formatting as CSS custom properties on the root', () => {
    const { container } = render(
      <Editor
        menuColor="#1e3a5f"
        menuBackground="#fef3c7"
        menuFontSize="1.125rem"
        menuFontFamily="Georgia, serif"
      />,
    )
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--wysiwyg-menu-color')).toBe('#1e3a5f')
    expect(root.style.getPropertyValue('--wysiwyg-menu-background')).toBe('#fef3c7')
    expect(root.style.getPropertyValue('--wysiwyg-menu-font-size')).toBe('1.125rem')
    expect(root.style.getPropertyValue('--wysiwyg-menu-font-family')).toBe('Georgia, serif')
  })

  it('leaves menu formatting vars unset when those props are omitted', () => {
    const { container } = render(<Editor />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--wysiwyg-menu-color')).toBe('')
    expect(root.style.getPropertyValue('--wysiwyg-menu-background')).toBe('')
    expect(root.style.getPropertyValue('--wysiwyg-menu-font-size')).toBe('')
    expect(root.style.getPropertyValue('--wysiwyg-menu-font-family')).toBe('')
  })

  it('applies border none as CSS custom properties on the root', () => {
    const { container } = render(<Editor border="none" />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--wysiwyg-border-width')).toBe('0')
    expect(root.style.getPropertyValue('--wysiwyg-border-radius')).toBe('0')
    expect(root.style.getPropertyValue('--wysiwyg-border-shadow')).toBe('none')
    expect(root.style.getPropertyValue('--wysiwyg-border-color')).toBe('')
  })

  it('applies a partial border object as CSS custom properties on the root', () => {
    const { container } = render(
      <Editor border={{ radius: '12px', shadow: '0 8px 24px rgb(0 0 0 / 15%)' }} />,
    )
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--wysiwyg-border-radius')).toBe('12px')
    expect(root.style.getPropertyValue('--wysiwyg-border-shadow')).toBe('0 8px 24px rgb(0 0 0 / 15%)')
    expect(root.style.getPropertyValue('--wysiwyg-border-width')).toBe('')
    expect(root.style.getPropertyValue('--wysiwyg-border-color')).toBe('')
  })

  it('leaves border vars unset when the border prop is omitted', () => {
    const { container } = render(<Editor />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--wysiwyg-border-width')).toBe('')
    expect(root.style.getPropertyValue('--wysiwyg-border-color')).toBe('')
    expect(root.style.getPropertyValue('--wysiwyg-border-radius')).toBe('')
    expect(root.style.getPropertyValue('--wysiwyg-border-shadow')).toBe('')
  })

  it('shows the menu bar and icon toolbar when visibility props are omitted', () => {
    render(<Editor />)

    expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Formatting toolbar' })).toBeInTheDocument()
  })

  it('hides the menu bar when menuVisible is false', () => {
    render(<Editor menuVisible={false} />)

    expect(screen.queryByRole('button', { name: 'File menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Formatting toolbar' })).toBeInTheDocument()
  })

  it('hides the icon toolbar when toolbarVisible is false', () => {
    render(<Editor toolbarVisible={false} />)

    expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Formatting toolbar' })).not.toBeInTheDocument()
  })

  it('hides chrome and keeps the visual surface when both are hidden', () => {
    render(<Editor menuVisible={false} toolbarVisible={false} />)

    expect(screen.queryByRole('button', { name: 'File menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Formatting toolbar' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toBeInTheDocument()
  })
})

describe('Editor fullscreen', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('covers the page from the toolbar toggle and shows an exit control', async () => {
    const user = userEvent.setup()
    const { container, unmount } = render(<Editor />)
    const root = container.firstElementChild as HTMLElement

    expect(root).not.toHaveAttribute('data-fullscreen')
    expect(screen.queryByRole('button', { name: 'Exit full screen' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Toggle full screen' }))

    expect(root).toHaveAttribute('data-fullscreen')
    expect(screen.getByRole('button', { name: 'Toggle full screen' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('exits from the overlay close button', async () => {
    const user = userEvent.setup()
    const { container } = render(<Editor defaultFullscreen />)
    const root = container.firstElementChild as HTMLElement

    expect(root).toHaveAttribute('data-fullscreen')

    await user.click(screen.getByRole('button', { name: 'Exit full screen' }))

    expect(root).not.toHaveAttribute('data-fullscreen')
    expect(screen.queryByRole('button', { name: 'Exit full screen' })).not.toBeInTheDocument()
  })

  it('exits on Escape', async () => {
    const user = userEvent.setup()
    const { container } = render(<Editor defaultFullscreen />)

    await user.keyboard('{Escape}')

    expect(container.firstElementChild).not.toHaveAttribute('data-fullscreen')
  })

  it('closes an open menu on the first Escape and leaves fullscreen on the second', async () => {
    const user = userEvent.setup()
    const { container } = render(<Editor defaultFullscreen />)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute('data-fullscreen')

    await user.keyboard('{Escape}')

    expect(container.firstElementChild).not.toHaveAttribute('data-fullscreen')
  })

  it('enters fullscreen from the View menu', async () => {
    const user = userEvent.setup()
    const { container } = render(<Editor />)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Full screen' }))

    expect(container.firstElementChild).toHaveAttribute('data-fullscreen')
  })

  it('keeps visual and HTML mode independent of fullscreen', async () => {
    const user = userEvent.setup()
    render(<Editor defaultFullscreen defaultValue="<p>Hello</p>" />)

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<p>Hello</p>')
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument()
  })

  it('shows the exit control when chrome is hidden', () => {
    render(<Editor defaultFullscreen menuVisible={false} toolbarVisible={false} />)

    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toBeInTheDocument()
  })

  it('respects a controlled fullscreen prop', async () => {
    const user = userEvent.setup()
    const onFullscreenChange = vi.fn()
    const { container, rerender } = render(
      <Editor fullscreen={false} onFullscreenChange={onFullscreenChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Toggle full screen' }))

    expect(onFullscreenChange).toHaveBeenCalledWith(true)
    expect(container.firstElementChild).not.toHaveAttribute('data-fullscreen')

    rerender(<Editor fullscreen onFullscreenChange={onFullscreenChange} />)

    expect(container.firstElementChild).toHaveAttribute('data-fullscreen')
  })
})

describe('Editor document preview', () => {
  it('opens a scrollable preview of the current document from the toolbar', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Preview me</p>" />)

    await user.click(screen.getByRole('button', { name: 'Preview document' }))

    expect(screen.getByRole('dialog', { name: 'Document preview' })).toBeInTheDocument()
    const frame = screen.getByTitle('Document preview') as HTMLIFrameElement
    await waitFor(() => {
      expect(frame.contentDocument?.body.innerHTML).toContain('Preview me')
    })
  })

  it('opens the preview from the View menu and closes from Close', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Menu preview</p>" />)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Preview' }))

    expect(screen.getByRole('dialog', { name: 'Document preview' })).toBeInTheDocument()
    const closeButtons = screen.getAllByRole('button', { name: 'Close' })
    await user.click(closeButtons[closeButtons.length - 1])

    expect(screen.queryByRole('dialog', { name: 'Document preview' })).not.toBeInTheDocument()
  })
})

describe('Editor read aloud', () => {
  let speaking = false
  let lastUtterance: { text: string } | null = null
  const cancel = vi.fn(() => {
    speaking = false
  })
  const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
    lastUtterance = utterance
    speaking = true
  })

  beforeEach(() => {
    speaking = false
    lastUtterance = null
    cancel.mockClear()
    speak.mockClear()
    class MockSpeechSynthesisUtterance {
      text: string

      constructor(text: string) {
        this.text = text
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance)
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        get speaking() {
          return speaking
        },
        speak,
        cancel,
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(window, 'speechSynthesis')
  })

  it('reads the document from the toolbar and cancels on a second click', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Read me aloud</p>" />)

    await user.click(screen.getByRole('button', { name: 'Read selection or document aloud' }))

    expect(speak).toHaveBeenCalledTimes(1)
    expect(lastUtterance?.text).toBe('Read me aloud')

    await user.click(screen.getByRole('button', { name: 'Read selection or document aloud' }))

    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('reads from the View menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Menu read aloud</p>" />)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Read aloud' }))

    expect(speak).toHaveBeenCalledTimes(1)
    expect(lastUtterance?.text).toBe('Menu read aloud')
  })
})

describe('Editor controlled harness', () => {
  it('lets a parent drive mode through onModeChange', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [mode, setMode] = useState<EditorMode>('visual')
      return <Editor mode={mode} onModeChange={setMode} />
    }

    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toBeInTheDocument()
  })

  it('lets a parent drive fullscreen through onFullscreenChange', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [fullscreen, setFullscreen] = useState(false)
      return <Editor fullscreen={fullscreen} onFullscreenChange={setFullscreen} />
    }

    const { container } = render(<Harness />)
    expect(container.firstElementChild).not.toHaveAttribute('data-fullscreen')

    await user.click(screen.getByRole('button', { name: 'Toggle full screen' }))

    expect(container.firstElementChild).toHaveAttribute('data-fullscreen')
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument()
  })
})

describe('Editor file commands', () => {
  it('flushes visual markup before save', async () => {
    const user = userEvent.setup()
    vi.mocked(saveHtml).mockClear()
    render(<Editor defaultValue="<p>Old</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>New</p>'
    await user.click(screen.getByRole('button', { name: 'Save as HTML file' }))

    expect(saveHtml).toHaveBeenCalledWith('<p>New</p>')
  })

  it('saves the html surface contents in html mode', async () => {
    const user = userEvent.setup()
    vi.mocked(saveHtml).mockClear()
    render(<Editor defaultMode="html" defaultValue="<p>Source</p>" />)

    await user.click(screen.getByRole('button', { name: 'Save as HTML file' }))

    expect(saveHtml).toHaveBeenCalledWith('<p>Source</p>')
  })

  it('replaces the document when open returns html', async () => {
    const user = userEvent.setup()
    vi.mocked(loadHtml).mockResolvedValueOnce('<p>From file</p>')
    render(<Editor defaultValue="<p>Old</p>" />)

    await user.click(screen.getByRole('button', { name: 'Open HTML file' }))

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>From file</p>')
  })

  it('calls onSave instead of saveHtml when set', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(async () => undefined)
    vi.mocked(saveHtml).mockClear()
    render(<Editor defaultValue="<p>Host save</p>" onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'Save as HTML file' }))

    expect(onSave).toHaveBeenCalledWith('<p>Host save</p>')
    expect(saveHtml).not.toHaveBeenCalled()
  })

  it('calls onOpen instead of loadHtml when set', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn(async () => '<p>From host</p>')
    vi.mocked(loadHtml).mockClear()
    render(<Editor defaultValue="<p>Old</p>" onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'Open HTML file' }))

    expect(onOpen).toHaveBeenCalled()
    expect(loadHtml).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>From host</p>')
  })
})

function fileDataTransfer(files: File[]) {
  return {
    files,
    types: files.length ? ['Files'] : [],
    items: files.map((file) => ({
      kind: 'file' as const,
      type: file.type,
      getAsFile: () => file,
    })),
    dropEffect: 'none',
    effectAllowed: 'all',
  }
}

function workspaceOf(name: 'Visual editor' | 'HTML editor') {
  const surface = screen.getByRole('textbox', { name })
  const workspace = surface.parentElement
  if (!workspace) throw new Error('expected editor workspace')
  return workspace
}

describe('Editor html file drop', () => {
  it('replaces the visual document when an html file is dropped', async () => {
    render(<Editor defaultValue="<p>Old</p>" />)
    const file = new File(['<p>From drop</p>'], 'doc.html', { type: 'text/html' })

    fireEvent.drop(workspaceOf('Visual editor'), { dataTransfer: fileDataTransfer([file]) })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>From drop</p>')
    })
  })

  it('replaces the html surface when an html file is dropped', async () => {
    render(<Editor defaultMode="html" defaultValue="<p>Old</p>" />)
    const file = new File(['<p>From drop</p>'], 'notes.htm', { type: '' })

    fireEvent.drop(workspaceOf('HTML editor'), { dataTransfer: fileDataTransfer([file]) })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<p>From drop</p>')
    })
  })

  it('ignores a dropped non-html file', async () => {
    render(<Editor defaultValue="<p>Old</p>" />)
    const file = new File(['png'], 'photo.png', { type: 'image/png' })

    fireEvent.drop(workspaceOf('Visual editor'), { dataTransfer: fileDataTransfer([file]) })

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>Old</p>')
  })

  it('does not replace when disableHtmlFileDrop is set', async () => {
    render(<Editor defaultValue="<p>Old</p>" disableHtmlFileDrop />)
    const file = new File(['<p>From drop</p>'], 'doc.html', { type: 'text/html' })

    fireEvent.drop(workspaceOf('Visual editor'), { dataTransfer: fileDataTransfer([file]) })

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>Old</p>')
  })

  it('does not replace when readOnly', async () => {
    render(<Editor defaultValue="<p>Old</p>" readOnly />)
    const file = new File(['<p>From drop</p>'], 'doc.html', { type: 'text/html' })

    fireEvent.drop(workspaceOf('Visual editor'), { dataTransfer: fileDataTransfer([file]) })

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>Old</p>')
  })

  it('runs transformHtml on dropped html', async () => {
    render(
      <Editor
        defaultValue="<p>Old</p>"
        transformHtml={(html) => html.replace(/dirty/g, 'clean')}
      />,
    )
    const file = new File(['<p>dirty</p>'], 'doc.html', { type: 'text/html' })

    fireEvent.drop(workspaceOf('Visual editor'), { dataTransfer: fileDataTransfer([file]) })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>clean</p>')
    })
  })

  it('shows a drop overlay while a file is dragged over the workspace', () => {
    render(<Editor defaultValue="<p>Old</p>" />)
    const file = new File(['<p>From drop</p>'], 'doc.html', { type: 'text/html' })

    fireEvent.dragEnter(workspaceOf('Visual editor'), { dataTransfer: fileDataTransfer([file]) })

    expect(screen.getByText('Drop HTML file to open')).toBeInTheDocument()
  })
})

describe('Editor history', () => {
  it('starts with undo and redo disabled', () => {
    render(<Editor />)

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit menu' })).toBeEnabled()
  })

  it('undoes and redoes visual edits', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Start</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>Typed</p>'
    fireEvent.input(visual)

    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(visual).toContainHTML('<p>Start</p>')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Redo' }))

    expect(visual).toContainHTML('<p>Typed</p>')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })

  it('clears redo after a new edit', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Start</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>Typed</p>'
    fireEvent.input(visual)
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    visual.innerHTML = '<p>Other</p>'
    fireEvent.input(visual)

    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(visual).toContainHTML('<p>Start</p>')
  })

  it('undoes from the Edit menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Start</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>Typed</p>'
    fireEvent.input(visual)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Undo' }))

    expect(visual).toContainHTML('<p>Start</p>')
  })

  it('undoes html-mode edits', async () => {
    const user = userEvent.setup()
    render(<Editor defaultMode="html" defaultValue="<p>Start</p>" />)

    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<p>Typed</p>' },
    })

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<p>Start</p>')
  })

  it('undoes a loaded document', async () => {
    const user = userEvent.setup()
    vi.mocked(loadHtml).mockResolvedValueOnce('<p>From file</p>')
    render(<Editor defaultValue="<p>Old</p>" />)

    await user.click(screen.getByRole('button', { name: 'Open HTML file' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>Old</p>')
  })

  it('handles Ctrl+Z and Ctrl+Shift+Z', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Start</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>Typed</p>'
    fireEvent.input(visual)
    visual.focus()

    await user.keyboard('{Control>}z{/Control}')
    expect(visual).toContainHTML('<p>Start</p>')

    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    expect(visual).toContainHTML('<p>Typed</p>')
  })

  it('prints the document on Ctrl+P', async () => {
    const user = userEvent.setup()
    vi.mocked(printHtml).mockClear()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.focus()

    await user.keyboard('{Control>}p{/Control}')

    expect(printHtml).toHaveBeenCalledWith('<p>Hello</p>')
  })

  it('inserts a page break on Ctrl+Enter', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>HelloWorld</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.focus()
    await selectVisualText(visual, 5, 5)

    await user.keyboard('{Control>}{Enter}{/Control}')

    const pageBreak = visual.querySelector('div')
    expect(pageBreak).not.toBeNull()
    expect(pageBreak?.style.breakAfter).toBe('page')
    expect(pageBreak?.style.pageBreakAfter).toBe('always')
    expect(visual.querySelectorAll('p')).toHaveLength(2)
    expect(visual.querySelectorAll('p')[0]?.textContent).toBe('Hello')
    expect(visual.querySelectorAll('p')[1]?.textContent).toBe('World')
  })
})

describe('Editor font marks', () => {
  it('applies bold from the toolbar as an inline style', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Bold' }))

    expect(visual).toContainHTML('font-weight')
    expect(visual.querySelector('span')).toHaveStyle({ fontWeight: '700' })
  })

  it('applies italic with Ctrl+I', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.focus()
    await selectVisualText(visual, 0, 5)
    await user.keyboard('{Control>}i{/Control}')

    expect(visual.querySelector('span')).toHaveStyle({ fontStyle: 'italic' })
  })

  it('reports strong as bold in the toolbar', async () => {
    render(<Editor defaultValue="<p><strong>Bold</strong></p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 4)

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('copies inline formatting with the format brush and applies it to another selection', async () => {
    const user = userEvent.setup()
    render(
      <Editor defaultValue='<p><span style="font-weight: 700; color: #ff0000;">Source</span></p><p>Target</p>' />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const brush = screen.getByRole('button', { name: 'Copy formatting' })

    await act(async () => {
      await selectVisualText(visual, 0, 6)
    })
    await user.click(brush)
    expect(brush).toHaveAttribute('aria-pressed', 'true')

    await act(async () => {
      await selectVisualText(visual, 6, 12)
    })
    fireEvent.mouseUp(visual)

    expect(brush).toHaveAttribute('aria-pressed', 'false')
    expect(visual.innerHTML).toContain('font-weight: 700')
    expect(visual.innerHTML).toContain('#ff0000')
  })

  it('cancels the format brush when clicked again while active', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue='<p><span style="font-weight: 700;">Source</span></p>' />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const brush = screen.getByRole('button', { name: 'Copy formatting' })

    await act(async () => {
      await selectVisualText(visual, 0, 6)
    })
    await user.click(brush)
    expect(brush).toHaveAttribute('aria-pressed', 'true')

    await user.click(brush)
    expect(brush).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not arm the format brush without a text selection', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const brush = screen.getByRole('button', { name: 'Copy formatting' })

    await act(async () => {
      await selectVisualText(visual, 2, 2)
    })
    await user.click(brush)

    expect(brush).toHaveAttribute('aria-pressed', 'false')
  })

  it('disables font commands in HTML mode', async () => {
    const user = userEvent.setup()
    render(<Editor defaultMode="html" defaultValue="<p>Hello</p>" />)

    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Font color' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Highlight color' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Bold' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Font size' })).toBeDisabled()
  })

  it('applies font size from the toolbar as an inline style', async () => {
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    fireEvent.click(screen.getByRole('button', { name: 'Font size' }))
    fireEvent.click(screen.getByRole('option', { name: '18' }))

    expect(visual.querySelector('span')).toHaveStyle({ fontSize: '18pt' })
  })

  it('applies font color from the toolbar as an inline style', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Font color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))

    expect(visual.querySelector('span')).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('applies highlight color from the toolbar as an inline style', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Highlight color' }))
    await user.click(screen.getByRole('option', { name: '#ffff00' }))

    expect(visual.querySelector('span')).toHaveStyle({ backgroundColor: 'rgb(255, 255, 0)' })
  })

  function typeIntoVisual(visual: HTMLElement, text: string) {
    visual.dispatchEvent(
      new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }),
    )
  }

  it('applies a pending font family to the next typed character at a caret', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)
    await user.click(screen.getByRole('button', { name: 'Font family' }))
    await user.click(screen.getByRole('option', { name: 'Georgia' }))

    act(() => {
      typeIntoVisual(visual, 'x')
    })

    const span = visual.querySelector('span')
    expect(span).toHaveStyle({ fontFamily: 'Georgia, serif' })
    expect(span).toHaveTextContent('x')
    expect(span?.contains(window.getSelection()?.anchorNode ?? null)).toBe(true)
  })

  it('applies a pending font size to the next typed character at a caret', async () => {
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)
    fireEvent.click(screen.getByRole('button', { name: 'Font size' }))
    fireEvent.click(screen.getByRole('option', { name: '18' }))

    act(() => {
      typeIntoVisual(visual, 'x')
    })

    const span = visual.querySelector('span')
    expect(span).toHaveStyle({ fontSize: '18pt' })
    expect(span).toHaveTextContent('x')
    expect(span?.contains(window.getSelection()?.anchorNode ?? null)).toBe(true)
  })

  it('applies a pending font color to the next typed character at a caret', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)
    await user.click(screen.getByRole('button', { name: 'Font color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))

    act(() => {
      typeIntoVisual(visual, 'x')
    })

    const span = visual.querySelector('span')
    expect(span).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    expect(span).toHaveTextContent('x')
    expect(span?.contains(window.getSelection()?.anchorNode ?? null)).toBe(true)
  })

  it('applies pending bold to the next typed character at a caret', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)
    await user.click(screen.getByRole('button', { name: 'Bold' }))

    act(() => {
      typeIntoVisual(visual, 'x')
    })

    const span = visual.querySelector('span')
    expect(span).toHaveStyle({ fontWeight: '700' })
    expect(span).toHaveTextContent('x')
    expect(span?.contains(window.getSelection()?.anchorNode ?? null)).toBe(true)
  })

  it('opens the font properties dialog from the Fonts menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Font properties…' }))

    expect(screen.getByRole('dialog', { name: 'Font properties' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
  })

  it('applies bold from the font properties dialog on OK', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Font properties…' }))
    await user.click(screen.getByRole('checkbox', { name: 'Bold' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(visual.querySelector('span')).toHaveStyle({ fontWeight: '700' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('applies font color from the font properties dialog on OK', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Fonts submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Font properties…' }))

    const dialog = screen.getByRole('dialog', { name: 'Font properties' })
    await user.click(within(dialog).getByRole('button', { name: 'Font color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    await user.click(within(dialog).getByRole('button', { name: 'OK' }))

    expect(visual.querySelector('span')).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })
})

describe('Editor insert chrome', () => {
  it('wraps a selection in a link from the dialog', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Link' }))

    const dialog = screen.getByRole('dialog', { name: 'Insert link' })
    expect(within(dialog).getByRole('tab', { name: 'Link' })).toHaveAttribute('aria-selected', 'true')
    await user.type(within(dialog).getByLabelText('URL'), 'https://example.com')
    await user.click(within(dialog).getByRole('button', { name: 'OK' }))

    const anchor = visual.querySelector('a')
    expect(anchor?.getAttribute('href')).toBe('https://example.com')
    expect(anchor?.textContent).toBe('Hello')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('inserts a bookmark at the caret', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Bookmark' }))
    const dialog = screen.getByRole('dialog', { name: 'Insert bookmark' })
    await user.type(within(dialog).getByLabelText('Bookmark name'), 'end')
    await user.click(within(dialog).getByRole('button', { name: 'OK' }))

    expect(visual.querySelector('a#end')).not.toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a third image source when customImagePicker is set', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <Editor
        defaultValue="<p>Hello</p>"
        customImagePicker={{
          text: 'Gallery',
          description: 'Choose from the media library',
          buttonCaption: 'Open gallery',
          onPick,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Insert image' }))
    const dialog = screen.getByRole('dialog', { name: 'Insert image' })
    expect(within(dialog).getByRole('radio', { name: 'File' })).toBeInTheDocument()
    expect(within(dialog).getByRole('radio', { name: 'Image URL' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('radio', { name: 'Gallery' }))
    expect(within(dialog).getByText('Choose from the media library')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Open gallery' }))

    expect(onPick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: 'Insert image' })).not.toBeInTheDocument()
  })

  it('skips the image dialog and inserts from the host picker when builtin insert is disabled', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn<(insertImage: (image: CustomImageInsert) => void) => void>()
    render(
      <Editor
        defaultValue="<p>Hello</p>"
        disableBuiltinImageInsert
        customImagePicker={{
          text: 'Gallery',
          description: 'Choose from the media library',
          buttonCaption: 'Open gallery',
          onPick,
        }}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Insert image' }))
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: 'Insert image' })).not.toBeInTheDocument()

    onPick.mock.calls[0][0]({
      src: 'https://example.com/a.png',
      alt: 'Chart',
      title: 'Q1',
      css: 'width: 80px',
    })

    const img = visual.querySelector('img')
    expect(img?.getAttribute('src')).toBe('https://example.com/a.png')
    expect(img?.getAttribute('alt')).toBe('Chart')
    expect(img?.getAttribute('title')).toBe('Q1')
    expect(img?.style.width).toBe('80px')
  })
})

describe('Editor paragraph chrome', () => {
  it('applies text-align from the toolbar as an inline style', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Align center' }))

    expect(visual.querySelector('p')).toHaveStyle({ textAlign: 'center' })
    expect(screen.getByRole('button', { name: 'Align center' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('wraps the selection in a bullet list', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Bullet list' }))

    expect(visual.querySelector('ul li')?.textContent).toBe('Hello')
    expect(screen.getByRole('button', { name: 'Bullet list' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('wraps the selection in a numbered list', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Numbered list' }))

    expect(visual.querySelector('ol li')?.textContent).toBe('Hello')
  })

  it('indents a paragraph with an inline margin', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Increase indent' }))

    expect(visual.querySelector('p')).toHaveStyle({ marginLeft: '40px' })
    expect(screen.getByRole('button', { name: 'Decrease indent' })).toBeEnabled()
  })

  it('opens the paragraph properties dialog from the Paragraph menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Paragraph properties…' }))

    expect(screen.getByRole('dialog', { name: 'Paragraph properties' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
  })

  it('applies center alignment from the paragraph properties dialog on OK', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Paragraph properties…' }))
    await user.click(screen.getByRole('radio', { name: 'Align center' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(visual.querySelector('p')).toHaveStyle({ textAlign: 'center' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the page properties dialog from the Page menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))

    expect(screen.getByRole('dialog', { name: 'Page properties' })).toBeInTheDocument()
    const dialog = screen.getByRole('dialog', { name: 'Page properties' })
    expect(within(dialog).getByRole('tab', { name: 'Font' })).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog).getByRole('combobox', { name: 'Font size' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Paragraph' })).toBeInTheDocument()
  })

  it('wraps the document and applies page background on OK', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Paragraph' }))
    await user.click(screen.getByRole('tab', { name: 'Background' }))
    await user.click(screen.getByRole('button', { name: 'Background color' }))
    await user.click(screen.getByRole('option', { name: '#ff0000' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))

    const shell = visual.querySelector('[data-page]')
    expect(shell).toBeInstanceOf(HTMLDivElement)
    expect(shell).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })
    expect(visual).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })
    expect(shell?.querySelector('p')?.textContent).toBe('Hello')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('paints the visual holder from a page background in the document HTML', () => {
    render(
      <Editor defaultValue={'<div data-page style="background-color: #ccffff"><p>Hello</p></div>'} />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).toHaveStyle({ backgroundColor: 'rgb(204, 255, 255)' })
    expect(visual.innerHTML).toContain('data-page')
  })

  const preloadedPageHtml =
    '<style data-page-at-rule>@page { size: A4; margin: 20pt; }</style><div data-page><p>Hello</p></div>'

  function expectPreloadedPageCanvas(visual: HTMLElement) {
    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.width).toBe('210mm')
    expect(visual.style.minHeight).toBe('297mm')
    expect(visual.style.paddingTop).toBe('20pt')
  }

  it('sizes the visual canvas from print page properties', async () => {
    const user = userEvent.setup()
    render(<Editor enablePageProperties defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Print' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Page size' }), 'A4')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.width).toBe('210mm')
    expect(visual.style.minHeight).toBe('297mm')
    expect(visual.innerHTML).not.toContain('data-page-at-rule')
  })

  it('preserves @page in onChange after applying A4 page size', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Editor enablePageProperties defaultValue="<p>Hello</p>" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Print' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Page size' }), 'A4')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    const lastHtml = onChange.mock.calls.at(-1)?.[0] as string | undefined
    expect(lastHtml).toContain('data-page-at-rule')
    expect(lastHtml).toContain('size: A4')
  })

  it('keeps @page when switching to HTML mode after applying A4', async () => {
    const user = userEvent.setup()
    render(<Editor enablePageProperties defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Print' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Page size' }), 'A4')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))
    const htmlValue = (screen.getByRole('textbox', { name: 'HTML editor' }) as HTMLTextAreaElement).value
    expect(htmlValue).toContain('data-page-at-rule')
    expect(htmlValue).toContain('size: A4')

    await user.click(screen.getByRole('button', { name: 'Switch to visual mode' }))
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.width).toBe('210mm')
    expect(visual.style.minHeight).toBe('297mm')
  })

  it('keeps the canvas sized after bold following A4 apply', async () => {
    const user = userEvent.setup()
    render(<Editor enablePageProperties defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Print' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Page size' }), 'A4')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Bold' }))

    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.width).toBe('210mm')
    expect(visual.style.minHeight).toBe('297mm')
  })

  it('sizes the visual canvas from preloaded @page HTML when innerHTML strips style tags', () => {
    const { rerender } = render(<Editor defaultValue={preloadedPageHtml} />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' }) as HTMLDivElement
    let stored = visual.innerHTML

    Object.defineProperty(visual, 'innerHTML', {
      configurable: true,
      get() {
        return stored.replace(/<style[\s\S]*?<\/style>/gi, '')
      },
      set(value: string) {
        stored = value.replace(/<style[\s\S]*?<\/style>/gi, '')
      },
    })

    rerender(<Editor defaultValue={preloadedPageHtml} />)

    expectPreloadedPageCanvas(visual)
    expect(visual.innerHTML).not.toContain('data-page-at-rule')
  })

  it('sizes the visual canvas from preloaded @page HTML', () => {
    render(<Editor defaultValue={preloadedPageHtml} />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expectPreloadedPageCanvas(visual)
  })

  it('sizes the visual canvas after switching from HTML mode with @page HTML', async () => {
    const user = userEvent.setup()
    render(<Editor defaultMode="html" defaultValue={preloadedPageHtml} />)

    await user.click(screen.getByRole('button', { name: 'Switch to visual mode' }))

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expectPreloadedPageCanvas(visual)
  })

  it('sizes the visual canvas when a controlled value with @page HTML is set', () => {
    const { rerender } = render(<Editor value="" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).not.toHaveAttribute('data-page-sized')

    rerender(<Editor value={preloadedPageHtml} />)
    expectPreloadedPageCanvas(visual)
  })

  it('sizes each page surface from preloaded @page HTML in multi-page mode', () => {
    const pageOne =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>One</p></div>'
    const pageTwo =
      '<style data-page-at-rule>@page { size: letter; }</style><div data-page><p>Two</p></div>'
    render(<Editor enableMultiPages defaultPages={[pageOne, pageTwo]} />)

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    expect(surfaces[0]).toHaveAttribute('data-page-sized')
    expect(surfaces[0].style.width).toBe('210mm')
    expect(surfaces[1]).toHaveAttribute('data-page-sized')
    expect(surfaces[1].style.width).toBe('8.5in')
  })

  it('shows rulers only on sized pages and follows selection in multi-page mode', async () => {
    const user = userEvent.setup()
    const pageA4 =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>One</p></div>'
    const pagePlain = '<div data-page><p>Two</p></div>'
    render(<Editor enableMultiPages defaultPages={[pageA4, pagePlain]} />)

    expect(screen.getByTestId('horizontal-ruler')).toBeInTheDocument()
    expect(screen.getAllByTestId('vertical-ruler')).toHaveLength(1)

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[1])
    expect(screen.queryByTestId('horizontal-ruler')).not.toBeInTheDocument()
    expect(screen.queryByTestId('vertical-ruler')).not.toBeInTheDocument()

    await user.click(surfaces[0])
    expect(screen.getByTestId('horizontal-ruler')).toBeInTheDocument()
    expect(screen.getAllByTestId('vertical-ruler')).toHaveLength(1)
  })

  it('previews and commits @page margins when dragging ruler margin splitters', async () => {
    const onChange = vi.fn()
    render(<Editor defaultValue={preloadedPageHtml} onChange={onChange} />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' }) as HTMLDivElement
    Object.defineProperty(visual, 'offsetWidth', { configurable: true, value: 816 })
    Object.defineProperty(visual, 'offsetHeight', { configurable: true, value: 1056 })
    fireEvent.input(visual)
    expectPreloadedPageCanvas(visual)
    expect(visual.style.paddingLeft).toBe('20pt')

    await waitFor(() => {
      const left = Number.parseFloat(screen.getByTestId('ruler-printable-area').style.left)
      expect(left).toBeGreaterThan(20)
      expect(left).toBeLessThan(35)
    })

    const splitter = screen.getByTestId('ruler-margin-splitter-left')
    fireEvent(splitter, new MouseEvent('pointerdown', { clientX: 96, bubbles: true }))
    fireEvent(window, new MouseEvent('pointermove', { clientX: 120 }))

    expect(visual.style.paddingLeft).toBe('36pt')

    fireEvent(window, new MouseEvent('pointerup', { clientX: 120 }))

    const lastHtml = onChange.mock.calls.at(-1)?.[0] as string | undefined
    expect(lastHtml).toContain('data-page-at-rule')
    expect(lastHtml).toContain('margin-left: 36pt')
  })

  it('applies screen zoom from the View menu when print layout exists', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue={preloadedPageHtml} />)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Zoom submenu' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: '150%' }))

    const zoomLayer = document.querySelector('[class*="pageZoomContent"]') as HTMLElement | null
    const viewport = document.querySelector('[class*="pageCanvasViewport"]') as HTMLElement | null
    expect(zoomLayer?.style.zoom).toBe('1.5')
    expect(viewport?.style.zoom).toBeFalsy()
  })

  it('applies fit-width zoom on load without clicking the canvas', () => {
    localStorage.setItem(PAGE_ZOOM_STORAGE_KEY, '"fitWidth"')
    render(<Editor defaultValue={preloadedPageHtml} />)

    const zoomLayer = document.querySelector('[class*="pageZoomContent"]') as HTMLElement | null
    const viewport = document.querySelector('[class*="pageCanvasViewport"]') as HTMLElement | null
    expect(zoomLayer?.style.zoom).not.toBe('')
    expect(viewport?.style.zoom).toBeFalsy()
    expect(viewport).toHaveAttribute('data-page-canvas-sized')

    localStorage.removeItem(PAGE_ZOOM_STORAGE_KEY)
  })

  it('updates zoom immediately when switching presets from the View menu', async () => {
    localStorage.setItem(PAGE_ZOOM_STORAGE_KEY, '"fitWidth"')
    const user = userEvent.setup()
    render(<Editor defaultValue={preloadedPageHtml} />)

    const zoomLayer = document.querySelector('[class*="pageZoomContent"]') as HTMLElement
    const viewport = document.querySelector('[class*="pageCanvasViewport"]') as HTMLElement
    expect(zoomLayer.style.zoom).not.toBe('')
    expect(viewport.style.zoom).toBeFalsy()

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Zoom submenu' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: '100%' }))
    expect(zoomLayer.style.zoom).toBeFalsy()

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Zoom submenu' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: '150%' }))
    expect(zoomLayer.style.zoom).toBe('1.5')

    localStorage.removeItem(PAGE_ZOOM_STORAGE_KEY)
  })

  it('places caret inside page shell when focusing a sized page with fit-width zoom', async () => {
    localStorage.setItem(PAGE_ZOOM_STORAGE_KEY, '"fitWidth"')
    const user = userEvent.setup()
    render(<Editor defaultValue={preloadedPageHtml} />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const shell = visual.querySelector('[data-page]') as HTMLElement
    await user.click(visual)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    const sel = window.getSelection()
    expect(sel?.rangeCount).toBeGreaterThan(0)
    const range = sel!.getRangeAt(0)
    const node = range.startContainer
    expect(shell.contains(node) || shell === node).toBe(true)

    localStorage.removeItem(PAGE_ZOOM_STORAGE_KEY)
  })

  async function samplePageZoomContent(samples: number): Promise<string[]> {
    const values: string[] = []
    for (let i = 0; i < samples; i++) {
      const zoomLayer = document.querySelector('[class*="pageZoomContent"]') as HTMLElement | null
      values.push(zoomLayer?.style.zoom ?? '')
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    return values
  }

  async function insertPageAfterSelected(
    user: ReturnType<typeof userEvent.setup>,
    pageIndex = 0,
  ) {
    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[pageIndex])
    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Insert page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page after' }))
  }

  async function insertPageBeforeSelected(
    user: ReturnType<typeof userEvent.setup>,
    pageIndex = 0,
  ) {
    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[pageIndex])
    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Insert page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page before' }))
  }

  it('stabilizes fit-page zoom when focused on an unsized page', async () => {
    localStorage.setItem(PAGE_ZOOM_STORAGE_KEY, '"fitPage"')
    const user = userEvent.setup()
    const pageOne =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>One</p></div>'
    render(<Editor enableMultiPages defaultPages={[pageOne]} />)

    await user.click(screen.getByRole('textbox', { name: 'Visual editor' }))
    await insertPageAfterSelected(user)

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    expect(surfaces).toHaveLength(2)
    await user.click(surfaces[1])

    const zoomOnUnsizedPage = await samplePageZoomContent(12)
    const settledOnUnsizedPage = zoomOnUnsizedPage.slice(6)
    expect(new Set(settledOnUnsizedPage).size).toBe(1)
    for (let i = 1; i < zoomOnUnsizedPage.length; i++) {
      const prev = Number.parseFloat(zoomOnUnsizedPage[i - 1] || '1')
      const curr = Number.parseFloat(zoomOnUnsizedPage[i] || '1')
      expect(curr).toBeLessThanOrEqual(prev + 0.001)
    }

    await user.click(surfaces[0])

    const zoomOnSizedPage = await samplePageZoomContent(12)
    const settledOnSizedPage = zoomOnSizedPage.slice(6)
    expect(new Set(settledOnSizedPage).size).toBe(1)

    localStorage.removeItem(PAGE_ZOOM_STORAGE_KEY)
  })

  it('keeps typed text inside page 2 shell in multi-page A4 mode', async () => {
    const user = userEvent.setup()
    const pageOne =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>One</p></div>'
    const pageTwo =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p></p></div>'
    render(<Editor enableMultiPages defaultPages={[pageOne, pageTwo]} />)

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[1])
    await user.type(surfaces[1], 'Hello')

    const shell = surfaces[1].querySelector('[data-page]')
    expect(shell?.textContent).toContain('Hello')
    for (const child of surfaces[1].childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        expect(child.textContent?.trim()).toBe('')
      }
    }
  })

  it('keeps Enter-created paragraphs inside page 2 shell in multi-page A4 mode', async () => {
    const user = userEvent.setup()
    const pageOne =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>One</p></div>'
    const pageTwo =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p></p></div>'
    render(<Editor enableMultiPages defaultPages={[pageOne, pageTwo]} />)

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[1])
    await user.type(surfaces[1], 'Hello{Enter}World')

    const shell = surfaces[1].querySelector('[data-page]')
    expect(shell?.textContent).toContain('Hello')
    expect(shell?.textContent).toContain('World')
    expect(surfaces[1].children).toHaveLength(1)
    expect(surfaces[1].firstElementChild).toBe(shell)
  })

  it('keeps typed text inside page 2 shell with fit-width zoom', () => {
    localStorage.setItem(PAGE_ZOOM_STORAGE_KEY, '"fitWidth"')
    const pageOne =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>One</p></div>'
    const pageTwo =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p></p></div>'
    render(<Editor enableMultiPages defaultPages={[pageOne, pageTwo]} />)

    const zoomLayer = document.querySelector('[class*="pageZoomContent"]') as HTMLElement | null
    const viewport = document.querySelector('[class*="pageCanvasViewport"]') as HTMLElement | null
    expect(zoomLayer?.style.zoom).not.toBe('')
    expect(viewport?.style.zoom).toBeFalsy()

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    const shellParagraph = surfaces[1].querySelector('[data-page] p') as HTMLElement
    surfaces[1].focus()
    shellParagraph.textContent = 'Zoomed'
    fireEvent.input(surfaces[1])

    expect(shellParagraph.textContent).toBe('Zoomed')
    for (const child of surfaces[1].childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        expect(child.textContent?.trim()).toBe('')
      }
    }
    localStorage.removeItem(PAGE_ZOOM_STORAGE_KEY)
  })

  it('renders multiple visual surfaces when enableMultiPages is true', () => {
    render(<Editor enableMultiPages defaultPages={['<p>One</p>', '<p>Two</p>']} />)
    expect(screen.getAllByRole('textbox', { name: 'Visual editor' })).toHaveLength(2)
  })

  it('preserves other pages when applying print settings on page 2', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        enableMultiPages
        enablePageProperties
        defaultPages={['<p>One</p>', '<p>Two</p>']}
        onPagesChange={onPagesChange}
      />,
    )

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[1])

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Print' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Page size' }), 'A4')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(screen.getAllByRole('textbox', { name: 'Visual editor' })).toHaveLength(2)
    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(2)
    expect(lastPages[0]).toContain('One')
    expect(lastPages[1]).toContain('Two')
    expect(lastPages[1]).toContain('data-page-at-rule')
  })

  it('preserves page 1 after inserting page 2 and setting print size', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor enableMultiPages enablePageProperties defaultPages={['<p>One</p>']} onPagesChange={onPagesChange} />,
    )

    await user.click(screen.getByRole('textbox', { name: 'Visual editor' }))
    await insertPageAfterSelected(user)

    expect(screen.getAllByRole('textbox', { name: 'Visual editor' })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Print' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Page size' }), 'A4')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(screen.getAllByRole('textbox', { name: 'Visual editor' })).toHaveLength(2)
    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(2)
    expect(lastPages[0]).toContain('One')
    expect(lastPages[1]).toContain('data-page-at-rule')
  })

  it('preserves page 1 when resetting print settings on page 2', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    const pageTwo =
      '<style data-page-at-rule>@page { size: A4; }</style><div data-page><p>Two</p></div>'
    render(
      <Editor
        enableMultiPages
        enablePageProperties
        defaultPages={['<p>One</p>', pageTwo]}
        onPagesChange={onPagesChange}
      />,
    )

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[1])

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))
    await user.click(screen.getByRole('tab', { name: 'Print' }))
    await user.click(
      screen.getByRole('button', { name: 'Remove @page print settings from this page' }),
    )

    expect(screen.getAllByRole('textbox', { name: 'Visual editor' })).toHaveLength(2)
    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(2)
    expect(lastPages[0]).toContain('One')
    expect(lastPages[1]).toContain('Two')
    expect(lastPages[1]).not.toContain('data-page-at-rule')
  })

  it('hides the Print tab when enablePageProperties is false', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))

    expect(screen.getByRole('dialog', { name: 'Page properties' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Print' })).not.toBeInTheDocument()
  })

  it('shows the Print tab when enablePageProperties is true', async () => {
    const user = userEvent.setup()
    render(<Editor enablePageProperties defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page properties…' }))

    expect(screen.getByRole('tab', { name: 'Print' })).toBeInTheDocument()
  })

  it('does not show Insert Page when enableMultiPages is false', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))

    expect(screen.queryByRole('menuitem', { name: 'Insert page submenu' })).not.toBeInTheDocument()
  })

  it('does not show Insert Page in HTML mode when enableMultiPages is true', async () => {
    const user = userEvent.setup()
    render(<Editor enableMultiPages defaultMode="html" defaultPages={['<p>One</p>']} />)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))

    expect(screen.queryByRole('menuitem', { name: 'Insert page submenu' })).not.toBeInTheDocument()
  })

  it('disables insert page items until a page is selected', async () => {
    const user = userEvent.setup()
    render(<Editor enableMultiPages defaultPages={['<p>One</p>', '<p>Two</p>', '<p>Three</p>']} />)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Insert page submenu' }))

    expect(screen.getByRole('menuitem', { name: 'Page before' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Page after' })).toBeDisabled()
  })

  it('inserts a page after the selected page, not at the end', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        enableMultiPages
        defaultPages={['<p>One</p>', '<p>Two</p>', '<p>Three</p>']}
        onPagesChange={onPagesChange}
      />,
    )

    await insertPageAfterSelected(user, 0)

    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(4)
    expect(lastPages[0]).toContain('One')
    expect(lastPages[1]).toBe('<p></p>')
    expect(lastPages[2]).toContain('Two')
    expect(lastPages[3]).toContain('Three')
  })

  it('inserts a page before the selected page', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        enableMultiPages
        defaultPages={['<p>One</p>', '<p>Two</p>', '<p>Three</p>']}
        onPagesChange={onPagesChange}
      />,
    )

    await insertPageBeforeSelected(user, 2)

    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(4)
    expect(lastPages[0]).toContain('One')
    expect(lastPages[1]).toContain('Two')
    expect(lastPages[2]).toBe('<p></p>')
    expect(lastPages[3]).toContain('Three')
  })

  async function selectPageSurface(
    user: ReturnType<typeof userEvent.setup>,
    pageIndex = 0,
  ) {
    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[pageIndex])
  }

  async function openEditPageMenu(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Edit menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Page submenu' }))
  }

  it('disables delete page until a page is selected', async () => {
    const user = userEvent.setup()
    render(<Editor enableMultiPages defaultPages={['<p>One</p>', '<p>Two</p>']} />)

    await openEditPageMenu(user)

    expect(screen.getByRole('menuitem', { name: 'Delete page' })).toBeDisabled()
  })

  it('disables delete page when only one page remains', async () => {
    const user = userEvent.setup()
    render(<Editor enableMultiPages defaultPages={['<p>One</p>']} />)

    await selectPageSurface(user)
    await openEditPageMenu(user)

    expect(screen.getByRole('menuitem', { name: 'Delete page' })).toBeDisabled()
  })

  it('deletes the selected page after confirmation from the Edit menu', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        enableMultiPages
        defaultPages={['<p>One</p>', '<p>Two</p>', '<p>Three</p>']}
        onPagesChange={onPagesChange}
      />,
    )

    await selectPageSurface(user, 1)
    await openEditPageMenu(user)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete page' }))

    expect(screen.getByRole('dialog', { name: 'Delete page' })).toBeInTheDocument()
    expect(
      screen.getByText('Are you sure you want to delete the selected page?'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete page' }))

    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(2)
    expect(lastPages[0]).toContain('One')
    expect(lastPages[1]).toContain('Three')
    expect(screen.getAllByRole('textbox', { name: 'Visual editor' })).toHaveLength(2)
  })

  it('applies defaultPageProperties on uncontrolled initial content', () => {
    render(
      <Editor
        defaultValue="<p>Hello</p>"
        defaultPageProperties={{ atRule: { sizePreset: 'A4' } }}
      />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.width).toBe('210mm')
    expect(visual.innerHTML).toContain('data-page')
  })

  it('applies defaultPageProperties inch margins to the visual canvas', () => {
    render(
      <Editor
        defaultValue=""
        defaultPageProperties={{
          atRule: {
            sizePreset: 'A4',
            orientation: 'portrait',
            margin: {
              top: { value: 1, unit: 'in' } as const,
              right: { value: 1, unit: 'in' } as const,
              bottom: { value: 1, unit: 'in' } as const,
              left: { value: 1, unit: 'in' } as const,
            },
          },
        }}
      />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).toHaveAttribute('data-page-sized')
    expect(visual.style.paddingLeft).toBe('72pt')
    expect(visual.style.paddingTop).toBe('72pt')
  })

  it('does not apply defaultPageProperties to controlled pages', () => {
    render(
      <Editor
        enableMultiPages
        pages={['<p>One</p>']}
        defaultPageProperties={{ atRule: { sizePreset: 'A4' } }}
      />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).not.toHaveAttribute('data-page-sized')
  })

  it('applies defaultPageProperties when inserting a new page', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        enableMultiPages
        defaultPages={['<p>One</p>']}
        defaultPageProperties={{ atRule: { sizePreset: 'letter' } }}
        onPagesChange={onPagesChange}
      />,
    )

    await user.click(screen.getByRole('textbox', { name: 'Visual editor' }))
    await insertPageAfterSelected(user)

    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(2)
    expect(lastPages[1]).toContain('data-page-at-rule')
    expect(lastPages[1]).toContain('size: letter')
  })
})

describe('Editor custom actions', () => {
  function demoAction(overrides: Partial<CustomAction> = {}): CustomAction {
    return {
      id: 'ai',
      label: 'AI',
      showIn: 'both',
      menu: { id: 'tools', label: 'Tools' },
      onAction: vi.fn(),
      ...overrides,
    }
  }

  it('shows a custom action in a new menu and the icon toolbar', async () => {
    const user = userEvent.setup()
    render(<Editor customActions={[demoAction()]} />)

    expect(screen.getByRole('button', { name: 'AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AI' }).querySelector('[data-icon="custom-action"]')).not.toBeNull()
    expect(screen.getByRole('group', { name: 'Custom' })).toHaveAttribute('data-toolbar-group', 'custom')

    await user.click(screen.getByRole('button', { name: 'Tools' }))
    expect(screen.getByRole('menuitem', { name: 'AI' })).toBeInTheDocument()
  })

  it('hides the toolbar button when showIn is menu', () => {
    render(<Editor customActions={[demoAction({ showIn: 'menu' })]} />)

    expect(screen.queryByRole('button', { name: 'AI' })).not.toBeInTheDocument()
  })

  it('hides the custom menu when showIn is toolbar', () => {
    render(<Editor customActions={[demoAction({ showIn: 'toolbar' })]} />)

    expect(screen.getByRole('button', { name: 'AI' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tools' })).not.toBeInTheDocument()
  })

  it('places an item in the File menu', async () => {
    const user = userEvent.setup()
    render(<Editor customActions={[demoAction({ menu: { id: 'file' }, showIn: 'menu' })]} />)

    await user.click(screen.getByRole('button', { name: 'File menu' }))
    expect(screen.getByRole('menuitem', { name: 'AI' })).toBeInTheDocument()
  })

  it('passes html-mode selection to onAction and inserts HTML by default', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn((api: CustomActionApi) => {
      api.insertHtml('<em>there</em>')
    })
    render(
      <Editor
        defaultMode="html"
        defaultValue="Hello world"
        customActions={[demoAction({ onAction })]}
      />,
    )

    const textarea = screen.getByRole('textbox', { name: 'HTML editor' }) as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(6, 11)
    fireEvent.select(textarea)

    await user.click(screen.getByRole('button', { name: 'AI' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    const api = onAction.mock.calls[0][0]
    expect(api.mode).toBe('html')
    expect(api.selection).toMatchObject({ text: 'world', collapsed: false, start: 6, end: 11 })
    expect(textarea).toHaveValue('Hello <em>there</em>')
  })

  it('inserts optional formatted text instead of HTML', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        defaultMode="html"
        defaultValue="Hello world"
        customActions={[
          demoAction({
            onAction: (api) => {
              api.insertHtml('<em>there</em>', '<em>there</em>')
            },
          }),
        ]}
      />,
    )

    const textarea = screen.getByRole('textbox', { name: 'HTML editor' }) as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(6, 11)
    fireEvent.select(textarea)

    await user.click(screen.getByRole('button', { name: 'AI' }))

    expect(textarea).toHaveValue('Hello &lt;em&gt;there&lt;/em&gt;')
  })

  it('replaces the entire document from setHtml', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Old</p>"
        customActions={[
          demoAction({
            onAction: (api) => {
              api.setHtml('<p>All new</p>')
            },
          }),
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'AI' }))

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>All new</p>')
  })

  it('shows a custom tooltip on the toolbar icon', () => {
    vi.useFakeTimers()
    render(<Editor customActions={[demoAction({ tooltip: 'Insert AI text' })]} />)

    const trigger = screen.getByRole('button', { name: 'AI' }).closest('[data-tooltip-trigger]') as HTMLElement
    fireEvent.mouseEnter(trigger)
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_HOVER_DELAY_MS)
    })

    expect(screen.getByText('Insert AI text', { selector: '[data-toolbar-tooltip]' })).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('Editor transformHtml', () => {
  const cleanDirty = (html: string) => html.replace(/dirty/g, 'clean')

  it('rewrites HTML-mode edits before onChange and storing', () => {
    const onChange = vi.fn()
    render(
      <Editor defaultMode="html" onChange={onChange} transformHtml={cleanDirty} />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<p>dirty</p>' },
    })

    expect(onChange).toHaveBeenCalledWith('<p>clean</p>')
    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<p>clean</p>')
  })

  it('rewrites visual edits before they are stored', async () => {
    const user = userEvent.setup()
    render(<Editor transformHtml={cleanDirty} />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>dirty</p>'
    fireEvent.input(visual)
    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' })).toHaveValue('<p>clean</p>')
  })

  it('rewrites custom action setHtml', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Old</p>"
        transformHtml={cleanDirty}
        customActions={[
          {
            id: 'ai',
            label: 'AI',
            showIn: 'toolbar',
            onAction: (api) => {
              api.setHtml('<p>dirty</p>')
            },
          },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'AI' }))

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>clean</p>')
  })

  it('rewrites loaded HTML', async () => {
    const user = userEvent.setup()
    vi.mocked(loadHtml).mockResolvedValueOnce('<p>dirty</p>')
    render(<Editor defaultValue="<p>Old</p>" transformHtml={cleanDirty} />)

    await user.click(screen.getByRole('button', { name: 'Open HTML file' }))

    expect(screen.getByRole('textbox', { name: 'Visual editor' })).toContainHTML('<p>clean</p>')
  })
})

describe('Editor sanitizeHtml', () => {
  it('strips script tags from visual edits by default', () => {
    const onChange = vi.fn()
    render(<Editor onChange={onChange} />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>Hi</p><script>alert(1)</script>'
    fireEvent.input(visual)

    const lastHtml = onChange.mock.calls.at(-1)?.[0] as string
    expect(lastHtml).not.toContain('<script')
    expect(lastHtml).toContain('Hi')
  })

  it('sanitizes inbound defaultValue', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue='<p>Hi</p><script>alert(1)</script>' />)

    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' }).value).not.toContain('<script')
    expect(screen.getByRole('textbox', { name: 'HTML editor' }).value).toContain('Hi')
  })

  it('strips javascript: URLs from inbound HTML', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue='<a href="javascript:alert(1)">Link</a>' />)

    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))

    expect(screen.getByRole('textbox', { name: 'HTML editor' }).value).not.toContain('javascript:')
    expect(screen.getByRole('textbox', { name: 'HTML editor' }).value).toContain('Link')
  })

  it('does not strip script tags when sanitizeHtml is false', () => {
    const onChange = vi.fn()
    render(<Editor sanitizeHtml={false} onChange={onChange} />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>Hi</p><script>alert(1)</script>'
    fireEvent.input(visual)

    const lastHtml = onChange.mock.calls.at(-1)?.[0] as string
    expect(lastHtml).toContain('<script')
  })
})

describe('Editor onAutoSave', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  async function advanceAutoSaveTick() {
    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })
  }

  it('does not fire when the prop is omitted', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    render(<Editor defaultValue="<p>Hello</p>" />)

    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it('does not fire when the document is unchanged', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    render(<Editor defaultValue="<p>Hello</p>" onAutoSave={onAutoSave} />)

    await advanceAutoSaveTick()

    expect(onAutoSave).not.toHaveBeenCalled()
  })

  it('fires with visual edits after one second', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    render(<Editor defaultValue="<p>Hello</p>" onAutoSave={onAutoSave} />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    visual.innerHTML = '<p>Edited</p>'
    fireEvent.input(visual)
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
    expect(onAutoSave).toHaveBeenCalledWith('<p>Edited</p>')
  })

  it('fires with HTML-mode edits after one second', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    render(<Editor defaultMode="html" defaultValue="<p>Hello</p>" onAutoSave={onAutoSave} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<p>Source</p>' },
    })
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
    expect(onAutoSave).toHaveBeenCalledWith('<p>Source</p>')
  })

  it('coalesces two changes within one second into the latest HTML', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    render(<Editor defaultMode="html" defaultValue="<p>One</p>" onAutoSave={onAutoSave} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<p>Two</p>' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<p>Three</p>' },
    })
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
    expect(onAutoSave).toHaveBeenCalledWith('<p>Three</p>')
  })

  it('does not fire again when nothing else changed', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    render(<Editor defaultMode="html" defaultValue="<p>Hello</p>" onAutoSave={onAutoSave} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: { value: '<p>Saved</p>' },
    })
    await advanceAutoSaveTick()
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
    expect(onAutoSave).toHaveBeenCalledWith('<p>Saved</p>')
  })

  it('does not fire multi-page auto-save again when nothing changed', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    render(
      <Editor
        enableMultiPages
        defaultPages={['<p>One</p>', '<p>Two</p>']}
        onAutoSave={onAutoSave}
      />,
    )

    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    surfaces[0].innerHTML = '<p>Edited</p>'
    fireEvent.input(surfaces[0])
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
    const calls = onAutoSave.mock.calls[0][0] as string[]
    expect(calls[0]).toContain('<p>Edited</p>')
    expect(calls[1]).toContain('<p>Two</p>')

    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
  })
})

describe('Editor custom paragraph styles', () => {
  it('hides Add new when custom paragraph style hooks are not set', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))

    expect(screen.queryByRole('menuitem', { name: 'Add new paragraph style' })).not.toBeInTheDocument()
  })

  it('loads custom paragraph styles on mount and again after save', async () => {
    const user = userEvent.setup()
    const styles: CustomParagraphStyle[] = []
    const load = vi.fn(async () => styles.map((style) => ({ ...style })))
    const save = vi.fn(async (style: CustomParagraphStyle) => {
      styles.push(style)
    })

    render(
      <Editor loadCustomParagraphStyles={load} onSaveCustomParagraphStyle={save} />,
    )

    expect(load).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Add new paragraph style' }))

    await user.type(screen.getByLabelText('Name'), 'Quote')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][0].name).toBe('Quote')
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Paragraph styles submenu' }))
    expect(screen.getByRole('menuitem', { name: 'Quote' })).toBeInTheDocument()
  })
})

describe('Editor toolbar customization', () => {
  afterEach(() => {
    localStorage.removeItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY)
  })

  async function openCustomizeDialog(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Toolbar submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Customize toolbar' }))
  }

  it('opens the customize dialog from the View menu', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await openCustomizeDialog(user)

    expect(screen.getByRole('dialog', { name: 'Customize toolbar' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Save: Show on toolbar' })).toBeChecked()
  })

  it('hides a toolbar icon when its checkbox is unchecked', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    expect(screen.getByRole('button', { name: 'Print document' })).toBeInTheDocument()
    await openCustomizeDialog(user)
    await user.click(screen.getByRole('checkbox', { name: 'Print: Show on toolbar' }))

    expect(screen.queryByRole('button', { name: 'Print document' })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY) ?? '{}').hiddenItemIds).toEqual([
      'print',
    ])
  })

  it('restores the default toolbar on reset', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    await openCustomizeDialog(user)
    await user.click(screen.getByRole('checkbox', { name: 'Print: Show on toolbar' }))
    expect(screen.queryByRole('button', { name: 'Print document' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('button', { name: 'Print document' })).toBeInTheDocument()
    expect(localStorage.getItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY)).toBeNull()
  })

  it('loads host settings and saves changes back', async () => {
    const user = userEvent.setup()
    let stored: ToolbarCustomization | null = {
      groupOrder: [],
      hiddenItemIds: ['print'],
    }
    const load = vi.fn(async () => stored)
    const save = vi.fn(async (next: ToolbarCustomization | null) => {
      stored = next
    })

    render(<Editor toolbarCustomization={{ load, save }} />)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Print document' })).not.toBeInTheDocument()
    })
    expect(load).toHaveBeenCalledTimes(1)

    await openCustomizeDialog(user)
    await user.click(screen.getByRole('checkbox', { name: 'Print: Show on toolbar' }))

    await waitFor(() => expect(save).toHaveBeenCalled())
    expect(save.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ hiddenItemIds: [] }))
    expect(screen.getByRole('button', { name: 'Print document' })).toBeInTheDocument()
    expect(localStorage.getItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY)).toBeNull()
  })

  it('includes custom toolbar actions in the dialog', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        customActions={[
          {
            id: 'ai',
            label: 'AI',
            showIn: 'toolbar',
            onAction: () => undefined,
          },
        ]}
      />,
    )

    await openCustomizeDialog(user)

    expect(screen.getByRole('checkbox', { name: 'AI: Show on toolbar' })).toBeChecked()
  })
})

describe('Editor allowed chrome', () => {
  afterEach(() => {
    localStorage.removeItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY)
  })

  async function openCustomizeDialog(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Toolbar submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Customize toolbar' }))
  }

  it('hides disallowed menus and keeps items inside shown menus', async () => {
    const user = userEvent.setup()
    render(<Editor allowedChrome={{ menus: ['file', 'edit'] }} />)

    expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit menu' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Insert menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Table menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Format menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Print document' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'File menu' }))
    expect(screen.getByRole('menuitem', { name: 'Print' })).toBeInTheDocument()
  })

  it('hides disallowed toolbar buttons without changing menus', async () => {
    const user = userEvent.setup()
    render(<Editor allowedChrome={{ toolbar: ['save', 'undo'] }} />)

    expect(screen.getByRole('button', { name: 'Save as HTML file' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Print document' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'File menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert menu' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'File menu' }))
    expect(screen.getByRole('menuitem', { name: 'Print' })).toBeInTheDocument()
  })

  it('lists only allowed toolbar items in the customize dialog', async () => {
    const user = userEvent.setup()
    render(<Editor allowedChrome={{ toolbar: ['save', 'undo'] }} />)

    await openCustomizeDialog(user)

    expect(screen.getByRole('checkbox', { name: 'Save: Show on toolbar' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Undo: Show on toolbar' })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Print: Show on toolbar' })).not.toBeInTheDocument()
  })

  it('persists hiding an allowed toolbar item in localStorage', async () => {
    const user = userEvent.setup()
    render(<Editor allowedChrome={{ toolbar: ['save', 'undo'] }} />)

    await openCustomizeDialog(user)
    await user.click(screen.getByRole('checkbox', { name: 'Save: Show on toolbar' }))

    expect(screen.queryByRole('button', { name: 'Save as HTML file' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY) ?? '{}').hiddenItemIds).toEqual([
      'save',
    ])
  })

  it('persists hiding an allowed toolbar item through host load and save', async () => {
    const user = userEvent.setup()
    let stored: ToolbarCustomization | null = null
    const load = vi.fn(async () => stored)
    const save = vi.fn(async (next: ToolbarCustomization | null) => {
      stored = next
    })

    render(
      <Editor
        allowedChrome={{ toolbar: ['save', 'undo'] }}
        toolbarCustomization={{ load, save }}
      />,
    )

    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    await openCustomizeDialog(user)
    await user.click(screen.getByRole('checkbox', { name: 'Undo: Show on toolbar' }))

    await waitFor(() => expect(save).toHaveBeenCalled())
    expect(save.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ hiddenItemIds: ['undo'] }))
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save as HTML file' })).toBeInTheDocument()
    expect(localStorage.getItem(TOOLBAR_CUSTOMIZATION_STORAGE_KEY)).toBeNull()
  })
})

describe('Editor dark mode', () => {
  afterEach(() => {
    localStorage.removeItem(DARK_MODE_STORAGE_KEY)
  })

  async function chooseViewTheme(user: ReturnType<typeof userEvent.setup>, name: 'Light mode' | 'Dark mode') {
    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemradio', { name }))
  }

  it('starts in light mode by default', () => {
    const { container } = render(<Editor />)

    expect(container.firstElementChild).toHaveAttribute('data-wysiwyg-theme', 'light')
    expect(screen.getByRole('textbox', { name: 'Visual editor' })).not.toHaveAttribute('data-wysiwyg-theme')
  })

  it('uses darkMode as the initial theme when nothing is persisted', () => {
    const { container } = render(<Editor darkMode />)

    expect(container.firstElementChild).toHaveAttribute('data-wysiwyg-theme', 'dark')
  })

  it('applies a persisted localStorage theme and keeps document surfaces light', async () => {
    localStorage.setItem(DARK_MODE_STORAGE_KEY, 'true')
    const user = userEvent.setup()
    const { container } = render(<Editor darkMode={false} defaultValue="<p>Hello</p>" />)

    expect(container.firstElementChild).toHaveAttribute('data-wysiwyg-theme', 'dark')
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(visual).toHaveAttribute('contenteditable', 'true')
    expect(visual).not.toHaveAttribute('data-wysiwyg-theme')
    expect(visual.className).toMatch(/surface/)
    expect(visual.className).toMatch(/visual/)

    await chooseViewTheme(user, 'Light mode')

    expect(container.firstElementChild).toHaveAttribute('data-wysiwyg-theme', 'light')
    expect(JSON.parse(localStorage.getItem(DARK_MODE_STORAGE_KEY) ?? '')).toBe(false)
  })

  it('persists View menu dark mode in localStorage', async () => {
    const user = userEvent.setup()
    const { container } = render(<Editor />)

    await chooseViewTheme(user, 'Dark mode')

    expect(container.firstElementChild).toHaveAttribute('data-wysiwyg-theme', 'dark')
    expect(JSON.parse(localStorage.getItem(DARK_MODE_STORAGE_KEY) ?? '')).toBe(true)
  })

  it('loads host settings and saves changes back without localStorage', async () => {
    const user = userEvent.setup()
    let stored: boolean | null = true
    const load = vi.fn(async () => stored)
    const save = vi.fn(async (next: boolean) => {
      stored = next
    })

    const { container } = render(<Editor darkModePersistence={{ load, save }} />)

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute('data-wysiwyg-theme', 'dark')
    })
    expect(load).toHaveBeenCalledTimes(1)

    await chooseViewTheme(user, 'Light mode')

    await waitFor(() => expect(save).toHaveBeenCalledWith(false))
    expect(container.firstElementChild).toHaveAttribute('data-wysiwyg-theme', 'light')
    expect(localStorage.getItem(DARK_MODE_STORAGE_KEY)).toBeNull()
  })
})

describe('Editor toolbar position', () => {
  afterEach(() => {
    localStorage.removeItem(TOOLBAR_POSITION_STORAGE_KEY)
  })

  async function chooseToolbarPosition(
    user: ReturnType<typeof userEvent.setup>,
    name: 'Top' | 'Left' | 'Right' | 'Bottom',
  ) {
    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Toolbar submenu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Toolbar position submenu' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name }))
  }

  const editorChromeCss = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'Editor.module.css'),
    'utf8',
  )

  function declaredZIndex(block: string): number {
    const match = editorChromeCss.match(new RegExp(`${block}\\s*\\{[^}]*z-index:\\s*(\\d+)`, 's'))
    return match ? Number(match[1]) : 0
  }

  it('docks the icon toolbar at the top by default', () => {
    const { container } = render(<Editor />)
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' })
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })

    expect(container.firstElementChild).toHaveAttribute('data-toolbar-position', 'top')
    expect(container.querySelector('[data-icon-dock="top"]')).not.toBeNull()
    expect(toolbar.compareDocumentPosition(visual) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('stacks File/View menus above the icon toolbar', () => {
    render(<Editor />)
    const fileMenu = screen.getByRole('button', { name: 'File menu' })
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' })

    expect(fileMenu.closest(`.${styles.menuChrome}`)).not.toBeNull()
    expect(toolbar.closest(`.${styles.iconChrome}`)).not.toBeNull()
    expect(declaredZIndex('\\.menuChrome')).toBeGreaterThan(declaredZIndex('\\.iconChrome\\.iconChrome'))
  })

  it('uses toolbarPosition as the initial dock when nothing is persisted', () => {
    const { container } = render(<Editor toolbarPosition="left" />)

    expect(container.firstElementChild).toHaveAttribute('data-toolbar-position', 'left')
    expect(container.querySelector('[data-icon-dock="left"]')).not.toBeNull()
  })

  it('moves the icon toolbar below the document from View → Toolbar → Position', async () => {
    const user = userEvent.setup()
    const { container } = render(<Editor />)

    await chooseToolbarPosition(user, 'Bottom')

    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' })
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    expect(container.firstElementChild).toHaveAttribute('data-toolbar-position', 'bottom')
    expect(container.querySelector('[data-icon-dock="bottom"]')).not.toBeNull()
    expect(visual.compareDocumentPosition(toolbar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(TOOLBAR_POSITION_STORAGE_KEY) ?? '')).toBe('bottom')
  })

  it('applies a persisted localStorage dock', () => {
    localStorage.setItem(TOOLBAR_POSITION_STORAGE_KEY, '"right"')
    const { container } = render(<Editor toolbarPosition="top" />)

    expect(container.firstElementChild).toHaveAttribute('data-toolbar-position', 'right')
  })

  it('loads host settings and saves changes back without localStorage', async () => {
    const user = userEvent.setup()
    let stored: 'top' | 'left' | 'right' | 'bottom' | null = 'left'
    const load = vi.fn(async () => stored)
    const save = vi.fn(async (next: typeof stored) => {
      stored = next
    })

    const { container } = render(<Editor toolbarPositionPersistence={{ load, save }} />)

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute('data-toolbar-position', 'left')
    })
    expect(load).toHaveBeenCalledTimes(1)

    await chooseToolbarPosition(user, 'Right')

    await waitFor(() => expect(save).toHaveBeenCalledWith('right'))
    expect(container.firstElementChild).toHaveAttribute('data-toolbar-position', 'right')
    expect(localStorage.getItem(TOOLBAR_POSITION_STORAGE_KEY)).toBeNull()
  })
})

describe('Editor context menu', () => {
  it('opens a custom menu on the visual surface and prevents the default', async () => {
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    const event = createEvent.contextMenu(visual)
    fireEvent(visual, event)

    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByRole('menu', { name: 'Editor context menu' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeEnabled()
    expect(screen.queryByRole('menuitem', { name: 'Image properties' })).not.toBeInTheDocument()
  })

  it('does not override context menu after a touch pointer so native selection can run', () => {
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const down = createEvent.pointerDown(visual)
    Object.defineProperty(down, 'pointerType', { value: 'touch' })
    fireEvent(visual, down)
    const event = createEvent.contextMenu(visual)
    fireEvent(visual, event)

    expect(event.defaultPrevented).toBe(false)
    expect(screen.queryByRole('menu', { name: 'Editor context menu' })).not.toBeInTheDocument()
  })

  it('still opens the custom menu on a mouse right-click after a mouse pointer', () => {
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const down = createEvent.pointerDown(visual)
    Object.defineProperty(down, 'pointerType', { value: 'mouse' })
    fireEvent(visual, down)
    const event = createEvent.contextMenu(visual, { button: 2 })
    fireEvent(visual, event)

    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByRole('menu', { name: 'Editor context menu' })).toBeInTheDocument()
  })

  it('does not override context menu in HTML mode or on the toolbar', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const format = screen.getByRole('button', { name: 'Format menu' })
    const chromeEvent = createEvent.contextMenu(format)
    fireEvent(format, chromeEvent)
    expect(screen.queryByRole('menu', { name: 'Editor context menu' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to HTML mode' }))
    const html = screen.getByRole('textbox', { name: 'HTML editor' })
    const htmlEvent = createEvent.contextMenu(html)
    fireEvent(html, htmlEvent)
    expect(htmlEvent.defaultPrevented).toBe(false)
    expect(screen.queryByRole('menu', { name: 'Editor context menu' })).not.toBeInTheDocument()
  })

  it('does not override context menu when disabled', () => {
    render(<Editor defaultValue="<p>Hello</p>" disabled />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const event = createEvent.contextMenu(visual)
    fireEvent(visual, event)
    expect(event.defaultPrevented).toBe(false)
    expect(screen.queryByRole('menu', { name: 'Editor context menu' })).not.toBeInTheDocument()
  })

  it('grays out font and paragraph properties when right-clicking an image', () => {
    render(
      <Editor defaultValue='<p><img src="https://example.com/a.png" alt="Chart"></p>' />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const img = visual.querySelector('img')
    expect(img).not.toBeNull()
    fireEvent.contextMenu(img as HTMLImageElement)

    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeEnabled()
    expect(screen.queryByRole('menuitem', { name: 'Link' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Font properties' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Paragraph properties' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Image properties' })).toBeEnabled()
  })

  it('opens font properties from a text selection', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    fireEvent.contextMenu(visual)

    await user.click(screen.getByRole('menuitem', { name: 'Font properties' }))
    expect(screen.getByRole('dialog', { name: 'Font properties' })).toBeInTheDocument()
  })

  it('opens the link dialog from a text selection', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    fireEvent.contextMenu(visual)

    await user.click(screen.getByRole('menuitem', { name: 'Link' }))
    expect(screen.getByRole('dialog', { name: 'Insert link' })).toBeInTheDocument()
  })

  it('opens the image properties dialog and applies size', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Editor
        defaultValue='<p><img src="https://example.com/a.png" alt="Chart"></p>'
        onChange={onChange}
      />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const img = visual.querySelector('img')
    fireEvent.contextMenu(img as HTMLImageElement)
    await user.click(screen.getByRole('menuitem', { name: 'Image properties' }))

    const dialog = screen.getByRole('dialog', { name: 'Image properties' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole('combobox', { name: 'Image width' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Alignment' })).toBeInTheDocument()

    await user.clear(within(dialog).getByRole('combobox', { name: 'Image width' }))
    await user.type(within(dialog).getByRole('combobox', { name: 'Image width' }), '180')
    await user.selectOptions(within(dialog).getAllByLabelText('Image size unit')[0], 'px')
    await user.click(within(dialog).getByRole('button', { name: 'OK' }))

    expect(dialog).not.toBeInTheDocument()
    expect((visual.querySelector('img') as HTMLImageElement).style.width).toBe('180px')
    expect(onChange).toHaveBeenCalled()
  })

  it('disables Image in the Format menu when no image is selected', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))

    expect(screen.getByRole('menuitem', { name: 'Image' })).toBeDisabled()
  })

  it('opens image properties from the Format menu when an image is selected', async () => {
    const user = userEvent.setup()
    render(
      <Editor defaultValue='<p><img src="https://example.com/a.png" alt="Chart"></p>' />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const img = visual.querySelector('img') as HTMLImageElement
    await user.click(img)

    await user.click(screen.getByRole('button', { name: 'Format menu' }))
    expect(screen.getByRole('menuitem', { name: 'Image' })).toBeEnabled()
    await user.click(screen.getByRole('menuitem', { name: 'Image' }))

    expect(screen.getByRole('dialog', { name: 'Image properties' })).toBeInTheDocument()
  })

  it('inserts a table from the Insert dialog', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Insert table' }))
    const dialog = screen.getByRole('dialog', { name: 'Insert table' })
    await user.click(within(dialog).getByRole('button', { name: 'Insert' }))

    expect(dialog).not.toBeInTheDocument()
    expect(visual.querySelectorAll('table')).toHaveLength(1)
    expect(visual.querySelectorAll('td')).toHaveLength(9)
  })

  it('inserts a horizontal rule from the toolbar', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>HelloWorld</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Insert horizontal line' }))

    const hr = visual.querySelector('hr')
    expect(hr).not.toBeNull()
    expect(visual.querySelectorAll('p')).toHaveLength(2)
    expect(visual.querySelectorAll('p')[0]?.textContent).toBe('Hello')
    expect(visual.querySelectorAll('p')[1]?.textContent).toBe('World')
  })

  it('inserts a horizontal rule from the Insert menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Horizontal line' }))

    expect(visual.querySelector('hr')).not.toBeNull()
  })

  it('inserts a page break from the Insert menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>HelloWorld</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Page break' }))

    const pageBreak = visual.querySelector('div')
    expect(pageBreak).not.toBeNull()
    expect(pageBreak?.style.breakAfter).toBe('page')
    expect(visual.querySelectorAll('p')).toHaveLength(2)
  })

  it('inserts audio from the Insert menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Audio' }))
    const dialog = screen.getByRole('dialog', { name: 'Insert audio' })
    await user.click(within(dialog).getByRole('radio', { name: 'Audio URL' }))
    await user.type(within(dialog).getByLabelText('Audio URL'), 'https://example.com/track.mp3')
    await user.click(within(dialog).getByRole('button', { name: 'OK' }))

    const audio = visual.querySelector('audio')
    expect(audio).not.toBeNull()
    expect(audio?.getAttribute('src')).toBe('https://example.com/track.mp3')
  })

  it('inserts a YouTube video from the Insert menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 5, 5)

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'YouTube video' }))
    const dialog = screen.getByRole('dialog', { name: 'Insert YouTube video' })
    await user.type(
      within(dialog).getByLabelText('YouTube URL'),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
    await user.click(within(dialog).getByRole('button', { name: 'OK' }))

    const iframe = visual.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('src')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('shows a third audio source when customAudioPicker is set', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <Editor
        defaultValue="<p>Hello</p>"
        customAudioPicker={{
          text: 'Library',
          description: 'Choose from the audio library',
          buttonCaption: 'Open library',
          onPick,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Audio' }))
    const dialog = screen.getByRole('dialog', { name: 'Insert audio' })
    await user.click(within(dialog).getByRole('radio', { name: 'Library' }))
    await user.click(within(dialog).getByRole('button', { name: 'Open library' }))

    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it('skips the audio dialog when builtin insert is disabled', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <Editor
        defaultValue="<p>Hello</p>"
        disableBuiltinAudioInsert
        customAudioPicker={{
          text: 'Library',
          description: 'Choose from the audio library',
          buttonCaption: 'Open library',
          onPick,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Audio' }))

    expect(onPick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: 'Insert audio' })).not.toBeInTheDocument()
  })

  it('opens page properties from the context menu', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    fireEvent.contextMenu(visual)

    await user.click(screen.getByRole('menuitem', { name: 'Page properties' }))
    expect(screen.getByRole('dialog', { name: 'Page properties' })).toBeInTheDocument()
  })

  it('deletes a page from the context menu after confirmation', async () => {
    const onPagesChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        enableMultiPages
        defaultPages={['<p>One</p>', '<p>Two</p>']}
        onPagesChange={onPagesChange}
      />,
    )
    const surfaces = screen.getAllByRole('textbox', { name: 'Visual editor' })
    await user.click(surfaces[1])
    fireEvent.contextMenu(surfaces[1])

    await user.click(screen.getByRole('menuitem', { name: 'Delete selected page' }))
    await user.click(screen.getByRole('button', { name: 'Delete page' }))

    const lastPages = onPagesChange.mock.calls.at(-1)?.[0] as string[]
    expect(lastPages).toHaveLength(1)
    expect(lastPages[0]).toContain('One')
  })

  it('enables table properties from the context menu inside a table', async () => {
    const user = userEvent.setup()
    render(
      <Editor defaultValue='<table style="border-collapse: collapse"><tbody><tr><td>Cell</td></tr></tbody></table>' />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const cell = visual.querySelector('td') as HTMLTableCellElement
    fireEvent.contextMenu(cell)

    expect(screen.getByRole('menuitem', { name: 'Table properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties' })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties' })).toBeEnabled()

    await user.click(screen.getByRole('menuitem', { name: 'Table properties' }))
    expect(screen.getByRole('dialog', { name: 'Table properties' })).toBeInTheDocument()
  })

  it('grays out table properties in the Table menu when the caret is not in a table', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    await user.click(screen.getByRole('button', { name: 'Table menu' }))
    expect(screen.getByRole('menuitem', { name: 'Table properties…' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Cell properties…' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Row properties…' })).toBeDisabled()
  })

  it('deletes the selected text and records history', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    fireEvent.contextMenu(visual)
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(visual.textContent).toBe('')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(visual.textContent).toBe('Hello')
  })
})

describe('Editor image resize', () => {
  function stubImageBox(
    img: HTMLImageElement,
    box: { left: number; top: number; width: number; height: number },
  ) {
    Object.defineProperty(img, 'offsetWidth', { configurable: true, get: () => box.width })
    Object.defineProperty(img, 'offsetHeight', { configurable: true, get: () => box.height })
    img.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: box.left, y: box.top, width: box.width, height: box.height })
  }

  function selectImage(img: HTMLImageElement) {
    stubImageBox(img, { left: 40, top: 20, width: 200, height: 100 })
    fireEvent.pointerDown(img, { clientX: 80, clientY: 50 })
  }

  it('shows resize handles after clicking an image', () => {
    render(
      <Editor defaultValue='<p><img src="https://example.com/a.png" alt="Chart" style="width: 200px; height: 100px"></p>' />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const img = visual.querySelector('img') as HTMLImageElement
    selectImage(img)

    expect(screen.getByRole('button', { name: 'Resize image width, keep aspect ratio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resize image height, keep aspect ratio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resize image freely' })).toBeInTheDocument()
  })

  it('keeps aspect ratio when dragging the right edge', () => {
    const onChange = vi.fn()
    render(
      <Editor
        defaultValue='<p><img src="https://example.com/a.png" alt="Chart" style="width: 200px; height: 100px"></p>'
        onChange={onChange}
      />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const img = visual.querySelector('img') as HTMLImageElement
    selectImage(img)

    const east = screen.getByRole('button', { name: 'Resize image width, keep aspect ratio' })
    fireEvent.mouseDown(east, { clientX: 240, clientY: 70 })
    fireEvent.mouseMove(document.body, { clientX: 290, clientY: 200 })
    fireEvent.mouseUp(document.body)

    expect(img.style.width).toBe('250px')
    expect(img.style.height).toBe('125px')
    expect(img.style.maxWidth).toBe('')
    expect(onChange).toHaveBeenCalled()
    const html = onChange.mock.calls.at(-1)?.[0] as string
    expect(html).toContain('width: 250px')
    expect(html).toContain('height: 125px')
  })

  it('does not keep aspect ratio when dragging the bottom-right corner', () => {
    render(
      <Editor defaultValue='<p><img src="https://example.com/a.png" alt="Chart" style="width: 200px; height: 100px"></p>' />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const img = visual.querySelector('img') as HTMLImageElement
    selectImage(img)

    const corner = screen.getByRole('button', { name: 'Resize image freely' })
    fireEvent.mouseDown(corner, { clientX: 240, clientY: 120 })
    fireEvent.mouseMove(document.body, { clientX: 280, clientY: 130 })
    fireEvent.mouseUp(document.body)

    expect(img.style.width).toBe('240px')
    expect(img.style.height).toBe('110px')
  })

  it('undoes a completed resize', async () => {
    const user = userEvent.setup()
    render(
      <Editor defaultValue='<p><img src="https://example.com/a.png" alt="Chart" style="width: 200px; height: 100px"></p>' />,
    )
    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    const img = visual.querySelector('img') as HTMLImageElement
    selectImage(img)

    const corner = screen.getByRole('button', { name: 'Resize image freely' })
    fireEvent.mouseDown(corner, { clientX: 240, clientY: 120 })
    fireEvent.mouseMove(document.body, { clientX: 300, clientY: 160 })
    fireEvent.mouseUp(document.body)

    expect(img.style.width).toBe('260px')
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    const restored = visual.querySelector('img') as HTMLImageElement
    expect(restored.style.width).toBe('200px')
    expect(restored.style.height).toBe('100px')
  })
})

describe('Editor comments', () => {
  it('does not show comment chrome by default', () => {
    render(<Editor defaultValue="<p>Hello world</p>" />)
    expect(screen.queryByRole('button', { name: 'Add comment on selection' })).toBeNull()
  })

  it('adds a text comment thread and message', async () => {
    const onCommentsChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
        onCommentsChange={onCommentsChange}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Add comment on selection' }))

    expect(screen.getByRole('dialog', { name: 'Comment' })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Write a comment…'), 'Please review')
    await user.click(screen.getByRole('button', { name: 'Post' }))

    expect(onCommentsChange).toHaveBeenCalled()
    const threads = onCommentsChange.mock.calls.at(-1)?.[0]
    expect(threads?.[0]?.messages[0]?.message).toBe('Please review')
    expect(threads?.[0]?.messages[0]?.userName).toBe('Alice')
    expect(visual.innerHTML).toContain('data-comment-thread')
  })

  it('keeps the comment panel open when adding a comment from Insert menu', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Insert menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Comment' }))

    expect(screen.getByRole('dialog', { name: 'Comment' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Write a comment…')).toHaveFocus()
  })

  it('supports read-only commenting without onChange', async () => {
    const onChange = vi.fn()
    const onCommentsChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        readOnly
        enableComments
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
        onChange={onChange}
        onCommentsChange={onCommentsChange}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Add comment on selection' }))
    await user.type(screen.getByPlaceholderText('Write a comment…'), 'Review note')
    await user.click(screen.getByRole('button', { name: 'Post' }))

    expect(onCommentsChange).toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled()
  })

  it('starts with comments hidden when defaultCommentsVisible is false', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        defaultCommentsVisible={false}
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Show comments' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Hide comments' })).toBeNull()

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Show comments' }))
    await user.click(screen.getByRole('button', { name: 'View menu' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Hide comments' })).toBeInTheDocument()
  })

  it('toggles comment visibility without removing thread data', async () => {
    const onCommentsChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
        onCommentsChange={onCommentsChange}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Add comment on selection' }))
    await user.type(screen.getByPlaceholderText('Write a comment…'), 'Still here')
    await user.click(screen.getByRole('button', { name: 'Post' }))

    const threads = onCommentsChange.mock.calls.at(-1)?.[0]
    expect(threads?.length).toBe(1)

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Hide comments' }))
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Hide comments' })).toBeNull()
    expect(threads?.[0]?.messages[0]?.message).toBe('Still here')
  })

  it('does not show the comment panel when the caret is outside a comment', async () => {
    const threads = [
      {
        id: 'cmt_existing',
        anchor: { type: 'text' as const, text: 'Hello', start: 0, end: 5 },
        messages: [{ id: 'msg_1', userId: 'u1', userName: 'Alice', message: 'Note', createdAt: '2026-01-01T12:00:00.000Z' }],
      },
    ]
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        comments={threads}
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 6, 6)

    expect(screen.queryByRole('dialog', { name: 'Comment' })).toBeNull()
  })

  it('shows the comment panel when the caret is inside a comment', async () => {
    const threads = [
      {
        id: 'cmt_existing',
        anchor: { type: 'text' as const, text: 'Hello', start: 0, end: 5 },
        messages: [{ id: 'msg_1', userId: 'u1', userName: 'Alice', message: 'Note', createdAt: '2026-01-01T12:00:00.000Z' }],
      },
    ]
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        comments={threads}
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 2, 2)

    expect(screen.getByRole('dialog', { name: 'Comment' })).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
  })

  it('closes the comment panel when clicking outside the comment', async () => {
    const user = userEvent.setup()
    const threads = [
      {
        id: 'cmt_existing',
        anchor: { type: 'text' as const, text: 'Hello', start: 0, end: 5 },
        messages: [{ id: 'msg_1', userId: 'u1', userName: 'Alice', message: 'Note', createdAt: '2026-01-01T12:00:00.000Z' }],
      },
    ]
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        comments={threads}
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 2, 2)
    expect(screen.getByRole('dialog', { name: 'Comment' })).toBeInTheDocument()

    await user.pointer({ keys: '[MouseLeft>]', target: visual, offset: 10 })
    await user.pointer({ keys: '[/MouseLeft]' })
    await selectVisualText(visual, 8, 8)

    expect(screen.queryByRole('dialog', { name: 'Comment' })).toBeNull()
  })

  it('closes the comment panel after adding a comment and clicking away', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 0, 5)
    await user.click(screen.getByRole('button', { name: 'Add comment on selection' }))
    expect(screen.getByRole('dialog', { name: 'Comment' })).toBeInTheDocument()

    await user.pointer({ keys: '[MouseLeft>]', target: visual, offset: 10 })
    await user.pointer({ keys: '[/MouseLeft]' })
    await selectVisualText(visual, 8, 8)
    expect(screen.queryByRole('dialog', { name: 'Comment' })).toBeNull()
  })

  it('keeps the comment panel open while replying in the panel', async () => {
    const user = userEvent.setup()
    const threads = [
      {
        id: 'cmt_existing',
        anchor: { type: 'text' as const, text: 'Hello', start: 0, end: 5 },
        messages: [{ id: 'msg_1', userId: 'u1', userName: 'Alice', message: 'Note', createdAt: '2026-01-01T12:00:00.000Z' }],
      },
    ]
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        comments={threads}
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await selectVisualText(visual, 2, 2)
    expect(screen.getByRole('dialog', { name: 'Comment' })).toBeInTheDocument()

    const reply = screen.getByPlaceholderText('Write a reply…')
    await user.click(reply)
    await user.type(reply, 'Follow up')

    expect(screen.getByRole('dialog', { name: 'Comment' })).toBeInTheDocument()
    expect(reply).toHaveValue('Follow up')
  })
})
