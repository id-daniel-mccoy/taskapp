export function noteEditor(): HTMLTextAreaElement | null {
  return document.querySelector('textarea.note-editor')
}

export function runNoteEdit(action: 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll'): void {
  const field = noteEditor()
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
