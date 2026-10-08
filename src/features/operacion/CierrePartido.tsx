import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../data/supabase'

type Paso = 0 | 1 | 2 | 3
type Partido = { id: string; inicio: string; estado: string; local_id: string; visitante_id: string; local: { nombre: string } | null; visitante: { nombre: string } | null; resultados: { goles_local: number; goles_visitante: number } | null }
type Participacion = { titular: boolean; capitan: boolean; presente: boolean | null; jugo: boolean | null; camiseta: number | null }
type Convocatoria = { id: string; respuesta: string; inscripciones: { camiseta: number | null; jugadores: { nombre: string; apellido: string } | null } | null; participaciones: Participacion | null }
type TipoEvento = { id: string; codigo: string; nombre: string }
type Gol = { id: number; jugador: string; asistidor: string; equipo: string; minuto: string }

const pasos = ['Presencia', 'Participación', 'Goles', 'Confirmar']

export function CierrePartido() {
  const [partidos, setPartidos] = useState<Partido[]>([]), [partido, setPartido] = useState(''), [items, setItems] = useState<Convocatoria[]>([]), [tipos, setTipos] = useState<TipoEvento[]>([]), [paso, setPaso] = useState<Paso>(0), [goles, setGoles] = useState<Gol[]>([]), [rival, setRival] = useState(''), [mensaje, setMensaje] = useState<string | null>(null), [tipoMensaje, setTipoMensaje] = useState<'hint' | 'error' | 'success'>('hint'), [guardando, setGuardando] = useState(false), [golesGuardados, setGolesGuardados] = useState<number[]>([])

  const cargar = async () => { const { data } = await supabase.from('partidos').select('id,inicio,estado,local_id,visitante_id,local:equipos!partidos_local_id_fkey(nombre),visitante:equipos!partidos_visitante_id_fkey(nombre),resultados(goles_local,goles_visitante)').order('inicio', { ascending: false }); setPartidos((data ?? []) as Partido[]) }
  useEffect(() => { void cargar() }, [])

  const seleccionar = async (id: string) => {
    setPartido(id); setPaso(0); setGoles([]); setGolesGuardados([]); setMensaje(null)
    if (!id) { setItems([]); return }
    const seleccionado = partidos.find(p => p.id === id)
    setRival(seleccionado?.resultados?.goles_visitante?.toString() ?? '')
    const [c, p] = await Promise.all([
      supabase.from('convocatorias').select('id,respuesta,inscripciones(camiseta,jugadores(nombre,apellido)),participaciones(titular,capitan,presente,jugo,camiseta)').eq('partido_id', id).eq('convocado', true),
      seleccionado ? supabase.from('tipos_estadistica').select('id,codigo,nombre').eq('deporte_id', (await supabase.from('partidos').select('deporte_id').eq('id', id).single()).data?.deporte_id ?? '').order('nombre') : Promise.resolve({ data: [], error: null }),
    ])
    if (c.error) { setTipoMensaje('error'); setMensaje('No se pudo cargar la participación.') } else setItems(((c.data ?? []) as Convocatoria[]).map(item => ({ ...item, participaciones: item.participaciones ?? { titular: false, capitan: false, presente: item.respuesta === 'acepta' ? true : null, jugo: false, camiseta: item.inscripciones?.camiseta ?? null } })))
    setTipos((p.data ?? []) as TipoEvento[])
  }

  const seleccionado = partidos.find(p => p.id === partido)
  const bloqueado = seleccionado?.estado !== 'pendiente'
  const presentes = items.filter(i => i.participaciones?.presente).length
  const jugadores = items.filter(i => i.participaciones?.presente && i.participaciones?.jugo)
  const sinRegistrar = items.filter(i => i.participaciones?.presente === null || i.participaciones?.presente === undefined).length
  const tipoGol = tipos.find(t => t.codigo === 'gol') ?? tipos[0]
  const resultadoLocal = goles.filter(g => g.equipo === seleccionado?.local_id).length
  const resultado = seleccionado?.resultados

  const cambiarParticipacion = (item: Convocatoria, cambios: Partial<Participacion>) => setItems(actual => actual.map(x => x.id === item.id ? { ...x, participaciones: { titular: false, capitan: false, presente: null, jugo: false, camiseta: x.inscripciones?.camiseta ?? null, ...x.participaciones, ...cambios } } : x))
  const guardarParticipacion = async () => {
    const resultados = await Promise.all(items.map(item => { const p = item.participaciones ?? { titular: false, capitan: false, presente: false, jugo: false, camiseta: item.inscripciones?.camiseta ?? null }; return supabase.rpc('guardar_participacion', { p_convocatoria_id: item.id, p_titular: p.titular, p_capitan: p.capitan, p_presente: p.presente === true, p_jugo: p.presente === true && p.jugo === true, p_camiseta: p.camiseta as unknown as number }) }))
    return resultados.find(x => x.error)?.error ?? null
  }

  const avanzar = async () => {
    if (paso === 0 && sinRegistrar > 0) { setTipoMensaje('error'); setMensaje(`Faltan ${sinRegistrar} jugadores por marcar.`); return }
    setGuardando(true); setMensaje(null)
    const error = paso <= 1 ? await guardarParticipacion() : null
    setGuardando(false)
    if (error) { setTipoMensaje('error'); setMensaje(error.message.includes('No autorizado') ? 'No tenés permiso para gestionar este partido.' : 'No se pudo guardar la participación.'); return }
    setPaso(Math.min(3, paso + 1) as Paso)
  }

  const cerrar = async () => {
    if (!partido || !seleccionado || !tipoGol) { setTipoMensaje('error'); setMensaje('Configurá un tipo de evento para registrar los goles.'); return }
    setGuardando(true); setMensaje(null)
    const participacionError = await guardarParticipacion()
    if (participacionError) { setGuardando(false); setTipoMensaje('error'); setMensaje('No se pudo guardar la participación.'); return }
    for (const gol of goles.filter(g => !golesGuardados.includes(g.id))) {
      const { error } = await supabase.rpc('guardar_evento_partido', { p_partido_id: partido, p_codigo: tipoGol.codigo, p_nombre: tipoGol.nombre, p_convocatoria_id: gol.jugador || null as unknown as string, p_asistidor_convocatoria_id: gol.asistidor || null as unknown as string, p_equipo_id: gol.equipo, p_periodo: 1, p_minuto: gol.minuto ? Number(gol.minuto) : null as unknown as number, p_motivo: null as unknown as string })
      if (error) { setGuardando(false); setTipoMensaje('error'); setMensaje('No se pudieron guardar todos los goles. Podés reintentar sin duplicar los ya confirmados.'); return }
      setGolesGuardados(actual => [...actual, gol.id])
    }
    const { error } = await supabase.rpc('guardar_resultado', { p_partido_id: partido, p_goles_local: resultadoLocal, p_goles_visitante: Number(rival) || 0 })
    setGuardando(false)
    if (error) { setTipoMensaje('error'); setMensaje(error.message.includes('No autorizado') ? 'No tenés permiso para cerrar este partido.' : 'No se pudo cerrar el partido.'); return }
    setTipoMensaje('success'); setMensaje('Partido cerrado y resultado guardado.'); await cargar(); await seleccionar(partido)
  }

  const agregarGol = () => setGoles(actual => [...actual, { id: Date.now(), jugador: jugadores[0]?.id ?? '', asistidor: '', equipo: seleccionado?.local_id ?? '', minuto: '' }])
  const actualizarGol = (id: number, cambios: Partial<Gol>) => setGoles(actual => actual.map(g => g.id === id ? { ...g, ...cambios } : g))
  const listaJugadores = useMemo(() => items.filter(i => i.participaciones?.presente).map(i => ({ id: i.id, nombre: `${i.inscripciones?.jugadores?.apellido ?? ''}, ${i.inscripciones?.jugadores?.nombre ?? ''}` })), [items])
  return <section className="panel match-stepper-panel"><div className="match-stepper-heading"><div><p className="eyebrow">Partido</p><h2>{seleccionado ? `${seleccionado.local?.nombre ?? 'Local'} vs. ${seleccionado.visitante?.nombre ?? rival}` : 'Cierre de partido'}</h2>{seleccionado && <p className="hint">{new Date(seleccionado.inicio).toLocaleString()}</p>}</div><label>Partido<select value={partido} onChange={e => void seleccionar(e.target.value)}><option value="">Seleccionar</option>{partidos.map(p => <option key={p.id} value={p.id}>{new Date(p.inicio).toLocaleString()} · {p.local?.nombre} vs. {p.visitante?.nombre} · {p.estado}</option>)}</select></label></div>{partido && <><div className="stepper" role="tablist" aria-label="Pasos del cierre">{pasos.map((nombre, index) => <button type="button" role="tab" aria-selected={paso === index} className={paso === index ? 'active' : paso > index ? 'complete' : ''} onClick={() => !bloqueado && setPaso(index as Paso)} key={nombre}><span />{nombre}</button>)}</div>{paso === 0 && <div className="step-content"><p>¿Quién vino? Marcá presencia y ausencia antes de continuar.</p><div className="match-players">{items.map(item => { const p = item.participaciones ?? { titular: false, capitan: false, presente: item.respuesta === 'acepta' ? true : null, jugo: false, camiseta: item.inscripciones?.camiseta ?? null }; return <div className="match-player-row" key={item.id}><span>{p.camiseta ?? '—'}</span><strong>{item.inscripciones?.jugadores?.apellido}, {item.inscripciones?.jugadores?.nombre}</strong><div className="match-player-actions"><button type="button" disabled={bloqueado} className={`toggle ${p.presente === true ? 'is-positive' : ''}`} aria-pressed={p.presente === true} onClick={() => cambiarParticipacion(item, { presente: p.presente === true ? null : true })}>P</button><button type="button" disabled={bloqueado} className={`toggle ${p.presente === false ? 'is-negative' : ''}`} aria-pressed={p.presente === false} onClick={() => cambiarParticipacion(item, { presente: p.presente === false ? null : false, jugo: false })}>A</button></div></div>})}</div></div>}{paso === 1 && <div className="step-content"><p>¿Quién jugó? Sólo se muestran los presentes.</p><div className="match-players">{items.filter(i => i.participaciones?.presente).map(item => { const p = item.participaciones!; return <div className="match-player-row" key={item.id}><strong>{item.inscripciones?.jugadores?.apellido}, {item.inscripciones?.jugadores?.nombre}</strong><button type="button" disabled={bloqueado} className={`toggle ${p.jugo ? 'is-positive' : ''}`} aria-pressed={!!p.jugo} onClick={() => cambiarParticipacion(item, { jugo: !p.jugo })}>{p.jugo ? 'Jugó' : 'No jugó'}</button></div>})}</div></div>}{paso === 2 && <div className="step-content"><div className="score-preview"><div><span>{seleccionado?.local?.nombre}</span><strong>{resultadoLocal}</strong></div><b>–</b><div><span>{seleccionado?.visitante?.nombre}</span><input aria-label="Goles visitante" type="number" min="0" value={rival} onChange={e => setRival(e.target.value)} /></div></div>{goles.map(gol => <div className="goal-row" key={gol.id}><select value={gol.jugador} onChange={e => actualizarGol(gol.id, { jugador: e.target.value })}><option value="">Goleador</option>{listaJugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}</select><select value={gol.asistidor} onChange={e => actualizarGol(gol.id, { asistidor: e.target.value })}><option value="">Sin asistidor</option>{listaJugadores.filter(j => j.id !== gol.jugador).map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}</select><input type="number" min="0" placeholder="Minuto" value={gol.minuto} onChange={e => actualizarGol(gol.id, { minuto: e.target.value })} /><select value={gol.equipo} onChange={e => actualizarGol(gol.id, { equipo: e.target.value })}><option value={seleccionado?.local_id}>{seleccionado?.local?.nombre}</option><option value={seleccionado?.visitante_id}>{seleccionado?.visitante?.nombre}</option></select></div>)}<button type="button" className="secondary" onClick={agregarGol}>+ Agregar gol</button></div>}{paso === 3 && <div className="step-content"><h3>Revisá antes de cerrar</h3><dl className="match-summary"><div><dt>Resultado</dt><dd>{resultadoLocal} – {Number(rival) || 0}</dd></div><div><dt>Presentes</dt><dd>{presentes} / {items.length}</dd></div><div><dt>Jugaron</dt><dd>{jugadores.length}</dd></div><div><dt>Goles registrados</dt><dd>{goles.length}</dd></div></dl><p className="hint">Después de cerrar, cualquier corrección pide motivo y queda auditada.</p></div>}{!bloqueado && <div className="stepper-footer"><button type="button" className="secondary" disabled={guardando || paso === 0} onClick={() => setPaso(Math.max(0, paso - 1) as Paso)}>Atrás</button>{paso < 3 ? <button type="button" disabled={guardando} onClick={() => void avanzar()}>{guardando ? 'Guardando…' : `Siguiente: ${pasos[paso + 1]}`}</button> : <button type="button" disabled={guardando || sinRegistrar > 0} onClick={() => void cerrar()}>{guardando ? 'Cerrando…' : 'Cerrar partido'}</button>}</div>}{bloqueado && resultado && <p className="success">Partido cerrado: {resultado.goles_local} – {resultado.goles_visitante}</p>}</>}{mensaje && <p className={tipoMensaje} role="status">{mensaje}</p>}</section>
}
