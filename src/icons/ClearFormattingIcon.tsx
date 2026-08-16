import type { IconProps } from './types'

export function ClearFormattingIcon({ className }: IconProps) {
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
      data-icon="clear-formatting"
    >
      <path d="M4 5h12" />
      <path d="M10 5v8" />
      <path d="m14 15 6 6" />
      <path d="m20 15-6 6" />
    </svg>
  )
}
