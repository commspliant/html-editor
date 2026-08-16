import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { en } from './en'
import { es } from './es'
import type { Locale, MessageKey, Messages } from './types'

const dictionaries: Record<Locale, Messages> = { en, es }

export type Translate = (key: MessageKey) => string

const LocaleContext = createContext<Translate>((key) => en[key])

type LocaleProviderProps = {
  locale?: Locale
  children: ReactNode
}

export function LocaleProvider({ locale = 'en', children }: LocaleProviderProps) {
  const t = useMemo<Translate>(() => {
    const messages = dictionaries[locale] ?? en
    return (key) => messages[key]
  }, [locale])

  return <LocaleContext.Provider value={t}>{children}</LocaleContext.Provider>
}

export function useT(): Translate {
  return useContext(LocaleContext)
}
