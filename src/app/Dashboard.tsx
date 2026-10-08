import { useEffect, useState } from 'react'
import { supabase } from '../data/supabase'
import { ContextoDeportivoProvider, useContextoDeportivo } from './ContextoDeportivo'
import { Categorias } from '../features/configuracion/Categorias'
import { Deportes } from '../features/configuracion/Deportes'
import { Equipos, Sedes, Temporadas } from '../features/configuracion/Institucional'
import { TiposEventos } from '../features/configuracion/TiposEventos'
import { Usuarios } from '../features/configuracion/Usuarios'
import { PlantelesJugadores } from '../features/operacion/PlantelesJugadores'
import { InscripcionExistente } from '../features/operacion/InscripcionExistente'
import { Asistencia } from '../features/operacion/Asistencia'
import { Partidos } from '../features/operacion/Partidos'
import { Convocatorias } from '../features/operacion/Convocatorias'
import { MisConvocatorias } from '../features/operacion/MisConvocatorias'
import { CierrePartido } from '../features/operacion/CierrePartido'
import { EventosPartido } from '../features/operacion/EventosPartido'
import { DashboardAsistencia } from '../features/reportes/DashboardAsistencia'
import { DashboardPartidos } from '../features/reportes/DashboardPartidos'

type Ruta = 'hoy' | 'planteles' | 'entrenamientos' | 'partidos' | 'asistencia' | 'reportes-partidos' | 'jugadores' | 'configuracion' | 'mis-convocatorias'
type Rol = 'docente' | 'alumno' | 'administrador'

const grupos: { titulo: string; items: { ruta: Ruta; etiqueta: string }[] }[] = [
  { titulo: 'Operación', items: [{ ruta: 'hoy', etiqueta: 'Hoy' }, { ruta: 'planteles', etiqueta: 'Planteles y jugadores' }, { ruta: 'entrenamientos', etiqueta: 'Entrenamientos' }, { ruta: 'partidos', etiqueta: 'Partidos' }] },
  { titulo: 'Reportes', items: [{ ruta: 'asistencia', etiqueta: 'Asistencia' }, { ruta: 'reportes-partidos', etiqueta: 'Partidos y posiciones' }, { ruta: 'jugadores', etiqueta: 'Jugadores' }] },
  { titulo: 'Configuración', items: [{ ruta: 'configuracion', etiqueta: 'Configuración' }] },
]

export function Dashboard(props: { email: string; isPrincipal: boolean; onSignOut: () => void }) {
  return <ContextoDeportivoProvider><DashboardShell {...props} /></ContextoDeportivoProvider>
}

function DashboardShell({ email, isPrincipal, onSignOut }: { email: string; isPrincipal: boolean; onSignOut: () => void }) {
  const [ruta, setRuta] = useState<Ruta>(() => (sessionStorage.getItem('fieldstats-route') as Ruta | null) ?? 'hoy')
  const [rol, setRol] = useState<Rol>('docente')
  const [rolesCargados, setRolesCargados] = useState(false)
  useContextoDeportivo()

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      // La ficha propia es visible para el rol alumno y no requiere exponer
      // el catálogo de roles al cliente. La autorización real sigue en RLS.
      const { data: ficha } = await supabase.from('jugadores').select('id').eq('perfil_id', data.user.id).maybeSingle()
      if (!isPrincipal && ficha) {
        setRol('alumno')
        setRuta('mis-convocatorias')
      } else if (isPrincipal) setRol('administrador')
      else if (ruta === 'configuracion' || ruta === 'mis-convocatorias') {
        setRuta('hoy')
        sessionStorage.setItem('fieldstats-route', 'hoy')
      }
      setRolesCargados(true)
    })
  }, [isPrincipal])

  const navegar = (next: Ruta) => {
    setRuta(next)
    sessionStorage.setItem('fieldstats-route', next)
  }
  useEffect(() => {
    const onNavigate = (event: Event) => navegar((event as CustomEvent<Ruta>).detail)
    window.addEventListener('fieldstats:navigate', onNavigate)
    return () => window.removeEventListener('fieldstats:navigate', onNavigate)
  }, [])
  const mostrarConfiguracion = isPrincipal
  const titulo = grupos.flatMap(g => g.items).find(i => i.ruta === ruta)?.etiqueta ?? 'Hoy'

  if (!rolesCargados && !isPrincipal) return <main className="dashboard"><p className="hint">Cargando tu espacio…</p></main>
  if (rol === 'alumno') return <main className="dashboard dashboard-student"><Header email={email} rol={rol} onSignOut={onSignOut} /><ContextBar /><main className="route-content"><RouteContent ruta="mis-convocatorias" /></main></main>

  return <main className="dashboard dashboard-app"><aside className="sidebar"><div className="brand"><p className="eyebrow">Goethe Schule</p><strong>FieldStats</strong></div><nav aria-label="Navegación principal">{grupos.map(grupo => <div className="nav-group" key={grupo.titulo}><span className="nav-label">{grupo.titulo}</span>{grupo.items.filter(item => item.ruta !== 'configuracion' || mostrarConfiguracion).map(item => <button key={item.ruta} className={ruta === item.ruta ? 'nav-item active' : 'nav-item'} onClick={() => navegar(item.ruta)}>{item.etiqueta}</button>)}</div>)}</nav><div className="sidebar-footer"><strong>{email}</strong><span>{rol === 'administrador' ? 'Administrador' : 'Docente'}</span><button className="secondary" onClick={onSignOut}>Cerrar sesión</button></div></aside><section className="dashboard-main"><Header email={email} rol={rol} onSignOut={onSignOut} mobile /><ContextBar /><div className="route-heading"><p className="eyebrow">{ruta === 'configuracion' ? 'Administración' : rol === 'administrador' ? 'FieldStats' : 'Operación'}</p><h1>{titulo}</h1></div><main className="route-content"><RouteContent ruta={ruta} /></main></section><nav className="mobile-nav" aria-label="Navegación móvil">{[{ ruta: 'hoy' as Ruta, etiqueta: 'Hoy' }, { ruta: 'planteles' as Ruta, etiqueta: 'Plantel' }, { ruta: 'partidos' as Ruta, etiqueta: 'Partidos' }, { ruta: 'asistencia' as Ruta, etiqueta: 'Reportes' }].map(item => <button key={item.ruta} className={ruta === item.ruta ? 'active' : ''} onClick={() => navegar(item.ruta)}>{item.etiqueta}</button>)}</nav></main>
}

