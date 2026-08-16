import type { IconProps } from './types'

export function CustomActionIcon({ className }: IconProps) {
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
      data-icon="custom-action"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 8.5c0-1 .7-1.5 1.5-1.5S12 7.5 12 8.5c0 1.2-3 1.2-3 3.2" />
      <path d="M10.5 14v.5" />
      <path d="M15 10v4" />
      <path d="M13 12h4" />
    </svg>
  )
}
