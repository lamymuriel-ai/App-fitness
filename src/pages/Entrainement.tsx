import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { SEANCES_TEMPLATES, PLANNING_SEMAINE } from '../data/defaults'
import { dateDuJourISO } from '../utils/date'

export default function Entrainement() {
  const navigate = useNavigate()
  const { seancesLog } = useAppData()
  const aujourdHui = dateDuJourISO()
  const idSeanceDuJour = PLANNING_SEMAINE[new Date().getDay()]

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Entraînement</div>
        <h1>Tes séances</h1>
        <p className="muted">3 séances par semaine, exercice par exercice (pas en circuit).</p>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {SEANCES_TEMPLATES.map((seance) => {
          const logDuJour = seancesLog.find(
            (s) => s.seanceTemplateId === seance.id && s.date === aujourdHui
          )
          const estAujourdHui = seance.id === idSeanceDuJour
          return (
            <div className={`card ${seance.lieu === 'salle' ? 'blue' : 'yellow'}`} key={seance.id}>
              <div className="card-title">
                <h3>{seance.nom}</h3>
                {estAujourdHui && <span className="pill pink">Aujourd'hui</span>}
              </div>
              <p className="muted small">
                {seance.moment} · {seance.exercices.length} exercices · 3 séries par exercice
              </p>
              {logDuJour?.termineeA && <span className="pill green">Terminée aujourd'hui ✓</span>}
              <button
                className="btn btn-primary mt-8"
                onClick={() => navigate(`/entrainement/seance/${seance.id}`)}
              >
                {logDuJour?.termineeA ? 'Revoir / continuer' : 'Commencer'}
              </button>
            </div>
          )
        })}

        <button className="link-btn" onClick={() => navigate('/entrainement/historique')}>
          🕘 Voir l'historique des séances →
        </button>
      </div>
    </div>
  )
}
