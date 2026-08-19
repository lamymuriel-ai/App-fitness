import { useState } from 'react'
import type { Micronutriments } from '../types'
import { analyserMicronutriments } from '../utils/nutrition'
import InfoBulleMicronutriment from './InfoBulleMicronutriment'

export default function AlertesNutriments({
  apportsMoyens,
  reference,
  periode = 'cette semaine',
}: {
  apportsMoyens: Micronutriments
  reference: Micronutriments
  periode?: string
}) {
  const [cleOuverte, setCleOuverte] = useState<keyof Micronutriments | null>(null)
  const aDesDonnees = Object.values(apportsMoyens).some((v) => v > 0)

  const analyse = analyserMicronutriments(apportsMoyens, reference)
  const notables = analyse.filter((n) => n.statut !== 'ok')
  const nutrimentOuvert = analyse.find((n) => n.cle === cleOuverte) ?? null

  if (!aDesDonnees || notables.length === 0) return null

  return (
    <div className="card blue" style={{ padding: 14 }}>
      <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>🔎 À surveiller {periode}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, minWidth: 0 }}>
        {notables.map((n) => (
          <button
            key={n.cle}
            onClick={() => setCleOuverte(n.cle)}
            className={`pill ${n.statut === 'faible' ? 'warning' : 'danger'}`}
            style={{
              padding: '4px 8px',
              fontSize: '0.72rem',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              border: 'none',
            }}
          >
            {n.emoji} {n.labelCourt} {n.statut === 'faible' ? '↓' : '↑'} {n.pourcentage}%
          </button>
        ))}
      </div>
      <p className="small muted mt-8 mb-0">
        Repère informatif, pas un diagnostic — en cas de doute, parles-en à un professionnel de santé.
      </p>

      <InfoBulleMicronutriment nutriment={nutrimentOuvert} onFermer={() => setCleOuverte(null)} />
    </div>
  )
}
