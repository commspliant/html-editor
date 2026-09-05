import {
  isPageBackgroundLayer,
  PAGE_BG_LAYER_ATTR,
  PAGE_SHELL_ATTR,
} from './page'
import { PAGE_AT_RULE_ATTR } from './pageAtRule'

function parsePageHtml(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

function serializePageBody(doc: Document): string {
  return doc.body.innerHTML.replace(/\s*data-page=""/g, ' data-page')
}

function unwrapPageShell(doc: Document): void {
  const shells = [...doc.body.querySelectorAll(`[${PAGE_SHELL_ATTR}]`)]
  for (const shell of shells) {
    if (!(shell instanceof HTMLElement)) continue
    const parent = shell.parentElement
    if (!parent) continue
    while (shell.firstChild) {
      parent.insertBefore(shell.firstChild, shell)
    }
    shell.remove()
  }
}

function removePageBackgroundLayers(doc: Document): void {
  for (const layer of [...doc.body.querySelectorAll(`[${PAGE_BG_LAYER_ATTR}]`)]) {
    layer.remove()
  }
  const byId = doc.getElementById('commspliant-background')
  byId?.remove()
}

/** Remove editor page chrome (@page style, data-page shell, background layers) from page HTML. */
export function stripPageChromeFromPageHtml(html: string): string {
  const doc = parsePageHtml(html)
  for (const style of doc.querySelectorAll(`style[${PAGE_AT_RULE_ATTR}]`)) {
    style.remove()
  }
  removePageBackgroundLayers(doc)
  unwrapPageShell(doc)
  for (const el of doc.body.querySelectorAll('*')) {
    if (el instanceof HTMLElement && isPageBackgroundLayer(el)) {
      el.remove()
    }
  }
  return serializePageBody(doc)
}
