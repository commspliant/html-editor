import { insertFlowBreakInDocument } from './flowBreakInsert'

export const DEFAULT_HR_MARGIN = '1em 0'
export const DEFAULT_HR_BORDER_TOP = '1px solid #d0d0d0'

function createHorizontalRule(): HTMLHRElement {
  const hr = document.createElement('hr')
  hr.style.margin = DEFAULT_HR_MARGIN
  hr.style.border = '0'
  hr.style.borderTop = DEFAULT_HR_BORDER_TOP
  return hr
}

export function insertHorizontalRuleInDocument(root: HTMLElement): boolean {
  return insertFlowBreakInDocument(root, createHorizontalRule())
}
