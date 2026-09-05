import { createContext, useContext } from 'react'
import type { CapabilityValidationResult, EditorCapabilityProfile } from './types'

export type CapabilitiesContextValue = {
  profile: EditorCapabilityProfile | undefined
  validation: CapabilityValidationResult | null
  refreshValidation: () => void
}

const CapabilitiesContext = createContext<CapabilitiesContextValue>({
  profile: undefined,
  validation: null,
  refreshValidation: () => undefined,
})

export function CapabilitiesProvider({
  value,
  children,
}: {
  value: CapabilitiesContextValue
  children: React.ReactNode
}) {
  return <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>
}

export function useCapabilitiesContext(): CapabilitiesContextValue {
  return useContext(CapabilitiesContext)
}

export function useCapabilitiesProfile(): EditorCapabilityProfile | undefined {
  return useContext(CapabilitiesContext).profile
}
