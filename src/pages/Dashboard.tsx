import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { BarreProgression, BarreMacros } from '../components/ui'
import { totauxRepas } from '../utils/nutrition'
import { dateDuJourISO, estAujourdhui, formatDateLong, numeroSemaine } from '../utils/date'
import { SEANCES_TEMPLATES, PLANNING_SEMAINE } from '../data/defaults'
import { detecterStagnation } from '../utils/stagnation'
import AlerteStagnationBanniere from '../components/AlerteStagnationBanniere'

export default function Dashboard() {
  const { profil, repas, suiviJournalier, enregistrerSuiviJour, seancesLog, alertesStagnation } = useAppData()
  const navigate = useNavigate()

  const aujourdHui = dateDuJourISO()
  const repasDuJour = useMemo(() => repas.filter((r) => estAujourdhui(r.dateHeure)), [repas])
  const totaux = useMemo(() => totauxRepas(repasDuJour), [repasDuJour])

  const entreeJour = suiviJournalier.find((e) => e.date === aujourdHui)
  const [pasSaisie, setPasSaisie] = useState<string>(entreeJour?.pas?.toString() || '')

  async function enregistrerPas() {
    const pas = Number(pasSaisie)
    if (!Number.isFinite(pas) || pas < 0) return
    await enregistrerSuiviJour({ date: aujourdHui, pas })
  }

  const jourSemaine = new Date().getDay()
  const idSeanceDuJour = PLANNING_SEMAINE[jourSemaine]
  const seanceDuJour = idSeanceDuJour ? SEANCES_TEMPLATES.find((s) => s.id === idSeanceDuJour) : null
  const seanceLogDuJour = seancesLog.find(
    (s) => s.date === aujourdHui && s.seanceTemplateId === idSeanceDuJour
  )

  const stagnationActive = useMemo(() => {
    const alerteOuverte = alertesStagnation.find((a) => !a.resolue)
    if (alerteOuverte) return alerteOuverte
    if (detecterStagnation(suiviJournalier)) {
      return { id: 'nouvelle', dateDetection: aujourdHui, resolue: false } as const
    }
    return null
  }, [alertesStagnation, suiviJournalier, aujourdHui])

  const objectifs = profil.objectifsNutritionnels

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">{formatDateLong(aujourdHui)}</div>
        <h1>{profil.prenom ? `Salut ${profil.prenom} 🌸` : 'Bonjour 🌸'}</h1>
        <p className="muted">Semaine {numeroSemaine(profil.dateDebut)} sur {profil.dureeObjectif_semaines}</p>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {stagnationActive && <AlerteStagnationBanniere alerte={stagnationActive} />}

        <div className="card pink">
          <div className="card-title">
            <h3>🍽️ Calories du jour</h3>
            <span className="pill pink">{repasDuJour.length} repas</span>
          </div>
          <div className="progress-label-row">
            <span className="progress-big-number">{Math.round(totaux.calories)}</span>
            <span className="progress-sub">objectif {objectifs.calories} kcal</span>
          </div>
          <BarreProgression valeur={totaux.calories} objectif={objectifs.calories} couleur="pink" />
          <div style={{ marginTop: 16 }}>
            <BarreMacros
              proteines_g={totaux.proteines_g}
              lipides_g={totaux.lipides_g}
              glucides_g={totaux.glucides_g}
            />
          </div>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/journal/ajouter')}>
            + Ajouter un repas
          </button>
        </div>

        <div className="card blue">
          <div className="card-title">
            <h3>👣 Pas du jour</h3>
          </div>
          <div className="progress-label-row">
            <span className="progress-big-number">{entreeJour?.pas?.toLocaleString('fr-FR') || 0}</span>
            <span className="progress-sub">objectif {profil.objectifPas.toLocaleString('fr-FR')}</span>
          </div>
          <BarreProgression valeur={entreeJour?.pas || 0} objectif={profil.objectifPas} couleur="blue" />
          <div className="field-row mt-16" style={{ alignItems: 'flex-end' }}>
            <div className="field mb-0" style={{ flex: 1 }}>
              <input
                type="number"
                placeholder="Nombre de pas"
                value={pasSaisie}
                onChange={(e) => setPasSaisie(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={enregistrerPas}>
              Enregistrer
            </button>
          </div>
        </div>

        {seanceDuJour && (
          <div className="card yellow">
            <div className="card-title">
              <h3>💪 Séance du jour</h3>
              {seanceLogDuJour?.termineeA && <span className="pill green">Terminée ✓</span>}
            </div>
            <p style={{ fontWeight: 700 }}>{seanceDuJour.nom}</p>
            <p className="muted small">
              {seanceDuJour.exercices.length} exercices · {seanceDuJour.moment} · {seanceDuJour.lieu === 'salle' ? 'En salle' : 'À la maison'}
            </p>
            <button
              className="btn btn-yellow mt-8"
              onClick={() => navigate(`/entrainement/seance/${seanceDuJour.id}`)}
            >
              {seanceLogDuJour?.termineeA ? 'Revoir la séance' : 'Commencer la séance'}
            </button>
          </div>
        )}

        {!seanceDuJour && (
          <div className="card">
            <h3>😌 Jour de repos</h3>
            <p className="muted mb-0">Pas de séance prévue aujourd'hui. Profites-en pour bouger un peu (marche, étirements).</p>
          </div>
        )}
      </div>
    </div>
  )
}
