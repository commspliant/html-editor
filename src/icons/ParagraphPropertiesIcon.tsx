import type { IconProps } from './types'

export function ParagraphPropertiesIcon({ className }: IconProps) {
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
      data-icon="paragraph-properties"
    >
      <path d="M13 4H9a4 4 0 0 0 0 8h2" />
      <path d="M15 4v16" />
      <path d="M11 4v16" />
    </svg>
  )
}
