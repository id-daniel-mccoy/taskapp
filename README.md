# Taskapp

A Linux-first notepad with a paper-and-ink interface. It opens everyday text files, understands JSON, and can view PDFs. Tasks and reminders will come later; this first version is the editor.

## Install

You need Node.js 18 or newer and npm.

```bash
./install.sh
```

That installs dependencies and adds a **Taskapp** entry to your application menu. Skip the menu shortcut with `./install.sh --no-desktop`.

## Run

```bash
./taskapp
./taskapp notes.md data.json report.pdf
```

The first launch compiles the app and may take a few seconds.

`Ctrl+K` opens the command palette. `Ctrl+N`, `Ctrl+O`, and `Ctrl+S` create, open, and save.

## What it opens

- **Text MIMEs** such as `text/plain`, Markdown, HTML, CSS, JavaScript/TypeScript, XML/SVG, CSV, YAML, source files, shell scripts, calendars, and similar text formats
- **JSON** (`application/json` and friends), with validate / format / minify
- **PDFs** (`application/pdf`) in a page-by-page reader

Drag files onto the window, or use **Open** from the title bar.

## Later platforms

The app is built with Electron, so the same project can grow to macOS and Windows without changing the editor UI.
