import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '../i18n/LocaleProvider'
import styles from './HtmlPageTabs.module.css'

const SCROLL_ARROW_THRESHOLD = 5
const SCROLL_STEP_PX = 120

type HtmlPageTabsProps = {
  pageCount: number
  activeIndex: number
  onSelect: (index: number) => void
}

export function HtmlPageTabs({ pageCount, activeIndex, onSelect }: HtmlPageTabsProps) {
  const t = useT()
  const listRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const showScrollButtons = pageCount >= SCROLL_ARROW_THRESHOLD

  const refreshScrollState = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const { scrollLeft, scrollWidth, clientWidth } = list
    setCanScrollLeft(scrollLeft > 1)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  useEffect(() => {
    refreshScrollState()
  }, [pageCount, activeIndex, refreshScrollState])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const activeTab = list.querySelector<HTMLElement>(`[data-page-tab="${activeIndex}"]`)
    activeTab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    refreshScrollState()
  }, [activeIndex, refreshScrollState])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const onScroll = () => refreshScrollState()
    list.addEventListener('scroll', onScroll, { passive: true })
    if (typeof ResizeObserver === 'undefined') {
      return () => {
        list.removeEventListener('scroll', onScroll)
      }
    }
    const observer = new ResizeObserver(() => refreshScrollState())
    observer.observe(list)
    return () => {
      list.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [refreshScrollState])

  const scrollBy = (delta: number) => {
    listRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const pageLabel = (index: number) => t('htmlModePageTab').replace('{n}', String(index + 1))

  return (
    <div className={styles.shell}>
      {showScrollButtons ? (
        <button
          type="button"
          className={styles.scrollButton}
          aria-label={t('htmlModePageTabsScrollLeftAria')}
          disabled={!canScrollLeft}
          onClick={() => scrollBy(-SCROLL_STEP_PX)}
        >
          ‹
        </button>
      ) : null}
      <div
        ref={listRef}
        className={styles.tabList}
        role="tablist"
        aria-label={t('htmlModePageTabsAria')}
      >
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            data-page-tab={index}
            className={`${styles.tab} ${index === activeIndex ? styles.tabActive : ''}`}
            aria-selected={index === activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => onSelect(index)}
          >
            {pageLabel(index)}
          </button>
        ))}
      </div>
      {showScrollButtons ? (
        <button
          type="button"
          className={styles.scrollButton}
          aria-label={t('htmlModePageTabsScrollRightAria')}
          disabled={!canScrollRight}
          onClick={() => scrollBy(SCROLL_STEP_PX)}
        >
          ›
        </button>
      ) : null}
    </div>
  )
}
