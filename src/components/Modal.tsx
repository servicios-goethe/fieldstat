type Props = { open: boolean; title: string; message: string; tone?: 'success' | 'error' | 'confirm'; onClose: () => void; onConfirm?: () => void }

export function Modal({ open, title, message, tone = 'success', onClose, onConfirm }: Props) {
  if (!open) return null
  return <div className="modal-backdrop" role="presentation"><section className={`modal ${tone}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">{title}</h2><p>{message}</p><div className="modal-actions">{onConfirm && <button onClick={onConfirm}>Confirmar</button>}<button className="secondary" onClick={onClose}>{onConfirm ? 'Cancelar' : 'Cerrar'}</button></div></section></div>
}
