import type { editor } from 'monaco-editor'
import { noteEditor } from './fields'

let monacoEditor: editor.IStandaloneCodeEditor | null = null

export function bindMonaco(instance: editor.IStandaloneCodeEditor | null): void {
  monacoEditor = instance
}

export { noteEditor }

export function runNoteEdit(action: 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll'): void {
  const field = noteEditor()
  const textareaFocused = field instanceof HTMLTextAreaElement && document.activeElement === field
  if (!textareaFocused && monacoEditor) {
    const commands: Record<typeof action, string> = {
      undo: 'undo',
      redo: 'redo',
      cut: 'editor.action.clipboardCutAction',
      copy: 'editor.action.clipboardCopyAction',
      paste: 'editor.action.clipboardPasteAction',
      selectAll: 'editor.action.selectAll'
    }
    monacoEditor.focus()
    monacoEditor.trigger('taskapp', commands[action], null)
    return
  }
  if (!field) return
  field.focus()
  if (action === 'paste') {
    void navigator.clipboard.readText().then((text) => {
      if (!text) return
      field.focus()
      if (!document.execCommand('insertText', false, text)) {
        const start = field.selectionStart
        const end = field.selectionEnd
        const next = field.value.slice(0, start) + text + field.value.slice(end)
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
        setter?.call(field, next)
        field.setSelectionRange(start + text.length, start + text.length)
        field.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }).catch(() => {
      document.execCommand('paste')
    })
    return
  }
  document.execCommand(action)
}
