import { inspectJson } from '../lib/json'
import type { ThemePreference } from '@shared/types'
import { CodeEditor } from './CodeEditor'

interface Props {
  name: string
  path: string
  content: string
  dirty: boolean
  wordWrap: boolean
  fontSize: number
  theme: ThemePreference
  onChange: (value: string) => void
}

export function JsonViewer({ name, path, content, dirty, wordWrap, fontSize, theme, onChange }: Props) {
  const check = inspectJson(content)
  return (
    <div className="file-viewer">
      <div className="file-viewer-banner">
        <div>
          <strong>{dirty ? `• ${name}` : name}</strong>
          <span>{path}</span>
        </div>
        <em className={check.ok ? 'ok' : 'bad'}>
          {check.ok ? `JSON${dirty ? ' · unsaved' : ''}` : check.message}
        </em>
      </div>
      <CodeEditor
        key={path}
        value={content}
        language="json"
        theme={theme}
        wordWrap={wordWrap}
        fontSize={fontSize}
        onChange={onChange}
      />
    </div>
  )
}
