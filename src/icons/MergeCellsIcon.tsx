import type { IconProps } from './types'

export function MergeCellsIcon({ className }: IconProps) {
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
      data-icon="merge-cells"
    >
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 12h5" />
      <path d="M16 12h5" />
      <path d="M12 4v16" />
      <path d="M9 9l3 3-3 3" />
      <path d="M15 9l-3 3 3 3" />
    </svg>
  )
}
