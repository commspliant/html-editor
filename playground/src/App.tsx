import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  Editor,
  type AllowedChrome,
  type CustomAction,
  type CustomActionApi,
  type CustomAudioInsert,
  type CustomAudioPicker,
  type CustomFont,
  type CustomImageInsert,
  type CustomImagePicker,
  type CustomParagraphStyle,
  type CustomVideoInsert,
  type CustomVideoPicker,
  type EditorBorder,
  type Locale,
  type ToolbarCustomization,
  type ToolbarCustomizationPersistence,
  type DarkModePersistence,
  type ToolbarPosition,
  type ToolbarPositionPersistence,
} from 'commspliant-html-editor'
import { playgroundMessages } from './i18n/messages'
import { CodeExampleDialog } from './CodeExampleDialog'
import { DocumentationPage } from './DocumentationPage'
import type { ExampleBlockId } from './codeExamples'

type PageView = 'playground' | 'documentation'
type MenuAppearance = 'default' | 'example'
type BorderAppearance = 'default' | 'none' | 'rounded'
type ImagePickerMode = 'default' | 'custom' | 'direct'
type AudioPickerMode = 'default' | 'custom' | 'direct'
type VideoPickerMode = 'default' | 'custom' | 'direct'
type ToolbarPersistMode = 'browser' | 'api'
type DarkModePersistMode = 'browser' | 'api'
type ToolbarPositionPersistMode = 'browser' | 'api'
type AllowedChromePreset = 'all' | 'fileEdit' | 'format'
type FileCallbacksMode = 'local' | 'host'

const PLAYGROUND_HOST_OPEN_SAMPLE = '<p>Sample document from mock host storage</p>'

const FILE_EDIT_CHROME: AllowedChrome = {
  menus: ['file', 'edit'],
  toolbar: ['save', 'open', 'print', 'undo', 'redo'],
}

const FORMAT_CHROME: AllowedChrome = {
  menus: ['format'],
  toolbar: [
    'fontFamily',
    'paragraphStyle',
    'fontSize',
    'fontColor',
    'highlightColor',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'clearFormatting',
    'alignLeft',
    'alignCenter',
    'alignRight',
    'alignJustify',
    'indent',
    'outdent',
    'bulletList',
    'numberedList',
  ],
}

const PLAYGROUND_GALLERY: { src: string; altKey: 'imageGalleryMountain' | 'imageGalleryLake' }[] = [
  { src: 'https://picsum.photos/id/1015/400/300', altKey: 'imageGalleryMountain' },
  { src: 'https://picsum.photos/id/1016/400/300', altKey: 'imageGalleryLake' },
]

const PLAYGROUND_AUDIO_GALLERY: {
  src: string
  titleKey: 'audioGalleryIntro' | 'audioGalleryOutro'
}[] = [
  {
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    titleKey: 'audioGalleryIntro',
  },
  {
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    titleKey: 'audioGalleryOutro',
  },
]

const PLAYGROUND_VIDEO_GALLERY: {
  src: string
  titleKey: 'videoGalleryYoutube' | 'videoGalleryHosted'
}[] = [
  {
    src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    titleKey: 'videoGalleryYoutube',
  },
  {
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    titleKey: 'videoGalleryHosted',
  },
]

const PLAYGROUND_STYLE_DELAY_MS = 800
const PLAYGROUND_TOOLBAR_DELAY_MS = 800

let playgroundCustomStyles: CustomParagraphStyle[] = []

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function loadPlaygroundCustomStyles() {
  await delay(PLAYGROUND_STYLE_DELAY_MS)
  return playgroundCustomStyles.map((style) => ({
    ...style,
    font: { ...style.font, marks: { ...style.font.marks } },
  }))
}

async function savePlaygroundCustomStyle(style: CustomParagraphStyle) {
  await delay(PLAYGROUND_STYLE_DELAY_MS)
  const index = playgroundCustomStyles.findIndex((item) => item.id === style.id)
  if (index >= 0) {
    playgroundCustomStyles[index] = style
    return
  }
  playgroundCustomStyles = [...playgroundCustomStyles, style]
}

async function deletePlaygroundCustomStyle(id: string) {
  await delay(PLAYGROUND_STYLE_DELAY_MS)
  playgroundCustomStyles = playgroundCustomStyles.filter((item) => item.id !== id)
}

