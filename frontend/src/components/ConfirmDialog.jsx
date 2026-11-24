import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel }) {
  const ref = useRef(null)

  useEffect(() => {
    ref.current.showModal()
  }, [])

  return (
    <dialog ref={ref} onClose={onCancel}>
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onCancel} disabled={busy}>Keep it</button>{' '}
      <button onClick={onConfirm} disabled={busy}>
        {busy ? 'Working…' : confirmLabel}
      </button>
    </dialog>
  )
}