import type { IconProps } from './types'

export function PageBreakIcon({ className }: IconProps) {
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
      data-icon="pageBreak"
    >
      <path d="M4 10h16" strokeDasharray="3 2" />
      <path d="M14 10v8" />
      <path d="M18 14h4v4h-4z" />
    </svg>
  )
}
