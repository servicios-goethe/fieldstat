import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../data/supabase'

type Respuesta = 'pendiente' | 'acepta' | 'rechaza'
type Convocatoria = { id: string; convocado: boolean; respuesta: Respuesta; transporte: string | null; partidos: { inicio: string; cierre_confirmacion: string; estado: string; local: { nombre: string } | null; visitante: { nombre: string } | null; planteles: { deportes: { nombre: string } | null; categorias: { nombre: string } | null } | null } | null }

function estaCerrada(item: Convocatoria) {
  const partido = item.partidos
  return !partido || new Date(partido.cierre_confirmacion) <= new Date() || partido.estado !== 'pendiente'
}

function plazo(cierre: string) {
  const fecha = new Date(cierre)
  const dias = Math.ceil((fecha.getTime() - Date.now()) / 86400000)
  if (dias <= 0) return `Cerró el ${fecha.toLocaleString()}`
  return `Podés responder hasta el ${fecha.toLocaleString()} · faltan ${dias} ${dias === 1 ? 'día' : 'días'}`
}

export function MisConvocatorias() {
  const [items, setItems] = useState<Convocatoria[]>([])
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({})
  const [transportes, setTransportes] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    const { data, error } = await supabase.from('convocatorias').select('id,convocado,respuesta,transporte,partidos(inicio,cierre_confirmacion,estado,local:equipos!partidos_local_id_fkey(nombre),visitante:equipos!partidos_visitante_id_fkey(nombre),planteles(deportes(nombre),categorias(nombre)))').eq('convocado', true).order('id')
    setCargando(false)
    if (error) {
      setMensaje('No se pudieron cargar tus convocatorias.')
      return
    }
    const rows = (data ?? []) as Convocatoria[]
    setItems(rows)
    setRespuestas(Object.fromEntries(rows.map(x => [x.id, x.respuesta || 'pendiente'])))
    setTransportes(Object.fromEntries(rows.map(x => [x.id, x.transporte ?? ''])))
  }

  useEffect(() => { void cargar() }, [])

  const responder = async (event: FormEvent, item: Convocatoria) => {
    event.preventDefault()
    setGuardando(item.id)
    setMensaje(null)
    const { error } = await supabase.rpc('responder_convocatoria', { p_convocatoria: item.id, p_respuesta: respuestas[item.id], p_transporte: (transportes[item.id] || null) as unknown as string })
    setGuardando(null)
    if (error) setMensaje(error.message.includes('cerrada') ? 'El plazo de respuesta ya cerró.' : 'No se pudo guardar la respuesta. Revisá la conexión e intentá nuevamente.')
    else { setMensaje('Respuesta guardada correctamente.'); await cargar() }
  }

  const activas = useMemo(() => items.filter(item => !estaCerrada(item)), [items])
  const anteriores = useMemo(() => items.filter(estaCerrada), [items])
  return <section className="panel convocatorias-panel"><div className="convocatorias-heading"><div><p className="eyebrow">Alumno</p><h2>Te convocaron</h2><p className="hint">Respondé hasta el cierre indicado. Tu respuesta se guarda de forma segura.</p></div></div>{cargando && <p className="hint">Cargando convocatorias…</p>}{!cargando && items.length === 0 && <p className="empty-state">No tenés convocatorias asignadas.</p>}{!cargando && activas.length > 0 && <div className="convocatorias-list">{activas.map(item => <ConvocatoriaCard key={item.id} item={item} respuesta={respuestas[item.id] ?? 'pendiente'} transporte={transportes[item.id] ?? ''} guardando={guardando === item.id} onRespuesta={respuesta => setRespuestas(actual => ({ ...actual, [item.id]: respuesta }))} onTransporte={transporte => setTransportes(actual => ({ ...actual, [item.id]: transporte }))} onSubmit={event => void responder(event, item)} />)}</div>}{!cargando && anteriores.length > 0 && <div className="convocatorias-previous"><p className="eyebrow">Anteriores</p>{anteriores.map(item => <PreviousConvocatoria key={item.id} item={item} />)}</div>}{mensaje && <p className={mensaje.includes('correctamente') ? 'success' : 'error'} role="status">{mensaje}</p>}</section>
}

function ConvocatoriaCard({ item, respuesta, transporte, guardando, onRespuesta, onTransporte, onSubmit }: { item: Convocatoria; respuesta: Respuesta; transporte: string; guardando: boolean; onRespuesta: (value: Respuesta) => void; onTransporte: (value: string) => void; onSubmit: (event: FormEvent) => void }) {
  const partido = item.partidos
  if (!partido) return null
  return <article className="convocatoria-card"><div className="convocatoria-card-top"><span className="kicker">{partido.planteles?.deportes?.nombre ?? 'Deporte'} · {partido.planteles?.categorias?.nombre ?? 'Categoría'}</span><span className={respuesta === 'acepta' ? 'tag tag-accent' : respuesta === 'rechaza' ? 'tag tag-neutral' : 'tag tag-outline'}>{respuesta === 'acepta' ? 'Vas' : respuesta === 'rechaza' ? 'No vas' : 'Sin responder'}</span></div><h3>{partido.local?.nombre ?? 'Local'} vs. {partido.visitante?.nombre ?? 'Rival'}</h3><div className="convocatoria-details"><div><span>Cuándo</span><strong>{new Date(partido.inicio).toLocaleString()}</strong></div><div><span>Dónde</span><strong>Ver sede con el docente</strong></div></div><p className="convocatoria-deadline">{plazo(partido.cierre_confirmacion)}</p><form onSubmit={onSubmit}><div className="response-toggles" role="group" aria-label="Respuesta a la convocatoria"><button type="button" className={`toggle response-toggle ${respuesta === 'acepta' ? 'is-positive' : ''}`} aria-pressed={respuesta === 'acepta'} onClick={() => onRespuesta(respuesta === 'acepta' ? 'pendiente' : 'acepta')}>Voy</button><button type="button" className={`toggle response-toggle ${respuesta === 'rechaza' ? 'is-negative' : ''}`} aria-pressed={respuesta === 'rechaza'} onClick={() => onRespuesta(respuesta === 'rechaza' ? 'pendiente' : 'rechaza')}>No puedo</button></div><label className="transport-label">Transporte<input value={transporte} onChange={event => onTransporte(event.target.value)} placeholder="Ej. voy por mi cuenta" /></label><button className="response-submit" disabled={guardando || respuesta === 'pendiente'}>{guardando ? 'Guardando…' : 'Guardar respuesta'}</button></form></article>
}

function PreviousConvocatoria({ item }: { item: Convocatoria }) {
  const partido = item.partidos
  if (!partido) return null
  return <div className="previous-row"><div><strong>{partido.local?.nombre ?? 'Local'} vs. {partido.visitante?.nombre ?? 'Rival'}</strong><span>{new Date(partido.inicio).toLocaleString()} · {item.respuesta === 'acepta' ? 'Vas' : item.respuesta === 'rechaza' ? 'No vas' : 'No respondiste'}</span></div><span className="tag tag-neutral">Cerrada</span></div>
}
