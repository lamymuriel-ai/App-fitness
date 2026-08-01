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
          const [titreCourt, description] = seance.nom.split(' — ')
          return (
            <div
              className={`card ${seance.lieu === 'salle' ? 'blue' : 'yellow'}`}
              style={{ padding: 14, marginBottom: 10 }}
              key={seance.id}
            >
              <div className="row-between" style={{ alignItems: 'center', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{titreCourt}</h3>
                    {estAujourdHui && <span className="pill pink">Aujourd'hui</span>}
                    {logDuJour?.termineeA && <span className="pill green">✓</span>}
                  </div>
                  <p className="muted small mb-0" style={{ fontSize: '0.78rem' }}>
                    {description} · {seance.moment} · {seance.exercices.length} exercices
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0 }}
                  onClick={() => navigate(`/entrainement/seance/${seance.id}`)}
                >
                  {logDuJour?.termineeA ? 'Revoir' : 'Commencer'}
                </button>
              </div>
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
