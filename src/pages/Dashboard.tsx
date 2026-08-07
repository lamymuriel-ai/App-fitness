import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { BarreProgression, BarreMacros } from '../components/ui'
import { totauxRepas, calculerMoyenneMicrosSemaine, ajouterSupplements } from '../utils/nutrition'
import { calculerBudgetRestant, genererSuggestions } from '../utils/suggestionsAlimentaires'
import { ajouterJours, dateDuJourISO, debutSemaineISO, estAujourdhui, formatDateLong, numeroSemaine } from '../utils/date'
import { SEANCES_TEMPLATES, PLANNING_SEMAINE } from '../data/defaults'
import { detecterStagnation } from '../utils/stagnation'
import { phraseDuJour } from '../data/phrasesEncouragement'
import AlerteStagnationBanniere from '../components/AlerteStagnationBanniere'

/** Index stable pour la journée (change chaque jour, sans dépendre du fuseau horaire). */
function indexRotationJournaliere(dateISO: string, taille: number): number {
  const [annee, mois, jour] = dateISO.split('-').map(Number)
  const joursDepuisEpoque = Math.floor(Date.UTC(annee, mois - 1, jour) / 86400000)
  return joursDepuisEpoque % taille
}

function couleurScoreSommeil(score: number): string {
  if (score > 90) return 'var(--success)'
  if (score >= 80) return '#b5711b'
  return 'var(--danger)'
}

export default function Dashboard() {
  const { profil, repas, suiviJournalier, seancesLog, alertesStagnation } = useAppData()
  const navigate = useNavigate()

  const aujourdHui = dateDuJourISO()
  const repasDuJour = useMemo(() => repas.filter((r) => estAujourdhui(r.dateHeure)), [repas])
  const totaux = useMemo(() => totauxRepas(repasDuJour), [repasDuJour])

  const entreeJour = suiviJournalier.find((e) => e.date === aujourdHui)

  const jourSemaine = new Date().getDay()
  // Le lundi, on met en avant le bilan de la semaine qui vient de se terminer — c'est la
  // seule forme d'"automatique" possible ici : une PWA sans backend ne peut rien générer
  // en tâche de fond, seulement réagir à l'ouverture de l'appli.
  const estLundi = jourSemaine === 1
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

  const moyenneMicrosSemaine = useMemo(
    () => ajouterSupplements(calculerMoyenneMicrosSemaine(repas, aujourdHui)),
    [repas, aujourdHui]
  )
  const suggestionDuJour = useMemo(() => {
    const suggestions = genererSuggestions(budgetRestant, moyenneMicrosSemaine, objectifs.micros, 5)
    if (suggestions.length === 0) return null
    // Fait tourner le choix parmi les meilleures idées (déjà diversifiées par catégorie) au lieu
    // de toujours prendre la mieux notée : sinon, tant que les manques de la semaine ne changent
    // pas, c'est le même aliment qui revient chaque jour (ex. toujours du saumon).
    return suggestions[indexRotationJournaliere(aujourdHui, suggestions.length)]
  }, [budgetRestant, moyenneMicrosSemaine, objectifs.micros, aujourdHui])

  return (
    <div>
      <div className="app-header row-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow">{formatDateLong(aujourdHui)}</div>
          <h1>{profil.prenom ? `Salut ${profil.prenom} 🌸` : 'Bonjour 🌸'}</h1>
          <p className="muted">Semaine {numeroSemaine(profil.dateDebut)} sur {profil.dureeObjectif_semaines}</p>
        </div>
        <button
          className="btn-ghost btn-sm"
          style={{ fontSize: '1.4rem', padding: 8 }}
          aria-label="Importer depuis Santé"
          onClick={() => navigate('/plus/importer-sante')}
        >
          🍏
        </button>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {stagnationActive && <AlerteStagnationBanniere alerte={stagnationActive} />}

        {estLundi && (
          <button
            className="card pink"
            style={{ padding: 14, width: '100%', textAlign: 'left' }}
            onClick={() => navigate(`/plus/bilan-semaine?semaine=${ajouterJours(debutSemaineISO(aujourdHui), -7)}`)}
          >
            <div className="row-between">
              <p className="small" style={{ fontWeight: 700, margin: 0 }}>
                📊 Ton bilan de la semaine dernière est prêt
              </p>
              <span>→</span>
            </div>
          </button>
        )}

        <div className="card blue" style={{ padding: 14 }}>
          <p className="small" style={{ fontStyle: 'italic', margin: 0 }}>💬 {phraseDuJour(aujourdHui)}</p>
        </div>

        {suggestionDuJour && (
          <div className="card yellow" style={{ padding: 14 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6 }}>🥗 Idée du jour</h3>
            <p className="small" style={{ fontWeight: 700, marginBottom: 2 }}>
              {suggestionDuJour.aliment.emoji} {suggestionDuJour.aliment.nom} · {suggestionDuJour.portion_g} g
            </p>
            {suggestionDuJour.raisons.map((raison) => (
              <p key={raison} className="muted small mb-0">
                {raison}
              </p>
            ))}
            <button
              className="link-btn small"
              style={{ padding: '4px 0 0' }}
              onClick={() => navigate('/journal/suggestions')}
            >
              Voir plus d'idées →
            </button>
          </div>
        )}

        <div className="card pink" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>🍽️ Calories</h3>
          <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>
            {Math.round(totaux.calories)}/{objectifs.calories}kcal ·{' '}
            <span style={{ color: 'var(--pink-deep)' }}>{Math.round(budgetRestant.calories)} restantes</span>
          </p>
          <BarreProgression valeur={totaux.calories} objectif={objectifs.calories} couleur="orange" />
          <div style={{ marginTop: 10 }}>
            <BarreMacros
              proteines_g={totaux.proteines_g}
              lipides_g={totaux.lipides_g}
              glucides_g={totaux.glucides_g}
              objectifProteines_g={objectifs.proteines_g}
              objectifLipides_g={objectifs.lipides_g}
              objectifGlucides_g={objectifs.glucides_g}
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
              <BarreProgression valeur={entreeJour?.pas || 0} objectif={profil.objectifPas} couleur="purple" />
            </div>
            <div>
              <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                😴 {entreeJour?.sommeil_h ?? '–'}
                <span className="muted"> {entreeJour?.sommeil_h !== undefined ? 'h' : 'pas enreg.'}</span>
                {entreeJour?.sommeil_h !== undefined && (() => {
                  const score = Math.min(100, Math.round((entreeJour.sommeil_h / 8) * 100))
                  return <span style={{ color: couleurScoreSommeil(score) }}> · {score}</span>
                })()}
              </p>
              <BarreProgression valeur={entreeJour?.sommeil_h || 0} objectif={8} couleur="navy" />
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
