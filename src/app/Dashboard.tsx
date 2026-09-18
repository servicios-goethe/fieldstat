import { Categorias } from '../features/configuracion/Categorias'

export function Dashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return <main className="dashboard"><header><div><p className="eyebrow">Goethe Schule</p><h1>FieldStats</h1><p className="subtitle">Administrador: {email}</p></div><button className="secondary" onClick={onSignOut}>Cerrar sesión</button></header><Categorias /></main>
}
