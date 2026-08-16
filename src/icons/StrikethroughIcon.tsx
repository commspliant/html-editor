import type { IconProps } from './types'

export function StrikethroughIcon({ className }: IconProps) {
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
      data-icon="strikethrough"
    >
      <path d="M6 7.5C6 5.5 8 4 12 4s6 1.5 6 3.5-1.8 2.8-6 3.5" />
      <path d="M6 16.5C6 18.5 8 20 12 20s6-1.5 6-3.5c0-1-.5-1.8-1.8-2.5" />
      <path d="M4 12h16" />
    </svg>
  )
}
