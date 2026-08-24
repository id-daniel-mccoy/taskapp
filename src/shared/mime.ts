import type { FileTypeInfo } from './types'

const TEXT: FileTypeInfo['kind'] = 'text'

const byExt: Record<string, FileTypeInfo> = {
  txt: { mime: 'text/plain', language: 'plaintext', kind: TEXT, label: 'Plain Text' },
  text: { mime: 'text/plain', language: 'plaintext', kind: TEXT, label: 'Plain Text' },
  log: { mime: 'text/plain', language: 'plaintext', kind: TEXT, label: 'Log' },
  md: { mime: 'text/markdown', language: 'markdown', kind: TEXT, label: 'Markdown' },
  markdown: { mime: 'text/markdown', language: 'markdown', kind: TEXT, label: 'Markdown' },
  mdown: { mime: 'text/markdown', language: 'markdown', kind: TEXT, label: 'Markdown' },
  rst: { mime: 'text/x-rst', language: 'restructuredtext', kind: TEXT, label: 'reStructuredText' },
  html: { mime: 'text/html', language: 'html', kind: TEXT, label: 'HTML' },
  htm: { mime: 'text/html', language: 'html', kind: TEXT, label: 'HTML' },
  xhtml: { mime: 'application/xhtml+xml', language: 'html', kind: TEXT, label: 'XHTML' },
  css: { mime: 'text/css', language: 'css', kind: TEXT, label: 'CSS' },
  scss: { mime: 'text/x-scss', language: 'scss', kind: TEXT, label: 'SCSS' },
  sass: { mime: 'text/x-sass', language: 'scss', kind: TEXT, label: 'Sass' },
  less: { mime: 'text/x-less', language: 'less', kind: TEXT, label: 'Less' },
  js: { mime: 'text/javascript', language: 'javascript', kind: TEXT, label: 'JavaScript' },
  mjs: { mime: 'text/javascript', language: 'javascript', kind: TEXT, label: 'JavaScript' },
  cjs: { mime: 'text/javascript', language: 'javascript', kind: TEXT, label: 'JavaScript' },
  jsx: { mime: 'text/javascript', language: 'javascript', kind: TEXT, label: 'JavaScript' },
  ts: { mime: 'text/typescript', language: 'typescript', kind: TEXT, label: 'TypeScript' },
  tsx: { mime: 'text/typescript', language: 'typescript', kind: TEXT, label: 'TypeScript' },
  json: { mime: 'application/json', language: 'json', kind: 'json', label: 'JSON' },
  jsonc: { mime: 'application/json', language: 'json', kind: 'json', label: 'JSON' },
  json5: { mime: 'application/json5', language: 'json', kind: 'json', label: 'JSON5' },
  geojson: { mime: 'application/geo+json', language: 'json', kind: 'json', label: 'GeoJSON' },
  xml: { mime: 'application/xml', language: 'xml', kind: TEXT, label: 'XML' },
  xsl: { mime: 'application/xml', language: 'xml', kind: TEXT, label: 'XSL' },
  xsd: { mime: 'application/xml', language: 'xml', kind: TEXT, label: 'XSD' },
  svg: { mime: 'image/svg+xml', language: 'xml', kind: TEXT, label: 'SVG' },
  csv: { mime: 'text/csv', language: 'plaintext', kind: TEXT, label: 'CSV' },
  tsv: { mime: 'text/tab-separated-values', language: 'plaintext', kind: TEXT, label: 'TSV' },
  yaml: { mime: 'application/yaml', language: 'yaml', kind: TEXT, label: 'YAML' },
  yml: { mime: 'application/yaml', language: 'yaml', kind: TEXT, label: 'YAML' },
  toml: { mime: 'application/toml', language: 'ini', kind: TEXT, label: 'TOML' },
  ini: { mime: 'text/plain', language: 'ini', kind: TEXT, label: 'INI' },
  env: { mime: 'text/plain', language: 'ini', kind: TEXT, label: 'Env' },
  conf: { mime: 'text/plain', language: 'ini', kind: TEXT, label: 'Config' },
  cfg: { mime: 'text/plain', language: 'ini', kind: TEXT, label: 'Config' },
  properties: { mime: 'text/plain', language: 'ini', kind: TEXT, label: 'Properties' },
  py: { mime: 'text/x-python', language: 'python', kind: TEXT, label: 'Python' },
  pyw: { mime: 'text/x-python', language: 'python', kind: TEXT, label: 'Python' },
  rb: { mime: 'text/x-ruby', language: 'ruby', kind: TEXT, label: 'Ruby' },
  php: { mime: 'application/x-httpd-php', language: 'php', kind: TEXT, label: 'PHP' },
  java: { mime: 'text/x-java-source', language: 'java', kind: TEXT, label: 'Java' },
  kt: { mime: 'text/x-kotlin', language: 'kotlin', kind: TEXT, label: 'Kotlin' },
  kts: { mime: 'text/x-kotlin', language: 'kotlin', kind: TEXT, label: 'Kotlin' },
  cs: { mime: 'text/x-csharp', language: 'csharp', kind: TEXT, label: 'C#' },
  c: { mime: 'text/x-c', language: 'c', kind: TEXT, label: 'C' },
  h: { mime: 'text/x-c', language: 'c', kind: TEXT, label: 'C Header' },
  cpp: { mime: 'text/x-c++', language: 'cpp', kind: TEXT, label: 'C++' },
  cc: { mime: 'text/x-c++', language: 'cpp', kind: TEXT, label: 'C++' },
  cxx: { mime: 'text/x-c++', language: 'cpp', kind: TEXT, label: 'C++' },
  hpp: { mime: 'text/x-c++', language: 'cpp', kind: TEXT, label: 'C++ Header' },
  hh: { mime: 'text/x-c++', language: 'cpp', kind: TEXT, label: 'C++ Header' },
  rs: { mime: 'text/x-rust', language: 'rust', kind: TEXT, label: 'Rust' },
  go: { mime: 'text/x-go', language: 'go', kind: TEXT, label: 'Go' },
  swift: { mime: 'text/x-swift', language: 'swift', kind: TEXT, label: 'Swift' },
  scala: { mime: 'text/x-scala', language: 'scala', kind: TEXT, label: 'Scala' },
  sh: { mime: 'application/x-sh', language: 'shell', kind: TEXT, label: 'Shell' },
  bash: { mime: 'application/x-sh', language: 'shell', kind: TEXT, label: 'Bash' },
  zsh: { mime: 'application/x-sh', language: 'shell', kind: TEXT, label: 'Zsh' },
  fish: { mime: 'application/x-sh', language: 'shell', kind: TEXT, label: 'Fish' },
  ps1: { mime: 'application/x-powershell', language: 'powershell', kind: TEXT, label: 'PowerShell' },
  bat: { mime: 'application/x-bat', language: 'bat', kind: TEXT, label: 'Batch' },
  cmd: { mime: 'application/x-bat', language: 'bat', kind: TEXT, label: 'Batch' },
  sql: { mime: 'application/sql', language: 'sql', kind: TEXT, label: 'SQL' },
  graphql: { mime: 'application/graphql', language: 'graphql', kind: TEXT, label: 'GraphQL' },
  gql: { mime: 'application/graphql', language: 'graphql', kind: TEXT, label: 'GraphQL' },
  dockerfile: { mime: 'text/x-dockerfile', language: 'dockerfile', kind: TEXT, label: 'Dockerfile' },
  makefile: { mime: 'text/x-makefile', language: 'plaintext', kind: TEXT, label: 'Makefile' },
  mk: { mime: 'text/x-makefile', language: 'plaintext', kind: TEXT, label: 'Makefile' },
  r: { mime: 'text/x-r', language: 'r', kind: TEXT, label: 'R' },
  lua: { mime: 'text/x-lua', language: 'lua', kind: TEXT, label: 'Lua' },
  pl: { mime: 'text/x-perl', language: 'perl', kind: TEXT, label: 'Perl' },
  pm: { mime: 'text/x-perl', language: 'perl', kind: TEXT, label: 'Perl' },
  rtf: { mime: 'application/rtf', language: 'plaintext', kind: TEXT, label: 'Rich Text' },
  tex: { mime: 'application/x-tex', language: 'plaintext', kind: TEXT, label: 'TeX' },
  latex: { mime: 'application/x-latex', language: 'plaintext', kind: TEXT, label: 'LaTeX' },
  bib: { mime: 'text/x-bibtex', language: 'plaintext', kind: TEXT, label: 'BibTeX' },
  ics: { mime: 'text/calendar', language: 'plaintext', kind: TEXT, label: 'Calendar' },
  vcf: { mime: 'text/vcard', language: 'plaintext', kind: TEXT, label: 'vCard' },
  vtt: { mime: 'text/vtt', language: 'plaintext', kind: TEXT, label: 'WebVTT' },
  srt: { mime: 'application/x-subrip', language: 'plaintext', kind: TEXT, label: 'Subtitles' },
  diff: { mime: 'text/x-diff', language: 'plaintext', kind: TEXT, label: 'Diff' },
  patch: { mime: 'text/x-patch', language: 'plaintext', kind: TEXT, label: 'Patch' },
  gitignore: { mime: 'text/plain', language: 'plaintext', kind: TEXT, label: 'Ignore' },
  editorconfig: { mime: 'text/plain', language: 'ini', kind: TEXT, label: 'EditorConfig' },
  lock: { mime: 'text/plain', language: 'json', kind: TEXT, label: 'Lockfile' },
  map: { mime: 'application/json', language: 'json', kind: TEXT, label: 'Source Map' },
  pdf: { mime: 'application/pdf', language: 'pdf', kind: 'pdf', label: 'PDF' }
}

