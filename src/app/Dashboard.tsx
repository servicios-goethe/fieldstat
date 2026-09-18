import { Categorias } from '../features/configuracion/Categorias'
import { Deportes } from '../features/configuracion/Deportes'
import { useState } from 'react'

export function Dashboard({ email, isPrincipal, onSignOut }: { email: string; isPrincipal: boolean; onSignOut: () => void }) {
  const [section, setSection] = useState<'inicio' | 'configuracion'>('inicio')
  return <main className="dashboard"><header><div><p className="eyebrow">Goethe Schule</p><h1>FieldStats</h1><p className="subtitle">{email}</p></div><button className="secondary" onClick={onSignOut}>Cerrar sesión</button></header><nav className="menu" aria-label="Navegación principal"><button className={section === 'inicio' ? 'selected' : 'secondary'} onClick={() => setSection('inicio')}>Inicio</button>{isPrincipal && <button className={section === 'configuracion' ? 'selected' : 'secondary'} onClick={() => setSection('configuracion')}>Configuración</button>}</nav>{section === 'inicio' && <section className="panel"><h2>Inicio</h2><p>Los módulos operativos de planteles, jugadores y asistencia se incorporarán aquí.</p></section>}{section === 'configuracion' && isPrincipal && <div className="panels"><Categorias /><Deportes /></div>}</main>
}
