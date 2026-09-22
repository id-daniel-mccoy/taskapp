function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === '&') return '&amp;'
    if (character === '<') return '&lt;'
    if (character === '>') return '&gt;'
    if (character === '"') return '&quot;'
    return '&#39;'
  })
}

function inline(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_]+)_/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let index = 0
  let inList: 'ul' | 'ol' | null = null
  let inCode = false
  let code: string[] = []

  const closeList = () => {
    if (inList) {
      html.push(`</${inList}>`)
      inList = null
    }
  }

  while (index < lines.length) {
    const line = lines[index]
    if (line.startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
        code = []
        inCode = false
      } else {
        closeList()
        inCode = true
      }
      index += 1
      continue
    }
    if (inCode) {
      code.push(line)
      index += 1
      continue
    }
    if (/^\s*$/.test(line)) {
      closeList()
      index += 1
      continue
    }
    if (/^---+$/.test(line.trim())) {
      closeList()
      html.push('<hr />')
      index += 1
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      index += 1
      continue
    }
    if (line.startsWith('> ')) {
      closeList()
      html.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`)
      index += 1
      continue
    }
    const unordered = line.match(/^\s*[-*+]\s+(.*)$/)
    if (unordered) {
      if (inList !== 'ul') {
        closeList()
        html.push('<ul>')
        inList = 'ul'
      }
      html.push(`<li>${inline(unordered[1])}</li>`)
      index += 1
      continue
    }
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ordered) {
      if (inList !== 'ol') {
        closeList()
        html.push('<ol>')
        inList = 'ol'
      }
      html.push(`<li>${inline(ordered[1])}</li>`)
      index += 1
      continue
    }
    closeList()
    html.push(`<p>${inline(line)}</p>`)
    index += 1
  }
  if (inCode) html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
  closeList()
  return html.join('')
}
