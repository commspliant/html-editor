import type { IconProps } from './types'

export function RedoIcon({ className }: IconProps) {
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
      data-icon="redo"
    >
      <path d="M21 10H10a5 5 0 0 0 0 10h1" />
      <path d="M17 6l4 4-4 4" />
    </svg>
  )
}
