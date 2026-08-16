import type { IconProps } from './types'

export function TableRowIcon({ className }: IconProps) {
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
      data-icon="table-row"
    >
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 10h18" />
      <path d="M3 16h18" />
      <rect x="4" y="10.5" width="16" height="5" fill="currentColor" stroke="none" opacity="0.25" />
    </svg>
  )
}
