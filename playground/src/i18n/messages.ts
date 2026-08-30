import type { Locale } from 'commspliant-html-editor'

export type PlaygroundMessages = {
  brandWordmark: string
  brandHomeAria: string
  sectionPlayground: string
  playgroundOpen: string
  playgroundClose: string
  playgroundResizeAria: string
  lede: string
  placeholder: string
  languageAria: string
  localeEn: string
  localeEs: string
  chromeAria: string
  menuVisible: string
  toolbarVisible: string
  fullscreen: string
  allowedChromeAria: string
  allowedChromeAll: string
  allowedChromeFileEdit: string
  allowedChromeFormat: string
  readOnlyAria: string
  readOnly: string
  readOnlyOff: string
  htmlFileDropAria: string
  htmlFileDropAllowed: string
  htmlFileDropDisabled: string
  autoSaveAria: string
  autoSaveOn: string
  autoSaveOff: string
  autoSaveLast: string
  autoSaveNever: string
  fileCallbacksAria: string
  fileCallbacksLocal: string
  fileCallbacksHost: string
  fileCallbacksLastSave: string
  fileCallbacksNever: string
  fileCallbacksStored: string
  fileCallbacksEmpty: string
  multiPagesAria: string
  multiPagesOff: string
  multiPagesOn: string
  optimizeEmbeddedImagesAria: string
  optimizeEmbeddedImagesOff: string
  optimizeEmbeddedImagesOn: string
  optimizeEmbeddedImagesHint: string
  initialContentAria: string
  initialContentHello: string
  initialContentEmpty: string
  pagePropertiesAria: string
  pagePropertiesOff: string
  pagePropertiesOn: string
  rulerAria: string
  rulerOff: string
  rulerOn: string
  defaultPagePropertiesAria: string
  defaultPagePropertiesOff: string
  defaultPagePropertiesOn: string
  defaultPagePropertiesOnWithMargins: string
  commentsAria: string
  commentsOff: string
  commentsOn: string
  commentsHint: string
  commentsThreadCount: string
  customActionsAria: string
  customActionsOn: string
  customActionsOff: string
  appearanceMenuAria: string
  menuDefault: string
  menuExample: string
  appearanceBorderAria: string
  borderDefault: string
  borderNone: string
  borderRounded: string
  appearanceFontsAria: string
  fontsDefault: string
  fontsGoogle: string
  customParagraphStylesAria: string
  customParagraphStylesOn: string
  customParagraphStylesOff: string
  appearanceImageAria: string
  imagePickerDefault: string
  imagePickerCustom: string
  imagePickerDirect: string
  appearanceBackgroundImageAria: string
  backgroundImagePickerDefault: string
  backgroundImagePickerCustom: string
  backgroundImagePickerDirect: string
  backgroundImagePickerTab: string
  backgroundImagePickerDescription: string
  backgroundImagePickerButton: string
  backgroundImageGalleryTitle: string
  backgroundImageGalleryCancel: string
  backgroundImageExampleBody: string
  appearanceToolbarAria: string
  toolbarPersistBrowser: string
  toolbarPersistApi: string
  appearanceDarkModeAria: string
  appearanceDarkModeInitialAria: string
  darkModeInitialLight: string
  darkModeInitialDark: string
  darkModePersistBrowser: string
  darkModePersistApi: string
  appearanceToolbarPositionAria: string
  appearanceToolbarPositionInitialAria: string
  toolbarPositionTop: string
  toolbarPositionLeft: string
  toolbarPositionRight: string
  toolbarPositionBottom: string
  toolbarPositionPersistBrowser: string
  toolbarPositionPersistApi: string
  imagePickerTab: string
  imagePickerDescription: string
  imagePickerButton: string
  imageGalleryTitle: string
  imageGalleryCancel: string
  imageGalleryMountain: string
  imageGalleryLake: string
  menuTools: string
  commandAi: string
  aiDialogTitle: string
  aiHtmlLabel: string
  aiFormattedLabel: string
  aiSample: string
  aiOk: string
  aiCancel: string
  codeExamplesLink: string
  codeExamplesClose: string
  chromeExampleBody: string
  allowedChromeExampleBody: string
  readOnlyExampleBody: string
  htmlFileDropExampleBody: string
  autoSaveExampleBody: string
  fileCallbacksExampleBody: string
  multiPagesExampleBody: string
  optimizeEmbeddedImagesExampleBody: string
  pagePropertiesExampleBody: string
  commentsExampleBody: string
  customActionsExampleBody: string
  menuExampleBody: string
  borderExampleBody: string
  fontsExampleBody: string
  customParagraphStylesExampleBody: string
  imageExampleBody: string
  audioExampleBody: string
  youtubeExampleBody: string
  appearanceAudioAria: string
  audioPickerDefault: string
  audioPickerCustom: string
  audioPickerDirect: string
  audioPickerTab: string
  audioPickerDescription: string
  audioPickerButton: string
  audioGalleryTitle: string
  audioGalleryCancel: string
  audioGalleryIntro: string
  audioGalleryOutro: string
  appearanceVideoAria: string
  videoPickerDefault: string
  videoPickerCustom: string
  videoPickerDirect: string
  videoPickerTab: string
  videoPickerDescription: string
  videoPickerButton: string
  videoGalleryTitle: string
  videoGalleryCancel: string
  videoGalleryYoutube: string
  videoGalleryHosted: string
  toolbarExampleBody: string
  darkModeExampleBody: string
  toolbarPositionExampleBody: string
  languageExampleBody: string
  footerGithub: string
  footerGithubLink: string
  footerBroughtBy: string
  navAria: string
  navPlayground: string
  navDocumentation: string
}

