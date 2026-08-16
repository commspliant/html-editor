import type { IconProps } from './types'

export function FontPropertiesIcon({ className }: IconProps) {
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
      data-icon="font-properties"
    >
      <path d="M4 20h4" />
      <path d="M6 20V6" />
      <path d="M4 6h4" />
      <path d="M12 20V9" />
      <path d="M12 9h8" />
      <path d="M16 9v11" />
    </svg>
  )
}
