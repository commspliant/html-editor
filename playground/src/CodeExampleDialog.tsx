import { codeExampleBlocks, type ExampleBlockId } from './codeExamples'
import type { PlaygroundMessages } from './i18n/messages'

type CodeExampleDialogProps = {
  blockId: ExampleBlockId
  messages: PlaygroundMessages
  onClose: () => void
}

export function CodeExampleDialog({ blockId, messages, onClose }: CodeExampleDialogProps) {
  const block = codeExampleBlocks[blockId]
  const title = messages[block.titleKey]
  const body = messages[block.bodyKey]

  return (
    <div
      className="ai-dialog-backdrop"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        className="ai-dialog code-example-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-example-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="code-example-title" className="ai-dialog-title">
          {title}
        </h2>
        <p className="code-example-body">{body}</p>
        {block.snippets.map((snippet) => (
          <pre key={snippet} className="code-example-pre">
            <code>{snippet}</code>
          </pre>
        ))}
        <div className="ai-dialog-actions">
          <button type="button" className="ai-dialog-button" onClick={onClose}>
            {messages.codeExamplesClose}
          </button>
        </div>
      </div>
    </div>
  )
}
