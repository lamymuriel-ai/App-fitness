import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { BarreProgression, BarreMacros } from '../components/ui'
import { totauxRepas } from '../utils/nutrition'
import { calculerBudgetRestant } from '../utils/suggestionsAlimentaires'
import { dateDuJourISO, debutSemaineISO, estAujourdhui, formatDateLong, numeroSemaine } from '../utils/date'
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
  const [sommeilSaisie, setSommeilSaisie] = useState<string>(entreeJour?.sommeil_h?.toString() || '')

  async function enregistrerPas() {
    const pas = Number(pasSaisie)
    if (!Number.isFinite(pas) || pas < 0) return
    await enregistrerSuiviJour({ date: aujourdHui, pas })
  }

  async function enregistrerSommeil() {
    const sommeil_h = Number(sommeilSaisie)
    if (!Number.isFinite(sommeil_h) || sommeil_h < 0 || sommeil_h > 24) return
    await enregistrerSuiviJour({ date: aujourdHui, sommeil_h })
  }

  const jourSemaine = new Date().getDay()
  const idSeanceDuJour = PLANNING_SEMAINE[jourSemaine]
  const seanceDuJour = idSeanceDuJour ? SEANCES_TEMPLATES.find((s) => s.id === idSeanceDuJour) : null
  const seanceLogDuJour = seancesLog.find(
    (s) => s.date === aujourdHui && s.seanceTemplateId === idSeanceDuJour
  )

  const debutSemaine = useMemo(() => debutSemaineISO(aujourdHui), [aujourdHui])
  const seancesCetteSemaine = useMemo(
    () =>
      SEANCES_TEMPLATES.map((s) => ({
        seance: s,
        faite: seancesLog.some((log) => log.seanceTemplateId === s.id && log.date >= debutSemaine && log.termineeA),
      })),
    [seancesLog, debutSemaine]
  )
  const nbSeancesFaites = seancesCetteSemaine.filter((s) => s.faite).length

  const stagnationActive = useMemo(() => {
    const alerteOuverte = alertesStagnation.find((a) => !a.resolue)
    if (alerteOuverte) return alerteOuverte
    if (detecterStagnation(suiviJournalier, profil.dateDebut)) {
      return { id: 'nouvelle', dateDetection: aujourdHui, resolue: false } as const
    }
    return null
  }, [alertesStagnation, suiviJournalier, aujourdHui, profil.dateDebut])

  const objectifs = profil.objectifsNutritionnels
  const budgetRestant = useMemo(() => calculerBudgetRestant(totaux, objectifs), [totaux, objectifs])

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">{formatDateLong(aujourdHui)}</div>
        <h1>{profil.prenom ? `Salut ${profil.prenom} 🌸` : 'Bonjour 🌸'}</h1>
        <p className="muted">Semaine {numeroSemaine(profil.dateDebut)} sur {profil.dureeObjectif_semaines}</p>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {stagnationActive && <AlerteStagnationBanniere alerte={stagnationActive} />}

        <div className="card pink" style={{ padding: 16 }}>
          <div className="card-title" style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: '1rem' }}>🍽️ Calories</h3>
            <span className="pill pink">{repasDuJour.length} repas</span>
          </div>
          <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>
            {Math.round(totaux.calories)}/{objectifs.calories}kcal ·{' '}
            <span style={{ color: 'var(--pink-deep)' }}>{Math.round(budgetRestant.calories)} restantes</span>
          </p>
          <BarreProgression valeur={totaux.calories} objectif={objectifs.calories} couleur="pink" />
          <div style={{ marginTop: 10 }}>
            <BarreMacros
              proteines_g={totaux.proteines_g}
              lipides_g={totaux.lipides_g}
              glucides_g={totaux.glucides_g}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                👣 {entreeJour?.pas?.toLocaleString('fr-FR') || 0}
                <span className="muted"> / {profil.objectifPas.toLocaleString('fr-FR')}</span>
              </p>
              <BarreProgression valeur={entreeJour?.pas || 0} objectif={profil.objectifPas} couleur="blue" />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <div className="field mb-0" style={{ flex: 1 }}>
                  <input
                    type="number"
                    placeholder="Pas"
                    value={pasSaisie}
                    onChange={(e) => setPasSaisie(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                  />
                </div>
                <button className="btn btn-secondary" style={{ padding: '0 14px', fontSize: '0.8rem' }} onClick={enregistrerPas}>
                  OK
                </button>
              </div>
            </div>
            <div>
              <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                😴 {entreeJour?.sommeil_h ?? '–'}
                <span className="muted"> {entreeJour?.sommeil_h !== undefined ? 'h (7-9 reco.)' : 'pas enreg.'}</span>
              </p>
              <BarreProgression valeur={entreeJour?.sommeil_h || 0} objectif={7} couleur="pink" />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <div className="field mb-0" style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="Heures"
                    value={sommeilSaisie}
                    onChange={(e) => setSommeilSaisie(e.target.value)}
                    style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                  />
                </div>
                <button className="btn btn-secondary" style={{ padding: '0 14px', fontSize: '0.8rem' }} onClick={enregistrerSommeil}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>

        {seanceDuJour ? (
          <div className="card yellow" style={{ padding: 14 }}>
            <div className="row-between">
              <p className="small" style={{ fontWeight: 700, marginBottom: 0 }}>
                💪 Séance {seanceDuJour.id} <span className="muted">· {seanceDuJour.moment}, {seanceDuJour.lieu === 'salle' ? 'en salle' : 'à la maison'}</span>
              </p>
              {seanceLogDuJour?.termineeA && <span className="pill green">✓</span>}
            </div>
            <button
              className="btn btn-yellow btn-sm mt-8"
              style={{ width: '100%' }}
              onClick={() => navigate(`/entrainement/seance/${seanceDuJour.id}`)}
            >
              {seanceLogDuJour?.termineeA ? 'Revoir la séance' : 'Commencer la séance'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 14 }}>
            <p className="small" style={{ fontWeight: 700, marginBottom: 0 }}>
              😌 Jour de repos <span className="muted">· profites-en pour bouger un peu</span>
            </p>
          </div>
        )}

        <div className="card" style={{ padding: 14 }}>
          <div className="row-between" style={{ marginBottom: 2 }}>
            <h3 style={{ fontSize: '0.95rem', margin: 0 }}>📅 Cette semaine</h3>
            <span className="pill yellow">{nbSeancesFaites}/{seancesCetteSemaine.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {seancesCetteSemaine.map(({ seance, faite }) => (
              <div
                key={seance.id}
                className="small"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                <span>{faite ? '✅' : '⬜️'}</span>
                <span>Séance {seance.id}</span>
              </div>
            ))}
          </div>
          <button className="link-btn small" style={{ padding: '4px 0 0' }} onClick={() => navigate('/entrainement')}>
            Voir toutes les séances →
          </button>
        </div>
      </div>
    </div>
  )
}
