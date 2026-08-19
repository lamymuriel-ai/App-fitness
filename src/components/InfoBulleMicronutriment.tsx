import type { AnalyseNutriment } from '../utils/nutrition'
import { FeuilleModale } from './ui'

const LABEL_STATUT: Record<AnalyseNutriment['statut'], string> = {
  faible: 'Un peu faible',
  eleve: 'Au-dessus du repère',
  ok: 'Dans les repères',
}

/** Feuille modale affichée au clic sur une pastille/tuile de micronutriment, avec les aliments courants où le trouver. */
export default function InfoBulleMicronutriment({
  nutriment,
  onFermer,
}: {
  nutriment: AnalyseNutriment | null
  onFermer: () => void
}) {
  return (
    <FeuilleModale ouverte={nutriment !== null} onFermer={onFermer}>
      {nutriment && (
        <div>
          <h3 style={{ marginTop: 0 }}>
            {nutriment.emoji} {nutriment.label}
          </h3>
          <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
            {Math.round(nutriment.apport * 10) / 10}{nutriment.unite} / {nutriment.reference}{nutriment.unite} ·{' '}
            {LABEL_STATUT[nutriment.statut]}
          </p>
          <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>Où en trouver</p>
          <p className="small muted mb-0">{nutriment.sources}</p>
        </div>
      )}
    </FeuilleModale>
  )
}
