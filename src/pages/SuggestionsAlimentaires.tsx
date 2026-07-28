import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { totauxRepas, calculerMoyenneMicrosSemaine, ajouterSupplements } from '../utils/nutrition'
import { calculerBudgetRestant, genererSuggestions } from '../utils/suggestionsAlimentaires'
import type { MomentRepas } from '../data/alimentsReference'
import { dateDuJourISO } from '../utils/date'

const LABEL_MOMENT: Record<MomentRepas, string> = {
  petit_dejeuner: '🌅 Petit-déj',
  repas: '🍽️ Repas',
  collation: '🍎 Collation',
}

export default function SuggestionsAlimentaires() {
  const navigate = useNavigate()
  const { profil, repas } = useAppData()
  const objectifs = profil.objectifsNutritionnels
  const aujourdHui = dateDuJourISO()
  const [filtreMoment, setFiltreMoment] = useState<MomentRepas | null>(null)

  const repasAujourdhui = useMemo(
    () => repas.filter((r) => r.dateHeure.slice(0, 10) === aujourdHui),
    [repas, aujourdHui]
  )
  const totauxJour = useMemo(() => totauxRepas(repasAujourdhui), [repasAujourdhui])

  const moyenneMicrosSemaine = useMemo(
    () => ajouterSupplements(calculerMoyenneMicrosSemaine(repas, aujourdHui)),
    [repas, aujourdHui]
  )

  const budgetRestant = useMemo(() => calculerBudgetRestant(totauxJour, objectifs), [totauxJour, objectifs])

  const suggestions = useMemo(
    () => genererSuggestions(budgetRestant, moyenneMicrosSemaine, objectifs.micros, 5, filtreMoment || undefined),
    [budgetRestant, moyenneMicrosSemaine, objectifs.micros, filtreMoment]
  )

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>🥗 Compléter ta journée</h1>
      <p className="muted">
        Des idées basées sur ce qu'il te reste aujourd'hui, sans dépasser ton objectif calorique.
      </p>

      <div className="card">
        <h3 className="mb-0">Il te reste aujourd'hui</h3>
        <div className="mt-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatRestante label="Calories" valeur={Math.round(budgetRestant.calories)} unite="kcal" />
          <StatRestante label="Protéines" valeur={Math.round(budgetRestant.proteines_g)} unite="g" />
          <StatRestante label="Lipides" valeur={Math.round(budgetRestant.lipides_g)} unite="g" />
          <StatRestante label="Glucides" valeur={Math.round(budgetRestant.glucides_g)} unite="g" />
        </div>
      </div>

      <div className="segmented">
        <button className={filtreMoment === null ? 'active' : ''} onClick={() => setFiltreMoment(null)}>
          Tous
        </button>
        {(Object.keys(LABEL_MOMENT) as MomentRepas[]).map((moment) => (
          <button
            key={moment}
            className={filtreMoment === moment ? 'active' : ''}
            onClick={() => setFiltreMoment(moment)}
          >
            {LABEL_MOMENT[moment]}
          </button>
        ))}
      </div>

      {budgetRestant.calories < 15 ? (
        <div className="card center">
          <p style={{ fontSize: '2rem', marginBottom: 4 }}>✅</p>
          <p style={{ fontWeight: 800 }}>Objectif calorique atteint (ou dépassé) pour aujourd'hui</p>
          <p className="muted small mb-0">Pas besoin d'ajouter quoi que ce soit de plus.</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card center">
          <p className="muted mb-0">Aucune idée ne rentre dans ce qu'il te reste pour l'instant.</p>
        </div>
      ) : (
        suggestions.map((s) => (
          <div className="card" key={s.aliment.id}>
            <div className="row-between">
              <div className="row gap-12">
                <span style={{ fontSize: '1.8rem' }}>{s.aliment.emoji}</span>
                <div>
                  <div style={{ fontWeight: 800 }}>{s.aliment.nom}</div>
                  <div className="small muted">{s.portion_g} g · {Math.round(s.calories)} kcal</div>
                </div>
              </div>
            </div>
            <div className="row gap-8 mt-8" style={{ flexWrap: 'wrap' }}>
              {s.raisons.map((raison) => (
                <span key={raison} className="pill blue">{raison}</span>
              ))}
            </div>
          </div>
        ))
      )}

      <p className="small muted mt-8">
        Repère informatif basé sur des valeurs nutritionnelles générales — pas une recommandation
        personnalisée.
      </p>
    </div>
  )
}

function StatRestante({ label, valeur, unite }: { label: string; valeur: number; unite: string }) {
  return (
    <div style={{ background: '#f7f3f5', borderRadius: 14, padding: '10px 12px' }}>
      <div className="small muted">{label}</div>
      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
        {valeur} {unite}
      </div>
    </div>
  )
}
