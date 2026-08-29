import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

const editorToolbarRenderSpy = vi.hoisted(() => vi.fn())

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
})
