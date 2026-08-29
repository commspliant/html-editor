import { describe, expect, it, vi } from 'vitest'
import { createCommandContext as context } from '../../test/commandContext'
import { createViewCommands, createViewQueries } from './commands'

describe('createViewCommands', () => {
  it('switches to visual mode', () => {
    const setMode = vi.fn()
    const commands = createViewCommands(context({ getMode: () => 'html', setMode }))

    commands.setVisualMode()

    expect(setMode).toHaveBeenCalledWith('visual')
  })

  it('switches to html mode', () => {
    const setMode = vi.fn()
    const commands = createViewCommands(context({ setMode }))

    commands.setHtmlMode()

    expect(setMode).toHaveBeenCalledWith('html')
  })

  it('toggles fullscreen on and off', () => {
    const setFullscreen = vi.fn()
    const commands = createViewCommands(context({ getFullscreen: () => false, setFullscreen }))

    commands.toggleFullscreen()

    expect(setFullscreen).toHaveBeenCalledWith(true)

    const exit = createViewCommands(context({ getFullscreen: () => true, setFullscreen }))
    exit.toggleFullscreen()

    expect(setFullscreen).toHaveBeenCalledWith(false)
  })

  it('opens the customize toolbar dialog', () => {
    const openCustomizeToolbar = vi.fn()
    const commands = createViewCommands(context({ openCustomizeToolbar }))

    commands.openCustomizeToolbar()

    expect(openCustomizeToolbar).toHaveBeenCalledTimes(1)
  })

  it('opens the document preview dialog', () => {
    const openDocumentPreview = vi.fn()
    const commands = createViewCommands(context({ openDocumentPreview }))

    commands.openDocumentPreview()

    expect(openDocumentPreview).toHaveBeenCalledTimes(1)
  })

  it('toggles read aloud', () => {
    const toggleReadAloud = vi.fn()
    const commands = createViewCommands(context({ toggleReadAloud }))

    commands.toggleReadAloud()

    expect(toggleReadAloud).toHaveBeenCalledTimes(1)
  })

  it('sets light and dark chrome modes', () => {
    const setDarkMode = vi.fn()
    const commands = createViewCommands(context({ setDarkMode }))

    commands.setDarkMode()
    expect(setDarkMode).toHaveBeenCalledWith(true)

    commands.setLightMode()
    expect(setDarkMode).toHaveBeenCalledWith(false)
  })

  it('sets toolbar dock position', () => {
    const setToolbarPosition = vi.fn()
    const commands = createViewCommands(context({ setToolbarPosition }))

    commands.setToolbarPositionTop()
    expect(setToolbarPosition).toHaveBeenCalledWith('top')
    commands.setToolbarPositionLeft()
    expect(setToolbarPosition).toHaveBeenCalledWith('left')
    commands.setToolbarPositionRight()
    expect(setToolbarPosition).toHaveBeenCalledWith('right')
    commands.setToolbarPositionBottom()
    expect(setToolbarPosition).toHaveBeenCalledWith('bottom')
  })

  it('sets page zoom presets', () => {
    const setPageZoom = vi.fn()
    const commands = createViewCommands(context({ setPageZoom }))

    commands.setPageZoomFitWidth()
    expect(setPageZoom).toHaveBeenCalledWith('fitWidth')
    commands.setPageZoom100()
    expect(setPageZoom).toHaveBeenCalledWith(100)
    commands.setPageZoom200()
    expect(setPageZoom).toHaveBeenCalledWith(200)
  })
})

describe('createViewQueries', () => {
  it('reports the current mode', () => {
    const queries = createViewQueries(context({ getMode: () => 'html' }))

    expect(queries.isVisualMode()).toBe(false)
    expect(queries.isHtmlMode()).toBe(true)
  })

  it('reports fullscreen state', () => {
    expect(createViewQueries(context({ getFullscreen: () => false })).isFullscreen()).toBe(false)
    expect(createViewQueries(context({ getFullscreen: () => true })).isFullscreen()).toBe(true)
  })

  it('reports chrome theme', () => {
    expect(createViewQueries(context({ getDarkMode: () => false })).isLightMode()).toBe(true)
    expect(createViewQueries(context({ getDarkMode: () => false })).isDarkMode()).toBe(false)
    expect(createViewQueries(context({ getDarkMode: () => true })).isLightMode()).toBe(false)
    expect(createViewQueries(context({ getDarkMode: () => true })).isDarkMode()).toBe(true)
  })

  it('reports toolbar dock position', () => {
    expect(createViewQueries(context({ getToolbarPosition: () => 'top' })).isToolbarPositionTop()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'left' })).isToolbarPositionLeft()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'right' })).isToolbarPositionRight()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'bottom' })).isToolbarPositionBottom()).toBe(true)
    expect(createViewQueries(context({ getToolbarPosition: () => 'left' })).isToolbarPositionTop()).toBe(false)
  })

  it('reports read aloud state', () => {
    expect(createViewQueries(context({ isReadingAloud: () => false })).isReadingAloud()).toBe(false)
    expect(createViewQueries(context({ isReadingAloud: () => true })).isReadingAloud()).toBe(true)
    expect(createViewQueries(context({ canReadAloud: () => true })).canReadAloud()).toBe(true)
    expect(createViewQueries(context({ canReadAloud: () => false })).canReadAloud()).toBe(false)
  })

  it('reports page zoom preset', () => {
    expect(createViewQueries(context({ getPageZoom: () => 'fitWidth' })).isPageZoomFitWidth()).toBe(true)
    expect(createViewQueries(context({ getPageZoom: () => 100 })).isPageZoom100()).toBe(true)
    expect(createViewQueries(context({ getPageZoom: () => 'fitPage' })).isPageZoomFitWidth()).toBe(false)
  })
})
