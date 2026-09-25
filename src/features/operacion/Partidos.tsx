import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'

type Catalogo = { id: string; nombre: string }
type Plantel = { id: string; deporte_id: string; categoria_id: string; temporada_id: string; equipos: { id: string; nombre: string } | null; deportes: { nombre: string } | null; categorias: { nombre: string } | null; temporadas: { nombre: string } | null }
type Partido = { id: string; inicio: string; cierre_confirmacion: string; estado: string; observaciones: string | null; local: Catalogo | null; visitante: Catalogo | null; sede: Catalogo | null; planteles: { equipos: { nombre: string } | null; deportes: { nombre: string } | null; categorias: { nombre: string } | null } | null }

export function Partidos() {
  const [planteles, setPlanteles] = useState<Plantel[]>([]), [equipos, setEquipos] = useState<Catalogo[]>([]), [sedes, setSedes] = useState<Catalogo[]>([]), [partidos, setPartidos] = useState<Partido[]>([])
  const [plantel, setPlantel] = useState(''), [rival, setRival] = useState(''), [sede, setSede] = useState(''), [inicio, setInicio] = useState(''), [cierre, setCierre] = useState(''), [observaciones, setObservaciones] = useState(''), [mensaje, setMensaje] = useState<string | null>(null)
  const cargar = async () => {
    const [p, e, s, partidosRespuesta] = await Promise.all([
      supabase.from('planteles').select('id,deporte_id,categoria_id,temporada_id,equipos(id,nombre),deportes(nombre),categorias(nombre),temporadas(nombre)').eq('activo', true).order('id'),
      supabase.from('equipos').select('id,nombre').eq('activo', true).order('nombre'),
      supabase.from('sedes').select('id,nombre').eq('activo', true).order('nombre'),
      supabase.from('partidos').select('id,inicio,cierre_confirmacion,estado,observaciones,local:equipos!partidos_local_id_fkey(id,nombre),visitante:equipos!partidos_visitante_id_fkey(id,nombre),sede:sedes!partidos_sede_id_fkey(id,nombre),planteles(equipos(nombre),deportes(nombre),categorias(nombre))').order('inicio', { ascending: false }),
    ])
    if (p.error) setMensaje('No se pudieron cargar los planteles.')
    setPlanteles((p.data ?? []) as Plantel[]); setEquipos((e.data ?? []) as Catalogo[]); setSedes((s.data ?? []) as Catalogo[]); setPartidos((partidosRespuesta.data ?? []) as Partido[])
  }
  useEffect(() => { void cargar() }, [])
  const seleccionado = planteles.find(p => p.id === plantel)
  const guardar = async (event: FormEvent) => {
    event.preventDefault(); setMensaje(null)
    if (!seleccionado?.equipos?.id) { setMensaje('El plantel no tiene equipo propio configurado.'); return }
    const { error } = await supabase.rpc('guardar_partido', { p_id: null as unknown as string, p_plantel_id: seleccionado.id, p_deporte_id: seleccionado.deporte_id, p_categoria_id: seleccionado.categoria_id, p_temporada_id: seleccionado.temporada_id, p_torneo_id: null as unknown as string, p_fecha_id: null as unknown as string, p_local_id: seleccionado.equipos.id, p_visitante_id: rival, p_sede_id: sede || null as unknown as string, p_inicio: new Date(inicio).toISOString(), p_cierre_confirmacion: new Date(cierre).toISOString(), p_estado: 'pendiente', p_observaciones: observaciones })
    if (error) setMensaje(error.message.includes('No autorizado') ? 'No tenés permiso para gestionar partidos en este plantel.' : 'No se pudo guardar el partido.')
    else { setMensaje('Partido creado.'); setRival(''); setSede(''); setInicio(''); setCierre(''); setObservaciones(''); await cargar() }
  }
  return <section className="panel"><h2>Partidos</h2><p className="hint">Creá encuentros asociados a un plantel. Las convocatorias se cargarán en el siguiente bloque.</p><ul className="catalogo">{partidos.map(p => <li key={p.id}><div><strong>{p.local?.nombre ?? 'Local'} vs. {p.visitante?.nombre ?? 'Rival'}</strong><div className="hint">{p.planteles?.equipos?.nombre} · {p.planteles?.deportes?.nombre} · {p.planteles?.categorias?.nombre} · {new Date(p.inicio).toLocaleString()} · {p.sede?.nombre ?? 'Sin sede'} · {p.estado}</div></div></li>)}{partidos.length === 0 && <li className="hint">Todavía no hay partidos cargados.</li>}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Plantel<select required value={plantel} onChange={e => setPlantel(e.target.value)}><option value="">Seleccionar</option>{planteles.map(p => <option key={p.id} value={p.id}>{p.equipos?.nombre} · {p.deportes?.nombre} · {p.categorias?.nombre} · {p.temporadas?.nombre}</option>)}</select></label><label>Rival<select required value={rival} onChange={e => setRival(e.target.value)}><option value="">Seleccionar</option>{equipos.filter(e => e.id !== seleccionado?.equipos?.id).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label><label>Sede<select value={sede} onChange={e => setSede(e.target.value)}><option value="">Sin sede</option>{sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label><label>Inicio<input required type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} /></label><label>Cierre de confirmación<input required type="datetime-local" value={cierre} onChange={e => setCierre(e.target.value)} /></label><label>Observaciones<input value={observaciones} onChange={e => setObservaciones(e.target.value)} /></label><button>Crear partido</button></form>{mensaje && <p className="hint">{mensaje}</p>}</section>
}
