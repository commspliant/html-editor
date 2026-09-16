import { fireEvent, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n/LocaleProvider'
import { readImageFileAsDataUrl } from '../../core/image'
import { ImageSourcePicker } from './ImageSourcePicker'

vi.mock('../../core/image', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/image')>()
  return {
    ...actual,
    readImageFileAsDataUrl: vi.fn(),
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('ImageSourcePicker', () => {
  beforeEach(() => {
    vi.mocked(readImageFileAsDataUrl).mockReset()
  })

  it('ignores stale file reads when picks overlap (WE-021)', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    vi.mocked(readImageFileAsDataUrl)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const onSrcChange = vi.fn()
    render(
      <LocaleProvider>
        <ImageSourcePicker src="" onSrcChange={onSrcChange} />
      </LocaleProvider>,
    )

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['a'], 'first.png', { type: 'image/png' })] },
    })
    fireEvent.change(input, {
      target: { files: [new File(['b'], 'second.png', { type: 'image/png' })] },
    })

    first.resolve('data:image/png;base64,FIRST')
    await Promise.resolve()
    expect(onSrcChange).not.toHaveBeenCalled()

    second.resolve('data:image/png;base64,SECOND')
    await waitFor(() => {
      expect(onSrcChange).toHaveBeenCalledTimes(1)
    })
    expect(onSrcChange).toHaveBeenCalledWith('data:image/png;base64,SECOND')
  })
})
