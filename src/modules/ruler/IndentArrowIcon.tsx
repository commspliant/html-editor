import React from 'react'
import styles from './Ruler.module.css'

export type IndentArrowType = 'down' | 'up' | 'box'

export type IndentArrowIconProps = {
  type: IndentArrowType
  active?: boolean
  className?: string
  style?: React.CSSProperties
  title?: string
  'aria-label'?: string
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  'data-testid'?: string
}

export const IndentArrowIcon: React.FC<IndentArrowIconProps> = ({
  type,
  active = false,
  className = '',
  style,
  title,
  'aria-label': ariaLabel,
  onPointerDown,
  'data-testid': testId,
}) => {
  const typeClass =
    type === 'down'
      ? styles.arrowDown
      : type === 'up'
        ? styles.arrowUp
        : styles.arrowBox

  return (
    <div
      className={`${styles.arrowIconWrapper} ${typeClass} ${active ? styles.arrowActive : ''} ${className}`}
      style={style}
      title={title}
      aria-label={ariaLabel || title}
      onPointerDown={onPointerDown}
      data-testid={testId}
    >
      <div className={styles.arrowGlyph} />
    </div>
  )
}
