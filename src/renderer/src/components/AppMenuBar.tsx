import { useEffect, useMemo, useRef, useState } from 'react'
import type { MenuCommand, ThemePreference } from '@shared/types'
import { THEMES } from '@shared/themes'
import { IconChevronRight } from '../lib/icons'

interface Props {
  theme: ThemePreference
  onCommand: (command: MenuCommand) => void
}

type MenuItem =
  | { kind: 'command'; id: MenuCommand; label: string; shortcut?: string; danger?: boolean; checked?: boolean }
  | { kind: 'quit'; label: string; shortcut?: string }
  | { kind: 'disabled'; label: string }
  | { kind: 'separator' }
  | { kind: 'submenu'; id: string; label: string; items: MenuItem[] }

interface MenuGroup {
  id: 'file' | 'edit' | 'view' | 'help'
  label: string
  items: MenuItem[]
}

function menus(theme: ThemePreference): MenuGroup[] {
  return [
    {
      id: 'file',
      label: 'File',
      items: [
        { kind: 'command', id: 'new', label: 'New note', shortcut: 'Ctrl+N' },
        { kind: 'command', id: 'open', label: 'Open…', shortcut: 'Ctrl+O' },
        { kind: 'command', id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
        { kind: 'command', id: 'save-as', label: 'Save as…', shortcut: 'Ctrl+Shift+S' },
        { kind: 'separator' },
        { kind: 'command', id: 'rename', label: 'Rename note', shortcut: 'F2' },
        { kind: 'command', id: 'duplicate', label: 'Duplicate note' },
        { kind: 'command', id: 'delete-note', label: 'Delete note', danger: true },
        { kind: 'command', id: 'close', label: 'Close viewer', shortcut: 'Ctrl+W' },
        { kind: 'separator' },
        { kind: 'command', id: 'show-in-folder', label: 'Show in folder' },
        { kind: 'command', id: 'show-notes-folder', label: 'Show notes folder' },
        { kind: 'separator' },
        { kind: 'command', id: 'settings', label: 'Settings', shortcut: 'Ctrl+,' },
        { kind: 'separator' },
        { kind: 'quit', label: 'Quit', shortcut: 'Ctrl+Q' }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { kind: 'command', id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
        { kind: 'command', id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z' },
        { kind: 'separator' },
        { kind: 'command', id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
        { kind: 'command', id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
        { kind: 'command', id: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
        { kind: 'command', id: 'select-all', label: 'Select all', shortcut: 'Ctrl+A' },
        { kind: 'separator' },
        { kind: 'command', id: 'find', label: 'Find', shortcut: 'Ctrl+F' }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { kind: 'command', id: 'command-palette', label: 'Command palette', shortcut: 'Ctrl+K' },
        { kind: 'separator' },
        {
          kind: 'submenu',
          id: 'theme',
          label: 'Theme',
          items: THEMES.map((item) => ({
            kind: 'command' as const,
            id: item.command,
            label: item.label,
            checked: item.id === theme
          }))
        },
        { kind: 'command', id: 'toggle-theme', label: 'Next theme', shortcut: 'Ctrl+Shift+T' },
        { kind: 'command', id: 'toggle-wrap', label: 'Word wrap', shortcut: 'Alt+Z' },
        { kind: 'separator' },
        { kind: 'command', id: 'font-larger', label: 'Larger text', shortcut: 'Ctrl+=' },
        { kind: 'command', id: 'font-smaller', label: 'Smaller text', shortcut: 'Ctrl+-' },
        { kind: 'separator' },
        { kind: 'command', id: 'shortcuts', label: 'Keyboard shortcuts', shortcut: 'Ctrl+/' }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [{ kind: 'disabled', label: 'Coming Soon...' }]
    }
  ]
}

function MenuItems({
  items,
  onCommand,
  onClose,
  openSub,
  setOpenSub
}: {
  items: MenuItem[]
  onCommand: (command: MenuCommand) => void
  onClose: () => void
  openSub: string | null
  setOpenSub: (id: string | null) => void
}) {
  return (
    <>
      {items.map((item, index) => {
        if (item.kind === 'separator') {
          return <hr key={`sep-${index}`} />
        }
        if (item.kind === 'disabled') {
          return (
            <button key={item.label} type="button" role="menuitem" disabled>
              {item.label}
            </button>
          )
        }
        if (item.kind === 'quit') {
          return (
            <button
              key="quit"
              type="button"
              role="menuitem"
              onClick={() => {
                onClose()
                window.taskapp.close()
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && <kbd>{item.shortcut}</kbd>}
            </button>
          )
        }
        if (item.kind === 'submenu') {
          const open = openSub === item.id
          return (
            <div
              key={item.id}
              className={`app-menu-sub${open ? ' open' : ''}`}
              onMouseEnter={() => setOpenSub(item.id)}
            >
              <button
                type="button"
                className="app-menu-sub-trigger"
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpenSub(open ? null : item.id)}
              >
                <span>{item.label}</span>
                <IconChevronRight width={14} height={14} />
              </button>
              {open && (
                <div className="app-menu-dropdown app-menu-flyout" role="menu">
                  <MenuItems
                    items={item.items}
                    onCommand={onCommand}
                    onClose={onClose}
                    openSub={null}
                    setOpenSub={() => undefined}
                  />
                </div>
              )}
            </div>
          )
        }
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className={[item.danger ? 'danger' : '', item.checked != null ? 'has-check' : ''].filter(Boolean).join(' ') || undefined}
            aria-checked={item.checked}
            onClick={() => {
              onClose()
              onCommand(item.id)
            }}
            onMouseEnter={() => setOpenSub(null)}
          >
            {item.checked != null && <span className="app-menu-check">{item.checked ? '✓' : ''}</span>}
            <span>{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </button>
        )
      })}
    </>
  )
}

export function AppMenuBar({ theme, onCommand }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [openId, setOpenId] = useState<MenuGroup['id'] | null>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)
  const items = useMemo(() => menus(theme), [theme])

  useEffect(() => {
    if (!openId) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpenId(null)
        setOpenSub(null)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenId(null)
        setOpenSub(null)
      }
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [openId])

  return (
    <div className="app-menubar" ref={root} role="menubar" aria-label="Application">
      {items.map((menu) => {
        const open = openId === menu.id
        return (
          <div key={menu.id} className={`app-menu${open ? ' open' : ''}`}>
            <button
              type="button"
              className="app-menu-trigger"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => {
                setOpenId(open ? null : menu.id)
                setOpenSub(null)
              }}
              onMouseEnter={() => {
                if (openId) {
                  setOpenId(menu.id)
                  setOpenSub(null)
                }
              }}
            >
              {menu.label}
            </button>
            {open && (
              <div className="app-menu-dropdown" role="menu">
                <MenuItems
                  items={menu.items}
                  onCommand={onCommand}
                  onClose={() => {
                    setOpenId(null)
                    setOpenSub(null)
                  }}
                  openSub={openSub}
                  setOpenSub={setOpenSub}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
