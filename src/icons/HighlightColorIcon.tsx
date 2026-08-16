import type { IconProps } from './types'

export function HighlightColorIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-icon="highlight-color"
    >
      <path d="M15.5 4.5l4 4-9 9H6.5v-4.5z" />
      <path d="M13.5 6.5l4 4" />
      <path d="M4 20h8" />
    </svg>
  )
}
