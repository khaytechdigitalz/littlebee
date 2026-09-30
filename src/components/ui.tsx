import React from 'react'
import { X } from 'lucide-react'

export function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  action?: React.ReactNode
}) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-semibold text-sm text-slate-100">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Field({
  label,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="text-xs text-slate-500 mb-1.5 block">{label}</span>}
      <input
        {...props}
        className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition placeholder:text-slate-600"
      />
    </label>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'positive' | 'negative' | 'accent'
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--hover)] text-slate-300',
    positive: 'bg-emerald-500/10 text-emerald-400',
    negative: 'bg-red-500/10 text-red-400',
    accent: 'bg-accent/15 text-accent',
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card w-full max-w-sm p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const base = 'text-sm font-semibold px-4 py-2.5 rounded-lg transition inline-flex items-center justify-center gap-2'
  const styles =
    variant === 'primary'
      ? 'bg-accent text-black hover:brightness-95'
      : 'border border-base-border text-slate-200 hover:bg-[var(--hover)]'
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}
