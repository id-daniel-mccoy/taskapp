import { caretFromText, type CaretInfo } from '@shared/text'

export function emitCaret(info: CaretInfo | null): void {
  window.dispatchEvent(new CustomEvent('taskapp:caret', { detail: info }))
}

export function caretFromTextarea(field: HTMLTextAreaElement): CaretInfo {
  return caretFromText(field.value, field.selectionStart, field.selectionEnd)
}

export function setTextareaValue(field: HTMLTextAreaElement, next: string, start: number, end = start): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(field, next)
  field.setSelectionRange(start, end)
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

export function indentTextarea(field: HTMLTextAreaElement, outdent: boolean): void {
  const value = field.value
  const start = field.selectionStart
  const end = field.selectionEnd
  const blockStart = value.lastIndexOf('\n', start - 1) + 1
  let blockEnd = value.indexOf('\n', end)
  if (blockEnd < 0) blockEnd = value.length
  if (end > start && value[end - 1] === '\n') blockEnd = end - 1
  const block = value.slice(blockStart, blockEnd)
  const lines = block.split('\n')
  const nextLines = lines.map((line) => {
    if (outdent) {
      if (line.startsWith('\t')) return line.slice(1)
      if (line.startsWith('  ')) return line.slice(2)
      if (line.startsWith(' ')) return line.slice(1)
      return line
    }
    return `  ${line}`
  })
  const nextBlock = nextLines.join('\n')
  const next = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd)
  const deltaStart = nextLines[0].length - lines[0].length
  const delta = nextBlock.length - block.length
  setTextareaValue(field, next, Math.max(blockStart, start + deltaStart), Math.max(blockStart, end + delta))
}
