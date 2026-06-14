import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'garage-log-theme'

interface ThemeContextValue {
  pref: ThemePref
  resolved: 'light' | 'dark'
  setPref: (p: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') return systemDark() ? 'dark' : 'light'
  return pref
}

function apply(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#090d15' : '#f5f6f8')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePref | null) ?? 'system',
  )
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(pref))

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p)
    localStorage.setItem(STORAGE_KEY, p)
    const r = resolve(p)
    setResolved(r)
    apply(r)
  }, [])

  useEffect(() => {
    apply(resolved)
  }, [resolved])

  useEffect(() => {
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const r = systemDark() ? 'dark' : 'light'
      setResolved(r)
      apply(r)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const value = useMemo(() => ({ pref, resolved, setPref }), [pref, resolved, setPref])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
