import type { Micronutriments } from '../types'
import { analyserMicronutriments } from '../utils/nutrition'

export default function GrilleMicronutriments({
  apports,
  reference,
  titre = 'Micronutriments',
}: {
  apports: Micronutriments
  reference: Micronutriments
  titre?: string
}) {
  const analyse = analyserMicronutriments(apports, reference)

  return (
    <div>
      <h3>{titre}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {analyse.map((n) => (
          <div
            key={n.cle}
            style={{
              background: n.statut === 'faible' ? '#fdecd8' : n.statut === 'eleve' ? '#fbe3e7' : '#f7f3f5',
              borderRadius: 14,
              padding: '10px 12px',
            }}
          >
            <div className="row-between">
              <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                {n.emoji} {n.label}
              </span>
              <span className="small muted">{n.pourcentage}%</span>
            </div>
            <div className="small muted">
              {Math.round(n.apport * 10) / 10}{n.unite} / {n.reference}{n.unite}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
