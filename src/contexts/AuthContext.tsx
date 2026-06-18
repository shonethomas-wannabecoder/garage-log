import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  configured: boolean
  sendEmailLogin: (email: string) => Promise<{ error: string | null }>
  verifyEmailCode: (email: string, code: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  demoUser,
}: {
  children: ReactNode
  demoUser?: User | null
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(demoUser === undefined)

  useEffect(() => {
    if (demoUser !== undefined) return
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [demoUser])

  const sendEmailLogin = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    return { error: error?.message ?? null }
  }, [])

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    return { error: error?.message ?? null }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      session: demoUser !== undefined ? null : session,
      user: demoUser !== undefined ? demoUser : (session?.user ?? null),
      loading: demoUser !== undefined ? false : loading,
      configured: demoUser !== undefined ? true : isSupabaseConfigured,
      sendEmailLogin,
      verifyEmailCode,
      signInWithPassword,
      signUpWithPassword,
      requestPasswordReset,
      updatePassword,
      signOut,
    }),
    [demoUser, session, loading, sendEmailLogin, verifyEmailCode, signInWithPassword, signUpWithPassword, requestPasswordReset, updatePassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
