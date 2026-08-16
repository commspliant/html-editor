import { Fragment, type ReactNode } from 'react'

type DocsMarkdownProps = {
  markdown: string
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        nodes.push(
          <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer">
            {link[1]}
          </a>,
        )
      }
    }
    key += 1
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }
  return nodes
}

function splitTableCells(row: string): string[] {
  const inner = row.replace(/^\|/, '').replace(/\|$/, '')
  const cells: string[] = []
  let current = ''
  for (let index = 0; index < inner.length; index += 1) {
    if (inner[index] === '\\' && inner[index + 1] === '|') {
      current += '|'
      index += 1
    } else if (inner[index] === '|') {
      cells.push(current.trim())
      current = ''
    } else {
      current += inner[index]
    }
  }
  cells.push(current.trim())
  return cells
}

function isTableSeparator(row: string): boolean {
  return /^\|?\s*:?-{3,}/.test(row)
}

function renderBlocks(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0
  let key = 0

  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() === '') {
      index += 1
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3')
      blocks.push(
        <Tag key={key} className={`docs-h${level}`}>
          {renderInline(heading[2])}
        </Tag>,
      )
      key += 1
      index += 1
      continue
    }

    if (line.trimStart().startsWith('|')) {
      const rows: string[] = []
      while (index < lines.length && lines[index].trimStart().startsWith('|')) {
        rows.push(lines[index])
        index += 1
      }
      const bodyRows = rows.filter((row) => !isTableSeparator(row))
      if (bodyRows.length > 0) {
        const header = splitTableCells(bodyRows[0])
        const data = bodyRows.slice(1).map(splitTableCells)
        blocks.push(
          <div key={key} className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  {header.map((cell) => (
                    <th key={cell}>{renderInline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((cells) => (
                  <tr key={cells.join('|')}>
                    {cells.map((cell, cellIndex) => (
                      <td key={`${cellIndex}-${cell}`}>{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
        key += 1
      }
      continue
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      const ordered = /^\s*\d+\.\s+/.test(line)
      while (
        index < lines.length &&
        (ordered ? /^\s*\d+\.\s+/.test(lines[index]) : /^\s*[-*]\s+/.test(lines[index]))
      ) {
        items.push(lines[index].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))
        index += 1
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(
        <List key={key} className="docs-list">
          {items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </List>,
      )
      key += 1
      continue
    }

    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !lines[index].match(/^(#{1,3})\s+/) &&
      !lines[index].trimStart().startsWith('|') &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index])
      index += 1
    }
    blocks.push(
      <p key={key} className="docs-p">
        {renderInline(paragraph.join(' '))}
      </p>,
    )
    key += 1
  }

  return blocks
}

export function DocsMarkdown({ markdown }: DocsMarkdownProps) {
  const chunks: ReactNode[] = []
  const fence = /```(\w*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = fence.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      chunks.push(
        <Fragment key={`t-${key}`}>{renderBlocks(markdown.slice(lastIndex, match.index))}</Fragment>,
      )
      key += 1
    }
    chunks.push(
      <pre key={`c-${key}`} className="code-example-pre docs-pre">
        <code>{match[2].replace(/\n$/, '')}</code>
      </pre>,
    )
    key += 1
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < markdown.length) {
    chunks.push(<Fragment key={`t-${key}`}>{renderBlocks(markdown.slice(lastIndex))}</Fragment>)
  }

  return <div className="docs-markdown">{chunks}</div>
}