export const playgroundMessages: Record<Locale, PlaygroundMessages> = {
  en: {
    brandWordmark: 'HTML editor Playground',
    brandHomeAria: 'CommsPliant home',
    sectionPlayground: 'Playground',
    playgroundOpen: 'Expand',
    playgroundClose: 'Collapse',
    playgroundResizeAria: 'Resize playground',
    lede: 'Switch between Visual and HTML modes.',
    placeholder: 'Start writing…',
    languageAria: 'Language',
    localeEn: 'English',
    localeEs: 'Español',
    chromeAria: 'Editor chrome',
    menuVisible: 'Menu',
    toolbarVisible: 'Toolbar',
    fullscreen: 'Full screen',
    allowedChromeAria: 'Allowed chrome',
    allowedChromeAll: 'All',
    allowedChromeFileEdit: 'File and Edit',
    allowedChromeFormat: 'Format only',
    readOnlyAria: 'Read only',
    readOnly: 'Read only',
    readOnlyOff: 'Editable',
    htmlFileDropAria: 'HTML file drop',
    htmlFileDropAllowed: 'Drop allowed',
    htmlFileDropDisabled: 'Drop disabled',
    autoSaveAria: 'Auto save',
    autoSaveOn: 'On',
    autoSaveOff: 'Off',
    autoSaveLast: 'Last auto save',
    autoSaveNever: 'Never',
    fileCallbacksAria: 'Save and open',
    fileCallbacksLocal: 'Local file',
    fileCallbacksHost: 'Host callbacks',
    fileCallbacksLastSave: 'Last host save',
    fileCallbacksNever: 'Never',
    fileCallbacksStored: 'Mock storage has a document',
    fileCallbacksEmpty: 'Mock storage is empty (Open loads a sample)',
    multiPagesAria: 'Multi-page editing',
    multiPagesOff: 'Single page',
    multiPagesOn: 'Multi-page',
    optimizeEmbeddedImagesAria: 'Embedded images',
    optimizeEmbeddedImagesOff: 'Default',
    optimizeEmbeddedImagesOn: 'Optimized',
    optimizeEmbeddedImagesHint:
      'When optimized, HTML source shows compact image ids instead of base64. Switch to HTML mode to verify; save and export still use full data URLs.',
    initialContentAria: 'Initial content',
    initialContentHello: 'Hello world',
    initialContentEmpty: 'Empty',
    pagePropertiesAria: 'Print tab',
    pagePropertiesOff: 'Hidden',
    pagePropertiesOn: 'Shown',
    rulerAria: 'Rulers',
    rulerOff: 'Hidden',
    rulerOn: 'Shown',
    defaultPagePropertiesAria: 'Default page properties',
    defaultPagePropertiesOff: 'None',
    defaultPagePropertiesOn: 'A4 portrait',
    defaultPagePropertiesOnWithMargins: 'A4 portrait + margins',
    commentsAria: 'Comments',
    commentsOff: 'Off',
    commentsOn: 'On',
    commentsHint: 'Select text or an image, then Add comment.',
    commentsThreadCount: '{count} comment thread(s)',
    customActionsAria: 'Custom actions',
    customActionsOn: 'On',
    customActionsOff: 'Off',
    appearanceMenuAria: 'Menu appearance',
    menuDefault: 'Menu default',
    menuExample: 'Menu example',
    appearanceBorderAria: 'Editor border',
    borderDefault: 'Border default',
    borderNone: 'No border',
    borderRounded: 'Rounded border',
    appearanceFontsAria: 'Document fonts',
    fontsDefault: 'Web-safe fonts',
    fontsGoogle: 'Google fonts',
    customParagraphStylesAria: 'Custom paragraph styles',
    customParagraphStylesOn: 'On',
    customParagraphStylesOff: 'Off',
    appearanceImageAria: 'Image picker',
    imagePickerDefault: 'Built-in insert',
    imagePickerCustom: 'Custom picker tab',
    imagePickerDirect: 'Custom picker only',
    appearanceBackgroundImageAria: 'Background image picker',
    backgroundImagePickerDefault: 'Built-in insert',
    backgroundImagePickerCustom: 'Custom picker in dialog',
    backgroundImagePickerDirect: 'Custom picker only',
    backgroundImagePickerTab: 'Gallery',
    backgroundImagePickerDescription: 'Choose from the playground gallery.',
    backgroundImagePickerButton: 'Open gallery',
    backgroundImageGalleryTitle: 'Background image gallery',
    backgroundImageGalleryCancel: 'Cancel',
    backgroundImageExampleBody:
      'Pass customBackgroundImagePicker for page and paragraph background images. Set disableBuiltinBackgroundImageSources to show only your picker inside the properties dialog, or disableBuiltinBackgroundImageInsert to call onPick immediately from Insert.',
    appearanceToolbarAria: 'Toolbar settings',
    toolbarPersistBrowser: 'Browser storage',
    toolbarPersistApi: 'API storage',
    appearanceDarkModeAria: 'Dark mode settings',
    appearanceDarkModeInitialAria: 'Initial chrome theme',
    darkModeInitialLight: 'Start light',
    darkModeInitialDark: 'Start dark',
    darkModePersistBrowser: 'Browser storage',
    darkModePersistApi: 'API storage',
    appearanceToolbarPositionAria: 'Toolbar position',
    appearanceToolbarPositionInitialAria: 'Initial toolbar dock',
    toolbarPositionTop: 'Top',
    toolbarPositionLeft: 'Left',
    toolbarPositionRight: 'Right',
    toolbarPositionBottom: 'Bottom',
    toolbarPositionPersistBrowser: 'Browser storage',
    toolbarPositionPersistApi: 'API storage',
    imagePickerTab: 'Gallery',
    imagePickerDescription: 'Choose an image from the sample gallery.',
    imagePickerButton: 'Open gallery',
    imageGalleryTitle: 'Sample gallery',
    imageGalleryCancel: 'Cancel',
    imageGalleryMountain: 'Mountain',
    imageGalleryLake: 'Lake',
    menuTools: 'Tools',
    commandAi: 'AI',
    aiDialogTitle: 'AI generated text',
    aiHtmlLabel: 'HTML',
    aiFormattedLabel: 'Formatted text (optional)',
    aiSample: '<p>This is the AI generated example text</p>',
    aiOk: 'OK',
    aiCancel: 'Cancel',
    codeExamplesLink: 'Code examples',
    codeExamplesClose: 'Close',
    chromeExampleBody:
      'Show or hide the menu bar and icon toolbar, and control the full-screen overlay from the host.',
    allowedChromeExampleBody:
      'Pass allowedChrome to show only the menus and icon-toolbar buttons the host allows. The two lists are independent. Omit the prop to show everything. Customize toolbar and persistence still apply on the allowed toolbar subset.',
    readOnlyExampleBody:
      'Lock both editing surfaces and all menus and toolbar buttons from the host. Default is false. Same lock as disabled.',
    htmlFileDropExampleBody:
      'Dropping an HTML file onto the document replaces it, the same as File → Open. Set disableHtmlFileDrop to ignore drops. File → Open is unchanged.',
    autoSaveExampleBody:
      'Pass onAutoSave to persist the document HTML. The editor polls every second and calls the callback only when the HTML changed. Omit the prop to disable. The callback is not awaited, so editing is not blocked. When enableMultiPages is true, the callback receives all pages as a string array.',
    fileCallbacksExampleBody:
      'By default, File → Save and Open use the built-in local HTML file picker. Pass onSave and/or onOpen to delegate to the host instead. The two props are independent. HTML file drag-drop is unchanged. When enableMultiPages is true, onSave receives and onOpen may return all pages as a string array.',
    multiPagesExampleBody:
      'Set enableMultiPages to edit multiple independent HTML pages in visual mode. Use onPagesChange(pages, activePageIndex) for controlled state. Host onSave, onOpen, and onAutoSave receive all pages as a string array; built-in File Save/Open still operate on the focused page only. HTML source mode edits one page at a time: a tab strip above the textarea shows Page 1, Page 2, and so on; the active tab matches the page selected in visual mode (or page 1 before any page is selected). With five or more pages, left/right arrows scroll the tab strip. View → Preview and host callbacks still use all pages. For joined storage, use joinPagesToHtml and <!-- wysiwyg-page-separator --> — not the HTML-mode textarea. When enablePageProperties is true, Edit → Page → Page properties → Print sets @page size and margins; the visual canvas previews each page. View → Zoom adjusts screen-only fit and percentage zoom. View → Ruler toggles horizontal and vertical rulers when print layout is active (single- or multi-page); use defaultRulerVisible and rulerUnit on Editor.',
    optimizeEmbeddedImagesExampleBody:
      'Set optimizeEmbeddedImages to keep embedded data:image sources in an internal registry while editing. The HTML source view shows data-wysiwyg-img-id and blob display URLs; onChange, onPagesChange, onSave, and export callbacks still receive full data URLs for persistence.',
    pagePropertiesExampleBody:
      'Pass enablePageProperties to add the Print tab to Edit → Page → Page properties. Font and Paragraph tabs are always available. Pass defaultPageProperties to apply partial settings on uncontrolled initial content and on each Insert → Page. Controlled value/pages are not modified on load. In the playground, set Initial content → Empty with Default page properties → A4 portrait to preview a blank sized page, or A4 portrait + margins for 1 in @page margins the rulers read.',
    commentsExampleBody:
      'Set enableComments to add comment threads anchored with data-comment-thread markers. Pass commentAuthor for posting identity and onCommentsChange to persist CommentThread[] separately from document HTML. Use stripCommentAnchors(html) for sanitized publish HTML. In readOnly mode, comment operations fire onCommentsChange only.',
    customActionsExampleBody:
      'Pass a customActions array to add host buttons, menu items, or both. Labels and tooltips are your copy — the library does not translate them.',
    menuExampleBody:
      'Restyle the dropdown menu bar only — not the icon toolbar. Load any custom webfont on the host page before passing its family name.',
    borderExampleBody:
      'Set the outer editor box. Use “none” to remove width, radius and shadow. Object fields are independent; omitted fields keep the defaults. Ignored in full screen.',
    fontsExampleBody:
      'Pass customFonts to append host faces after the built-in web-safe list. Optional css is a stylesheet URL. When a webfont is used, its stylesheet link is prepended to exported HTML.',
    customParagraphStylesExampleBody:
      'Pass loadCustomParagraphStyles and onSaveCustomParagraphStyle to persist host-defined styles under Format → Paragraph styles and the toolbar style dropdown. Custom styles and Add new stay hidden unless both callbacks are set. The Delete button is shown only when onDeleteCustomParagraphStyle is set.',
    imageExampleBody:
      'Pass customImagePicker to add a third Insert image source. Set disableBuiltinImageInsert to skip the built-in dialog and open your picker immediately.',
    audioExampleBody:
      'Pass customAudioPicker to add a third Insert audio source. Set disableBuiltinAudioInsert to skip the built-in dialog and open your picker immediately.',
    youtubeExampleBody:
      'Pass customVideoPicker to add a third Insert YouTube video source. Set disableBuiltinVideoInsert to skip the built-in dialog and open your picker immediately.',
    appearanceAudioAria: 'Audio picker',
    audioPickerDefault: 'Built-in insert',
    audioPickerCustom: 'Custom picker tab',
    audioPickerDirect: 'Custom picker only',
    audioPickerTab: 'Library',
    audioPickerDescription: 'Choose audio from the sample library.',
    audioPickerButton: 'Open library',
    audioGalleryTitle: 'Sample audio library',
    audioGalleryCancel: 'Cancel',
    audioGalleryIntro: 'Intro track',
    audioGalleryOutro: 'Outro track',
    appearanceVideoAria: 'YouTube video picker',
    videoPickerDefault: 'Built-in insert',
    videoPickerCustom: 'Custom picker tab',
    videoPickerDirect: 'Custom picker only',
    videoPickerTab: 'Library',
    videoPickerDescription: 'Choose a video from the sample library.',
    videoPickerButton: 'Open library',
    videoGalleryTitle: 'Sample video library',
    videoGalleryCancel: 'Cancel',
    videoGalleryYoutube: 'YouTube sample',
    videoGalleryHosted: 'Hosted MP4 sample',
    toolbarExampleBody:
      'Omit toolbarCustomization to persist layout in localStorage. Pass load and save to store it on the host, including async APIs.',
    darkModeExampleBody:
      'darkMode is the initial chrome theme when nothing is persisted (default false, light). Omit darkModePersistence to persist View → Light mode / Dark mode in localStorage. Pass load and save to store it on the host. Visual and HTML surfaces stay unchanged.',
    toolbarPositionExampleBody:
      'toolbarPosition is the initial icon-toolbar dock when nothing is persisted (default top). The menu bar stays at the top. Omit toolbarPositionPersistence to persist View → Toolbar → Position in localStorage. Pass load and save to store it on the host. Top and bottom wrap; left and right stay a single column.',
    languageExampleBody:
      'Pass locale to switch library chrome between English and Spanish. Document content is not translated.',
    footerGithub: 'GitHub:',
    footerGithubLink: 'commspliant/html-editor',
    footerBroughtBy: 'Brought to you by CommsPliant Communication',
    navAria: 'Playground sections',
    navPlayground: 'Playground',
    navDocumentation: 'Documentation',
  },
  es: {
    brandWordmark: 'Playground del editor HTML',
    brandHomeAria: 'Inicio de CommsPliant',
    sectionPlayground: 'Playground',
    playgroundOpen: 'Expandir',
    playgroundClose: 'Contraer',
    playgroundResizeAria: 'Redimensionar el playground',
    lede: 'Cambia entre los modos Visual y HTML.',
    placeholder: 'Empieza a escribir…',
    languageAria: 'Idioma',
    localeEn: 'English',
    localeEs: 'Español',
    chromeAria: 'Chrome del editor',
    menuVisible: 'Menú',
    toolbarVisible: 'Barra de herramientas',
    fullscreen: 'Pantalla completa',
    allowedChromeAria: 'Chrome permitido',
    allowedChromeAll: 'Todo',
    allowedChromeFileEdit: 'Archivo y Editar',
    allowedChromeFormat: 'Solo Formato',
    readOnlyAria: 'Solo lectura',
    readOnly: 'Solo lectura',
    readOnlyOff: 'Editable',
    htmlFileDropAria: 'Soltar archivo HTML',
    htmlFileDropAllowed: 'Soltar permitido',
    htmlFileDropDisabled: 'Soltar desactivado',
    autoSaveAria: 'Autoguardado',
    autoSaveOn: 'Activado',
    autoSaveOff: 'Desactivado',
    autoSaveLast: 'Último autoguardado',
    autoSaveNever: 'Nunca',
    fileCallbacksAria: 'Guardar y abrir',
    fileCallbacksLocal: 'Archivo local',
    fileCallbacksHost: 'Callbacks del anfitrión',
    fileCallbacksLastSave: 'Último guardado del anfitrión',
    fileCallbacksNever: 'Nunca',
    fileCallbacksStored: 'El almacenamiento simulado tiene un documento',
    fileCallbacksEmpty: 'El almacenamiento simulado está vacío (Abrir carga un ejemplo)',
    multiPagesAria: 'Edición multipágina',
    multiPagesOff: 'Una página',
    multiPagesOn: 'Multipágina',
    optimizeEmbeddedImagesAria: 'Imágenes incrustadas',
    optimizeEmbeddedImagesOff: 'Predeterminado',
    optimizeEmbeddedImagesOn: 'Optimizado',
    optimizeEmbeddedImagesHint:
      'Con optimización, el HTML fuente muestra ids compactos en lugar de base64. Cambia al modo HTML para comprobarlo; guardar y exportar siguen usando data URLs completas.',
    initialContentAria: 'Contenido inicial',
    initialContentHello: 'Hola mundo',
    initialContentEmpty: 'Vacío',
    pagePropertiesAria: 'Pestaña Impresión',
    pagePropertiesOff: 'Oculta',
    pagePropertiesOn: 'Visible',
    rulerAria: 'Reglas',
    rulerOff: 'Ocultas',
    rulerOn: 'Visibles',
    defaultPagePropertiesAria: 'Propiedades de página por defecto',
    defaultPagePropertiesOff: 'Ninguna',
    defaultPagePropertiesOn: 'A4 vertical',
    defaultPagePropertiesOnWithMargins: 'A4 vertical + márgenes',
    commentsAria: 'Comentarios',
    commentsOff: 'Desactivado',
    commentsOn: 'Activado',
    commentsHint: 'Selecciona texto o una imagen y usa Añadir comentario.',
    commentsThreadCount: '{count} hilo(s) de comentarios',
    customActionsAria: 'Acciones personalizadas',
    customActionsOn: 'Activado',
    customActionsOff: 'Desactivado',
    appearanceMenuAria: 'Apariencia del menú',
    menuDefault: 'Menú predeterminado',
    menuExample: 'Menú de ejemplo',
    appearanceBorderAria: 'Borde del editor',
    borderDefault: 'Borde predeterminado',
    borderNone: 'Sin borde',
    borderRounded: 'Borde redondeado',
    appearanceFontsAria: 'Fuentes del documento',
    fontsDefault: 'Fuentes web',
    fontsGoogle: 'Fuentes de Google',
    customParagraphStylesAria: 'Estilos de párrafo personalizados',
    customParagraphStylesOn: 'Activado',
    customParagraphStylesOff: 'Desactivado',
    appearanceImageAria: 'Selector de imagen',
    imagePickerDefault: 'Inserción integrada',
    imagePickerCustom: 'Pestaña de selector',
    imagePickerDirect: 'Solo selector',
    appearanceBackgroundImageAria: 'Selector de imagen de fondo',
    backgroundImagePickerDefault: 'Inserción integrada',
    backgroundImagePickerCustom: 'Selector en el diálogo',
    backgroundImagePickerDirect: 'Solo selector',
    backgroundImagePickerTab: 'Galería',
    backgroundImagePickerDescription: 'Elige de la galería del playground.',
    backgroundImagePickerButton: 'Abrir galería',
    backgroundImageGalleryTitle: 'Galería de imagen de fondo',
    backgroundImageGalleryCancel: 'Cancelar',
    backgroundImageExampleBody:
      'Pasa customBackgroundImagePicker para imágenes de fondo de página y párrafo. Con disableBuiltinBackgroundImageSources solo se muestra tu selector en el diálogo de propiedades; con disableBuiltinBackgroundImageInsert onPick se llama de inmediato desde Insertar.',
    appearanceToolbarAria: 'Configuración de la barra',
    toolbarPersistBrowser: 'Almacenamiento del navegador',
    toolbarPersistApi: 'Almacenamiento API',
    appearanceDarkModeAria: 'Configuración del modo oscuro',
    appearanceDarkModeInitialAria: 'Tema inicial del chrome',
    darkModeInitialLight: 'Iniciar claro',
    darkModeInitialDark: 'Iniciar oscuro',
    darkModePersistBrowser: 'Almacenamiento del navegador',
    darkModePersistApi: 'Almacenamiento API',
    appearanceToolbarPositionAria: 'Posición de la barra',
    appearanceToolbarPositionInitialAria: 'Acoplamiento inicial de la barra',
    toolbarPositionTop: 'Arriba',
    toolbarPositionLeft: 'Izquierda',
    toolbarPositionRight: 'Derecha',
    toolbarPositionBottom: 'Abajo',
    toolbarPositionPersistBrowser: 'Almacenamiento del navegador',
    toolbarPositionPersistApi: 'Almacenamiento API',
    imagePickerTab: 'Galería',
    imagePickerDescription: 'Elige una imagen de la galería de ejemplo.',
    imagePickerButton: 'Abrir galería',
    imageGalleryTitle: 'Galería de ejemplo',
    imageGalleryCancel: 'Cancelar',
    imageGalleryMountain: 'Montaña',
    imageGalleryLake: 'Lago',
    menuTools: 'Herramientas',
    commandAi: 'IA',
    aiDialogTitle: 'Texto generado por IA',
    aiHtmlLabel: 'HTML',
    aiFormattedLabel: 'Texto con formato (opcional)',
    aiSample: '<p>Este es el texto de ejemplo generado por IA</p>',
    aiOk: 'Aceptar',
    aiCancel: 'Cancelar',
    codeExamplesLink: 'Ejemplos de código',
    codeExamplesClose: 'Cerrar',
    chromeExampleBody:
      'Muestra u oculta la barra de menú y la barra de iconos, y controla la pantalla completa desde la aplicación anfitriona.',
    allowedChromeExampleBody:
      'Pasa allowedChrome para mostrar solo los menús y botones de la barra que el anfitrión permite. Las dos listas son independientes. Omite la propiedad para mostrar todo. Personalizar la barra y la persistencia siguen aplicándose al subconjunto permitido.',
    readOnlyExampleBody:
      'Bloquea ambas superficies de edición y todos los menús y botones de la barra desde la aplicación anfitriona. El valor predeterminado es false. El mismo bloqueo que disabled.',
    htmlFileDropExampleBody:
      'Soltar un archivo HTML sobre el documento lo reemplaza, igual que Archivo → Abrir. Con disableHtmlFileDrop se ignoran las sueltas. Archivo → Abrir no cambia.',
    autoSaveExampleBody:
      'Pasa onAutoSave para persistir el HTML del documento. El editor consulta cada segundo y llama al callback solo si el HTML cambió. Omite la propiedad para desactivarlo. El callback no se espera, así que la edición no se bloquea. Con enableMultiPages, el callback recibe todas las páginas como un array de cadenas.',
    fileCallbacksExampleBody:
      'Por defecto, Archivo → Guardar y Abrir usan el selector de archivo HTML integrado. Pasa onSave y/o onOpen para delegar en el anfitrión. Las dos propiedades son independientes. Soltar un archivo HTML no cambia. Con enableMultiPages, onSave recibe y onOpen puede devolver todas las páginas como un array de cadenas.',
    multiPagesExampleBody:
      'Con enableMultiPages puedes editar varias páginas HTML independientes en modo visual. Usa onPagesChange(pages, activePageIndex) para estado controlado. Los callbacks del anfitrión onSave, onOpen y onAutoSave reciben todas las páginas como un array de cadenas; Archivo → Guardar/Abrir integrado sigue operando solo en la página activa. El modo HTML edita una página a la vez: una franja de pestañas sobre el área de texto muestra Página 1, Página 2, etc.; la pestaña activa coincide con la página seleccionada en modo visual (o la página 1 si no hay ninguna seleccionada). Con cinco o más páginas, las flechas izquierda/derecha desplazan las pestañas. Vista → Vista previa y los callbacks del anfitrión siguen usando todas las páginas. Para almacenamiento unido, usa joinPagesToHtml y <!-- wysiwyg-page-separator --> — no el área de texto del modo HTML. Con enablePageProperties, Editar → Página → Propiedades de página → Impresión define el tamaño y márgenes @page; el lienzo visual los previsualiza. Ver → Zoom ajusta el ajuste y el porcentaje solo en pantalla. Ver → Regla muestra u oculta las reglas cuando hay diseño de impresión (una o varias páginas); usa defaultRulerVisible y rulerUnit en Editor.',
    optimizeEmbeddedImagesExampleBody:
      'Activa optimizeEmbeddedImages para guardar las fuentes data:image incrustadas en un registro interno mientras editas. La vista HTML fuente muestra data-wysiwyg-img-id y URLs blob; onChange, onPagesChange, onSave y las exportaciones siguen devolviendo data URLs completas para persistir.',
    pagePropertiesExampleBody:
      'Pasa enablePageProperties para añadir la pestaña Impresión en Editar → Página → Propiedades de página. Las pestañas Fuente y Párrafo están siempre disponibles. Pasa defaultPageProperties para aplicar ajustes parciales al contenido inicial no controlado y a cada Insertar → Página. value/pages controlados no se modifican al cargar. En el playground, usa Contenido inicial → Vacío con Propiedades de página por defecto → A4 vertical para previsualizar una página en blanco con tamaño, o A4 vertical + márgenes para márgenes @page de 1 in que leen las reglas.',
    commentsExampleBody:
      'Con enableComments puedes añadir hilos de comentarios anclados con data-comment-thread. Pasa commentAuthor para la identidad al publicar y onCommentsChange para persistir CommentThread[] aparte del HTML del documento. Usa stripCommentAnchors(html) para HTML publicado sin anclajes. En modo readOnly, las operaciones de comentarios solo disparan onCommentsChange.',
    customActionsExampleBody:
      'Pasa un array customActions para añadir botones y elementos de menú de la aplicación. Las etiquetas y descripciones emergentes son tu texto: la biblioteca no las traduce.',
    menuExampleBody:
      'Cambia solo el estilo de la barra de menús desplegables, no la barra de iconos. Carga cualquier fuente web en la página anfitriona antes de pasar su familia.',
    borderExampleBody:
      'Define el recuadro exterior del editor. Usa “none” para quitar grosor, radio y sombra. Los campos del objeto son independientes; los omitidos conservan los valores predeterminados. Se ignora en pantalla completa.',
    fontsExampleBody:
      'Pasa customFonts para añadir fuentes de la aplicación después de la lista web segura. El css opcional es una URL de hoja de estilos. Si se usa una webfont, su enlace se antepone al HTML exportado.',
    customParagraphStylesExampleBody:
      'Pasa loadCustomParagraphStyles y onSaveCustomParagraphStyle para persistir estilos definidos por el anfitrión en Formato → Estilos de párrafo y el desplegable de estilo. Los estilos personalizados y Añadir nuevo se ocultan salvo que ambos callbacks estén definidos. El botón Eliminar solo aparece si se pasa onDeleteCustomParagraphStyle.',
    imageExampleBody:
      'Pasa customImagePicker para añadir una tercera fuente de inserción de imágenes. Con disableBuiltinImageInsert se omite el diálogo integrado y se abre tu selector de inmediato.',
    audioExampleBody:
      'Pasa customAudioPicker para añadir una tercera fuente de inserción de audio. Con disableBuiltinAudioInsert se omite el diálogo integrado y se abre tu selector de inmediato.',
    youtubeExampleBody:
      'Pasa customVideoPicker para añadir una tercera fuente de inserción de vídeo de YouTube. Con disableBuiltinVideoInsert se omite el diálogo integrado y se abre tu selector de inmediato.',
    appearanceAudioAria: 'Selector de audio',
    audioPickerDefault: 'Inserción integrada',
    audioPickerCustom: 'Pestaña de selector',
    audioPickerDirect: 'Solo selector',
    audioPickerTab: 'Biblioteca',
    audioPickerDescription: 'Elige audio de la biblioteca de ejemplo.',
    audioPickerButton: 'Abrir biblioteca',
    audioGalleryTitle: 'Biblioteca de audio de ejemplo',
    audioGalleryCancel: 'Cancelar',
    audioGalleryIntro: 'Pista intro',
    audioGalleryOutro: 'Pista outro',
    appearanceVideoAria: 'Selector de vídeo de YouTube',
    videoPickerDefault: 'Inserción integrada',
    videoPickerCustom: 'Pestaña de selector',
    videoPickerDirect: 'Solo selector',
    videoPickerTab: 'Biblioteca',
    videoPickerDescription: 'Elige un vídeo de la biblioteca de ejemplo.',
    videoPickerButton: 'Abrir biblioteca',
    videoGalleryTitle: 'Biblioteca de vídeo de ejemplo',
    videoGalleryCancel: 'Cancelar',
    videoGalleryYoutube: 'Ejemplo de YouTube',
    videoGalleryHosted: 'Ejemplo MP4 alojado',
    toolbarExampleBody:
      'Omite toolbarCustomization para guardar el diseño en localStorage. Pasa load y save para almacenarlo en el anfitrión, incluidas las APIs asíncronas.',
    darkModeExampleBody:
      'darkMode es el tema inicial del chrome cuando no hay nada persistido (false por defecto, claro). Omite darkModePersistence para guardar Vista → Modo claro / Modo oscuro en localStorage. Pasa load y save para almacenarlo en el anfitrión. Las superficies Visual y HTML no cambian.',
    toolbarPositionExampleBody:
      'toolbarPosition es el acoplamiento inicial de la barra de iconos cuando no hay nada persistido (arriba por defecto). La barra de menú se queda arriba. Omite toolbarPositionPersistence para guardar Vista → Barra de herramientas → Posición en localStorage. Pasa load y save para almacenarlo en el anfitrión. Arriba y abajo envuelven; izquierda y derecha se quedan en una sola columna.',
    languageExampleBody:
      'Pasa locale para cambiar el chrome de la biblioteca entre inglés y español. El contenido del documento no se traduce.',
    footerGithub: 'GitHub:',
    footerGithubLink: 'commspliant/html-editor',
    footerBroughtBy: 'Presentado por CommsPliant Communication',
    navAria: 'Secciones del playground',
    navPlayground: 'Playground',
    navDocumentation: 'Documentación',
  },
}
