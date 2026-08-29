import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

const editorToolbarRenderSpy = vi.hoisted(() => vi.fn())
const workspaceHostRenderSpy = vi.hoisted(() => vi.fn())

vi.mock('../toolbar/EditorToolbar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../toolbar/EditorToolbar')>()
  const OriginalToolbar = actual.EditorToolbar

  function SpyEditorToolbar(props: ComponentProps<typeof OriginalToolbar>) {
    editorToolbarRenderSpy()
    return <OriginalToolbar {...props} />
  }

  return {
    ...actual,
    EditorToolbar: SpyEditorToolbar,
  }
})

vi.mock('./EditorWorkspaceHost', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./EditorWorkspaceHost')>()
  const OriginalWorkspaceHost = actual.EditorWorkspaceHost

  function SpyEditorWorkspaceHost(props: ComponentProps<typeof OriginalWorkspaceHost>) {
    workspaceHostRenderSpy()
    return <OriginalWorkspaceHost {...props} />
  }

  return {
    ...actual,
    EditorWorkspaceHost: SpyEditorWorkspaceHost,
  }
})

import { Editor } from './Editor'

describe('Editor chrome render isolation', () => {
  it('does not re-render EditorToolbar when typing without selection change', async () => {
    const user = userEvent.setup()
    render(<Editor defaultValue="<p>Hello</p>" />)

    const visual = screen.getByRole('textbox', { name: 'Visual editor' })
    await user.click(visual)
    await user.type(visual, 'x')
    editorToolbarRenderSpy.mockClear()

    await user.type(visual, 'abcdefghij')

    expect(editorToolbarRenderSpy).not.toHaveBeenCalled()
  })

  it('re-renders EditorWorkspaceHost when comment visibility toggles', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        defaultValue="<p>Hello world</p>"
        enableComments
        commentAuthor={{ userId: 'u1', userName: 'Alice' }}
      />,
    )

    workspaceHostRenderSpy.mockClear()

    await user.click(screen.getByRole('button', { name: 'View menu' }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Hide comments' }))

    expect(workspaceHostRenderSpy).toHaveBeenCalled()
  })

  it('re-renders EditorWorkspaceHost when customFonts change', () => {
    const { rerender } = render(
      <Editor
        defaultValue='<p><span style="font-family: Roboto, sans-serif">Hello</span></p>'
        customFonts={[{ name: 'Roboto', family: 'Roboto, sans-serif', css: 'https://example.com/roboto.css' }]}
      />,
    )

    workspaceHostRenderSpy.mockClear()

    rerender(
      <Editor
        defaultValue='<p><span style="font-family: Pacifico, cursive">Hello</span></p>'
        customFonts={[{ name: 'Pacifico', family: 'Pacifico, cursive', css: 'https://example.com/pacifico.css' }]}
      />,
    )

    expect(workspaceHostRenderSpy).toHaveBeenCalled()
  })
})
