import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../data/supabase'

type Estado = 'presente' | 'ausente' | null
type Plantel = { id: string; nombre: string }
type Inscripcion = { id: string; jugadores: { nombre: string; apellido: string } | null; camiseta: number | null }
type Entrenamiento = { id: string; plantel_id: string; inicio: string; estado: string }

export function Asistencia() {
  const [planteles, setPlanteles] = useState<Plantel[]>([])
  const [plantel, setPlantel] = useState('')
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([])
  const [entrenamiento, setEntrenamiento] = useState('')
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [estados, setEstados] = useState<Record<string, Estado>>({})
  const [inicio, setInicio] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [tipoMensaje, setTipoMensaje] = useState<'hint' | 'error' | 'success'>('hint')
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    const [p, e] = await Promise.all([
      supabase.from('planteles').select('id,equipos(nombre),deportes(nombre),categorias(nombre)').order('id'),
      supabase.from('entrenamientos').select('id,plantel_id,inicio,estado').order('inicio', { ascending: false }),
    ])
    if (p.error || e.error) {
      setTipoMensaje('error')
      setMensaje('No se pudieron cargar los entrenamientos.')
      return
    }
    setPlanteles((p.data ?? []).map((x: any) => ({ id: x.id, nombre: [x.equipos?.nombre, x.deportes?.nombre, x.categorias?.nombre].filter(Boolean).join(' · ') })))
    setEntrenamientos((e.data ?? []) as Entrenamiento[])
  }

  useEffect(() => { void cargar() }, [])

  useEffect(() => {
    if (!entrenamiento || !plantel) {
      setInscripciones([])
      setEstados({})
      return
    }
    let activo = true
    setCargando(true)
    void Promise.all([
      supabase.from('inscripciones').select('id,camiseta,jugadores(nombre,apellido)').eq('plantel_id', plantel).eq('activa', true).order('id'),
      supabase.from('asistencias').select('inscripcion_id,estado').eq('entrenamiento_id', entrenamiento),
    ]).then(([i, a]) => {
      if (!activo) return
      if (i.error || a.error) {
        setTipoMensaje('error')
        setMensaje('No se pudo cargar la lista de asistencia.')
      } else {
        const next: Record<string, Estado> = {}
        ;(a.data ?? []).forEach((x: any) => { next[x.inscripcion_id] = x.estado === 'presente' || x.estado === 'ausente' ? x.estado : null })
        setInscripciones((i.data ?? []) as Inscripcion[])
        setEstados(next)
        setMensaje(null)
      }
      setCargando(false)
    })
    return () => { activo = false }
  }, [entrenamiento, plantel])

  const presentes = useMemo(() => inscripciones.filter(i => estados[i.id] === 'presente').length, [estados, inscripciones])
  const ausentes = useMemo(() => inscripciones.filter(i => estados[i.id] === 'ausente').length, [estados, inscripciones])
  const sinRegistrar = inscripciones.length - presentes - ausentes
  const porcentaje = inscripciones.length ? Math.round(((presentes + ausentes) / inscripciones.length) * 100) : 0

  const seleccionarPlantel = (value: string) => {
    setPlantel(value)
    setEntrenamiento('')
    setMensaje(null)
  }

  const crear = async (event: FormEvent) => {
    event.preventDefault()
    setGuardando(true)
    setTipoMensaje('hint')
    const { data, error } = await supabase.rpc('guardar_entrenamiento', { p_id: null as unknown as string, p_plantel_id: plantel, p_inicio: inicio, p_sede_id: null as unknown as string, p_estado: 'realizado' })
    setGuardando(false)
    if (error) {
      setTipoMensaje('error')
      setMensaje(error.message.includes('No autorizado') ? 'No tenés permiso para gestionar este plantel.' : 'No se pudo crear el entrenamiento.')
    } else {
      setInicio('')
      setTipoMensaje('success')
      setMensaje('Entrenamiento creado. Seleccioná la sesión para tomar asistencia.')
      await cargar()
      setEntrenamiento(data as string)
    }
  }

  const alternar = (id: string, estado: Exclude<Estado, null>) => setEstados(actual => ({ ...actual, [id]: actual[id] === estado ? null : estado }))

  const marcarRestoPresentes = () => setEstados(actual => {
    const next = { ...actual }
    inscripciones.forEach(i => { if (!next[i.id]) next[i.id] = 'presente' })
    return next
  })

  const guardar = async () => {
    if (!entrenamiento || !plantel || sinRegistrar > 0) return
    setGuardando(true)
    setTipoMensaje('hint')
    setMensaje(null)
    const resultados = await Promise.all(inscripciones.map(i => supabase.rpc('guardar_asistencia', { p_entrenamiento_id: entrenamiento, p_inscripcion_id: i.id, p_plantel_id: plantel, p_estado: estados[i.id] as string })))
    const error = resultados.find(result => result.error)?.error
    setGuardando(false)
    if (error) {
      setTipoMensaje('error')
      setMensaje(error.message.includes('No autorizado') ? 'No tenés permiso para guardar esta asistencia.' : 'No se pudo guardar la asistencia. Revisá la conexión e intentá nuevamente.')
    } else {
      setTipoMensaje('success')
      setMensaje('Asistencia guardada correctamente.')
    }
  }

  const sesion = entrenamientos.find(x => x.id === entrenamiento)
  return <section className="panel attendance-panel"><div className="attendance-top"><div><p className="eyebrow">Entrenamientos</p><h2>Tomar asistencia</h2></div><div className="attendance-selects"><label>Plantel<select value={plantel} onChange={e => seleccionarPlantel(e.target.value)}><option value="">Seleccionar</option>{planteles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label><label>Sesión<select value={entrenamiento} onChange={e => setEntrenamiento(e.target.value)} disabled={!plantel}><option value="">Seleccionar</option>{entrenamientos.filter(x => x.plantel_id === plantel).map(x => <option key={x.id} value={x.id}>{new Date(x.inicio).toLocaleString()} · {x.estado}</option>)}</select></label></div></div><form className="inline-form attendance-create" onSubmit={e => void crear(e)}><label>Nuevo entrenamiento<input required type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} /></label><button disabled={!plantel || guardando}>Crear sesión</button></form>{sesion && <div className="attendance-summary"><div><p className="eyebrow">{new Date(sesion.inicio).toLocaleDateString()} · {new Date(sesion.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><h3>{planteles.find(p => p.id === plantel)?.nombre}</h3></div><div className="attendance-counts"><strong>{presentes} <span>presentes</span></strong><strong>{ausentes} <span>ausentes</span></strong><strong className={sinRegistrar ? 'is-pending' : ''}>{sinRegistrar} <span>sin registrar</span></strong></div></div>}{entrenamiento && <div className="attendance-progress" aria-label={`${porcentaje}% de la lista registrada`}><span style={{ width: `${porcentaje}%` }} /></div>}{cargando && <p className="hint">Cargando lista…</p>}{entrenamiento && !cargando && inscripciones.length === 0 && <p className="hint">No hay alumnos activos en este plantel.</p>}{entrenamiento && !cargando && inscripciones.length > 0 && <div className="attendance-list">{inscripciones.map(i => <div className="attendance-row" key={i.id}><span className="shirt-number">{i.camiseta ?? '—'}</span><span className="player-name">{i.jugadores?.apellido}, {i.jugadores?.nombre}</span><div className="attendance-toggles"><button type="button" className={`toggle ${estados[i.id] === 'presente' ? 'is-positive' : ''}`} aria-pressed={estados[i.id] === 'presente'} onClick={() => alternar(i.id, 'presente')}>P</button><button type="button" className={`toggle ${estados[i.id] === 'ausente' ? 'is-negative' : ''}`} aria-pressed={estados[i.id] === 'ausente'} onClick={() => alternar(i.id, 'ausente')}>A</button></div></div>)}</div>}{entrenamiento && inscripciones.length > 0 && <div className="attendance-footer"><button type="button" className="secondary" onClick={marcarRestoPresentes} disabled={!sinRegistrar}>Marcar resto presentes</button><button type="button" onClick={() => void guardar()} disabled={guardando || sinRegistrar > 0}>{guardando ? 'Guardando…' : sinRegistrar ? `Faltan ${sinRegistrar} para guardar` : 'Guardar asistencia'}</button></div>}{mensaje && <p className={tipoMensaje}>{mensaje}</p>}</section>
}
