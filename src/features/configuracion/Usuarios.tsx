import { useEffect, useState } from 'react'
import { supabase } from '../../data/supabase'

type Usuario = { usuario_id: string; email: string; nombre: string; habilitado: boolean }
type Rol = { id: string; codigo: string; nombre: string }

export function Usuarios() {
  const [usuarios,setUsuarios]=useState<Usuario[]>([]),[roles,setRoles]=useState<Rol[]>([]),[rol,setRol]=useState(''),[error,setError]=useState<string|null>(null)
  const cargar=async()=>{const [u,r]=await Promise.all([supabase.rpc('listar_usuarios_google'),supabase.from('roles').select('id,codigo,nombre').eq('activo',true).order('nombre')]);if(u.error||r.error)setError('No se pudieron cargar los usuarios.');else{setUsuarios((u.data??[]) as Usuario[]);setRoles((r.data??[]) as Rol[]);if(!rol&&r.data?.[0])setRol(r.data[0].id)}}
  useEffect(()=>{void cargar()},[])
  const habilitar=async(usuario:Usuario)=>{const {error:e}=await supabase.rpc('habilitar_usuario',{p_usuario:usuario.usuario_id,p_nombre:usuario.nombre||usuario.email,p_activo:true});if(e)setError('No se pudo habilitar el usuario.');else await cargar()}
  const asignar=async(usuario:Usuario)=>{if(!rol)return;const {error:e}=await supabase.rpc('asignar_rol',{p_usuario:usuario.usuario_id,p_rol:rol,p_deporte:null as unknown as string,p_plantel:null as unknown as string});if(e)setError('No se pudo asignar el rol.');else setError(null)}
  return <section className="panel"><h2>Usuarios y roles</h2><p className="hint">Sólo el administrador principal puede habilitar identidades Google y asignar perfiles.</p><label>Rol a asignar<select value={rol} onChange={e=>setRol(e.target.value)}>{roles.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}</select></label><ul className="catalogo">{usuarios.map(u=><li key={u.usuario_id}><span>{u.email} {u.habilitado?'(habilitado)':'(pendiente)'}</span><span>{!u.habilitado&&<button className="small" onClick={()=>void habilitar(u)}>Habilitar</button>} {u.habilitado&&<button className="small" onClick={()=>void asignar(u)}>Asignar rol</button>}</span></li>)}</ul>{error&&<p className="error">{error}</p>}</section>
}
