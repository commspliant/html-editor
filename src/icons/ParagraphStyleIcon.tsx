import type { IconProps } from './types'

export function ParagraphStyleIcon({ className }: IconProps) {
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
      data-icon="paragraph-style"
    >
      <path d="M5 6h14" />
      <path d="M5 10h10" />
      <path d="M5 14h14" />
      <path d="M5 18h8" />
    </svg>
  )
}
