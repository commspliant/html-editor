import type { IconProps } from './types'

export function UnderlineIcon({ className }: IconProps) {
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
      data-icon="underline"
    >
      <path d="M7 4v8a5 5 0 0 0 10 0V4" />
      <path d="M5 20h14" />
    </svg>
  )
}
