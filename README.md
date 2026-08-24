<p align="center">
  <img src="resources/icon.png" width="112" height="112" alt="Taskapp">
</p>

<h1 align="center">Taskapp</h1>

<p align="center">
  <strong>A quiet notepad for notes, files, and the work that sits beside them.</strong>
</p>

<p align="center">
  Linux first &nbsp;·&nbsp; Local by default &nbsp;·&nbsp; Open source
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Linux-d4a05a?style=flat-square" alt="Linux">
  <img src="https://img.shields.io/badge/node-%3E%3D18-0a0a0a?style=flat-square" alt="Node.js 18+">
  <img src="https://img.shields.io/badge/license-MIT-d4a05a?style=flat-square" alt="MIT License">
</p>

Taskapp is a Linux-first desktop notepad. Notes are ordinary `.txt` files on your computer. Open a Markdown file, a JSON document, a PDF, or an image and Taskapp treats it as what it is — a file on disk — not a note imported into a library.

This is the first surface of a larger product. Tasks and reminders come next. The editor, the file viewers, and the local-first habits are the foundation.

**Developed by Ascendry Labs.**

---

## Highlights

- **Notes that stay notes.** Each note is a `.txt` file plus a name you choose. Titles are not inferred from the first line.
- **Files stay files.** Markdown, source, JSON, and similar text open as editable tabs. Save writes back to the original path. Save as never creates a note.
- **Readers for the rest.** PDFs scroll as a full document. Images sit on a checkerboard so transparency is honest.
- **Yours, on disk.** The notes library lives in the app data folder on this machine. Nothing is uploaded.
- **At home on Linux.** Install once, then launch from the terminal, the application menu, or **Open with**.

Ink and Paper themes, a command palette, and a compact notepad toolbar are built in.

---

## Supported platforms

| Platform | Status |
| --- | --- |
| **Linux** (X11 and Wayland) | Supported. This is the current target: installer, launcher, icon, menu entry, and **Open with**. |
| macOS | Not yet. The UI is Electron, so a later port is planned. |
| Windows | Not yet. Same as macOS. |

The Linux path is tested as a local checkout on x86_64 with Node.js 18 or newer (including nvm). Aarch64 is not a first-class target yet.

---

## Requirements

- **Node.js 18+** and **npm**
- A graphical session (the window is an Electron app)
- Network on first install, so npm and the Electron runtime can download

On Debian or Ubuntu:

```bash
sudo apt install nodejs npm
```

If you use nvm, fnm, or Volta, install from a terminal as usual. The Taskapp launcher finds nvm’s Node even when GNOME starts the app without your shell profile.

---

## Install

Clone the repository, then run the installer from the project root:

```bash
git clone https://github.com/id-daniel-mccoy/taskapp.git
cd taskapp
chmod +x install.sh taskapp
./install.sh
```

`install.sh` will:

1. Check for Node.js 18+ and npm
2. Run `npm install`
3. Make sure the Electron runtime is present (and finish extracting it if npm left that incomplete)
4. On Linux, install a **Taskapp** application-menu entry, icons, and file associations

Skip the desktop entry if you only want the CLI:

```bash
./install.sh --no-desktop
```

If GitHub releases are blocked on your network, set an Electron mirror and run the installer again:

```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
./install.sh
```

Re-run `./install.sh` after pulling updates that change the desktop file or icons. GNOME may keep a cached icon until you close the application overview or start a new session.

---

## Run

```bash
./taskapp
```

Or open files directly:

```bash
./taskapp notes.md data.json report.pdf photo.png
```

The first launch compiles the app and can take a few seconds. After install, Taskapp also appears in the application menu. Right-click a supported file in the file manager and choose **Open with → Taskapp**.

If Taskapp is already running, **Open with** hands the file to that window instead of starting a second copy.

The window is the app. A local Vite server on port 3000 is only what Electron loads during development; you do not open that URL in a browser.

---

## What it opens

| Kind | What happens |
| --- | --- |
| **Notes** (`.txt`, `.text`) | Opening from disk imports a copy into the notes library. New notes are drafts until you name them. |
| **Other text** | Markdown, HTML, CSS, JS/TS, XML, CSV, YAML, TOML, shell, and common source files open as editable file tabs. Save / Save as write to disk. |
| **JSON** | Same as other text files, with a live valid/invalid banner. Formatted once on open. |
| **PDF** | Read-only, full-document scroll, page controls, and zoom. |
| **Images** | Read-only viewer with a transparency checkerboard, fit, and zoom. PNG, JPEG, GIF, WebP, BMP, ICO, SVG, AVIF. TIFF is attempted (Chromium often cannot decode it). |

Drag files onto the window, use **Open** in the title bar, or pass paths on the command line.

Notes are stored under the Electron user-data directory. On Linux that is typically `~/.config/Taskapp/notes/`. Settings → **Open notes folder** if you want the exact path.

---

## Keyboard

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` | Command palette |
| `Ctrl+N` | New note |
| `Ctrl+O` | Open a file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save as |
| `F2` | Rename note |
| `Ctrl+W` | Close the current file tab |
| `Ctrl+F` | Find |
| `Ctrl+Shift+T` | Toggle Ink / Paper |
| `Alt+Z` | Word wrap |
| `Ctrl+,` | Settings |
| `Ctrl+/` | Keyboard shortcuts |

Click the notes icon on the left rail to hide or show the notes list.

---

## Project layout

```text
install.sh              Linux installer
taskapp                 Launcher (finds Node, starts Electron)
linux/taskapp.desktop   Application menu and Open with
resources/              App icon and bundled Corinthia font
src/main/               Electron main process, notes library, file I/O
src/preload/            Context-bridge API
src/renderer/           React UI
src/shared/             MIME map and shared types
```

---

## Contributing

Issues and pull requests are welcome. Keep changes focused. Match the tone of the UI: calm, local, and specific about what is a note versus what is a file.

---

## Credits

- [Corinthia](https://fonts.google.com/specimen/Corinthia) by the Corinthia Project Authors, SIL Open Font License 1.1, used in the app icon
- [Electron](https://www.electronjs.org/), [Vite](https://vitejs.dev/), [React](https://react.dev/), [Monaco Editor](https://microsoft.github.io/monaco-editor/), [PDF.js](https://mozilla.github.io/pdf.js/)

---

<p align="center">
  <img src="resources/icon.png" width="48" height="48" alt="">
</p>

<p align="center">
  <strong>Taskapp</strong><br>
  Developed by Ascendry Labs
</p>

<p align="center">
  Released under the <a href="LICENSE">MIT License</a>
</p>
