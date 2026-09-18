import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../data/supabase'
import { Dashboard } from './Dashboard'

type Access = 'checking' | 'signed-out' | 'pending' | 'active' | 'inactive' | 'error'

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [access, setAccess] = useState<Access>('checking')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async (nextSession: Session | null) => {
      setSession(nextSession)
      setMessage(null)
      if (!nextSession) {
        setAccess('signed-out')
        return
      }

      setAccess('checking')
      const { data, error } = await supabase
        .from('perfiles')
        .select('activo')
        .eq('id', nextSession.user.id)
        .maybeSingle()

      if (error) {
        setAccess('error')
        setMessage('No pudimos verificar tu acceso. Intentá nuevamente.')
      } else if (!data) {
        setAccess('pending')
      } else {
        setAccess(data.activo ? 'active' : 'inactive')
      }
    }

    void supabase.auth.getSession().then(({ data }) => checkSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void checkSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setMessage('No se pudo iniciar sesión con Google. Intentá nuevamente.')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (access === 'active' && session?.user.email) {
    return <Dashboard email={session.user.email} onSignOut={() => void signOut()} />
  }

  return (
    <main className="app-shell">
      <section className="card" aria-live="polite">
        <p className="eyebrow">Goethe Schule</p>
        <h1>FieldStats</h1>
        <p className="subtitle">Gestión deportiva institucional</p>

        {access === 'checking' && <p>Verificando tu sesión…</p>}

        {access === 'signed-out' && (
          <>
            <p>Ingresá con tu cuenta de Google autorizada por la institución.</p>
            <button type="button" onClick={() => void signIn()}>Continuar con Google</button>
          </>
        )}

        {access === 'pending' && (
          <>
            <p>Tu cuenta <strong>{session?.user.email}</strong> inició sesión correctamente, pero todavía no tiene un perfil habilitado en FieldStats.</p>
            <p className="hint">Un administrador debe asignarte un perfil y rol antes de continuar.</p>
            <button type="button" className="secondary" onClick={() => void signOut()}>Cerrar sesión</button>
          </>
        )}

        {access === 'inactive' && (
          <>
            <p>Tu perfil de FieldStats está inactivo. Contactá al administrador institucional.</p>
            <button type="button" className="secondary" onClick={() => void signOut()}>Cerrar sesión</button>
          </>
        )}


        {access === 'error' && <p className="error">{message}</p>}
        {message && access !== 'error' && <p className="error">{message}</p>}
      </section>
    </main>
  )
}
