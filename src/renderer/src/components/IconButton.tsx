import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  children: ReactNode
}

export function IconButton({ label, active, className, children, ...props }: Props) {
  return (
    <button
      type="button"
      className={['icon-btn', 'has-tooltip', active ? 'on' : '', className].filter(Boolean).join(' ')}
      data-tooltip={label}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  )
}
