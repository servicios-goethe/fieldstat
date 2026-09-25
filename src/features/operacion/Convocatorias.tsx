import { useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'

type Partido = { id: string; plantel_id: string; inicio: string; local: { nombre: string } | null; visitante: { nombre: string } | null }
type Inscripcion = { id: string; camiseta: number | null; jugadores: { nombre: string; apellido: string } | null }
type Convocatoria = { id: string; inscripcion_id: string; convocado: boolean; respuesta: string }

export function Convocatorias() {
  const [partidos, setPartidos] = useState<Partido[]>([]), [inscripciones, setInscripciones] = useState<Inscripcion[]>([]), [convocatorias, setConvocatorias] = useState<Record<string, Convocatoria>>({}), [partido, setPartido] = useState(''), [mensaje, setMensaje] = useState<string | null>(null)
  const cargarPartidos = async () => { const { data } = await supabase.from('partidos').select('id,plantel_id,inicio,local:equipos!partidos_local_id_fkey(nombre),visitante:equipos!partidos_visitante_id_fkey(nombre)').eq('estado', 'pendiente').order('inicio'); setPartidos((data ?? []) as Partido[]) }
  useEffect(() => { void cargarPartidos() }, [])
  const cargarConvocatoria = async (id: string) => {
    const p = partidos.find(x => x.id === id); if (!p) return
    const [i, c] = await Promise.all([supabase.from('inscripciones').select('id,camiseta,jugadores(nombre,apellido)').eq('plantel_id', p.plantel_id).eq('activa', true).order('id'), supabase.from('convocatorias').select('id,inscripcion_id,convocado,respuesta').eq('partido_id', id)])
    if (i.error || c.error) { setMensaje('No se pudo cargar la convocatoria.'); return }
    setInscripciones((i.data ?? []) as Inscripcion[]); setConvocatorias(Object.fromEntries(((c.data ?? []) as Convocatoria[]).map(x => [x.inscripcion_id, x])))
  }
  const cambiar = async (inscripcion: Inscripcion, convocado: boolean) => {
    const actual = convocatorias[inscripcion.id]; const { data, error } = await supabase.rpc('guardar_convocatoria', { p_id: actual?.id ?? null as unknown as string, p_partido_id: partido, p_inscripcion_id: inscripcion.id, p_convocado: convocado })
    if (error) { setMensaje(error.message.includes('No autorizado') ? 'No tenés permiso para gestionar esta convocatoria.' : 'No se pudo guardar la convocatoria.'); return }
    setConvocatorias(prev => ({ ...prev, [inscripcion.id]: { id: actual?.id ?? data, inscripcion_id: inscripcion.id, convocado, respuesta: actual?.respuesta ?? 'pendiente' } })); setMensaje('Convocatoria actualizada.')
  }
  return <section className="panel"><h2>Convocatorias</h2><p className="hint">Seleccioná un partido pendiente y marcá los jugadores que participan.</p><label>Partido<select value={partido} onChange={e => { setPartido(e.target.value); void cargarConvocatoria(e.target.value) }}><option value="">Seleccionar</option>{partidos.map(p => <option key={p.id} value={p.id}>{new Date(p.inicio).toLocaleString()} · {p.local?.nombre} vs. {p.visitante?.nombre}</option>)}</select></label>{partido && <ul className="catalogo">{inscripciones.map(i => { const c = convocatorias[i.id]; return <li key={i.id}><span>{i.jugadores?.apellido}, {i.jugadores?.nombre} · camiseta {i.camiseta ?? '—'} {c?.respuesta && c.respuesta !== 'pendiente' ? `· respuesta: ${c.respuesta}` : ''}</span><button className={c?.convocado ? 'secondary small' : 'small'} onClick={() => void cambiar(i, !c?.convocado)}>{c?.convocado ? 'Retirar' : 'Convocar'}</button></li>})}{inscripciones.length === 0 && <li className="hint">El plantel no tiene inscripciones activas.</li>}</ul>}{mensaje && <p className="hint">{mensaje}</p>}</section>
}
