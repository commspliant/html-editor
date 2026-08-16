import type { IconProps } from './types'

export function CellPropertiesIcon({ className }: IconProps) {
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
      data-icon="cell-properties"
    >
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 12h18" />
      <path d="M12 4v16" />
      <rect x="12.5" y="4.5" width="8" height="7" fill="currentColor" stroke="none" opacity="0.25" />
    </svg>
  )
}
