import type { Ref } from 'react'
import { IconChevronDown, IconChevronUp, IconX } from '../lib/icons'
import { IconButton } from './IconButton'

interface Props {
  query: string
  replace: string
  caseSensitive: boolean
  wholeWord: boolean
  showReplace: boolean
  matchLabel: string
  findRef?: Ref<HTMLInputElement>
  onQuery: (value: string) => void
  onReplaceValue: (value: string) => void
  onToggleCase: () => void
  onToggleWord: () => void
  onNext: () => void
  onPrev: () => void
  onReplace: () => void
  onReplaceAll: () => void
  onClose: () => void
}

export function FindBar({
  query,
  replace,
  caseSensitive,
  wholeWord,
  showReplace,
  matchLabel,
  findRef,
  onQuery,
  onReplaceValue,
  onToggleCase,
  onToggleWord,
  onNext,
  onPrev,
  onReplace,
  onReplaceAll,
  onClose
}: Props) {
  return (
    <form
      className="find-bar"
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
    >
      <input
        ref={findRef}
        value={query}
        placeholder="Find"
        aria-label="Find"
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }
          if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault()
            onPrev()
          }
        }}
      />
      {showReplace && (
        <input
          value={replace}
          placeholder="Replace"
          aria-label="Replace"
          onChange={(event) => onReplaceValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              onClose()
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              onReplace()
            }
          }}
        />
      )}
      <span className="find-count">{matchLabel}</span>
      <button
        type="button"
        className={`chip-btn${caseSensitive ? ' on' : ''}`}
        aria-pressed={caseSensitive}
        title="Match case"
        onClick={onToggleCase}
      >
        Aa
      </button>
      <button
        type="button"
        className={`chip-btn${wholeWord ? ' on' : ''}`}
        aria-pressed={wholeWord}
        title="Whole word"
        onClick={onToggleWord}
      >
        W
      </button>
      <IconButton label="Previous match" onClick={onPrev}><IconChevronUp /></IconButton>
      <IconButton label="Next match" onClick={onNext}><IconChevronDown /></IconButton>
      {showReplace && (
        <>
          <button type="button" className="chip-btn" onClick={onReplace}>Replace</button>
          <button type="button" className="chip-btn" onClick={onReplaceAll}>All</button>
        </>
      )}
      <IconButton label="Close find" onClick={onClose}><IconX /></IconButton>
    </form>
  )
}
