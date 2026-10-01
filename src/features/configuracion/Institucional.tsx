import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'

type Registro = { id: string; nombre: string; desde?: string; hasta?: string; direccion?: string | null; es_propio?: boolean }
function draft<T>(key: string, fallback: T): T { try { return JSON.parse(sessionStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback } }

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
  const initial = draft('fieldstats-draft-temporada', { id: null as string | null, nombre: '', desde: '', hasta: '' }); const [id, setId] = useState<string | null>(initial.id); const [nombre, setNombre] = useState(initial.nombre); const [desde, setDesde] = useState(initial.desde); const [hasta, setHasta] = useState(initial.hasta)
  useEffect(() => { sessionStorage.setItem('fieldstats-draft-temporada', JSON.stringify({ id, nombre, desde, hasta })) }, [id, nombre, desde, hasta])
  const guardar = async (event: FormEvent) => { event.preventDefault(); const { error: fallo } = await supabase.rpc('guardar_temporada', { p_id: id as unknown as string, p_nombre: nombre, p_desde: desde, p_hasta: hasta, p_activa: true }); if (fallo) setError('No se pudo guardar la temporada.'); else { setId(null); setNombre(''); setDesde(''); setHasta(''); sessionStorage.removeItem('fieldstats-draft-temporada'); await cargar() } }
  return <section className="panel"><h2>Temporadas</h2><ul className="catalogo">{items.map(i => <li key={i.id}><span>{i.nombre}: {i.desde} a {i.hasta}</span><button className="secondary small" onClick={() => { setId(i.id); setNombre(i.nombre); setDesde(i.desde ?? ''); setHasta(i.hasta ?? '') }}>Editar</button></li>)}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Nombre<input required value={nombre} onChange={e => setNombre(e.target.value)} /></label><label>Desde<input required type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label><label>Hasta<input required type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label><button>{id ? 'Guardar cambios' : 'Agregar'}</button></form>{error && <p className="error">{error}</p>}</section>
}

export function Sedes() {
  const { items, error, setError, cargar } = useCatalogo('sedes'); const initial = draft('fieldstats-draft-sede', { id: null as string | null, nombre: '', direccion: '' }); const [id, setId] = useState<string | null>(initial.id); const [nombre, setNombre] = useState(initial.nombre); const [direccion, setDireccion] = useState(initial.direccion)
  useEffect(() => { sessionStorage.setItem('fieldstats-draft-sede', JSON.stringify({ id, nombre, direccion })) }, [id, nombre, direccion])
  const guardar = async (event: FormEvent) => { event.preventDefault(); const { error: fallo } = await supabase.rpc('guardar_sede', { p_id: id as unknown as string, p_nombre: nombre, p_direccion: direccion, p_activa: true }); if (fallo) setError('No se pudo guardar la sede.'); else { setId(null); setNombre(''); setDireccion(''); sessionStorage.removeItem('fieldstats-draft-sede'); await cargar() } }
  return <section className="panel"><h2>Sedes</h2><ul className="catalogo">{items.map(i => <li key={i.id}><span>{i.nombre}{i.direccion && ` — ${i.direccion}`}</span><button className="secondary small" onClick={() => { setId(i.id); setNombre(i.nombre); setDireccion(i.direccion ?? '') }}>Editar</button></li>)}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Nombre<input required value={nombre} onChange={e => setNombre(e.target.value)} /></label><label>Dirección<input value={direccion} onChange={e => setDireccion(e.target.value)} /></label><button>{id ? 'Guardar cambios' : 'Agregar'}</button></form>{error && <p className="error">{error}</p>}</section>
}

export function Equipos() {
  const { items, error, setError, cargar } = useCatalogo('equipos'); const initial = draft('fieldstats-draft-equipo', { id: null as string | null, nombre: '', esPropio: true }); const [id, setId] = useState<string | null>(initial.id); const [nombre, setNombre] = useState(initial.nombre); const [esPropio, setEsPropio] = useState(initial.esPropio)
  useEffect(() => { sessionStorage.setItem('fieldstats-draft-equipo', JSON.stringify({ id, nombre, esPropio })) }, [id, nombre, esPropio])
  const guardar = async (event: FormEvent) => { event.preventDefault(); const { error: fallo } = await supabase.rpc('guardar_equipo', { p_id: id as unknown as string, p_nombre: nombre, p_es_propio: esPropio, p_activo: true }); if (fallo) setError('No se pudo guardar el equipo.'); else { setId(null); setNombre(''); setEsPropio(true); sessionStorage.removeItem('fieldstats-draft-equipo'); await cargar() } }
  return <section className="panel"><h2>Equipos</h2><ul className="catalogo">{items.map(i => <li key={i.id}><span>{i.nombre} {i.es_propio ? '(propio)' : '(rival)'}</span><button className="secondary small" onClick={() => { setId(i.id); setNombre(i.nombre); setEsPropio(i.es_propio ?? true) }}>Editar</button></li>)}</ul><form className="inline-form" onSubmit={e => void guardar(e)}><label>Nombre<input required value={nombre} onChange={e => setNombre(e.target.value)} /></label><label>Tipo<select value={esPropio ? 'propio' : 'rival'} onChange={e => setEsPropio(e.target.value === 'propio')}><option value="propio">Propio</option><option value="rival">Rival</option></select></label><button>{id ? 'Guardar cambios' : 'Agregar'}</button></form>{error && <p className="error">{error}</p>}</section>
}
