type EasterEggProps = {
  open: boolean
  onClose: () => void
}

export function EasterEgg({ open, onClose }: EasterEggProps) {
  if (!open) return null

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-6 border-0 bg-background/95 px-6"
      onClick={onClose}
      aria-label="Закрыть"
    >
      <span className="heart-pulse" aria-hidden="true" />
      <span className="text-center text-2xl font-medium">Специально для Алиночки</span>
    </button>
  )
}
