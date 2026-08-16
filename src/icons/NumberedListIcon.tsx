import type { IconProps } from './types'

export function NumberedListIcon({ className }: IconProps) {
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
      data-icon="numbered-list"
    >
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M4 5v3h2" />
      <path d="M4 11h2l-2 2h2" />
      <path d="M4 19h2" />
      <path d="M4 17h2v2" />
    </svg>
  )
}
