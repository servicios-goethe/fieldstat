import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../data/supabase'

export type OpcionContexto = { id: string; nombre: string }
type ContextoValue = {
  deporte: string
  categoria: string
  temporada: string
  deportes: OpcionContexto[]
  categorias: OpcionContexto[]
  temporadas: OpcionContexto[]
  setDeporte: (id: string) => void
  setCategoria: (id: string) => void
  setTemporada: (id: string) => void
  cargando: boolean
  mensaje: string | null
}

const ContextoDeportivo = createContext<ContextoValue | null>(null)

function inicial(clave: string) {
  return sessionStorage.getItem(`fieldstats-context-${clave}`) ?? ''
}

export function ContextoDeportivoProvider({ children }: { children: ReactNode }) {
  const [deportes, setDeportes] = useState<OpcionContexto[]>([])
  const [categorias, setCategorias] = useState<OpcionContexto[]>([])
  const [temporadas, setTemporadas] = useState<OpcionContexto[]>([])
  const [deporte, setDeporteState] = useState(inicial('deporte'))
  const [categoria, setCategoriaState] = useState(inicial('categoria'))
  const [temporada, setTemporadaState] = useState(inicial('temporada'))
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    void Promise.all([
      supabase.from('deportes').select('id,nombre').eq('activo', true).order('nombre'),
      supabase.from('categorias').select('id,nombre').eq('activo', true).order('orden'),
      supabase.from('temporadas').select('id,nombre').eq('activa', true).order('desde', { ascending: false }),
    ]).then(([d, c, t]) => {
      if (!activo) return
      if (d.error || c.error || t.error) setMensaje('No se pudo cargar el contexto deportivo.')
      setDeportes((d.data ?? []) as OpcionContexto[])
      setCategorias((c.data ?? []) as OpcionContexto[])
      setTemporadas((t.data ?? []) as OpcionContexto[])
      setCargando(false)
    })
    return () => { activo = false }
  }, [])

  const setContexto = (clave: string, setter: (value: string) => void, value: string) => {
    setter(value)
    if (value) sessionStorage.setItem(`fieldstats-context-${clave}`, value)
    else sessionStorage.removeItem(`fieldstats-context-${clave}`)
  }
  const value = useMemo<ContextoValue>(() => ({
    deporte, categoria, temporada, deportes, categorias, temporadas, cargando, mensaje,
    setDeporte: value => setContexto('deporte', setDeporteState, value),
    setCategoria: value => setContexto('categoria', setCategoriaState, value),
    setTemporada: value => setContexto('temporada', setTemporadaState, value),
  }), [deporte, categoria, temporada, deportes, categorias, temporadas, cargando, mensaje])

  return <ContextoDeportivo.Provider value={value}>{children}</ContextoDeportivo.Provider>
}

export function useContextoDeportivo() {
  const value = useContext(ContextoDeportivo)
  if (!value) throw new Error('useContextoDeportivo debe usarse dentro de ContextoDeportivoProvider')
  return value
}
