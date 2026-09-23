import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'
type Plantel = { id:string; equipos:{nombre:string}|null; deportes:{nombre:string}|null; categorias:{nombre:string}|null }

export function InscripcionExistente() {
  const [planteles,setPlanteles]=useState<Plantel[]>([])
  useEffect(()=>{void supabase.from('planteles').select('id,equipos(nombre),deportes(nombre),categorias(nombre)').eq('activo',true).then(({data})=>setPlanteles((data??[]) as Plantel[]))},[])
  const [dni,setDni]=useState(''),[plantel,setPlantel]=useState(''),[camiseta,setCamiseta]=useState(''),[mensaje,setMensaje]=useState<string|null>(null)
  const guardar=async(e:FormEvent)=>{e.preventDefault();const{error}=await supabase.rpc('inscribir_jugador_por_dni',{p_dni:dni,p_plantel_id:plantel,p_camiseta:camiseta?Number(camiseta):null as unknown as number,p_desde:null as unknown as string});setMensaje(error?'No se pudo crear la inscripción. Verificá el DNI y que el plantel esté activo.':'Inscripción creada correctamente.');if(!error){setDni('');setPlantel('');setCamiseta('')}}
  return <section className="panel"><h2>Nueva inscripción</h2><p className="hint">Usá el DNI de un jugador existente para inscribirlo en otro plantel.</p><form className="inline-form" onSubmit={e=>void guardar(e)}><label>DNI<input required pattern="[0-9]{7,10}" value={dni} onChange={e=>setDni(e.target.value)}/></label><label>Plantel<select required value={plantel} onChange={e=>setPlantel(e.target.value)}><option value="">Seleccionar</option>{planteles.map(p=><option key={p.id} value={p.id}>{p.equipos?.nombre} · {p.deportes?.nombre} · {p.categorias?.nombre}</option>)}</select></label><label>Camiseta<input type="number" min="0" max="999" value={camiseta} onChange={e=>setCamiseta(e.target.value)}/></label><button>Inscribir</button></form>{mensaje&&<p className="hint">{mensaje}</p>}</section>
}
