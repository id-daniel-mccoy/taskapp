import { IconX } from '../lib/icons'
import type { ViewerDoc } from '../hooks/useWorkspace'

interface Props {
  docs: ViewerDoc[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
}

export function TabBar({ docs, activeId, onSelect, onClose }: Props) {
  if (!docs.length) return null
  return (
    <div className="tabbar" role="tablist">
      {docs.map((doc) => (
        <button
          key={doc.id}
          className={`tab${doc.id === activeId ? ' active' : ''}`}
          role="tab"
          aria-selected={doc.id === activeId}
          onClick={() => onSelect(doc.id)}
          onAuxClick={(event) => {
            if (event.button === 1) {
              event.preventDefault()
              onClose(doc.id)
            }
          }}
        >
          <span>{('dirty' in doc && doc.dirty) ? `• ${doc.name}` : doc.name}</span>
          <span
            className="tab-close"
            role="button"
            title="Close"
            onClick={(event) => {
              event.stopPropagation()
              onClose(doc.id)
            }}
          >
            <IconX width="12" height="12" />
          </span>
        </button>
      ))}
    </div>
  )
}
