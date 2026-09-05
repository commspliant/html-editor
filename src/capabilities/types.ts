export type CssPropertyStatus =
  | 'allowed'
  | 'restricted'
  | 'disallowed'
  | 'allowed_with_degradation'

export type AllowedTagRule = {
  tag: string
  required_attributes?: Record<string, string>
  allowed_attributes?: string[]
  disallowed_css?: string[]
  forced_css?: Record<string, string>
  default_attributes?: Record<string, string>
  recommended_css?: string[]
  status?: 'restricted'
  notes?: string
}

export type CssPropertyRuleSource = {
  property: string
  status: CssPropertyStatus
  support?: Record<string, string>
  allowed_values?: string[]
  disallowed_values?: string[]
  allowed_on_tags?: string[]
  restrictions?: string
  fallback?: string | null
  fallback_required?: string
  transformation?: string
}

export type RenderingCapabilities = {
  $schema?: string
  title?: string
  version?: string
  description?: string
  global_rules?: {
    layout_mode?: string
    require_inlining?: boolean
    max_container_width_px?: number
    strip_unknown_tags?: boolean
    strip_unknown_attributes?: boolean
  }
  html_elements?: {
    allowed_tags?: AllowedTagRule[]
    disallowed_tags?: string[]
  }
  css_properties?: CssPropertyRuleSource[]
}

export type TagRule = {
  tag: string
  requiredAttributes: Record<string, string>
  allowedAttributes: string[] | null
  disallowedCss: string[]
  forcedCss: Record<string, string>
  defaultAttributes: Record<string, string>
  status?: 'restricted'
  notes?: string
}

export type NormalizedCssPropertyRule = {
  property: string
  status: CssPropertyStatus
  allowedValues: string[] | null
  disallowedValues: string[] | null
  allowedOnTags: string[] | null
  restrictions?: string
  fallback?: string | null
}

export type NormalizedContract = {
  allowedTagSet: Set<string> | null
  disallowedTagSet: Set<string>
  tagRules: Map<string, TagRule>
  cssPropertyRules: Map<string, NormalizedCssPropertyRule>
  globalRules: {
    layoutMode?: string
    requireInlining?: boolean
    maxContainerWidthPx?: number
    stripUnknownTags: boolean
    stripUnknownAttributes: boolean
  }
}

export type CapabilityViolationSeverity = 'error' | 'warning'

export type CapabilityViolation = {
  code: string
  severity: CapabilityViolationSeverity
  messageKey: string
  messageParams: Record<string, string>
  selector?: string
  tag?: string
  attribute?: string
  cssProperty?: string
  pageIndex?: number
}

export type CapabilityValidationResult = {
  valid: boolean
  errorCount: number
  warningCount: number
  violations: CapabilityViolation[]
}

export type EditorCapabilityProfile = {
  normalized: NormalizedContract
  hiddenToolbarItemIds: ReadonlySet<string>
  hiddenContextMenuCommands: ReadonlySet<string>
  allowedParagraphTags: readonly string[]
  allowedFontFamilies: string[] | null
  hiddenDialogTabs: Partial<Record<'paragraph' | 'page', readonly string[]>>
  maxContainerWidthPx?: number
  pageLayoutAllowed: boolean
}
