import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function IconNotes(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v5h5" />
      <path d="M10 12h6M10 16h4" />
    </Svg>
  )
}

export function IconTasks(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 11l2 2 5-5" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </Svg>
  )
}

export function IconAlarm(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 10v3l2 1.5" />
      <path d="M5 5 7.5 8M19 5 16.5 8" />
    </Svg>
  )
}

export function IconPlay(props: IconProps) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="M8 6v12l10-6z" />
    </Svg>
  )
}

export function IconPause(props: IconProps) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </Svg>
  )
}

export function IconBell(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconFolder(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 7h6l2 2h10v10H3z" />
    </Svg>
  )
}

export function IconSave(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 5h11l3 3v11H5z" />
      <path d="M8 5v5h8V5M8 19v-6h8v6" />
    </Svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  )
}

export function IconSun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Svg>
  )
}

export function IconMoon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 14a6 6 0 1 1-6-8 7 7 0 0 0 6 8z" />
    </Svg>
  )
}

export function IconX(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  )
}

export function IconMin(props: IconProps) {
  return (
    <Svg width="12" height="12" {...props}>
      <path d="M4 12h16" />
    </Svg>
  )
}

export function IconMax(props: IconProps) {
  return (
    <Svg width="12" height="12" {...props}>
      <rect x="6" y="6" width="12" height="12" />
    </Svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" />
    </Svg>
  )
}

export function IconUndo(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 14 5 10l4-4" />
      <path d="M5 10h9a5 5 0 1 1 0 10H9" />
    </Svg>
  )
}

export function IconRedo(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 14l4-4-4-4" />
      <path d="M19 10h-9a5 5 0 1 0 0 10h5" />
    </Svg>
  )
}

export function IconCut(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.2 7.8 20 19M8.2 16.2 20 5" />
    </Svg>
  )
}

export function IconCopy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5h10" />
    </Svg>
  )
}

export function IconPaste(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5h8" />
      <path d="M9 4h6v3H9z" />
      <rect x="5" y="7" width="14" height="13" rx="2" />
    </Svg>
  )
}

export function IconSelectAll(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </Svg>
  )
}

export function IconWrap(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6h18M3 12h12a3 3 0 1 1 0 6h-4" />
      <path d="M13 16l-2 2 2 2" />
    </Svg>
  )
}

export function IconFontSmaller(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 18 8.5 7h1.6L14 18" />
      <path d="M6.4 14h5.8" />
      <path d="M17 13h5" />
    </Svg>
  )
}

export function IconFontLarger(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 18 7.5 7h1.6L13 18" />
      <path d="M5.4 14h5.8" />
      <path d="M16.5 13h6M19.5 10v6" />
    </Svg>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 6 9 12l6 6" />
    </Svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  )
}

export function IconChevronUp(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 15l6-6 6 6" />
    </Svg>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  )
}

export function IconMinus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  )
}
