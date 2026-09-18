import { FormEvent, useEffect, useState } from 'react'
import type { Database } from '../../data/database.types'
import { supabase } from '../../data/supabase'

type Categoria = Database['public']['Tables']['categorias']['Row']

export function Categorias() {
  const [items, setItems] = useState<Categoria[]>([])
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    const { data, error: lecturaError } = await supabase
      .from('categorias')
      .select('*')
      .order('orden')
    if (lecturaError) setError('No se pudieron cargar las categorías.')
    else setItems(data)
  }

  useEffect(() => { void cargar() }, [])

  const crear = async (event: FormEvent) => {
    event.preventDefault()
    if (!nombre.trim()) return
    setGuardando(true)
    setError(null)
    const { error: guardadoError } = await supabase.rpc('guardar_categoria', {
      // El generador de tipos no representa argumentos PostgreSQL anulables.
      p_id: null as unknown as string,
      p_nombre: nombre,
      p_orden: items.length + 1,
      p_activo: true,
    })
    setGuardando(false)
    if (guardadoError) setError('No se pudo guardar la categoría. Revisá que no esté repetida.')
    else {
      setNombre('')
      await cargar()
    }
  }

  const alternar = async (categoria: Categoria) => {
    setError(null)
    const { error: guardadoError } = await supabase.rpc('guardar_categoria', {
      p_id: categoria.id,
      p_nombre: categoria.nombre,
      p_orden: categoria.orden,
      p_activo: !categoria.activo,
    })
    if (guardadoError) setError('No se pudo actualizar la categoría.')
    else await cargar()
  }

  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Categorías</h2><p>Las categorías se administran por temporada; no hay una regla de edad fija en el código.</p></div></div>
      <ul className="catalogo">
        {items.map((categoria) => <li key={categoria.id}>
          <span>{categoria.orden}. {categoria.nombre}</span>
          <button className="secondary small" onClick={() => void alternar(categoria)}>{categoria.activo ? 'Desactivar' : 'Activar'}</button>
        </li>)}
      </ul>
      <form className="inline-form" onSubmit={(event) => void crear(event)}>
        <label>Nueva categoría<input value={nombre} maxLength={80} onChange={(event) => setNombre(event.target.value)} /></label>
        <button disabled={guardando}>{guardando ? 'Guardando…' : 'Agregar'}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  )
}
