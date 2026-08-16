import type { IconProps } from './types'

export function SaveIcon({ className }: IconProps) {
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
      data-icon="save"
    >
      <path d="M5 3h11l5 5v13H5V3z" />
      <path d="M15 3v6H9V3" />
      <path d="M8 21v-7h8v7" />
    </svg>
  )
}
