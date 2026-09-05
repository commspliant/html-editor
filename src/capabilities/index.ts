export type {
  CapabilityValidationResult,
  CapabilityViolation,
  CapabilityViolationSeverity,
  EditorCapabilityProfile,
  NormalizedContract,
  RenderingCapabilities,
  TagRule,
} from './types'
export { normalizeContract } from './normalizeContract'
export { resolveEditorCapabilities } from './resolveEditorCapabilities'
export {
  filterCapabilitiesLayout,
  isToolbarItemAllowedByCapabilities,
} from './capabilitiesChrome'
export {
  validateHtmlAgainstCapabilities,
  validatePagesAgainstCapabilities,
} from './validateHtml'
export {
  formatCapabilityViolationLocation,
  formatCapabilityViolationMessage,
  interpolateMessageParams,
} from './formatViolation'
export { isFeatureAllowed } from './isFeatureAllowed'
export { isPageLayoutAllowed } from './isPageLayoutAllowed'
export { EDITOR_FEATURE_FOOTPRINTS, DIALOG_TAB_FOOTPRINTS } from './featureFootprint'
