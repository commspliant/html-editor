import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AUTO_SAVE_INTERVAL_MS, useAutoSave, type AutoSaveCallback } from './useAutoSave'

function AutoSaveHarness({
  onAutoSave,
  htmlRef,
}: {
  onAutoSave?: AutoSaveCallback
  htmlRef: { current: string }
}) {
  useAutoSave({ onAutoSave, getHtml: () => htmlRef.current })
  return null
}

async function advanceAutoSaveTick() {
  await act(async () => {
    vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS)
    await Promise.resolve()
  })
}

describe('useAutoSave', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not start a timer when the callback is omitted', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const htmlRef = { current: '<p>Hello</p>' }
    render(<AutoSaveHarness htmlRef={htmlRef} />)

    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it('does not fire when the document is unchanged', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    const htmlRef = { current: '<p>Hello</p>' }
    render(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)

    await advanceAutoSaveTick()
    await advanceAutoSaveTick()

    expect(onAutoSave).not.toHaveBeenCalled()
  })

  it('fires once with the latest HTML after an edit', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    const htmlRef = { current: '<p>Hello</p>' }
    render(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)

    htmlRef.current = '<p>Edited</p>'
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
    expect(onAutoSave).toHaveBeenCalledWith('<p>Edited</p>')
  })

  it('coalesces several edits in the same second into one call', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    const htmlRef = { current: '<p>One</p>' }
    render(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)

    htmlRef.current = '<p>Two</p>'
    htmlRef.current = '<p>Three</p>'
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(1)
    expect(onAutoSave).toHaveBeenCalledWith('<p>Three</p>')
  })

  it('fires again after a later edit', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    const htmlRef = { current: '<p>One</p>' }
    render(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)

    htmlRef.current = '<p>Two</p>'
    await advanceAutoSaveTick()
    await advanceAutoSaveTick()
    htmlRef.current = '<p>Three</p>'
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(2)
    expect(onAutoSave).toHaveBeenNthCalledWith(1, '<p>Two</p>')
    expect(onAutoSave).toHaveBeenNthCalledWith(2, '<p>Three</p>')
  })

  it('stops firing when the callback is unset', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    const htmlRef = { current: '<p>Hello</p>' }
    const { rerender } = render(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)

    rerender(<AutoSaveHarness htmlRef={htmlRef} />)
    htmlRef.current = '<p>Edited</p>'
    await advanceAutoSaveTick()

    expect(onAutoSave).not.toHaveBeenCalled()
  })

  it('does not treat attaching the callback as a change', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn()
    const htmlRef = { current: '<p>Hello</p>' }
    const { rerender } = render(<AutoSaveHarness htmlRef={htmlRef} />)

    htmlRef.current = '<p>Already edited</p>'
    rerender(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)
    await advanceAutoSaveTick()

    expect(onAutoSave).not.toHaveBeenCalled()
  })

  it('does not wait for a slow callback before the next tick', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    let release: (() => void) | undefined
    const onAutoSave = vi.fn((html: string) => {
      if (html === '<p>One</p>') {
        return new Promise<void>((resolve) => {
          release = resolve
        })
      }
    })
    const htmlRef = { current: '<p>Start</p>' }
    render(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)

    htmlRef.current = '<p>One</p>'
    await advanceAutoSaveTick()
    htmlRef.current = '<p>Two</p>'
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenCalledTimes(2)
    expect(onAutoSave).toHaveBeenNthCalledWith(1, '<p>One</p>')
    expect(onAutoSave).toHaveBeenNthCalledWith(2, '<p>Two</p>')
    release?.()
  })

  it('keeps polling after a throwing callback', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const onAutoSave = vi.fn((html: string) => {
      if (html === '<p>Bad</p>') {
        throw new Error('save failed')
      }
    })
    const htmlRef = { current: '<p>Start</p>' }
    render(<AutoSaveHarness onAutoSave={onAutoSave} htmlRef={htmlRef} />)

    htmlRef.current = '<p>Bad</p>'
    await advanceAutoSaveTick()
    htmlRef.current = '<p>Ok</p>'
    await advanceAutoSaveTick()

    expect(onAutoSave).toHaveBeenNthCalledWith(1, '<p>Bad</p>')
    expect(onAutoSave).toHaveBeenNthCalledWith(2, '<p>Ok</p>')
  })
})
