export type OverflowState = {
  canScrollLeft: boolean
  canScrollRight: boolean
}

const OVERFLOW_EPSILON = 1

export function getOverflowState(
  el: Pick<HTMLElement, 'scrollLeft' | 'scrollWidth' | 'clientWidth'>,
): OverflowState {
  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
  return {
    canScrollLeft: el.scrollLeft > OVERFLOW_EPSILON,
    canScrollRight: el.scrollLeft < maxScroll - OVERFLOW_EPSILON,
  }
}

const ICON_BUTTON_SCROLL_FALLBACK_PX = 40

export function overflowScrollAmount(el: ParentNode): number {
  const button = el.querySelector('button')
  const measured = button instanceof HTMLElement ? button.offsetWidth : 0
  return Math.max(measured || ICON_BUTTON_SCROLL_FALLBACK_PX, 1)
}
