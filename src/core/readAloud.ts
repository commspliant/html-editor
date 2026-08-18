import type { CustomActionSelection } from '../types'

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function htmlToPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.innerText ?? div.textContent ?? '').trim()
}

export function resolveReadAloudText(
  selection: CustomActionSelection,
  html: string,
): string | null {
  const selected = selection.text.trim()
  if (selected) return selected
  const documentText = htmlToPlainText(html)
  return documentText || null
}

export type ReadAloudSession = {
  toggle: (text: string) => void
  isSpeaking: () => boolean
  cancel: () => void
}

export function createReadAloudSession(onChange: () => void): ReadAloudSession {
  const synth = window.speechSynthesis

  const notify = () => {
    onChange()
  }

  return {
    toggle(text: string) {
      if (!isSpeechSynthesisSupported()) return
      if (synth.speaking) {
        synth.cancel()
        notify()
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = notify
      utterance.onerror = notify
      synth.speak(utterance)
      notify()
    },
    isSpeaking() {
      return isSpeechSynthesisSupported() && synth.speaking
    },
    cancel() {
      if (!isSpeechSynthesisSupported()) return
      if (synth.speaking) {
        synth.cancel()
        notify()
      }
    },
  }
}
