import readme from '../../README.md?raw'
import { DocsMarkdown } from './DocsMarkdown'

type DocumentationPageProps = {
  label: string
}

export function DocumentationPage({ label }: DocumentationPageProps) {
  return (
    <section className="docs-page" aria-label={label}>
      <article className="docs-article">
        <DocsMarkdown markdown={readme} />
      </article>
    </section>
  )
}
