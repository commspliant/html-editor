import type { IconProps } from './types'

export function FormatBrushIcon({ className }: IconProps) {
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
      data-icon="format-brush"
    >
      <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.34-3 3v2.06h2.06c1.66 0 3-1.34 3-3v-2.06Z" />
      <path d="M7.07 14.94 4.01 18" />
    </svg>
  )
}
