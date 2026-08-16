import type { IconProps } from './types'

export function PagePropertiesIcon({ className }: IconProps) {
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
      data-icon="page-properties"
    >
      <path d="M6 3h8l6 6v12H6z" />
      <path d="M14 3v6h6" />
    </svg>
  )
}
