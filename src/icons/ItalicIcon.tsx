import type { IconProps } from './types'

export function ItalicIcon({ className }: IconProps) {
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
      data-icon="italic"
    >
      <path d="M10 4h9" />
      <path d="M5 20h9" />
      <path d="M14 4L8 20" />
    </svg>
  )
}
