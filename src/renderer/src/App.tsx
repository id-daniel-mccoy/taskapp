import { useEffect, useState } from 'react'
import { ActivityRail } from './components/ActivityRail'
import { AlarmEditor } from './components/AlarmEditor'
import { AlarmOverlay } from './components/AlarmOverlay'
import { AlarmsList } from './components/AlarmsList'
import { AudioViewer } from './components/AudioViewer'
import { CommandPalette, ConfirmDialog, SettingsPanel, ShortcutsPanel } from './components/Overlays'
import { JsonViewer } from './components/JsonViewer'
import { ImageViewer } from './components/ImageViewer'
import { NoteEditor } from './components/NoteEditor'
import { NotesList } from './components/NotesList'
import { PdfViewer } from './components/PdfViewer'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import { TextFileViewer } from './components/TextFileViewer'
import { TitleBar } from './components/TitleBar'
import { Welcome } from './components/Welcome'
import { useAlarms } from './hooks/useAlarms'
import { useWorkspace } from './hooks/useWorkspace'

export function App() {
  const workspace = useWorkspace()
  const alarms = useAlarms()
  const [section, setSection] = useState<'notes' | 'alarms'>('notes')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const {
    activeNote,
    activeViewer,
    setPaletteOpen,
    setSettingsOpen,
    setShortcutsOpen,
    newNote,
    openFiles,
    saveActive,
    saveActiveAs,
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
        setSection('notes')
        setSidebarOpen(true)
        void newNote()
      }
      if (meta && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        setSection('notes')
        void openFiles()
      }
      if (meta && event.key.toLowerCase() === 's' && event.shiftKey) {
        event.preventDefault()
        void saveActiveAs()
      } else if (meta && event.key.toLowerCase() === 's') {
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
      if (meta && event.key.toLowerCase() === 'q') {
        event.preventDefault()
        window.taskapp.close()
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
  }, [activeNote, activeViewer, closeViewer, handleMenu, newNote, openFiles, saveActive, saveActiveAs, setPaletteOpen, setRenamingId, setSettingsOpen, setShortcutsOpen])

  useEffect(() => {
    if (activeViewer) setSection('notes')
  }, [activeViewer])

  useEffect(() => {
    if (!alarms.ringing) return
    setSection('alarms')
    setSidebarOpen(true)
  }, [alarms.ringing])

  if (!workspace.ready) {
    return <div className="app" />
  }

  const showWelcome = section === 'notes' && !activeNote && !activeViewer
  const alarmHint = !alarms.systemd && alarms.alarms.some((item) => item.enabled)
    ? 'Alarm timers need systemd — they will not fire if Taskapp is closed'
    : alarms.nextUp
      ? `Next · ${alarms.nextUp}`
      : section === 'alarms'
        ? 'No upcoming alarms'
        : null

  return (
    <div
      className="app"
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
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
        if (paths.length) {
          setSection('notes')
          void workspace.openPaths(paths)
        }
      }}
    >
      <TitleBar
        note={section === 'notes' ? activeNote : null}
        viewer={section === 'notes' ? activeViewer : null}
        heading={section === 'alarms' ? alarms.active?.label ?? 'Alarms' : undefined}
        theme={workspace.theme}
        titleFocusKey={workspace.titleFocusKey}
        onMenu={(command) => {
          if (command === 'new' || command === 'open' || command === 'rename' || command === 'duplicate' || command === 'delete-note' || command === 'find') {
            setSection('notes')
          }
          if (command === 'new') setSidebarOpen(true)
          workspace.handleMenu(command)
        }}
        onRename={(title) => activeNote && void workspace.renameNote(activeNote.id, title)}
      />
      <div className={`shell${sidebarOpen ? '' : ' notes-collapsed'}${section === 'alarms' ? ' section-alarms' : ''}`}>
        <ActivityRail
          section={section}
          onNotes={() => {
            if (section === 'notes') setSidebarOpen((open) => !open)
            else {
              setSection('notes')
              setSidebarOpen(true)
            }
          }}
          onAlarms={() => {
            if (section === 'alarms') setSidebarOpen((open) => !open)
            else {
              setSection('alarms')
              setSidebarOpen(true)
            }
          }}
        />
        {section === 'notes' ? (
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
            collapsed={!sidebarOpen}
          />
        ) : (
          <AlarmsList
            alarms={alarms.alarms}
            activeId={alarms.activeId}
            onSelect={alarms.setActiveId}
            onNew={() => void alarms.create()}
            onToggle={(id, enabled) => alarms.update(id, { enabled }, true)}
            collapsed={!sidebarOpen}
          />
        )}
        <main className="workspace">
          {section === 'notes' && (
            <TabBar
              docs={workspace.viewers}
              activeId={workspace.activeViewerId}
              onSelect={workspace.setActiveViewerId}
              onClose={workspace.closeViewer}
            />
          )}
          <section className="stage">
            {section === 'alarms' && (
              <AlarmEditor
                alarm={alarms.active}
                sounds={alarms.sounds}
                previewing={alarms.previewing}
                onChange={alarms.update}
                onPreview={alarms.preview}
                onDelete={alarms.setPendingDelete}
              />
            )}
            {section === 'notes' && showWelcome && (
              <Welcome
                notes={workspace.notes}
                onNew={() => void workspace.newNote()}
                onOpen={() => void workspace.openFiles()}
                onOpenNote={workspace.selectNote}
              />
            )}
            {section === 'notes' && activeNote && !activeViewer && (
              <NoteEditor
                note={activeNote}
                wordWrap={workspace.settings.wordWrap}
                fontSize={workspace.settings.fontSize}
                onChange={workspace.updateNoteContent}
                onCommand={(command) => workspace.handleMenu(command)}
              />
            )}
            {section === 'notes' && activeViewer?.kind === 'json' && (
              <JsonViewer
                name={activeViewer.name}
                path={activeViewer.path}
                content={activeViewer.content}
                dirty={activeViewer.dirty}
                wordWrap={workspace.settings.wordWrap}
                fontSize={workspace.settings.fontSize}
                onChange={workspace.updateViewerContent}
              />
            )}
            {section === 'notes' && activeViewer?.kind === 'text-file' && (
              <TextFileViewer
                name={activeViewer.name}
                path={activeViewer.path}
                label={activeViewer.label}
                content={activeViewer.content}
                dirty={activeViewer.dirty}
                wordWrap={workspace.settings.wordWrap}
                fontSize={workspace.settings.fontSize}
                onChange={workspace.updateViewerContent}
              />
            )}
            {section === 'notes' && activeViewer?.kind === 'pdf' && <PdfViewer doc={activeViewer} />}
            {section === 'notes' && activeViewer?.kind === 'image' && <ImageViewer doc={activeViewer} />}
            {section === 'notes' && activeViewer?.kind === 'audio' && <AudioViewer doc={activeViewer} />}
            <div className="toasts">
              {workspace.toasts.map((item) => (
                <div key={item.id} className={`toast ${item.tone}`}>{item.text}</div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <StatusBar
        note={section === 'notes' && activeNote && !activeViewer ? activeNote : null}
        viewer={section === 'notes' ? activeViewer : null}
        wordWrap={workspace.settings.wordWrap}
        saving={Boolean(activeNote?.dirty || (activeViewer && 'dirty' in activeViewer && activeViewer.dirty))}
        statusHint={alarmHint}
        modeLabel={section === 'alarms' ? 'Alarms' : undefined}
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
      {alarms.pendingDelete && (
        <ConfirmDialog
          title="Delete this alarm?"
          body="The scheduled timer will be removed from this computer."
          confirmLabel="Delete"
          onConfirm={() => {
            const id = alarms.pendingDelete
            if (id) void alarms.remove(id)
          }}
          onCancel={() => alarms.setPendingDelete(null)}
        />
      )}
      {alarms.ringing && (
        <AlarmOverlay
          alarm={alarms.ringing}
          onStop={() => void alarms.stop()}
          onSnooze={() => void alarms.snooze(alarms.ringing!.id)}
        />
      )}
    </div>
  )
}
