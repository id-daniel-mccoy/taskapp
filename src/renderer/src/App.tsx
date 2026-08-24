import { useEffect } from 'react'
import { ActivityRail } from './components/ActivityRail'
import { CommandPalette, ConfirmDialog, SettingsPanel, ShortcutsPanel } from './components/Overlays'
import { JsonViewer } from './components/JsonViewer'
import { NoteEditor } from './components/NoteEditor'
import { NotesList } from './components/NotesList'
import { PdfViewer } from './components/PdfViewer'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import { TitleBar } from './components/TitleBar'
import { Welcome } from './components/Welcome'
import { useWorkspace } from './hooks/useWorkspace'

export function App() {
  const workspace = useWorkspace()
  const {
    activeNote,
    activeViewer,
    setPaletteOpen,
    setSettingsOpen,
    setShortcutsOpen,
    newNote,
    openFiles,
    saveActive,
    closeViewer,
    handleMenu,
    setRenamingId
  } = workspace

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
      if (meta && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        void newNote()
      }
      if (meta && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        void openFiles()
      }
      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveActive()
      }
      if (meta && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        handleMenu('find')
      }
      if (meta && event.key.toLowerCase() === 'w') {
        event.preventDefault()
        if (activeViewer) closeViewer(activeViewer.id)
      }
      if (event.key === 'F2') {
        event.preventDefault()
        handleMenu('rename')
      }
      if (meta && (event.key === '=' || event.key === '+')) {
        event.preventDefault()
        handleMenu('font-larger')
      }
      if (meta && event.key === '-') {
        event.preventDefault()
        handleMenu('font-smaller')
      }
      if (meta && event.key === ',') {
        event.preventDefault()
        setSettingsOpen(true)
      }
      if (meta && event.key === '/') {
        event.preventDefault()
        setShortcutsOpen(true)
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
        setSettingsOpen(false)
        setShortcutsOpen(false)
        setRenamingId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeNote, activeViewer, closeViewer, handleMenu, newNote, openFiles, saveActive, setPaletteOpen, setRenamingId, setSettingsOpen, setShortcutsOpen])

  if (!workspace.ready) {
    return <div className="app" />
  }

  const showWelcome = !activeNote && !activeViewer

  return (
    <div className="app">
      <TitleBar
        note={activeNote}
        viewer={activeViewer}
        theme={workspace.theme}
        titleFocusKey={workspace.titleFocusKey}
        onNew={() => void workspace.newNote()}
        onOpen={() => void workspace.openFiles()}
        onSave={() => void workspace.saveActive()}
        onPalette={() => workspace.setPaletteOpen(true)}
        onTheme={() => workspace.handleMenu('toggle-theme')}
        onSettings={() => workspace.setSettingsOpen(true)}
        onRename={(title) => activeNote && void workspace.renameNote(activeNote.id, title)}
      />
      <div className="shell">
        <ActivityRail />
        <NotesList
          notes={workspace.notes}
          activeId={workspace.activeNoteId}
          renamingId={workspace.renamingId}
          onSelect={workspace.selectNote}
          onNew={() => void workspace.newNote()}
          onRename={(id, title) => void workspace.renameNote(id, title)}
          onStartRename={workspace.setRenamingId}
          onCancelRename={() => workspace.setRenamingId(null)}
          onDuplicate={(id) => void workspace.duplicateNote(id)}
          onShowFile={(id) => void workspace.showNoteFile(id)}
          onDelete={workspace.requestDelete}
        />
        <main
          className="workspace"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const paths = [...event.dataTransfer.files]
              .map((file) => {
                try {
                  return window.taskapp.pathForFile(file)
                } catch {
                  return ''
                }
              })
              .filter(Boolean)
            if (paths.length) void workspace.openPaths(paths)
          }}
        >
          <TabBar
            docs={workspace.viewers}
            activeId={workspace.activeViewerId}
            onSelect={workspace.setActiveViewerId}
            onClose={workspace.closeViewer}
          />
          <section className="stage">
            {showWelcome && (
              <Welcome
                notes={workspace.notes}
                onNew={() => void workspace.newNote()}
                onOpen={() => void workspace.openFiles()}
                onOpenNote={workspace.selectNote}
              />
            )}
            {activeNote && !activeViewer && (
              <NoteEditor
                note={activeNote}
                wordWrap={workspace.settings.wordWrap}
                fontSize={workspace.settings.fontSize}
                onChange={workspace.updateNoteContent}
                onCommand={(command) => workspace.handleMenu(command)}
              />
            )}
            {activeViewer?.kind === 'json' && (
              <JsonViewer name={activeViewer.name} path={activeViewer.path} content={activeViewer.content} />
            )}
            {activeViewer?.kind === 'pdf' && <PdfViewer doc={activeViewer} />}
            <div className="toasts">
              {workspace.toasts.map((item) => (
                <div key={item.id} className={`toast ${item.tone}`}>{item.text}</div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <StatusBar
        note={activeNote && !activeViewer ? activeNote : null}
        viewer={activeViewer}
        wordWrap={workspace.settings.wordWrap}
        saving={Boolean(activeNote?.dirty)}
      />
      {workspace.paletteOpen && (
        <CommandPalette onClose={() => workspace.setPaletteOpen(false)} onRun={workspace.handleMenu} />
      )}
      {workspace.settingsOpen && (
        <SettingsPanel
          settings={workspace.settings}
          notesDir={workspace.notesDir}
          onChange={(next) => void workspace.persistSettings(next)}
          onShowNotes={() => void window.taskapp.showNotesFolder()}
          onClose={() => workspace.setSettingsOpen(false)}
        />
      )}
      {workspace.shortcutsOpen && (
        <ShortcutsPanel onClose={() => workspace.setShortcutsOpen(false)} />
      )}
      {workspace.pendingDelete && (
        <ConfirmDialog
          title="Delete this note?"
          body="The .txt file will be removed from Taskapp’s notes folder on this computer."
          confirmLabel="Delete"
          onConfirm={() => void workspace.confirmDelete()}
          onCancel={() => workspace.setPendingDelete(null)}
        />
      )}
    </div>
  )
}
