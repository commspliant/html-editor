import { isPageCanvasSized } from './pageCanvasLayout'
import { queryPageAtRule } from './pageAtRule'

/** True when the page HTML defines a sized print canvas (@page preset or custom width+height). */
export function hasPrintLayout(pageHtml: string): boolean {
  return isPageCanvasSized(queryPageAtRule(pageHtml))
}
