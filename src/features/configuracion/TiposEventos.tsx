import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'

type Deporte = { id: string; nombre: string }
type Tipo = { id: string; deporte_id: string; codigo: string; nombre: string }

export function TiposEventos() {
  const [deportes, setDeportes] = useState<Deporte[]>([]), [items, setItems] = useState<Tipo[]>([]), [deporte, setDeporte] = useState(''), [codigo, setCodigo] = useState(''), [nombre, setNombre] = useState(''), [mensaje, setMensaje] = useState<string | null>(null)
  const cargar = async () => { const [d, t] = await Promise.all([supabase.from('deportes').select('id,nombre').eq('activo', true).order('nombre'), supabase.from('tipos_estadistica').select('id,deporte_id,codigo,nombre').order('nombre')]); setDeportes((d.data ?? []) as Deporte[]); setItems((t.data ?? []) as Tipo[]) }
  useEffect(() => { void cargar() }, [])
  const guardar = async (e: FormEvent) => { e.preventDefault(); const { error } = await supabase.rpc('guardar_tipo_estadistica', { p_id: null as unknown as string, p_deporte_id: deporte, p_codigo: codigo, p_nombre: nombre }); setMensaje(error ? 'No se pudo guardar el tipo de evento.' : 'Tipo de evento guardado.'); if (!error) { setCodigo(''); setNombre(''); await cargar() } }
  return <section className="panel"><h2>Tipos de eventos</h2><p className="hint">El administrador define los eventos disponibles para cada deporte.</p><ul className="catalogo">{items.map(i => <li key={i.id}>{deportes.find(d => d.id === i.deporte_id)?.nombre ?? 'Deporte'} · <strong>{i.nombre}</strong> <small>({i.codigo})</small></li>)}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Deporte<select required value={deporte} onChange={e => setDeporte(e.target.value)}><option value="">Seleccionar</option>{deportes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label><label>Código<input required value={codigo} maxLength={40} onChange={e => setCodigo(e.target.value)} placeholder="gol" /></label><label>Nombre<input required value={nombre} maxLength={80} onChange={e => setNombre(e.target.value)} placeholder="Gol" /></label><button>Agregar</button></form>{mensaje && <p className="hint">{mensaje}</p>}</section>
}
