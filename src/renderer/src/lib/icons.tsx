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
