import type { IconProps } from './types'

export function UndoIcon({ className }: IconProps) {
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
      data-icon="undo"
    >
      <path d="M3 10h11a5 5 0 0 1 0 10h-1" />
      <path d="M7 6L3 10l4 4" />
    </svg>
  )
}
