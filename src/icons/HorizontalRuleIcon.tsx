import type { IconProps } from './types'

export function HorizontalRuleIcon({ className }: IconProps) {
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
      data-icon="horizontalRule"
    >
      <path d="M4 12h16" />
    </svg>
  )
}
