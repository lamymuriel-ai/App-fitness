import type { Micronutriments } from '../types'
import { analyserMicronutriments } from '../utils/nutrition'

export default function AlertesNutriments({
  apportsMoyens,
  reference,
  periode = 'cette semaine',
}: {
  apportsMoyens: Micronutriments
  reference: Micronutriments
  periode?: string
}) {
  const aDesDonnees = Object.values(apportsMoyens).some((v) => v > 0)
  if (!aDesDonnees) return null

  const analyse = analyserMicronutriments(apportsMoyens, reference)
  const notables = analyse.filter((n) => n.statut !== 'ok')

  if (notables.length === 0) return null

  return (
    <div className="card blue" style={{ padding: 14 }}>
      <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>🔎 À surveiller {periode}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, minWidth: 0 }}>
        {notables.map((n) => (
          <span
            key={n.cle}
            className={`pill ${n.statut === 'faible' ? 'warning' : 'danger'}`}
            style={{
              padding: '4px 8px',
              fontSize: '0.72rem',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {n.emoji} {n.labelCourt} {n.statut === 'faible' ? '↓' : '↑'} {n.pourcentage}%
          </span>
        ))}
      </div>
      <p className="small muted mt-8 mb-0">
        Repère informatif, pas un diagnostic — en cas de doute, parles-en à un professionnel de santé.
      </p>
    </div>
  )
}
