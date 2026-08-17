import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  Editor,
  type CustomAction,
  type CustomActionApi,
  type CustomFont,
  type CustomImageInsert,
  type CustomImagePicker,
  type CustomParagraphStyle,
  type EditorBorder,
  type Locale,
  type ToolbarCustomization,
  type ToolbarCustomizationPersistence,
} from 'commspliant-html-editor'
import { playgroundMessages } from './i18n/messages'
import { CodeExampleDialog } from './CodeExampleDialog'
import { DocumentationPage } from './DocumentationPage'
import type { ExampleBlockId } from './codeExamples'

type PageView = 'playground' | 'documentation'
type MenuAppearance = 'default' | 'example'
type BorderAppearance = 'default' | 'none' | 'rounded'
type ImagePickerMode = 'default' | 'custom' | 'direct'
type ToolbarPersistMode = 'browser' | 'api'

const PLAYGROUND_GALLERY: { src: string; altKey: 'imageGalleryMountain' | 'imageGalleryLake' }[] = [
  { src: 'https://picsum.photos/id/1015/400/300', altKey: 'imageGalleryMountain' },
  { src: 'https://picsum.photos/id/1016/400/300', altKey: 'imageGalleryLake' },
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
  const [fullscreen, setFullscreen] = useState(false)
  const [menuAppearance, setMenuAppearance] = useState<MenuAppearance>('default')
  const [borderAppearance, setBorderAppearance] = useState<BorderAppearance>('default')
  const [googleFonts, setGoogleFonts] = useState(false)
  const [imagePickerMode, setImagePickerMode] = useState<ImagePickerMode>('default')
  const [toolbarPersistMode, setToolbarPersistMode] = useState<ToolbarPersistMode>('browser')
  const [imageInsert, setImageInsert] = useState<((image: CustomImageInsert) => void) | null>(null)
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

  const toolbarCustomization = useMemo<ToolbarCustomizationPersistence | undefined>(() => {
    if (toolbarPersistMode !== 'api') return undefined
    return {
      load: loadPlaygroundToolbarSettings,
      save: savePlaygroundToolbarSettings,
    }
  }, [toolbarPersistMode])

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
              fullscreen={fullscreen}
              onFullscreenChange={setFullscreen}
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
              customActions={customActions}
              customFonts={googleFonts ? playgroundGoogleFonts : undefined}
              customImagePicker={customImagePicker}
              disableBuiltinImageInsert={imagePickerMode === 'direct'}
              toolbarCustomization={toolbarCustomization}
              loadCustomParagraphStyles={loadPlaygroundCustomStyles}
              onSaveCustomParagraphStyle={savePlaygroundCustomStyle}
              onDeleteCustomParagraphStyle={deletePlaygroundCustomStyle}
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
