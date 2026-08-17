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
  readOnlyAria: string
  readOnly: string
  readOnlyOff: string
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
  appearanceImageAria: string
  imagePickerDefault: string
  imagePickerCustom: string
  imagePickerDirect: string
  appearanceToolbarAria: string
  toolbarPersistBrowser: string
  toolbarPersistApi: string
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
  readOnlyExampleBody: string
  menuExampleBody: string
  borderExampleBody: string
  fontsExampleBody: string
  imageExampleBody: string
  toolbarExampleBody: string
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
    readOnlyAria: 'Read only',
    readOnly: 'Read only',
    readOnlyOff: 'Editable',
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
    appearanceImageAria: 'Image picker',
    imagePickerDefault: 'Built-in insert',
    imagePickerCustom: 'Custom picker tab',
    imagePickerDirect: 'Custom picker only',
    appearanceToolbarAria: 'Toolbar settings',
    toolbarPersistBrowser: 'Browser storage',
    toolbarPersistApi: 'API storage',
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
    readOnlyExampleBody:
      'Lock both editing surfaces and all menus and toolbar buttons from the host. Default is false. Same lock as disabled.',
    menuExampleBody:
      'Restyle the dropdown menu bar only — not the icon toolbar. Load any custom webfont on the host page before passing its family name.',
    borderExampleBody:
      'Set the outer editor box. Use “none” to remove width, radius and shadow. Object fields are independent; omitted fields keep the defaults. Ignored in full screen.',
    fontsExampleBody:
      'Pass customFonts to append host faces after the built-in web-safe list. Optional css is a stylesheet URL. When a webfont is used, its stylesheet link is prepended to exported HTML.',
    imageExampleBody:
      'Pass customImagePicker to add a third Insert image source. Set disableBuiltinImageInsert to skip the built-in dialog and open your picker immediately.',
    toolbarExampleBody:
      'Omit toolbarCustomization to persist layout in localStorage. Pass load and save to store it on the host, including async APIs.',
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
    readOnlyAria: 'Solo lectura',
    readOnly: 'Solo lectura',
    readOnlyOff: 'Editable',
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
    appearanceImageAria: 'Selector de imagen',
    imagePickerDefault: 'Inserción integrada',
    imagePickerCustom: 'Pestaña de selector',
    imagePickerDirect: 'Solo selector',
    appearanceToolbarAria: 'Configuración de la barra',
    toolbarPersistBrowser: 'Almacenamiento del navegador',
    toolbarPersistApi: 'Almacenamiento API',
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
    readOnlyExampleBody:
      'Bloquea ambas superficies de edición y todos los menús y botones de la barra desde la aplicación anfitriona. El valor predeterminado es false. El mismo bloqueo que disabled.',
    menuExampleBody:
      'Cambia solo el estilo de la barra de menús desplegables, no la barra de iconos. Carga cualquier fuente web en la página anfitriona antes de pasar su familia.',
    borderExampleBody:
      'Define el recuadro exterior del editor. Usa “none” para quitar grosor, radio y sombra. Los campos del objeto son independientes; los omitidos conservan los valores predeterminados. Se ignora en pantalla completa.',
    fontsExampleBody:
      'Pasa customFonts para añadir fuentes de la aplicación después de la lista web segura. El css opcional es una URL de hoja de estilos. Si se usa una webfont, su enlace se antepone al HTML exportado.',
    imageExampleBody:
      'Pasa customImagePicker para añadir una tercera fuente de inserción de imágenes. Con disableBuiltinImageInsert se omite el diálogo integrado y se abre tu selector de inmediato.',
    toolbarExampleBody:
      'Omite toolbarCustomization para guardar el diseño en localStorage. Pasa load y save para almacenarlo en el anfitrión, incluidas las APIs asíncronas.',
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
