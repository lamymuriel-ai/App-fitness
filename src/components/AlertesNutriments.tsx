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
    <div className="card blue">
      <h3>🔎 À surveiller {periode}</h3>
      <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
        {notables.map((n) => (
          <span key={n.cle} className={`pill ${n.statut === 'faible' ? 'warning' : 'danger'}`}>
            {n.emoji} {n.label} {n.statut === 'faible' ? 'faible' : 'élevé'} ({n.pourcentage}%)
          </span>
        ))}
      </div>
      <p className="small muted mt-8 mb-0">
        Repère informatif basé sur des apports de référence générales — pas un diagnostic. En cas de
        doute, parles-en à un professionnel de santé.
      </p>
    </div>
  )
}
