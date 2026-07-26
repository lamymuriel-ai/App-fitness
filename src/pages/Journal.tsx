import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { estAujourdhui, formatDateCourt, formatHeure, dateDuJourISO } from '../utils/date'
import { totauxRepas } from '../utils/nutrition'
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

export default function Journal() {
  const { profil, repas } = useAppData()
  const navigate = useNavigate()
  const [onglet, setOnglet] = useState<'jour' | 'historique'>('jour')

  const repasDuJour = useMemo(
    () => repas.filter((r) => estAujourdhui(r.dateHeure)).sort((a, b) => a.dateHeure.localeCompare(b.dateHeure)),
    [repas]
  )
  const totauxJour = useMemo(() => totauxRepas(repasDuJour), [repasDuJour])

  const septDerniersJours = useMemo(() => {
    const auj = new Date(dateDuJourISO())
    const seuil = new Date(auj)
    seuil.setDate(seuil.getDate() - 6)
    return repas.filter((r) => new Date(r.dateHeure) >= seuil)
  }, [repas])
  const totauxSemaine = useMemo(() => totauxRepas(septDerniersJours), [septDerniersJours])
  const joursAvecDonnees = useMemo(() => {
    const dates = new Set(septDerniersJours.map((r) => r.dateHeure.slice(0, 10)))
    return Math.max(1, dates.size)
  }, [septDerniersJours])
  const moyenneMicrosSemaine = useMemo(() => {
    const cles = Object.keys(totauxSemaine.micros) as (keyof typeof totauxSemaine.micros)[]
    const moyenne = { ...totauxSemaine.micros }
    for (const cle of cles) moyenne[cle] = totauxSemaine.micros[cle] / joursAvecDonnees
    return moyenne
  }, [totauxSemaine, joursAvecDonnees])

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

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Journal alimentaire</div>
        <h1>Nutrition</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        <div className="segmented">
          <button className={onglet === 'jour' ? 'active' : ''} onClick={() => setOnglet('jour')}>
            Aujourd'hui
          </button>
          <button className={onglet === 'historique' ? 'active' : ''} onClick={() => setOnglet('historique')}>
            Historique
          </button>
        </div>

        {onglet === 'jour' && (
          <>
            <div className="card pink">
              <div className="progress-label-row">
                <span className="progress-big-number">{Math.round(totauxJour.calories)}</span>
                <span className="progress-sub">/ {objectifs.calories} kcal</span>
              </div>
              <BarreProgression valeur={totauxJour.calories} objectif={objectifs.calories} couleur="pink" />
              <div className="mt-16">
                <BarreMacros
                  proteines_g={totauxJour.proteines_g}
                  lipides_g={totauxJour.lipides_g}
                  glucides_g={totauxJour.glucides_g}
                />
              </div>
            </div>

            <AlertesNutriments apportsMoyens={moyenneMicrosSemaine} reference={objectifs.micros} />

            <div className="card">
              <GrilleMicronutriments apports={totauxJour.micros} reference={objectifs.micros} titre="Micronutriments du jour" />
            </div>

            <button className="btn btn-primary mt-8" onClick={() => navigate('/journal/ajouter')}>
              + Ajouter un repas
            </button>

            <div className="mt-16">
              {repasDuJour.length === 0 ? (
                <EtatVide emoji="🍽️" titre="Rien enregistré pour l'instant" texte="Ajoute ton premier repas du jour !" />
              ) : (
                repasDuJour.map((r) => <LigneRepas key={r.id} repas={r} onClick={() => navigate(`/journal/repas/${r.id}`)} />)
              )}
            </div>

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
              return (
                <div className="card" key={jour}>
                  <div className="row-between">
                    <h3 style={{ marginBottom: 0 }}>{formatDateCourt(jour)}</h3>
                    <span className="pill pink">{Math.round(totauxJourHisto.calories)} kcal</span>
                  </div>
                  <div className="mt-8">
                    {repasJour.map((r) => (
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
