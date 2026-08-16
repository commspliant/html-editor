import type { IconProps } from './types'

export function OpenIcon({ className }: IconProps) {
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
      data-icon="open"
    >
      <path d="M3 7h6l2 2h10v3" />
      <path d="M3 10l2.2 9h13.6L21 10H3z" />
    </svg>
  )
}
