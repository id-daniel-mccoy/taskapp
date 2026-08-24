import { inspectJson } from '../lib/json'

interface Props {
  name: string
  path: string
  content: string
}

export function JsonViewer({ name, path, content }: Props) {
  const check = inspectJson(content)
  return (
    <div className="file-viewer">
      <div className="file-viewer-banner">
        <div>
          <strong>{name}</strong>
          <span>{path}</span>
        </div>
        <em className={check.ok ? 'ok' : 'bad'}>{check.ok ? 'JSON · read only' : check.message}</em>
      </div>
      <textarea
        className="file-viewer-body"
        value={check.ok ? check.formatted ?? content : content}
        readOnly
        spellCheck={false}
      />
    </div>
  )
}
