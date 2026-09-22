export function noteEditor(): HTMLTextAreaElement | null {
  const active = document.activeElement
  if (active instanceof HTMLTextAreaElement) return active
  return document.querySelector('textarea.note-editor')
}