let playgroundToolbarSettings: ToolbarCustomization | null = null

async function loadPlaygroundToolbarSettings() {
  await delay(PLAYGROUND_TOOLBAR_DELAY_MS)
  return playgroundToolbarSettings
}

async function savePlaygroundToolbarSettings(settings: ToolbarCustomization | null) {
  await delay(PLAYGROUND_TOOLBAR_DELAY_MS)
  playgroundToolbarSettings = settings
}

let playgroundDarkMode: boolean | null = null

async function loadPlaygroundDarkMode() {
  await delay(PLAYGROUND_TOOLBAR_DELAY_MS)
  return playgroundDarkMode
}

async function savePlaygroundDarkMode(darkMode: boolean) {
  await delay(PLAYGROUND_TOOLBAR_DELAY_MS)
  playgroundDarkMode = darkMode
}

let playgroundToolbarPosition: ToolbarPosition | null = null

async function loadPlaygroundToolbarPosition() {
  await delay(PLAYGROUND_TOOLBAR_DELAY_MS)
  return playgroundToolbarPosition
}

async function savePlaygroundToolbarPosition(position: ToolbarPosition) {
  await delay(PLAYGROUND_TOOLBAR_DELAY_MS)
  playgroundToolbarPosition = position
}

const PLAYGROUND_FILE_DELAY_MS = 400

let playgroundDocumentHtml: string | string[] | null = null

async function savePlaygroundDocument(html: string | string[]) {
  await delay(PLAYGROUND_FILE_DELAY_MS)
  playgroundDocumentHtml = html
}

async function loadPlaygroundDocument(): Promise<string | string[] | null> {
  await delay(PLAYGROUND_FILE_DELAY_MS)
  return playgroundDocumentHtml ?? PLAYGROUND_HOST_OPEN_SAMPLE
}

const exampleMenu = {
  menuColor: '#1e3a5f',
  menuBackground: '#fef3c7',
  menuFontSize: '1.05rem',
  menuFontFamily: 'Georgia, serif',
} as const

const roundedBorder: EditorBorder = {
  width: '2px',
  color: '#2563eb',
  radius: '12px',
  shadow: '0 8px 24px rgb(0 0 0 / 15%)',
}

const SIDEBAR_DEFAULT_WIDTH = 280
const SIDEBAR_MIN_WIDTH = 200
const SIDEBAR_KEYBOARD_STEP = 16

function clampSidebarWidth(width: number, workspaceWidth: number) {
  const max = Math.max(SIDEBAR_MIN_WIDTH, workspaceWidth * 0.5)
  return Math.min(max, Math.max(SIDEBAR_MIN_WIDTH, width))
}

function ControlGroupHeading({
  label,
  examplesLabel,
  onOpenExamples,
}: {
  label: string
  examplesLabel: string
  onOpenExamples: () => void
}) {
  return (
    <div className="control-group-heading">
      <span className="control-group-label">{label}</span>
      <button type="button" className="code-examples-link" onClick={onOpenExamples}>
        {examplesLabel}
      </button>
    </div>
  )
}

const playgroundGoogleFonts: CustomFont[] = [
  {
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    css: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
  },
  {
    name: 'Pacifico',
    family: 'Pacifico, cursive',
    css: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  },
  {
    name: 'Source Serif 4',
    family: '"Source Serif 4", serif',
    css: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,700&display=swap',
  },
]

