import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'

type Deporte = { id: string; codigo: string; nombre: string; activo: boolean }

export function Deportes() {
  const [items, setItems] = useState<Deporte[]>([])
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cargar = async () => { const { data, error } = await supabase.from('deportes').select('id,codigo,nombre,activo').order('nombre'); if (error) setError('No se pudieron cargar los deportes.'); else setItems(data) }
  useEffect(() => { void cargar() }, [])
  const guardar = async (event: FormEvent) => { event.preventDefault(); const { error } = await supabase.rpc('guardar_deporte', { p_id: null as unknown as string, p_codigo: codigo, p_nombre: nombre, p_activo: true }); if (error) setError('No se pudo guardar el deporte.'); else { setNombre(''); setCodigo(''); await cargar() } }
  return <section className="panel"><h2>Deportes</h2><ul className="catalogo">{items.map((item) => <li key={item.id}><span>{item.nombre} <small>({item.codigo})</small></span><span>{item.activo ? 'Activo' : 'Inactivo'}</span></li>)}</ul><form className="inline-form" onSubmit={(event) => void guardar(event)}><label>Código<input value={codigo} required maxLength={30} onChange={(event) => setCodigo(event.target.value)} /></label><label>Deporte<input value={nombre} required maxLength={80} onChange={(event) => setNombre(event.target.value)} /></label><button>Agregar</button></form>{error && <p className="error">{error}</p>}</section>
}
