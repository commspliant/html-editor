import type { IconProps } from './types'

export function AlignCenterIcon({ className }: IconProps) {
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
      data-icon="align-center"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M4 18h16" />
    </svg>
  )
}
