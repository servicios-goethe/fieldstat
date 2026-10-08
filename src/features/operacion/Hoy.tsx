import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../data/supabase'
import { useContextoDeportivo } from '../../app/ContextoDeportivo'

type Tarea = { id: string; inicio: string; estado: string; plantel: string; sede: string | null }
type Partido = { id: string; inicio: string; estado: string; local: string; visitante: string; plantel: string; cierre: string }

const fecha = (value: string) => new Date(value).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const contexto = (item: any) => [item.planteles?.equipos?.nombre, item.planteles?.deportes?.nombre, item.planteles?.categorias?.nombre].filter(Boolean).join(' · ')

export function Hoy() {
  const ctx = useContextoDeportivo()
  const [entrenamientos, setEntrenamientos] = useState<Tarea[]>([])
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [convocatorias, setConvocatorias] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    const ahora = new Date()
    const desde = new Date(ahora); desde.setHours(0, 0, 0, 0)
    const hasta = new Date(ahora); hasta.setHours(23, 59, 59, 999)
    const cargar = async () => {
      setCargando(true)
      let plantelesQuery = supabase.from('planteles').select('id').eq('activo', true)
      if (ctx.deporte) plantelesQuery = plantelesQuery.eq('deporte_id', ctx.deporte)
      if (ctx.categoria) plantelesQuery = plantelesQuery.eq('categoria_id', ctx.categoria)
      if (ctx.temporada) plantelesQuery = plantelesQuery.eq('temporada_id', ctx.temporada)
      const { data: plantelesContexto, error: plantelesError } = await plantelesQuery
      const ids = (plantelesContexto ?? []).map((x: { id: string }) => x.id)
      if (plantelesError) { if (activo) { setError('No se pudo cargar el contexto del día.'); setCargando(false) }; return }
      if (!ids.length) { if (activo) { setEntrenamientos([]); setPartidos([]); setConvocatorias(0); setCargando(false) }; return }
      const [e, p, c] = await Promise.all([
        supabase.from('entrenamientos').select('id,inicio,estado,sede:sedes(nombre),planteles(equipos(nombre),deportes(nombre),categorias(nombre))').in('plantel_id', ids).gte('inicio', desde.toISOString()).lte('inicio', hasta.toISOString()).order('inicio'),
        supabase.from('partidos').select('id,inicio,estado,cierre_confirmacion,local:equipos!partidos_local_id_fkey(nombre),visitante:equipos!partidos_visitante_id_fkey(nombre),planteles(equipos(nombre),deportes(nombre),categorias(nombre))').in('plantel_id', ids).in('estado', ['pendiente']).gte('inicio', desde.toISOString()).lte('inicio', hasta.toISOString()).order('inicio'),
        supabase.from('convocatorias').select('id,plantel_id', { count: 'exact', head: true }).in('plantel_id', ids).eq('respuesta', 'pendiente'),
      ])
      if (!activo) return
      if (e.error || p.error || c.error) setError('No se pudo cargar el resumen del día.')
      setEntrenamientos((e.data ?? []).map((x: any) => ({ id: x.id, inicio: x.inicio, estado: x.estado, plantel: contexto(x), sede: x.sede?.nombre ?? null })))
      setPartidos((p.data ?? []).map((x: any) => ({ id: x.id, inicio: x.inicio, estado: x.estado, local: x.local?.nombre ?? 'Local', visitante: x.visitante?.nombre ?? 'Rival', plantel: contexto(x), cierre: x.cierre_confirmacion })))
      setConvocatorias(c.count ?? 0)
      setCargando(false)
    }
    void cargar()
    return () => { activo = false }
  }, [ctx.deporte, ctx.categoria, ctx.temporada])

  const entrenamientosFiltrados = useMemo(() => entrenamientos, [entrenamientos])
  const navegar = (ruta: string) => window.dispatchEvent(new CustomEvent('fieldstats:navigate', { detail: ruta }))
  const total = entrenamientosFiltrados.length + partidos.length
  return <div className="today-dashboard">
    <section className="today-intro"><div><p className="eyebrow">{new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p><h2>{total ? `Tenés ${total} tarea${total === 1 ? '' : 's'} hoy` : 'Tu día está despejado'}</h2><p className="hint">El resumen respeta el deporte, categoría y temporada seleccionados arriba.</p></div><div className="today-stats"><div><strong>{entrenamientosFiltrados.length}</strong><span>entrenamientos</span></div><div><strong>{partidos.length}</strong><span>partidos</span></div><div><strong>{convocatorias}</strong><span>respuestas pendientes</span></div></div></section>
    {cargando && <section className="panel empty-state">Cargando tareas del día…</section>}
    {error && <section className="panel error">{error}</section>}
    {!cargando && !error && <>
      <section className="today-grid"><article className="panel today-card"><div className="panel-heading"><p className="eyebrow">Próximo entrenamiento</p><h3>{entrenamientosFiltrados[0] ? fecha(entrenamientosFiltrados[0].inicio) : 'Sin entrenamientos'}</h3></div>{entrenamientosFiltrados[0] && <><p><strong>{entrenamientosFiltrados[0].plantel}</strong><br /><span className="hint">{entrenamientosFiltrados[0].sede ?? 'Sede sin definir'} · {entrenamientosFiltrados[0].estado}</span></p><button onClick={() => navegar('entrenamientos')}>Tomar asistencia</button></>}{!entrenamientosFiltrados[0] && <p className="hint">No hay sesiones cargadas para hoy.</p>}</article><article className="panel today-card"><div className="panel-heading"><p className="eyebrow">Partidos pendientes</p><h3>{partidos.length ? `${partidos.length} para gestionar` : 'Sin partidos hoy'}</h3></div>{partidos.slice(0, 3).map(p => <div className="today-row" key={p.id}><div><strong>{p.local} vs. {p.visitante}</strong><span>{fecha(p.inicio)} · {p.plantel}</span></div><span className="tag tag-accent">Pendiente</span></div>)}{partidos.length > 3 && <p className="hint">Y {partidos.length - 3} más…</p>}<button className="secondary" onClick={() => navegar('partidos')}>Ver partidos</button></article></section>
      <section className="panel today-actions"><div><p className="eyebrow">Acciones rápidas</p><h3>Seguí trabajando</h3></div><div className="quick-links"><button onClick={() => navegar('planteles')}>Planteles y jugadores</button><button className="secondary" onClick={() => navegar('asistencia')}>Ver reportes</button>{convocatorias > 0 && <button className="secondary" onClick={() => navegar('partidos')}>Revisar convocatorias</button>}</div></section>
    </>}
  </div>
}
