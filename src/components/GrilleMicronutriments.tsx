import type { Micronutriments } from '../types'
import { analyserMicronutriments } from '../utils/nutrition'

const LABEL_COURT: Partial<Record<string, string>> = {
  Magnésium: 'Magnés.',
  'Vitamine A': 'Vit. A',
  'Vitamine C': 'Vit. C',
  'Vitamine D': 'Vit. D',
  'Vitamine E': 'Vit. E',
  'Vitamine B6': 'Vit. B6',
  'Vitamine B12': 'Vit. B12',
}

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, minWidth: 0 }}>
        {analyse.map((n) => (
          <div
            key={n.cle}
            style={{
              background: n.statut === 'faible' ? '#fdecd8' : n.statut === 'eleve' ? '#fbe3e7' : '#f7f3f5',
              borderRadius: 14,
              padding: '8px 10px',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <div className="row-between" style={{ gap: 4, minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {n.emoji} {LABEL_COURT[n.label] ?? n.label}
              </span>
              <span className="muted" style={{ fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                {n.pourcentage}%
              </span>
            </div>
            <div
              className="muted"
              style={{
                fontSize: '0.68rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {Math.round(n.apport * 10) / 10}{n.unite} / {n.reference}{n.unite}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
