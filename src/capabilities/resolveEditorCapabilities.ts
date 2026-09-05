import { PARAGRAPH_STYLE_TAGS } from '../core/blockFormat'
import {
  CONTEXT_MENU_COMMAND_FOOTPRINTS,
  DIALOG_TAB_FOOTPRINTS,
  EDITOR_FEATURE_FOOTPRINTS,
} from './featureFootprint'
import { isDialogTabAllowed, isFeatureAllowed } from './isFeatureAllowed'
import { isPageLayoutAllowed } from './isPageLayoutAllowed'
import { normalizeContract } from './normalizeContract'
import type { EditorCapabilityProfile, RenderingCapabilities } from './types'

function collectHiddenToolbarItems(rules: ReturnType<typeof normalizeContract>): Set<string> {
  const hidden = new Set<string>()
  for (const [itemId, footprint] of Object.entries(EDITOR_FEATURE_FOOTPRINTS)) {
    if (!isFeatureAllowed(footprint, rules)) {
      hidden.add(itemId)
    }
  }
  return hidden
}

function collectHiddenContextMenuCommands(rules: ReturnType<typeof normalizeContract>): Set<string> {
  const hidden = new Set<string>()
  for (const [command, footprint] of Object.entries(CONTEXT_MENU_COMMAND_FOOTPRINTS)) {
    if (!isFeatureAllowed(footprint, rules)) {
      hidden.add(command)
    }
  }
  return hidden
}

function collectAllowedParagraphTags(rules: ReturnType<typeof normalizeContract>): string[] {
  if (!rules.allowedTagSet) {
    return [...PARAGRAPH_STYLE_TAGS]
  }
  return PARAGRAPH_STYLE_TAGS.filter((tag) => rules.allowedTagSet!.has(tag))
}

function collectAllowedFontFamilies(rules: ReturnType<typeof normalizeContract>): string[] | null {
  const fontRule = rules.cssPropertyRules.get('font-family')
  if (!fontRule?.allowedValues || fontRule.allowedValues.length === 0) return null
  return [...fontRule.allowedValues]
}

function collectHiddenDialogTabs(
  rules: ReturnType<typeof normalizeContract>,
): Partial<Record<'paragraph' | 'page', string[]>> {
  const result: Partial<Record<'paragraph' | 'page', string[]>> = {}

  for (const dialog of ['paragraph', 'page'] as const) {
    const hiddenTabs: string[] = []
    for (const [tab, footprint] of Object.entries(DIALOG_TAB_FOOTPRINTS[dialog])) {
      if (!isDialogTabAllowed(dialog, tab, rules, DIALOG_TAB_FOOTPRINTS[dialog])) {
        hiddenTabs.push(tab)
      } else if (!isFeatureAllowed(footprint, rules)) {
        hiddenTabs.push(tab)
      }
    }
    if (hiddenTabs.length > 0) {
      result[dialog] = hiddenTabs
    }
  }

  return result
}

export function resolveEditorCapabilities(
  contract: RenderingCapabilities,
): EditorCapabilityProfile {
  const normalized = normalizeContract(contract)
  return {
    normalized,
    hiddenToolbarItemIds: collectHiddenToolbarItems(normalized),
    hiddenContextMenuCommands: collectHiddenContextMenuCommands(normalized),
    allowedParagraphTags: collectAllowedParagraphTags(normalized),
    allowedFontFamilies: collectAllowedFontFamilies(normalized),
    hiddenDialogTabs: collectHiddenDialogTabs(normalized),
    maxContainerWidthPx: normalized.globalRules.maxContainerWidthPx,
    pageLayoutAllowed: isPageLayoutAllowed(contract),
  }
}
