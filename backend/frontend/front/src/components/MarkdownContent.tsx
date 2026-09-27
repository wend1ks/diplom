import { Fragment } from 'react'

type InlineProps = { text: string }

/** A small, safe Markdown renderer for lesson content. It never injects HTML. */
function Inline({ text }: InlineProps) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g)
  return <>{parts.map((part, index) => {
    if (/^`[^`]+`$/.test(part)) return <code key={index}>{part.slice(1, -1)}</code>
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (/^\*[^*]+\*$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/)
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    return <Fragment key={index}>{part}</Fragment>
  })}</>
}

export default function MarkdownContent({ content }: { content: string }) {
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) { index += 1; continue }
    if (line.startsWith('```')) {
      const language = line.slice(3).trim(); const code: string[] = []; index += 1
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++])
      if (index < lines.length) index += 1
      blocks.push(<pre className="markdown-code" key={`code-${index}`}><code data-language={language}>{code.join('\n')}</code></pre>); continue
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) { const Tag = `h${heading[1].length}` as 'h1' | 'h2' | 'h3'; blocks.push(<Tag key={`heading-${index}`}><Inline text={heading[2]} /></Tag>); index += 1; continue }
    if (line.startsWith('> ')) { blocks.push(<blockquote key={`quote-${index}`}><Inline text={line.slice(2)} /></blockquote>); index += 1; continue }
    const list = line.match(/^[-*]\s+(.+)$/); const ordered = line.match(/^\d+\.\s+(.+)$/)
    if (list || ordered) {
      const isOrdered = Boolean(ordered); const items: string[] = []
      while (index < lines.length) { const item = isOrdered ? lines[index].match(/^\d+\.\s+(.+)$/) : lines[index].match(/^[-*]\s+(.+)$/); if (!item) break; items.push(item[1]); index += 1 }
      const List = isOrdered ? 'ol' : 'ul'; blocks.push(<List key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}><Inline text={item} /></li>)}</List>); continue
    }
    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const cells = (value: string) => value.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()); const headers = cells(line); index += 2; const rows: string[][] = []
      while (index < lines.length && lines[index].includes('|')) rows.push(cells(lines[index++]))
      blocks.push(<div className="markdown-table-wrap" key={`table-${index}`}><table><thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}><Inline text={cell} /></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}><Inline text={row[cellIndex] || ''} /></td>)}</tr>)}</tbody></table></div>); continue
    }
    const paragraph: string[] = [line]; index += 1
    while (index < lines.length && lines[index].trim() && !/^(#{1,3}\s|```|> |[-*]\s+|\d+\.\s+)/.test(lines[index])) paragraph.push(lines[index++])
    blocks.push(<p key={`paragraph-${index}`}><Inline text={paragraph.join(' ')} /></p>)
  }
  return <div className="markdown-content">{blocks}</div>
}
