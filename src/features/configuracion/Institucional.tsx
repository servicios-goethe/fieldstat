import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'

type Registro = { id: string; nombre: string; desde?: string; hasta?: string; direccion?: string | null; es_propio?: boolean }

function useCatalogo(tabla: 'temporadas' | 'sedes' | 'equipos') {
  const [items, setItems] = useState<Registro[]>([])
  const [error, setError] = useState<string | null>(null)
  const cargar = async () => {
    const { data, error: lectura } = await supabase.from(tabla).select('*').order('nombre')
    if (lectura) setError('No se pudieron cargar los datos.')
    else setItems((data ?? []) as Registro[])
  }
  useEffect(() => { void cargar() }, [])
  return { items, error, setError, cargar }
}

export function Temporadas() {
  const { items, error, setError, cargar } = useCatalogo('temporadas')
  const [nombre, setNombre] = useState(''); const [desde, setDesde] = useState(''); const [hasta, setHasta] = useState('')
  const guardar = async (event: FormEvent) => { event.preventDefault(); const { error: fallo } = await supabase.rpc('guardar_temporada', { p_id: null as unknown as string, p_nombre: nombre, p_desde: desde, p_hasta: hasta, p_activa: true }); if (fallo) setError('No se pudo guardar la temporada.'); else { setNombre(''); setDesde(''); setHasta(''); await cargar() } }
  return <section className="panel"><h2>Temporadas</h2><ul className="catalogo">{items.map(i => <li key={i.id}>{i.nombre}: {i.desde} a {i.hasta}</li>)}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Nombre<input required value={nombre} onChange={e => setNombre(e.target.value)} /></label><label>Desde<input required type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label><label>Hasta<input required type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label><button>Agregar</button></form>{error && <p className="error">{error}</p>}</section>
}

export function Sedes() {
  const { items, error, setError, cargar } = useCatalogo('sedes'); const [nombre, setNombre] = useState(''); const [direccion, setDireccion] = useState('')
  const guardar = async (event: FormEvent) => { event.preventDefault(); const { error: fallo } = await supabase.rpc('guardar_sede', { p_id: null as unknown as string, p_nombre: nombre, p_direccion: direccion, p_activa: true }); if (fallo) setError('No se pudo guardar la sede.'); else { setNombre(''); setDireccion(''); await cargar() } }
  return <section className="panel"><h2>Sedes</h2><ul className="catalogo">{items.map(i => <li key={i.id}>{i.nombre}{i.direccion && ` — ${i.direccion}`}</li>)}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Nombre<input required value={nombre} onChange={e => setNombre(e.target.value)} /></label><label>Dirección<input value={direccion} onChange={e => setDireccion(e.target.value)} /></label><button>Agregar</button></form>{error && <p className="error">{error}</p>}</section>
}

export function Equipos() {
  const { items, error, setError, cargar } = useCatalogo('equipos'); const [nombre, setNombre] = useState('')
  const guardar = async (event: FormEvent) => { event.preventDefault(); const { error: fallo } = await supabase.rpc('guardar_equipo', { p_id: null as unknown as string, p_nombre: nombre, p_es_propio: true, p_activo: true }); if (fallo) setError('No se pudo guardar el equipo.'); else { setNombre(''); await cargar() } }
  return <section className="panel"><h2>Equipos</h2><ul className="catalogo">{items.map(i => <li key={i.id}>{i.nombre} {i.es_propio ? '(propio)' : '(rival)'}</li>)}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Nombre<input required value={nombre} onChange={e => setNombre(e.target.value)} /></label><button>Agregar</button></form>{error && <p className="error">{error}</p>}</section>
}
