/** Mensaje para listas sin resultados. Siempre explica que hacer, no solo que no hay nada. */

export function EstadoVacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="vacio">
      <p style={{ fontWeight: 600, color: 'var(--color-texto-suave)' }}>{titulo}</p>
      {detalle && <p style={{ marginTop: 'var(--e1)' }}>{detalle}</p>}
    </div>
  )
}