export function App() {
  const [playgroundOpen, setPlaygroundOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH)
  const [resizing, setResizing] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')
  const [menuVisible, setMenuVisible] = useState(true)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [allowedChromePreset, setAllowedChromePreset] = useState<AllowedChromePreset>('all')
  const [fullscreen, setFullscreen] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [disableHtmlFileDrop, setDisableHtmlFileDrop] = useState(false)
  const [autoSave, setAutoSave] = useState(false)
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState<number | null>(null)
  const [fileCallbacksMode, setFileCallbacksMode] = useState<FileCallbacksMode>('local')
  const [multiPagesEnabled, setMultiPagesEnabled] = useState(false)
  const [lastHostSaveAt, setLastHostSaveAt] = useState<number | null>(null)
  const [hostDocumentStored, setHostDocumentStored] = useState(() => playgroundDocumentHtml !== null)
  const [customActionsEnabled, setCustomActionsEnabled] = useState(true)
  const [customParagraphStylesEnabled, setCustomParagraphStylesEnabled] = useState(true)
  const [menuAppearance, setMenuAppearance] = useState<MenuAppearance>('default')
  const [borderAppearance, setBorderAppearance] = useState<BorderAppearance>('default')
  const [googleFonts, setGoogleFonts] = useState(false)
  const [imagePickerMode, setImagePickerMode] = useState<ImagePickerMode>('default')
  const [audioPickerMode, setAudioPickerMode] = useState<AudioPickerMode>('default')
  const [videoPickerMode, setVideoPickerMode] = useState<VideoPickerMode>('default')
  const [toolbarPersistMode, setToolbarPersistMode] = useState<ToolbarPersistMode>('browser')
  const [darkModePersistMode, setDarkModePersistMode] = useState<DarkModePersistMode>('browser')
  const [initialDarkMode, setInitialDarkMode] = useState(false)
  const [toolbarPositionPersistMode, setToolbarPositionPersistMode] =
    useState<ToolbarPositionPersistMode>('browser')
  const [initialToolbarPosition, setInitialToolbarPosition] = useState<ToolbarPosition>('top')
  const [imageInsert, setImageInsert] = useState<((image: CustomImageInsert) => void) | null>(null)
  const [audioInsert, setAudioInsert] = useState<((audio: CustomAudioInsert) => void) | null>(null)
  const [videoInsert, setVideoInsert] = useState<((video: CustomVideoInsert) => void) | null>(null)
  const [aiApi, setAiApi] = useState<CustomActionApi | null>(null)
  const [aiHtml, setAiHtml] = useState('')
  const [aiFormatted, setAiFormatted] = useState('')
  const [exampleBlock, setExampleBlock] = useState<ExampleBlockId | null>(null)
  const [pageView, setPageView] = useState<PageView>('playground')
  const workspaceRef = useRef<HTMLDivElement>(null)
  const t = playgroundMessages[locale]

  const measuredWidth = workspaceRef.current?.getBoundingClientRect().width
  const sidebarMax = Math.max(
    SIDEBAR_MIN_WIDTH,
    (measuredWidth && measuredWidth > 0 ? measuredWidth : 800) * 0.5,
  )

  const applySidebarWidth = useCallback((clientX: number) => {
    const workspace = workspaceRef.current
    if (!workspace) return
    const rect = workspace.getBoundingClientRect()
    setSidebarWidth(clampSidebarWidth(clientX - rect.left, rect.width))
  }, [])

  const onSplitterPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!playgroundOpen) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setResizing(true)
    applySidebarWidth(event.clientX)
  }

  const onSplitterPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    applySidebarWidth(event.clientX)
  }

  const onSplitterPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setResizing(false)
  }

  const onSplitterKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!playgroundOpen) return
    const width = workspaceRef.current?.getBoundingClientRect().width ?? sidebarWidth * 2
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setSidebarWidth((current) => clampSidebarWidth(current - SIDEBAR_KEYBOARD_STEP, width))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setSidebarWidth((current) => clampSidebarWidth(current + SIDEBAR_KEYBOARD_STEP, width))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setSidebarWidth(SIDEBAR_MIN_WIDTH)
    } else if (event.key === 'End') {
      event.preventDefault()
      setSidebarWidth(clampSidebarWidth(width * 0.5, width))
    }
  }

  const allowedChrome = useMemo<AllowedChrome | undefined>(() => {
    if (allowedChromePreset === 'fileEdit') return FILE_EDIT_CHROME
    if (allowedChromePreset === 'format') return FORMAT_CHROME
    return undefined
  }, [allowedChromePreset])

  const customActions = useMemo<CustomAction[]>(
    () => [
      {
        id: 'ai',
        label: t.commandAi,
        showIn: 'both',
        menu: { id: 'tools', label: t.menuTools },
        onAction: (api) => {
          setAiApi(api)
          setAiHtml(t.aiSample)
          setAiFormatted('')
        },
      },
    ],
    [t],
  )

  const customImagePicker = useMemo<CustomImagePicker | undefined>(() => {
    if (imagePickerMode === 'default') return undefined
    return {
      text: t.imagePickerTab,
      description: t.imagePickerDescription,
      buttonCaption: t.imagePickerButton,
      onPick: (insertImage) => {
        setImageInsert(() => insertImage)
      },
    }
  }, [imagePickerMode, t])

  const customAudioPicker = useMemo<CustomAudioPicker | undefined>(() => {
    if (audioPickerMode === 'default') return undefined
    return {
      text: t.audioPickerTab,
      description: t.audioPickerDescription,
      buttonCaption: t.audioPickerButton,
      onPick: (insertAudio) => {
        setAudioInsert(() => insertAudio)
      },
    }
  }, [audioPickerMode, t])

  const customVideoPicker = useMemo<CustomVideoPicker | undefined>(() => {
    if (videoPickerMode === 'default') return undefined
    return {
      text: t.videoPickerTab,
      description: t.videoPickerDescription,
      buttonCaption: t.videoPickerButton,
      onPick: (insertVideo) => {
        setVideoInsert(() => insertVideo)
      },
    }
  }, [videoPickerMode, t])

  const toolbarCustomization = useMemo<ToolbarCustomizationPersistence | undefined>(() => {
    if (toolbarPersistMode !== 'api') return undefined
    return {
      load: loadPlaygroundToolbarSettings,
      save: savePlaygroundToolbarSettings,
    }
  }, [toolbarPersistMode])

  const darkModePersistence = useMemo<DarkModePersistence | undefined>(() => {
    if (darkModePersistMode !== 'api') return undefined
    return {
      load: loadPlaygroundDarkMode,
      save: savePlaygroundDarkMode,
    }
  }, [darkModePersistMode])

  const toolbarPositionPersistence = useMemo<ToolbarPositionPersistence | undefined>(() => {
    if (toolbarPositionPersistMode !== 'api') return undefined
    return {
      load: loadPlaygroundToolbarPosition,
      save: savePlaygroundToolbarPosition,
    }
  }, [toolbarPositionPersistMode])

  const onAutoSave = useCallback((_html: string | string[]) => {
    setLastAutoSaveAt(Date.now())
  }, [])

  const onSave = useCallback(async (html: string | string[]) => {
    await savePlaygroundDocument(html)
    setLastHostSaveAt(Date.now())
    setHostDocumentStored(true)
  }, [])

  const onOpen = useCallback(async () => loadPlaygroundDocument(), [])

  const autoSaveWhen =
    lastAutoSaveAt == null
      ? t.autoSaveNever
      : new Date(lastAutoSaveAt).toLocaleString(locale, {
          dateStyle: 'medium',
          timeStyle: 'medium',
        })

  const hostSaveWhen =
    lastHostSaveAt == null
      ? t.fileCallbacksNever
      : new Date(lastHostSaveAt).toLocaleString(locale, {
          dateStyle: 'medium',
          timeStyle: 'medium',
        })

  const hostStorageStatus = hostDocumentStored ? t.fileCallbacksStored : t.fileCallbacksEmpty

  return (
    <main className="page">
      <header className="page-header">
        <a
          className="page-brand"
          href="https://commspliant.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.brandHomeAria}
        >
          <img className="page-logo" src="/logo.svg" alt="" width="109" height="28" />
          <span className="page-wordmark">{t.brandWordmark}</span>
        </a>
        <nav className="page-nav" aria-label={t.navAria}>
          <button
            type="button"
            className="page-nav-button"
            aria-current={pageView === 'playground' ? 'page' : undefined}
            aria-pressed={pageView === 'playground'}
            onClick={() => setPageView('playground')}
          >
            {t.navPlayground}
          </button>
          <button
            type="button"
            className="page-nav-button"
            aria-current={pageView === 'documentation' ? 'page' : undefined}
            aria-pressed={pageView === 'documentation'}
            onClick={() => setPageView('documentation')}
          >
            {t.navDocumentation}
          </button>
        </nav>
      </header>
      {pageView === 'documentation' ? (
        <DocumentationPage label={t.navDocumentation} />
      ) : (
      <div
        ref={workspaceRef}
        className={resizing ? 'workspace workspace-resizing' : 'workspace'}
      >
        <aside
          className={playgroundOpen ? 'sidebar' : 'sidebar sidebar-collapsed'}
          style={playgroundOpen ? { width: sidebarWidth } : undefined}
          aria-label={t.sectionPlayground}
        >
          <div className="sidebar-header">
            {playgroundOpen ? (
              <h1 className="sidebar-title">{t.sectionPlayground}</h1>
            ) : (
              <span className="sidebar-rail-title">{t.sectionPlayground}</span>
            )}
            <button
              type="button"
              className="locale-toggle-button sidebar-toggle"
              aria-expanded={playgroundOpen}
              aria-controls={playgroundOpen ? 'playground-controls' : undefined}
              aria-label={playgroundOpen ? t.playgroundClose : t.playgroundOpen}
              onClick={() => setPlaygroundOpen((open) => !open)}
            >
              {playgroundOpen ? t.playgroundClose : '›'}
            </button>
          </div>
          {playgroundOpen ? (
            <div id="playground-controls" className="sidebar-body">
              <div className="header-controls">
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.chromeAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('chrome')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.chromeAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={menuVisible}
                      onClick={() => setMenuVisible((visible) => !visible)}
                    >
                      {t.menuVisible}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={toolbarVisible}
                      onClick={() => setToolbarVisible((visible) => !visible)}
                    >
                      {t.toolbarVisible}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={fullscreen}
                      onClick={() => setFullscreen((open) => !open)}
                    >
                      {t.fullscreen}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.allowedChromeAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('allowedChrome')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.allowedChromeAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={allowedChromePreset === 'all'}
                      onClick={() => setAllowedChromePreset('all')}
                    >
                      {t.allowedChromeAll}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={allowedChromePreset === 'fileEdit'}
                      onClick={() => setAllowedChromePreset('fileEdit')}
                    >
                      {t.allowedChromeFileEdit}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={allowedChromePreset === 'format'}
                      onClick={() => setAllowedChromePreset('format')}
                    >
                      {t.allowedChromeFormat}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.readOnlyAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('readOnly')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.readOnlyAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!readOnly}
                      onClick={() => setReadOnly(false)}
                    >
                      {t.readOnlyOff}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={readOnly}
                      onClick={() => setReadOnly(true)}
                    >
                      {t.readOnly}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.htmlFileDropAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('htmlFileDrop')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.htmlFileDropAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!disableHtmlFileDrop}
                      onClick={() => setDisableHtmlFileDrop(false)}
                    >
                      {t.htmlFileDropAllowed}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={disableHtmlFileDrop}
                      onClick={() => setDisableHtmlFileDrop(true)}
                    >
                      {t.htmlFileDropDisabled}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.multiPagesAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('multiPages')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.multiPagesAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!multiPagesEnabled}
                      onClick={() => setMultiPagesEnabled(false)}
                    >
                      {t.multiPagesOff}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={multiPagesEnabled}
                      onClick={() => setMultiPagesEnabled(true)}
                    >
                      {t.multiPagesOn}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.fileCallbacksAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('fileCallbacks')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.fileCallbacksAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={fileCallbacksMode === 'local'}
                      onClick={() => setFileCallbacksMode('local')}
                    >
                      {t.fileCallbacksLocal}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={fileCallbacksMode === 'host'}
                      onClick={() => setFileCallbacksMode('host')}
                    >
                      {t.fileCallbacksHost}
                    </button>
                  </div>
                  {fileCallbacksMode === 'host' ? (
                    <>
                      <p className="control-group-status">
                        {t.fileCallbacksLastSave}: {hostSaveWhen}
                      </p>
                      <p className="control-group-status">{hostStorageStatus}</p>
                    </>
                  ) : null}
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.autoSaveAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('autoSave')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.autoSaveAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!autoSave}
                      onClick={() => setAutoSave(false)}
                    >
                      {t.autoSaveOff}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={autoSave}
                      onClick={() => setAutoSave(true)}
                    >
                      {t.autoSaveOn}
                    </button>
                  </div>
                  <p className="control-group-status">
                    {t.autoSaveLast}: {autoSaveWhen}
                  </p>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.customActionsAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('customActions')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.customActionsAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!customActionsEnabled}
                      onClick={() => setCustomActionsEnabled(false)}
                    >
                      {t.customActionsOff}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={customActionsEnabled}
                      onClick={() => setCustomActionsEnabled(true)}
                    >
                      {t.customActionsOn}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceMenuAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('menu')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceMenuAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={menuAppearance === 'default'}
                      onClick={() => setMenuAppearance('default')}
                    >
                      {t.menuDefault}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={menuAppearance === 'example'}
                      onClick={() => setMenuAppearance('example')}
                    >
                      {t.menuExample}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceBorderAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('border')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceBorderAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={borderAppearance === 'default'}
                      onClick={() => setBorderAppearance('default')}
                    >
                      {t.borderDefault}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={borderAppearance === 'none'}
                      onClick={() => setBorderAppearance('none')}
                    >
                      {t.borderNone}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={borderAppearance === 'rounded'}
                      onClick={() => setBorderAppearance('rounded')}
                    >
                      {t.borderRounded}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceFontsAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('fonts')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceFontsAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!googleFonts}
                      onClick={() => setGoogleFonts(false)}
                    >
                      {t.fontsDefault}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={googleFonts}
                      onClick={() => setGoogleFonts(true)}
                    >
                      {t.fontsGoogle}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.customParagraphStylesAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('customParagraphStyles')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.customParagraphStylesAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!customParagraphStylesEnabled}
                      onClick={() => setCustomParagraphStylesEnabled(false)}
                    >
                      {t.customParagraphStylesOff}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={customParagraphStylesEnabled}
                      onClick={() => setCustomParagraphStylesEnabled(true)}
                    >
                      {t.customParagraphStylesOn}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceImageAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('image')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceImageAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={imagePickerMode === 'default'}
                      onClick={() => setImagePickerMode('default')}
                    >
                      {t.imagePickerDefault}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={imagePickerMode === 'custom'}
                      onClick={() => setImagePickerMode('custom')}
                    >
                      {t.imagePickerCustom}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={imagePickerMode === 'direct'}
                      onClick={() => setImagePickerMode('direct')}
                    >
                      {t.imagePickerDirect}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceAudioAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('audio')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceAudioAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={audioPickerMode === 'default'}
                      onClick={() => setAudioPickerMode('default')}
                    >
                      {t.audioPickerDefault}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={audioPickerMode === 'custom'}
                      onClick={() => setAudioPickerMode('custom')}
                    >
                      {t.audioPickerCustom}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={audioPickerMode === 'direct'}
                      onClick={() => setAudioPickerMode('direct')}
                    >
                      {t.audioPickerDirect}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceVideoAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('youtube')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceVideoAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={videoPickerMode === 'default'}
                      onClick={() => setVideoPickerMode('default')}
                    >
                      {t.videoPickerDefault}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={videoPickerMode === 'custom'}
                      onClick={() => setVideoPickerMode('custom')}
                    >
                      {t.videoPickerCustom}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={videoPickerMode === 'direct'}
                      onClick={() => setVideoPickerMode('direct')}
                    >
                      {t.videoPickerDirect}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceToolbarAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('toolbar')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceToolbarAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={toolbarPersistMode === 'browser'}
                      onClick={() => setToolbarPersistMode('browser')}
                    >
                      {t.toolbarPersistBrowser}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={toolbarPersistMode === 'api'}
                      onClick={() => setToolbarPersistMode('api')}
                    >
                      {t.toolbarPersistApi}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceDarkModeAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('darkMode')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceDarkModeInitialAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={!initialDarkMode}
                      onClick={() => setInitialDarkMode(false)}
                    >
                      {t.darkModeInitialLight}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={initialDarkMode}
                      onClick={() => setInitialDarkMode(true)}
                    >
                      {t.darkModeInitialDark}
                    </button>
                  </div>
                  <div className="locale-toggle" role="group" aria-label={t.appearanceDarkModeAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={darkModePersistMode === 'browser'}
                      onClick={() => setDarkModePersistMode('browser')}
                    >
                      {t.darkModePersistBrowser}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={darkModePersistMode === 'api'}
                      onClick={() => setDarkModePersistMode('api')}
                    >
                      {t.darkModePersistApi}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.appearanceToolbarPositionAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('toolbarPosition')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.appearanceToolbarPositionInitialAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={initialToolbarPosition === 'top'}
                      onClick={() => setInitialToolbarPosition('top')}
                    >
                      {t.toolbarPositionTop}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={initialToolbarPosition === 'left'}
                      onClick={() => setInitialToolbarPosition('left')}
                    >
                      {t.toolbarPositionLeft}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={initialToolbarPosition === 'right'}
                      onClick={() => setInitialToolbarPosition('right')}
                    >
                      {t.toolbarPositionRight}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={initialToolbarPosition === 'bottom'}
                      onClick={() => setInitialToolbarPosition('bottom')}
                    >
                      {t.toolbarPositionBottom}
                    </button>
                  </div>
                  <div className="locale-toggle" role="group" aria-label={t.appearanceToolbarPositionAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={toolbarPositionPersistMode === 'browser'}
                      onClick={() => setToolbarPositionPersistMode('browser')}
                    >
                      {t.toolbarPositionPersistBrowser}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={toolbarPositionPersistMode === 'api'}
                      onClick={() => setToolbarPositionPersistMode('api')}
                    >
                      {t.toolbarPositionPersistApi}
                    </button>
                  </div>
                </div>
                <div className="control-group">
                  <ControlGroupHeading
                    label={t.languageAria}
                    examplesLabel={t.codeExamplesLink}
                    onOpenExamples={() => setExampleBlock('language')}
                  />
                  <div className="locale-toggle" role="group" aria-label={t.languageAria}>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={locale === 'en'}
                      onClick={() => setLocale('en')}
                    >
                      {t.localeEn}
                    </button>
                    <button
                      type="button"
                      className="locale-toggle-button"
                      aria-pressed={locale === 'es'}
                      onClick={() => setLocale('es')}
                    >
                      {t.localeEs}
                    </button>
                  </div>
                </div>
              </div>
              <p className="lede">{t.lede}</p>
            </div>
          ) : null}
        </aside>
        {playgroundOpen ? (
          <div
            className="sidebar-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label={t.playgroundResizeAria}
            aria-valuenow={Math.round(sidebarWidth)}
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            aria-valuemax={Math.round(sidebarMax)}
            tabIndex={0}
            onPointerDown={onSplitterPointerDown}
            onPointerMove={onSplitterPointerMove}
            onPointerUp={onSplitterPointerUp}
            onPointerCancel={onSplitterPointerUp}
            onKeyDown={onSplitterKeyDown}
          />
        ) : null}
        <section className="editor-pane">
          <div className="editor-slot">
            <Editor
              locale={locale}
              menuVisible={menuVisible}
              toolbarVisible={toolbarVisible}
              allowedChrome={allowedChrome}
              fullscreen={fullscreen}
              onFullscreenChange={setFullscreen}
              readOnly={readOnly}
              disableHtmlFileDrop={disableHtmlFileDrop}
              enableMultiPages={multiPagesEnabled}
              onAutoSave={autoSave ? onAutoSave : undefined}
              onSave={fileCallbacksMode === 'host' ? onSave : undefined}
              onOpen={fileCallbacksMode === 'host' ? onOpen : undefined}
              {...(menuAppearance === 'example' ? exampleMenu : {})}
              border={
                borderAppearance === 'none'
                  ? 'none'
                  : borderAppearance === 'rounded'
                    ? roundedBorder
                    : undefined
              }
              defaultValue="<p>Hello <strong>world</strong></p>"
              placeholder={t.placeholder}
              customActions={customActionsEnabled ? customActions : undefined}
              customFonts={googleFonts ? playgroundGoogleFonts : undefined}
              customImagePicker={customImagePicker}
              disableBuiltinImageInsert={imagePickerMode === 'direct'}
              customAudioPicker={customAudioPicker}
              disableBuiltinAudioInsert={audioPickerMode === 'direct'}
              customVideoPicker={customVideoPicker}
              disableBuiltinVideoInsert={videoPickerMode === 'direct'}
              toolbarCustomization={toolbarCustomization}
              darkMode={initialDarkMode}
              darkModePersistence={darkModePersistence}
              toolbarPosition={initialToolbarPosition}
              toolbarPositionPersistence={toolbarPositionPersistence}
              loadCustomParagraphStyles={
                customParagraphStylesEnabled ? loadPlaygroundCustomStyles : undefined
              }
              onSaveCustomParagraphStyle={
                customParagraphStylesEnabled ? savePlaygroundCustomStyle : undefined
              }
              onDeleteCustomParagraphStyle={
                customParagraphStylesEnabled ? deletePlaygroundCustomStyle : undefined
              }
            />
          </div>
        </section>
      </div>
      )}
      {exampleBlock ? (
        <CodeExampleDialog
          blockId={exampleBlock}
          messages={t}
          onClose={() => setExampleBlock(null)}
        />
      ) : null}
      {audioInsert ? (
        <div className="ai-dialog-backdrop">
          <div
            className="ai-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audio-gallery-title"
          >
            <h2 id="audio-gallery-title" className="ai-dialog-title">
              {t.audioGalleryTitle}
            </h2>
            <div className="image-gallery">
              {PLAYGROUND_AUDIO_GALLERY.map((item) => {
                const title = t[item.titleKey]
                return (
                  <button
                    key={item.src}
                    type="button"
                    className="image-gallery-item"
                    onClick={() => {
                      audioInsert({
                        src: item.src,
                        title,
                      })
                      setAudioInsert(null)
                    }}
                  >
                    <span>{title}</span>
                  </button>
                )
              })}
            </div>
            <div className="ai-dialog-actions">
              <button
                type="button"
                className="ai-dialog-button"
                onClick={() => {
                  setAudioInsert(null)
                }}
              >
                {t.audioGalleryCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {videoInsert ? (
        <div className="ai-dialog-backdrop">
          <div
            className="ai-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-gallery-title"
          >
            <h2 id="video-gallery-title" className="ai-dialog-title">
              {t.videoGalleryTitle}
            </h2>
            <div className="image-gallery">
              {PLAYGROUND_VIDEO_GALLERY.map((item) => {
                const title = t[item.titleKey]
                return (
                  <button
                    key={item.src}
                    type="button"
                    className="image-gallery-item"
                    onClick={() => {
                      videoInsert({
                        src: item.src,
                        title,
                      })
                      setVideoInsert(null)
                    }}
                  >
                    <span>{title}</span>
                  </button>
                )
              })}
            </div>
            <div className="ai-dialog-actions">
              <button
                type="button"
                className="ai-dialog-button"
                onClick={() => {
                  setVideoInsert(null)
                }}
              >
                {t.videoGalleryCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {imageInsert ? (
        <div className="ai-dialog-backdrop">
          <div
            className="ai-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-gallery-title"
          >
            <h2 id="image-gallery-title" className="ai-dialog-title">
              {t.imageGalleryTitle}
            </h2>
            <div className="image-gallery">
              {PLAYGROUND_GALLERY.map((item) => {
                const alt = t[item.altKey]
                return (
                  <button
                    key={item.src}
                    type="button"
                    className="image-gallery-item"
                    onClick={() => {
                      imageInsert({
                        src: item.src,
                        alt,
                        title: alt,
                        css: 'width: 200px; border-radius: 8px',
                      })
                      setImageInsert(null)
                    }}
                  >
                    <img src={item.src} alt={alt} />
                    <span>{alt}</span>
                  </button>
                )
              })}
            </div>
            <div className="ai-dialog-actions">
              <button
                type="button"
                className="ai-dialog-button"
                onClick={() => {
                  setImageInsert(null)
                }}
              >
                {t.imageGalleryCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {aiApi ? (
        <div className="ai-dialog-backdrop">
          <div className="ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-dialog-title">
            <h2 id="ai-dialog-title" className="ai-dialog-title">
              {t.aiDialogTitle}
            </h2>
            <label className="ai-dialog-field">
              <span>{t.aiHtmlLabel}</span>
              <textarea
                className="ai-dialog-text"
                value={aiHtml}
                onChange={(event) => setAiHtml(event.target.value)}
              />
            </label>
            <label className="ai-dialog-field">
              <span>{t.aiFormattedLabel}</span>
              <textarea
                className="ai-dialog-text ai-dialog-text-optional"
                value={aiFormatted}
                onChange={(event) => setAiFormatted(event.target.value)}
              />
            </label>
            <div className="ai-dialog-actions">
              <button
                type="button"
                className="ai-dialog-button"
                onClick={() => {
                  setAiApi(null)
                }}
              >
                {t.aiCancel}
              </button>
              <button
                type="button"
                className="ai-dialog-button ai-dialog-button-primary"
                onClick={() => {
                  aiApi.insertHtml(aiHtml, aiFormatted.trim() ? aiFormatted : undefined)
                  setAiApi(null)
                }}
              >
                {t.aiOk}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <footer className="page-footer">
        <span>
          {t.footerGithub}{' '}
          <a
            href="https://github.com/commspliant/html-editor"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.footerGithubLink}
          </a>
        </span>
        <span className="page-footer-separator" aria-hidden="true">
          ·
        </span>
        <a href="https://commspliant.com/" target="_blank" rel="noopener noreferrer">
          {t.footerBroughtBy}
        </a>
      </footer>
    </main>
  )
}
