import { useEffect, useState } from 'react'
import type { ThemePreference } from '@shared/types'
import { CodeEditor } from './CodeEditor'
import { renderMarkdown } from '../lib/markdown'

interface Props {
  name: string
  path: string
  label: string
  language: string
  content: string
  dirty: boolean
  wordWrap: boolean
  fontSize: number
  theme: ThemePreference
  onChange: (value: string) => void
}

export function TextFileViewer({
  name,
  path,
  label,
  language,
  content,
  dirty,
  wordWrap,
  fontSize,
  theme,
  onChange
}: Props) {
  const markdown = language === 'markdown'
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    const onPreview = () => {
      if (markdown) setPreview((value) => !value)
    }
    window.addEventListener('taskapp:preview', onPreview)
    return () => window.removeEventListener('taskapp:preview', onPreview)
  }, [markdown])

  useEffect(() => {
    setPreview(false)
  }, [path])

  return (
    <div className="file-viewer">
      <div className="file-viewer-banner">
        <div>
          <strong>{dirty ? `• ${name}` : name}</strong>
          <span>{path}</span>
        </div>
        <div className="file-viewer-actions">
          {markdown && (
            <button type="button" className={`chip-btn${preview ? ' on' : ''}`} onClick={() => setPreview((value) => !value)}>
              Preview
            </button>
          )}
          <em>{label}{dirty ? ' · unsaved' : ''}</em>
        </div>
      </div>
      <div className={`file-viewer-work${preview ? ' has-preview' : ''}`}>
        <CodeEditor
          key={path}
          value={content}
          language={language}
          theme={theme}
          wordWrap={wordWrap}
          fontSize={fontSize}
          onChange={onChange}
        />
        {preview && (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            onClick={(event) => {
              const link = (event.target as HTMLElement).closest('a')
              if (link) event.preventDefault()
            }}
          />
        )}
      </div>
    </div>
  )
}
