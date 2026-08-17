import type { IconProps } from './types'

export function FontFamilyIcon({ className }: IconProps) {
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
      data-icon="font-family"
    >
      <path d="M4 18L9 6l5 12" />
      <path d="M6.2 13h5.6" />
      <path d="M16 18V9" />
      <path d="M16 9h5" />
    </svg>
  )
}
