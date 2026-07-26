import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { SEANCES_TEMPLATES } from '../data/defaults'
import { formatDateLong } from '../utils/date'
import { EtatVide } from '../components/ui'

export default function HistoriqueEntrainement() {
  const navigate = useNavigate()
  const { seancesLog } = useAppData()

  const terminees = [...seancesLog]
    .filter((s) => s.termineeA)
    .sort((a, b) => (b.termineeA || '').localeCompare(a.termineeA || ''))

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>🕘 Historique des séances</h1>

      {terminees.length === 0 && (
        <EtatVide emoji="💪" titre="Pas encore de séance terminée" texte="Tes séances passées apparaîtront ici." />
      )}

      {terminees.map((log) => {
        const template = SEANCES_TEMPLATES.find((t) => t.id === log.seanceTemplateId)
        const setsFaits = log.exercices.reduce((s, e) => s + e.sets.filter((x) => x.fait).length, 0)
        const setsTotal = log.exercices.reduce((s, e) => s + e.sets.length, 0)
        return (
          <div className="card" key={log.id}>
            <div className="row-between">
              <h3 className="mb-0">{template?.nom || log.seanceTemplateId}</h3>
              <span className="pill green">{setsFaits}/{setsTotal} séries</span>
            </div>
            <p className="muted small">{formatDateLong(log.date)}</p>
            {log.exercices.map((ex) => (
              <div className="list-row" key={ex.nom}>
                <span>{ex.nom}</span>
                <span className="muted small">
                  {ex.poidsUtilise_kg ? `${ex.poidsUtilise_kg} kg · ` : ''}
                  {ex.sets.filter((s) => s.fait).length}/{ex.sets.length} séries
                </span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
