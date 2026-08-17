import type { IconProps } from './types'

export function FontSizeIcon({ className }: IconProps) {
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
      data-icon="font-size"
    >
      <path d="M4 18V8h3" />
      <path d="M4 8h8" />
      <path d="M10 8v10" />
      <path d="M16 18V12h2" />
      <path d="M16 12h5" />
      <path d="M19 12v6" />
    </svg>
  )
}
