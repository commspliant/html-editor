import type { IconProps } from './types'

export function FontColorIcon({ className }: IconProps) {
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
      data-icon="font-color"
    >
      <path d="M6 18L12 4l6 14" />
      <path d="M8.5 13h7" />
    </svg>
  )
}