const byMime: Record<string, FileTypeInfo> = {}
for (const info of Object.values(byExt)) {
  if (!byMime[info.mime]) byMime[info.mime] = info
}

byMime['text/x-markdown'] = byExt.md
byMime['text/javascript'] = byExt.js
byMime['application/javascript'] = byExt.js
byMime['application/x-javascript'] = byExt.js
byMime['application/typescript'] = byExt.ts
byMime['text/xml'] = byExt.xml
byMime['text/yaml'] = byExt.yaml
byMime['text/x-yaml'] = byExt.yaml
byMime['application/x-yaml'] = byExt.yaml
byMime['application/x-json'] = byExt.json
byMime['text/json'] = byExt.json
byMime['text/x-sh'] = byExt.sh
byMime['application/x-shellscript'] = byExt.sh
byMime['text/x-shellscript'] = byExt.sh
byMime['text/x-python'] = byExt.py
byMime['application/x-python'] = byExt.py
byMime['text/x-java'] = byExt.java
byMime['text/rtf'] = byExt.rtf

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'tif', 'tiff', 'heic', 'avif',
  'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac',
  'mp4', 'mov', 'mkv', 'webm', 'avi',
  'zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'exe', 'dll', 'so', 'dylib', 'bin', 'class', 'o', 'a', 'wasm',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  'sqlite', 'db', 'iso', 'dmg', 'appimage'
])

