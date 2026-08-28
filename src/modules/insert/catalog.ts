import { PagePropertiesIcon, ParagraphPropertiesIcon } from '../../icons'
import type { ToolbarCatalog } from '../../toolbar/types'
import { AudioIcon, BookmarkIcon, HorizontalRuleIcon, ImageIcon, LinkIcon, PageBreakIcon, YoutubeIcon } from '../../icons'

export const insertCatalog: ToolbarCatalog = {
  menus: {
    insert: {
      id: 'insert',
      labelKey: 'menuInsert',
      ariaKey: 'menuInsertAria',
    },
  },
  submenus: {
    insertPage: {
      id: 'insertPage',
      labelKey: 'menuInsertPage',
      ariaKey: 'menuInsertPageAria',
      enabled: 'hasSelectedPage',
    },
  },
  groups: {
    insert: {
      id: 'insert',
      labelKey: 'toolbarGroupInsert',
    },
  },
  items: {
    link: {
      id: 'link',
      command: 'openLinkDialog',
      icon: LinkIcon,
      labelKey: 'commandLink',
      ariaKey: 'commandLinkAria',
      enabled: 'isVisualMode',
      active: 'isLink',
      toggle: true,
    },
    bookmark: {
      id: 'bookmark',
      command: 'openBookmarkDialog',
      icon: BookmarkIcon,
      labelKey: 'commandBookmark',
      ariaKey: 'commandBookmarkAria',
      enabled: 'isVisualMode',
    },
    image: {
      id: 'image',
      command: 'openImageDialog',
      icon: ImageIcon,
      labelKey: 'commandImage',
      ariaKey: 'commandImageAria',
      enabled: 'isVisualMode',
    },
    pageBackgroundImage: {
      id: 'pageBackgroundImage',
      command: 'openPageBackgroundImage',
      icon: PagePropertiesIcon,
      labelKey: 'commandPageBackgroundImage',
      ariaKey: 'commandPageBackgroundImageAria',
      enabled: 'canInsertPageBackgroundImage',
    },
    paragraphBackgroundImage: {
      id: 'paragraphBackgroundImage',
      command: 'openParagraphBackgroundImage',
      icon: ParagraphPropertiesIcon,
      labelKey: 'commandParagraphBackgroundImage',
      ariaKey: 'commandParagraphBackgroundImageAria',
      enabled: 'canInsertParagraphBackgroundImage',
    },
    audio: {
      id: 'audio',
      command: 'openAudioDialog',
      icon: AudioIcon,
      labelKey: 'commandAudio',
      ariaKey: 'commandAudioAria',
      enabled: 'isVisualMode',
    },
    youtube: {
      id: 'youtube',
      command: 'openYoutubeDialog',
      icon: YoutubeIcon,
      labelKey: 'commandYoutube',
      ariaKey: 'commandYoutubeAria',
      enabled: 'isVisualMode',
    },
    horizontalRule: {
      id: 'horizontalRule',
      command: 'insertHorizontalRule',
      icon: HorizontalRuleIcon,
      labelKey: 'commandHorizontalRule',
      ariaKey: 'commandHorizontalRuleAria',
      enabled: 'isVisualMode',
    },
    pageBreak: {
      id: 'pageBreak',
      command: 'insertPageBreak',
      icon: PageBreakIcon,
      labelKey: 'commandPageBreak',
      ariaKey: 'commandPageBreakAria',
      enabled: 'isVisualMode',
    },
    insertPageBefore: {
      id: 'insertPageBefore',
      command: 'insertPageBefore',
      icon: PagePropertiesIcon,
      labelKey: 'commandInsertPageBefore',
      ariaKey: 'commandInsertPageBeforeAria',
      enabled: 'hasSelectedPage',
    },
    insertPageAfter: {
      id: 'insertPageAfter',
      command: 'insertPageAfter',
      icon: PagePropertiesIcon,
      labelKey: 'commandInsertPageAfter',
      ariaKey: 'commandInsertPageAfterAria',
      enabled: 'hasSelectedPage',
    },
  },
}
