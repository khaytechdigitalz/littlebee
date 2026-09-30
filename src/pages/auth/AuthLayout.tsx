import React from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  const { colorMode, toggleColorMode } = useTheme()

  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center px-4 py-10 relative">
      <button
        onClick={toggleColorMode}
        className="absolute top-5 right-5 p-2 rounded-lg border border-base-border hover:bg-[var(--hover)] transition text-slate-300"
        aria-label="Toggle light/dark mode"
      >
        {colorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent/90 flex items-center justify-center font-bold text-black">
            🐝
          </div>
          <span className="font-bold text-lg tracking-tight">LITTLEBEE</span>
        </Link>

        <div className="card p-6">
          <h1 className="text-xl font-bold mb-1">{title}</h1>
          <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