export const DIALOG_FILTERS = [
  { name: 'Supported', extensions: ['txt', 'json', 'pdf'] },
  { name: 'Notes (Text)', extensions: ['txt'] },
  { name: 'JSON', extensions: ['json'] },
  { name: 'PDF', extensions: ['pdf'] },
  { name: 'All files', extensions: ['*'] }
]

export const DESKTOP_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'text/css',
  'text/javascript',
  'text/xml',
  'text/csv',
  'text/calendar',
  'text/x-python',
  'text/x-sh',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/pdf',
  'application/sql',
  'application/x-sh',
  'application/rtf',
  'image/svg+xml'
]

export function extensionOf(filePath: string): string {
  const base = filePath.split(/[\\/]/).pop() ?? ''
  if (base.startsWith('.') && !base.slice(1).includes('.')) {
    return base.slice(1).toLowerCase()
  }
  const named = base.toLowerCase()
  if (named === 'dockerfile' || named === 'makefile' || named === 'jenkinsfile') {
    return named
  }
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function inferFileType(filePath: string, mimeHint?: string): FileTypeInfo {
  const ext = extensionOf(filePath)
  if (ext && byExt[ext]) return byExt[ext]
  if (mimeHint) {
    const normalized = mimeHint.split(';')[0].trim().toLowerCase()
    if (byMime[normalized]) return byMime[normalized]
    if (normalized === 'application/pdf') return byExt.pdf
    if (normalized.startsWith('text/')) {
      return { mime: normalized, language: 'plaintext', kind: TEXT, label: 'Text' }
    }
  }
  if (ext && BINARY_EXT.has(ext)) {
    return {
      mime: 'application/octet-stream',
      language: 'plaintext',
      kind: 'unsupported',
      label: 'Binary'
    }
  }
  return { mime: 'text/plain', language: 'plaintext', kind: TEXT, label: 'Plain Text' }
}

export function isJsonLike(mime: string, language: string, name: string): boolean {
  return (
    language === 'json' ||
    mime === 'application/json' ||
    mime === 'application/geo+json' ||
    mime.endsWith('+json') ||
    name.toLowerCase().endsWith('.json')
  )
}

export function displayName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath
}

export const LANGUAGE_OPTIONS: { id: string; label: string }[] = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'json', label: 'JSON' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'xml', label: 'XML' },
  { id: 'yaml', label: 'YAML' },
  { id: 'python', label: 'Python' },
  { id: 'shell', label: 'Shell' },
  { id: 'sql', label: 'SQL' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'php', label: 'PHP' },
  { id: 'ini', label: 'INI' }
]
