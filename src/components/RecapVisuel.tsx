import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { calculerRecapJour, type RecapJour, type StatutMetrique } from '../utils/recapJournalier'
import { ajouterJours, dateDuJourISO, debutSemaineISO, formatDateCourt, formatDateLong } from '../utils/date'

const COULEURS_STATUT: Record<StatutMetrique, { bg: string; fg: string }> = {
  ok: { bg: '#e4f7e8', fg: '#3f9955' },
  attention: { bg: '#fdecd8', fg: '#b5711b' },
  absent: { bg: '#f2eef0', fg: '#9b8f97' },
}

function ajouterMois(dateISO: string, n: number): string {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setMonth(d.getMonth() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function grilleDuMois(dateISO: string): (string | null)[] {
  const d = new Date(`${dateISO}T00:00:00`)
  const annee = d.getFullYear()
  const mois = d.getMonth()
  const premierJourSemaine = new Date(annee, mois, 1).getDay()
  const decalage = premierJourSemaine === 0 ? 6 : premierJourSemaine - 1 // grille commence un lundi
  const nbJours = new Date(annee, mois + 1, 0).getDate()
  const grille: (string | null)[] = new Array(decalage).fill(null)
  for (let jour = 1; jour <= nbJours; jour++) {
    grille.push(`${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`)
  }
  return grille
}

function Pastille({ emoji, statut }: { emoji: string; statut: StatutMetrique }) {
  const c = COULEURS_STATUT[statut]
  return (
    <span
      title={statut}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: c.bg,
        fontSize: '0.9em',
        opacity: statut === 'absent' ? 0.5 : 1,
      }}
    >
      {emoji}
    </span>
  )
}

function LignePastilles({ recap }: { recap: RecapJour }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <Pastille emoji="😴" statut={recap.sommeil} />
      <Pastille emoji="🍽️" statut={recap.calories} />
      <Pastille emoji="👣" statut={recap.pas} />
      {recap.sport === 'repos' ? (
        <Pastille emoji="😌" statut="ok" />
      ) : (
        <Pastille emoji="💪" statut={recap.sport} />
      )}
    </div>
  )
}

export default function RecapVisuel() {
  const { profil, suiviJournalier, repas, seancesLog } = useAppData()
  const [mode, setMode] = useState<'semaine' | 'mois'>('semaine')
  const [dateReference, setDateReference] = useState(dateDuJourISO())
  const [jourSelectionne, setJourSelectionne] = useState<string | null>(null)

  const joursSemaine = useMemo(() => {
    const lundi = debutSemaineISO(dateReference)
    return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i))
  }, [dateReference])

  const grilleMois = useMemo(() => grilleDuMois(dateReference), [dateReference])

  const recapsParJour = useMemo(() => {
    const jours = mode === 'semaine' ? joursSemaine : grilleMois.filter((j): j is string => j !== null)
    const carte = new Map<string, RecapJour>()
    for (const jour of jours) {
      carte.set(jour, calculerRecapJour(jour, profil, suiviJournalier, repas, seancesLog))
    }
    return carte
  }, [mode, joursSemaine, grilleMois, profil, suiviJournalier, repas, seancesLog])

  function reculer() {
    setJourSelectionne(null)
    setDateReference((d) => (mode === 'semaine' ? ajouterJours(d, -7) : ajouterMois(d, -1)))
  }
  function avancer() {
    setJourSelectionne(null)
    setDateReference((d) => (mode === 'semaine' ? ajouterJours(d, 7) : ajouterMois(d, 1)))
  }

  const labelPeriode =
    mode === 'semaine'
      ? `${formatDateCourt(joursSemaine[0])} — ${formatDateCourt(joursSemaine[6])}`
      : new Date(`${dateReference}T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="card">
      <div className="card-title">
        <h3>📅 Récap visuel</h3>
      </div>

      <div className="segmented">
        <button className={mode === 'semaine' ? 'active' : ''} onClick={() => setMode('semaine')}>
          Semaine
        </button>
        <button className={mode === 'mois' ? 'active' : ''} onClick={() => setMode('mois')}>
          Mois
        </button>
      </div>

      <div className="row-between mb-16">
        <button className="btn-ghost btn-sm" onClick={reculer}>←</button>
        <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{labelPeriode}</span>
        <button className="btn-ghost btn-sm" onClick={avancer}>→</button>
      </div>

      {mode === 'semaine' ? (
        <div>
          {joursSemaine.map((jour) => {
            const recap = recapsParJour.get(jour)!
            const c = COULEURS_STATUT[recap.global]
            return (
              <div
                key={jour}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: c.bg,
                  borderRadius: 10,
                  marginBottom: 6,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, textTransform: 'capitalize' }}>
                    {new Date(`${jour}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className="small muted">{formatDateCourt(jour)}</div>
                </div>
                <LignePastilles recap={recap} />
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((lettre, i) => (
              <div key={i} className="muted small center" style={{ fontWeight: 700 }}>
                {lettre}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {grilleMois.map((jour, i) => {
              if (!jour) return <div key={`vide-${i}`} />
              const recap = recapsParJour.get(jour)!
              const c = COULEURS_STATUT[recap.global]
              return (
                <button
                  key={jour}
                  onClick={() => setJourSelectionne(jour)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 8,
                    border: jourSelectionne === jour ? '2px solid var(--pink-deep)' : '2px solid transparent',
                    background: c.bg,
                    color: c.fg,
                    fontWeight: 700,
                    fontSize: '0.85em',
                  }}
                >
                  {Number(jour.slice(8, 10))}
                </button>
              )
            })}
          </div>
          {jourSelectionne && (
            <div className="mt-16">
              <div style={{ fontWeight: 700, marginBottom: 8, textTransform: 'capitalize' }}>
                {formatDateLong(jourSelectionne)}
              </div>
              <LignePastilles recap={recapsParJour.get(jourSelectionne)!} />
            </div>
          )}
        </div>
      )}

      <p className="small muted mt-16 mb-0">
        🟢 dans les objectifs (ou 😌 repos, pas de séance prévue) · 🟠 à ajuster · ⚪️ pas de donnée ce jour-là
      </p>
    </div>
  )
}
