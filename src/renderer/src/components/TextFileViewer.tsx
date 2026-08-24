interface Props {
  name: string
  path: string
  label: string
  content: string
  dirty: boolean
  wordWrap: boolean
  fontSize: number
  onChange: (value: string) => void
}

export function TextFileViewer({ name, path, label, content, dirty, wordWrap, fontSize, onChange }: Props) {
  return (
    <div className="file-viewer">
      <div className="file-viewer-banner">
        <div>
          <strong>{dirty ? `• ${name}` : name}</strong>
          <span>{path}</span>
        </div>
        <em>{label}{dirty ? ' · unsaved' : ''}</em>
      </div>
      <textarea
        className="file-viewer-body"
        value={content}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        wrap={wordWrap ? 'soft' : 'off'}
        style={{ fontSize: `${fontSize}px`, whiteSpace: wordWrap ? 'pre-wrap' : 'pre' }}
      />
    </div>
  )
}
