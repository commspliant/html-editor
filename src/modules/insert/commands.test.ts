import { describe, expect, it, vi } from 'vitest'
import { createCommandContext as context } from '../../test/commandContext'
import { defaultLinkAttrs } from '../../core/link'
import { defaultImagePropertiesApply } from '../../core/imageProperties'
import { createInsertCommands, createInsertQueries } from './commands'

describe('createInsertCommands', () => {
  it('opens and applies the link dialog', () => {
    const openLinkDialog = vi.fn()
    const applyLink = vi.fn()
    const commands = createInsertCommands(context({ openLinkDialog, applyLink }))

    commands.openLinkDialog()
    commands.openLinkDialog('bookmark')
    commands.applyLink(defaultLinkAttrs({ href: 'https://example.com', targetBlank: true }))

    expect(openLinkDialog.mock.calls).toEqual([[undefined], ['bookmark']])
    expect(applyLink).toHaveBeenCalledWith(
      defaultLinkAttrs({
        href: 'https://example.com',
        targetBlank: true,
      }),
    )
  })

  it('opens and applies the bookmark dialog', () => {
    const openBookmarkDialog = vi.fn()
    const applyBookmark = vi.fn()
    const commands = createInsertCommands(context({ openBookmarkDialog, applyBookmark }))

    commands.openBookmarkDialog()
    commands.applyBookmark('intro')

    expect(openBookmarkDialog).toHaveBeenCalledTimes(1)
    expect(applyBookmark).toHaveBeenCalledWith('intro')
  })

  it('opens and applies the image dialog', () => {
    const openImageDialog = vi.fn()
    const applyImage = vi.fn()
    const commands = createInsertCommands(context({ openImageDialog, applyImage }))

    commands.openImageDialog()
    commands.applyImage({ src: 'https://example.com/a.png', alt: 'Chart', title: 'Q1' })

    expect(openImageDialog).toHaveBeenCalledTimes(1)
    expect(applyImage).toHaveBeenCalledWith({
      src: 'https://example.com/a.png',
      alt: 'Chart',
      title: 'Q1',
    })
  })

  it('opens page and paragraph background image dialogs', () => {
    const openPageBackgroundImage = vi.fn()
    const openParagraphBackgroundImage = vi.fn()
    const commands = createInsertCommands(
      context({ openPageBackgroundImage, openParagraphBackgroundImage }),
    )

    commands.openPageBackgroundImage()
    commands.openParagraphBackgroundImage()

    expect(openPageBackgroundImage).toHaveBeenCalledTimes(1)
    expect(openParagraphBackgroundImage).toHaveBeenCalledTimes(1)
  })

  it('opens and applies the audio dialog', () => {
    const openAudioDialog = vi.fn()
    const applyAudio = vi.fn()
    const commands = createInsertCommands(context({ openAudioDialog, applyAudio }))

    commands.openAudioDialog()
    commands.applyAudio({ src: 'https://example.com/track.mp3', title: 'Intro' })

    expect(openAudioDialog).toHaveBeenCalledTimes(1)
    expect(applyAudio).toHaveBeenCalledWith({
      src: 'https://example.com/track.mp3',
      title: 'Intro',
    })
  })

  it('opens and applies the youtube dialog', () => {
    const openYoutubeDialog = vi.fn()
    const applyYoutube = vi.fn()
    const commands = createInsertCommands(context({ openYoutubeDialog, applyYoutube }))

    commands.openYoutubeDialog()
    commands.applyYoutube({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Demo',
    })

    expect(openYoutubeDialog).toHaveBeenCalledTimes(1)
    expect(applyYoutube).toHaveBeenCalledWith({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Demo',
    })
  })

  it('opens image properties', () => {
    const openImageProperties = vi.fn()
    const commands = createInsertCommands(context({ openImageProperties }))

    commands.openImageProperties()
    commands.openImageProperties('advanced')

    expect(openImageProperties.mock.calls).toEqual([[undefined], ['advanced']])
  })

  it('applies image properties', () => {
    const applyImageProperties = vi.fn()
    const commands = createInsertCommands(context({ applyImageProperties }))
    const draft = defaultImagePropertiesApply({
      sizeMode: 'width',
      width: { value: 50, unit: '%' },
    })

    commands.applyImageProperties(draft)

    expect(applyImageProperties).toHaveBeenCalledWith(draft)
  })

  it('inserts a horizontal rule', () => {
    const insertHorizontalRule = vi.fn()
    const commands = createInsertCommands(context({ insertHorizontalRule }))

    commands.insertHorizontalRule()

    expect(insertHorizontalRule).toHaveBeenCalledTimes(1)
  })

  it('inserts a page break', () => {
    const insertPageBreak = vi.fn()
    const commands = createInsertCommands(context({ insertPageBreak }))

    commands.insertPageBreak()

    expect(insertPageBreak).toHaveBeenCalledTimes(1)
  })

  it('opens delete page confirmation', () => {
    const deletePage = vi.fn()
    const commands = createInsertCommands(context({ deletePage }))

    commands.deletePage()

    expect(deletePage).toHaveBeenCalledTimes(1)
  })
})

describe('createInsertQueries', () => {
  it('reports whether the selection is in a link', () => {
    expect(createInsertQueries(context({ isLink: () => true })).isLink()).toBe(true)
    expect(createInsertQueries(context()).isLink()).toBe(false)
  })

  it('reports whether an image is selected', () => {
    expect(createInsertQueries(context({ isImageSelected: () => true })).isImageSelected()).toBe(true)
    expect(createInsertQueries(context()).isImageSelected()).toBe(false)
  })

  it('reports whether the selected page can be deleted', () => {
    expect(createInsertQueries(context({ canDeletePage: () => true })).canDeletePage()).toBe(true)
    expect(createInsertQueries(context()).canDeletePage()).toBe(false)
  })

  it('reports whether page and paragraph background images can be inserted', () => {
    expect(
      createInsertQueries(context({ canInsertPageBackgroundImage: () => true }))
        .canInsertPageBackgroundImage(),
    ).toBe(true)
    expect(createInsertQueries(context()).canInsertPageBackgroundImage()).toBe(false)
    expect(
      createInsertQueries(context({ canInsertParagraphBackgroundImage: () => true }))
        .canInsertParagraphBackgroundImage(),
    ).toBe(true)
    expect(createInsertQueries(context()).canInsertParagraphBackgroundImage()).toBe(false)
  })
})
