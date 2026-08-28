import type { IconProps } from './types'

export function RulerIcon({ className }: IconProps) {
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
      data-icon="ruler"
    >
      <path d="M4 8h16" />
      <path d="M4 16h16" />
      <path d="M6 8v8" />
      <path d="M10 8v4" />
      <path d="M14 8v6" />
      <path d="M18 8v8" />
    </svg>
  )
}
