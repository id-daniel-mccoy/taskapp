import icon from '../assets/icon.png'
import type { RecentFile } from '@shared/types'

interface Props {
  recents: RecentFile[]
  onNew: () => void
  onOpen: () => void
  onOpenPath: (path: string) => void
}

export function Welcome({ recents, onNew, onOpen, onOpenPath }: Props) {
  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-hero">
          <img src={icon} alt="Taskapp" />
          <div>
            <h1>Taskapp</h1>
            <p>A quiet place for notes, JSON, and PDFs. Tasks and reminders come next.</p>
          </div>
        </div>
        <div className="welcome-actions">
          <button className="primary-btn" onClick={onNew}>New note</button>
          <button className="ghost-btn" onClick={onOpen}>Open file</button>
        </div>
        <div className="recents">
          <h2>Recent</h2>
          {recents.length === 0 ? (
            <p className="empty-note">Nothing here yet. Open a text file, JSON document, or PDF to begin.</p>
          ) : (
            <div className="recent-list">
              {recents.map((item) => (
                <button key={item.path} className="recent-item" onClick={() => onOpenPath(item.path)}>
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.path}</em>
                  </span>
                  <em>{item.mime}</em>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
