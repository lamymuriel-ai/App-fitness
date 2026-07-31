import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { BarreProgression, BarreMacros, EtatVide } from '../components/ui'
import { genererRapportHebdomadaire, genererAnalyseHebdomadaire } from '../utils/rapportHebdomadaire'
import { ajouterJours, dateDuJourISO, debutSemaineISO, formatDateCourt } from '../utils/date'

function couleurDelta(delta: number, objectifPerte: boolean): string {
  if (Math.abs(delta) < 0.05) return 'var(--text-soft)'
  const vaDansLeBonSens = objectifPerte ? delta < 0 : delta > 0
  return vaDansLeBonSens ? 'var(--success)' : 'var(--danger)'
}

export default function BilanHebdomadaire() {
  const navigate = useNavigate()
  const { profil, repas, suiviJournalier, suiviHebdomadaire, seancesLog } = useAppData()
  const [searchParams, setSearchParams] = useSearchParams()

  const semaineCourante = useMemo(() => debutSemaineISO(dateDuJourISO()), [])
  const semaine = searchParams.get('semaine') || semaineCourante

  const rapport = useMemo(
    () => genererRapportHebdomadaire(semaine, profil, repas, suiviJournalier, suiviHebdomadaire, seancesLog),
    [semaine, profil, repas, suiviJournalier, suiviHebdomadaire, seancesLog]
  )
  const analyse = useMemo(() => genererAnalyseHebdomadaire(rapport, profil), [rapport, profil])

  function changerSemaine(delta: number) {
    setSearchParams({ semaine: ajouterJours(semaine, delta) })
  }

  const objectifPerte = profil.objectif === 'perte_poids'
  const rienARapporter = rapport.nbJoursAvecRepas === 0 && !rapport.pas && !rapport.sommeil_h && !rapport.poids

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📊 Bilan de la semaine</h1>

      <div className="row-between mb-16">
        <button className="btn-ghost btn-sm" onClick={() => changerSemaine(-7)}>←</button>
        <span style={{ fontWeight: 700 }}>
          {formatDateCourt(rapport.semaineDebut)} — {formatDateCourt(rapport.semaineFin)}
        </span>
        <button className="btn-ghost btn-sm" onClick={() => changerSemaine(7)} disabled={semaine >= semaineCourante}>
          →
        </button>
      </div>

      {rienARapporter ? (
        <EtatVide
          emoji="🌸"
          titre="Pas encore de données"
          texte="Reviens quand tu auras enregistré au moins un repas, un poids ou tes pas sur cette semaine."
        />
      ) : (
        <>
          <div className="card yellow" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{analyse.titre}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analyse.points.map((point) => (
                <p key={point} className="small" style={{ margin: 0 }}>
                  {point}
                </p>
              ))}
            </div>
          </div>

          {rapport.poids && (
            <div className="card center" style={{ padding: 16 }}>
              <p className="small muted mb-0">⚖️ Poids en fin de semaine</p>
              <p style={{ fontSize: '2.2rem', fontWeight: 800, margin: '4px 0' }}>{rapport.poids.fin.toFixed(1)} kg</p>
              <p className="small" style={{ fontWeight: 700, color: couleurDelta(rapport.poids.delta, objectifPerte) }}>
                {Math.abs(rapport.poids.delta) < 0.05
                  ? '➡️ stable sur la semaine'
                  : rapport.poids.delta < 0
                    ? `📉 ${rapport.poids.delta.toFixed(1)} kg sur la semaine`
                    : `📈 +${rapport.poids.delta.toFixed(1)} kg sur la semaine`}
              </p>
            </div>
          )}

          <div className="card pink" style={{ padding: 16 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>🍽️ Alimentation (moyenne/jour)</h3>
            <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>
              {Math.round(rapport.calories.moyenne)}/{rapport.calories.objectif} kcal
            </p>
            <BarreProgression valeur={rapport.calories.moyenne} objectif={rapport.calories.objectif} couleur="orange" />
            <div style={{ marginTop: 10 }}>
              <BarreMacros
                proteines_g={rapport.proteines_g.moyenne}
                lipides_g={rapport.lipides_g.moyenne}
                glucides_g={rapport.glucides_g.moyenne}
                objectifProteines_g={rapport.proteines_g.objectif}
                objectifLipides_g={rapport.lipides_g.objectif}
                objectifGlucides_g={rapport.glucides_g.objectif}
              />
            </div>
            {rapport.nbJoursAvecRepas > 0 && rapport.nbJoursAvecRepas < 5 && (
              <p className="small muted mt-8 mb-0">
                Basé sur {rapport.nbJoursAvecRepas} jour{rapport.nbJoursAvecRepas > 1 ? 's' : ''} avec repas renseignés.
              </p>
            )}
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                  👣 {rapport.pas ? Math.round(rapport.pas.moyenne).toLocaleString('fr-FR') : '–'}
                  <span className="muted"> / {profil.objectifPas.toLocaleString('fr-FR')}</span>
                </p>
                <BarreProgression valeur={rapport.pas?.moyenne || 0} objectif={profil.objectifPas} couleur="purple" />
              </div>
              <div>
                <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                  😴 {rapport.sommeil_h ? rapport.sommeil_h.moyenne.toFixed(1) : '–'}
                  <span className="muted"> {rapport.sommeil_h ? 'h' : 'pas enreg.'}</span>
                </p>
                <BarreProgression valeur={rapport.sommeil_h?.moyenne || 0} objectif={8} couleur="navy" />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0 }}>💪 Séances</h3>
              <span className="pill green">
                {rapport.seances.faites}/{rapport.seances.planifiees}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: rapport.seances.planifiees }, (_, i) => (
                <span key={i} style={{ fontSize: '1.4rem' }}>
                  {i < rapport.seances.faites ? '✅' : '⬜️'}
                </span>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>🔬 Micronutriments</h3>
            {rapport.microsFaibles.length === 0 ? (
              <p className="small muted mb-0">Rien de particulier à signaler cette semaine 👍</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rapport.microsFaibles.map((m) => (
                  <div
                    key={m.cle}
                    className="row-between"
                    style={{ background: '#fdecd8', borderRadius: 10, padding: '6px 10px' }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {m.emoji} {m.label}
                    </span>
                    <span className="muted small">{m.pourcentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
