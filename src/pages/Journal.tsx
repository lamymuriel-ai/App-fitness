import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { ajouterJours, formatDateCourt, formatDateLong, formatHeure, dateDuJourISO } from '../utils/date'
import { totauxRepas, calculerMoyenneMicrosSemaine, ajouterSupplements } from '../utils/nutrition'
import { calculerBudgetRestant } from '../utils/suggestionsAlimentaires'
import { BarreProgression, BarreMacros, EtatVide } from '../components/ui'
import GrilleMicronutriments from '../components/GrilleMicronutriments'
import AlertesNutriments from '../components/AlertesNutriments'
import type { Repas } from '../types'

const LABEL_TYPE: Record<Repas['type'], string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

const EMOJI_METHODE: Record<Repas['methode'], string> = {
  photo: '📷',
  code_barres: '📦',
  manuel: '✍️',
  import_sante: '🍏',
}

function libelleJour(iso: string): string {
  const aujourdHui = dateDuJourISO()
  if (iso === aujourdHui) return "Aujourd'hui"
  if (iso === ajouterJours(aujourdHui, -1)) return 'Hier'
  if (iso === ajouterJours(aujourdHui, 1)) return 'Demain'
  return formatDateLong(iso)
}

export default function Journal() {
  const { profil, repas, suiviJournalier } = useAppData()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [onglet, setOnglet] = useState<'jour' | 'historique'>('jour')
  const [dateAffichee, setDateAffichee] = useState(searchParams.get('date') || dateDuJourISO())

  const repasDuJour = useMemo(
    () =>
      repas
        .filter((r) => r.dateHeure.slice(0, 10) === dateAffichee)
        .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure)),
    [repas, dateAffichee]
  )
  const totauxJour = useMemo(() => totauxRepas(repasDuJour), [repasDuJour])
  // Les repas importés depuis Santé comptent dans les totaux nutritionnels mais
  // n'apportent rien à afficher individuellement (souvent nombreux et sans intérêt
  // à parcourir un par un) — on les garde dans les calculs, on les masque de la liste.
  const repasDuJourVisibles = useMemo(
    () => repasDuJour.filter((r) => r.methode !== 'import_sante'),
    [repasDuJour]
  )

  const moyenneMicrosSemaine = useMemo(
    () => calculerMoyenneMicrosSemaine(repas, dateDuJourISO()),
    [repas]
  )
  const microsJourAvecSupplements = useMemo(() => ajouterSupplements(totauxJour.micros), [totauxJour])
  const moyenneMicrosAvecSupplements = useMemo(
    () => ajouterSupplements(moyenneMicrosSemaine),
    [moyenneMicrosSemaine]
  )

  const parJour = useMemo(() => {
    const groupes = new Map<string, Repas[]>()
    for (const r of [...repas].sort((a, b) => b.dateHeure.localeCompare(a.dateHeure))) {
      const jour = r.dateHeure.slice(0, 10)
      if (!groupes.has(jour)) groupes.set(jour, [])
      groupes.get(jour)!.push(r)
    }
    return Array.from(groupes.entries())
  }, [repas])

  const objectifs = profil.objectifsNutritionnels
  const budgetRestant = useMemo(() => calculerBudgetRestant(totauxJour, objectifs), [totauxJour, objectifs])

  const entreeJourAffichee = suiviJournalier.find((e) => e.date === dateAffichee)

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Journal alimentaire</div>
        <h1>Nutrition</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        <div className="segmented">
          <button className={onglet === 'jour' ? 'active' : ''} onClick={() => setOnglet('jour')}>
            Jour
          </button>
          <button className={onglet === 'historique' ? 'active' : ''} onClick={() => setOnglet('historique')}>
            Historique
          </button>
        </div>

        {onglet === 'jour' && (
          <>
            <div className="row-between mb-16">
              <button className="btn-ghost btn-sm" onClick={() => setDateAffichee((d) => ajouterJours(d, -1))}>
                ←
              </button>
              <div className="center">
                <div style={{ fontWeight: 800, textTransform: 'capitalize' }}>{libelleJour(dateAffichee)}</div>
                {dateAffichee !== dateDuJourISO() && (
                  <button className="link-btn small" style={{ padding: 0 }} onClick={() => setDateAffichee(dateDuJourISO())}>
                    Revenir à aujourd'hui
                  </button>
                )}
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setDateAffichee((d) => ajouterJours(d, 1))}>
                →
              </button>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                    👣 {entreeJourAffichee?.pas?.toLocaleString('fr-FR') || 0}
                    <span className="muted"> / {profil.objectifPas.toLocaleString('fr-FR')}</span>
                  </p>
                  <BarreProgression valeur={entreeJourAffichee?.pas || 0} objectif={profil.objectifPas} couleur="purple" />
                </div>
                <div>
                  <p className="small" style={{ fontWeight: 700, marginBottom: 4 }}>
                    😴 {entreeJourAffichee?.sommeil_h ?? '–'}
                    <span className="muted"> {entreeJourAffichee?.sommeil_h !== undefined ? 'h' : 'pas enreg.'}</span>
                  </p>
                  <BarreProgression valeur={entreeJourAffichee?.sommeil_h || 0} objectif={8} couleur="navy" />
                </div>
              </div>
            </div>

            <div className="card pink" style={{ padding: 16 }}>
              <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>
                {Math.round(totauxJour.calories)}/{objectifs.calories}kcal ·{' '}
                <span style={{ color: 'var(--pink-deep)' }}>{Math.round(budgetRestant.calories)} restantes</span>
              </p>
              <BarreProgression valeur={totauxJour.calories} objectif={objectifs.calories} couleur="orange" />
              <div style={{ marginTop: 10 }}>
                <BarreMacros
                  proteines_g={totauxJour.proteines_g}
                  lipides_g={totauxJour.lipides_g}
                  glucides_g={totauxJour.glucides_g}
                  objectifProteines_g={objectifs.proteines_g}
                  objectifLipides_g={objectifs.lipides_g}
                  objectifGlucides_g={objectifs.glucides_g}
                />
              </div>
            </div>

            <div className="card">
              <GrilleMicronutriments apports={microsJourAvecSupplements} reference={objectifs.micros} titre="Micronutriments du jour" />
            </div>

            <AlertesNutriments apportsMoyens={moyenneMicrosAvecSupplements} reference={objectifs.micros} />

            {dateAffichee === dateDuJourISO() && (
              <button className="btn btn-primary mt-8" onClick={() => navigate('/journal/suggestions')}>
                🥗 Idées pour compléter ta journée
              </button>
            )}

            {repasDuJourVisibles.length > 0 && (
              <div className="mt-16">
                {repasDuJourVisibles.map((r) => (
                  <LigneRepas key={r.id} repas={r} onClick={() => navigate(`/journal/repas/${r.id}`)} />
                ))}
              </div>
            )}

            <button className="link-btn mt-8" onClick={() => navigate('/journal/tendances')}>
              📈 Voir les tendances hebdomadaires →
            </button>
          </>
        )}

        {onglet === 'historique' && (
          <div className="mt-8">
            {parJour.length === 0 && (
              <EtatVide emoji="📅" titre="Aucun historique" texte="Tes repas passés apparaîtront ici." />
            )}
            {parJour.map(([jour, repasJour]) => {
              const totauxJourHisto = totauxRepas(repasJour)
              const repasJourVisibles = repasJour.filter((r) => r.methode !== 'import_sante')
              return (
                <div className="card" key={jour}>
                  <div className="row-between">
                    <h3 style={{ marginBottom: 0 }}>{formatDateCourt(jour)}</h3>
                    <span className="pill pink">{Math.round(totauxJourHisto.calories)} kcal</span>
                  </div>
                  <div className="mt-8">
                    {repasJourVisibles.map((r) => (
                      <LigneRepas key={r.id} repas={r} onClick={() => navigate(`/journal/repas/${r.id}`)} compact />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function LigneRepas({ repas, onClick, compact }: { repas: Repas; onClick: () => void; compact?: boolean }) {
  return (
    <button
      className="list-row"
      style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
      onClick={onClick}
    >
      <div className="row gap-12">
        {repas.photo ? (
          <img src={repas.photo} className="thumb" alt="" />
        ) : (
          <div className="thumb row" style={{ justifyContent: 'center', fontSize: '1.6rem' }}>
            {EMOJI_METHODE[repas.methode]}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 800 }}>{repas.nom}</div>
          <div className="small muted">
            {LABEL_TYPE[repas.type]} {!compact && `· ${formatHeure(repas.dateHeure)}`}
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 800 }}>{Math.round(repas.calories)} kcal</div>
    </button>
  )
}