function Header({ email, rol, onSignOut, mobile = false }: { email: string; rol: Rol; onSignOut: () => void; mobile?: boolean }) {
  return <header className={mobile ? 'app-header mobile-only' : 'app-header'}><div><p className="eyebrow">{mobile ? 'FieldStats' : ''}</p>{!mobile && <p className="subtitle">{email}</p>}</div>{mobile && <><span className="avatar" aria-label={`Usuario ${email}`}>{email.slice(0, 2).toUpperCase()}</span><button className="secondary header-signout" onClick={onSignOut}>Salir</button></>}{!mobile && <span className="role-badge">{rol}</span>}</header>
}

function ContextBar() {
  const { deporte, categoria, temporada, deportes, categorias, temporadas, setDeporte, setCategoria, setTemporada, cargando, mensaje } = useContextoDeportivo()
  return <div className="context-bar" aria-label="Contexto deportivo"><div className="segmented" role="group" aria-label="Deporte">{deportes.map(item => <button key={item.id} className={deporte === item.id ? 'active' : ''} onClick={() => setDeporte(deporte === item.id ? '' : item.id)}>{item.nombre}</button>)}{deportes.length === 0 && <span className="hint">Deporte</span>}</div><div className="segmented" role="group" aria-label="Categoría">{categorias.map(item => <button key={item.id} className={categoria === item.id ? 'active' : ''} onClick={() => setCategoria(categoria === item.id ? '' : item.id)}>{item.nombre}</button>)}{categorias.length === 0 && <span className="hint">Categoría</span>}</div><label>Temporada<select value={temporada} onChange={e => setTemporada(e.target.value)} disabled={cargando}><option value="">Todas</option>{temporadas.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>{mensaje && <span className="error">{mensaje}</span>}</div>
}

function RouteContent({ ruta }: { ruta: Ruta }) {
  switch (ruta) {
    case 'planteles': return <><PlantelesJugadores /><InscripcionExistente /></>
    case 'entrenamientos': return <Asistencia />
    case 'partidos': return <><Partidos /><Convocatorias /><CierrePartido /><EventosPartido /></>
    case 'asistencia': return <DashboardAsistencia />
    case 'reportes-partidos': return <DashboardPartidos />
    case 'jugadores': return <PlantelesJugadores />
    case 'configuracion': return <><Usuarios /><Categorias /><Deportes /><TiposEventos /><Temporadas /><Sedes /><Equipos /></>
    case 'mis-convocatorias': return <MisConvocatorias />
    default: return <section className="panel welcome"><p className="eyebrow">Próxima tarea</p><h2>Hoy</h2><p className="hint">Seleccioná una sección para comenzar. La vista de tareas del día se incorporará en la siguiente etapa.</p><div className="quick-links"><button onClick={() => window.dispatchEvent(new CustomEvent('fieldstats:navigate', { detail: 'entrenamientos' }))}>Ir a entrenamientos</button><button className="secondary" onClick={() => window.dispatchEvent(new CustomEvent('fieldstats:navigate', { detail: 'partidos' }))}>Ir a partidos</button></div></section>
  }
}
