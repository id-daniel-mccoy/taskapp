import { useEffect } from 'react'
import { ActivityRail } from './components/ActivityRail'
import { CommandPalette, ConfirmDialog, SettingsPanel, ShortcutsPanel } from './components/Overlays'
import { PdfViewer } from './components/PdfViewer'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import { TextEditor } from './components/TextEditor'
import { TitleBar } from './components/TitleBar'
import { Welcome } from './components/Welcome'
import { useWorkspace } from './hooks/useWorkspace'

export function App() {
  const workspace = useWorkspace()
  const {
    active,
    setPaletteOpen,
    setSettingsOpen,
    setShortcutsOpen,
    newNote,
    openFiles,
    saveDocument,
    requestClose
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
        newNote()
      }
      if (meta && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        void openFiles()
      }
      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (active) void saveDocument(active, event.shiftKey)
      }
      if (meta && event.key.toLowerCase() === 'w') {
        event.preventDefault()
        if (active) requestClose(active.id)
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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, newNote, openFiles, requestClose, saveDocument, setPaletteOpen, setSettingsOpen, setShortcutsOpen])

  if (!workspace.ready) {
    return <div className="app" />
  }

  return (
    <div className="app">
      <TitleBar
        active={workspace.active}
        theme={workspace.theme}
        onNew={workspace.newNote}
        onOpen={() => void workspace.openFiles()}
        onSave={() => workspace.active && void workspace.saveDocument(workspace.active)}
        onPalette={() => workspace.setPaletteOpen(true)}
        onTheme={() => workspace.handleMenu('toggle-theme')}
        onSettings={() => workspace.setSettingsOpen(true)}
      />
      <div className="shell">
        <ActivityRail />
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
            docs={workspace.docs}
            activeId={workspace.activeId}
            onSelect={workspace.setActiveId}
            onClose={workspace.requestClose}
            onNew={workspace.newNote}
          />
          <section className="stage">
            {!workspace.active && (
              <Welcome
                recents={workspace.settings.recents}
                onNew={workspace.newNote}
                onOpen={() => void workspace.openFiles()}
                onOpenPath={(path) => void workspace.openPaths([path])}
              />
            )}
            {workspace.active?.kind === 'text' && (
              <TextEditor
                doc={workspace.active}
                theme={workspace.theme}
                wordWrap={workspace.settings.wordWrap}
                fontSize={workspace.settings.fontSize}
                jsonState={workspace.jsonState}
                onChange={workspace.updateActiveContent}
                onCursor={workspace.updateCursor}
                onFormat={() => workspace.applyJson('format')}
                onMinify={() => workspace.applyJson('minify')}
                onValidate={() => workspace.applyJson('validate')}
              />
            )}
            {workspace.active?.kind === 'pdf' && <PdfViewer doc={workspace.active} />}
            <div className="toasts">
              {workspace.toasts.map((item) => (
                <div key={item.id} className={`toast ${item.tone}`}>{item.text}</div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <StatusBar
        active={workspace.active}
        wordWrap={workspace.settings.wordWrap}
        onLanguage={workspace.setLanguage}
      />
      {workspace.paletteOpen && (
        <CommandPalette onClose={() => workspace.setPaletteOpen(false)} onRun={workspace.handleMenu} />
      )}
      {workspace.settingsOpen && (
        <SettingsPanel
          settings={workspace.settings}
          onChange={(next) => void workspace.persistSettings(next)}
          onClose={() => workspace.setSettingsOpen(false)}
        />
      )}
      {workspace.shortcutsOpen && (
        <ShortcutsPanel onClose={() => workspace.setShortcutsOpen(false)} />
      )}
      {workspace.pendingClose && (
        <ConfirmDialog
          title="Save this note?"
          body="There are unsaved changes. Save them before closing the tab?"
          onSave={() => void workspace.confirmClose(true)}
          onDiscard={() => void workspace.confirmClose(false)}
          onCancel={() => workspace.setPendingClose(null)}
        />
      )}
      {workspace.pendingWindowClose && (
        <ConfirmDialog
          title="Quit Taskapp?"
          body="Some notes are unsaved. Save them before quitting?"
          onSave={() => void workspace.confirmWindowClose(true)}
          onDiscard={() => void workspace.confirmWindowClose(false)}
          onCancel={() => workspace.setPendingWindowClose(false)}
        />
      )}
    </div>
  )
}
