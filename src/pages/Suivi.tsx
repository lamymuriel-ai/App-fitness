import { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useAppData } from '../context/AppDataContext'
import { dateDuJourISO, formatDateCourt } from '../utils/date'
import { moyenneMobile7Jours, detecterStagnation } from '../utils/stagnation'
import AlerteStagnationBanniere from '../components/AlerteStagnationBanniere'
import RecapVisuel from '../components/RecapVisuel'
import { EtatVide } from '../components/ui'

export default function Suivi() {
  const {
    profil,
    suiviJournalier,
    suiviHebdomadaire,
    enregistrerSuiviJour,
    enregistrerSuiviHebdo,
    alertesStagnation,
    mettreAJourProfil,
  } = useAppData()

  const aujourdHui = dateDuJourISO()
  const entreeJour = suiviJournalier.find((e) => e.date === aujourdHui)

  const [poidsJour, setPoidsJour] = useState(entreeJour?.poids_kg?.toString() || '')
  const [poidsHebdo, setPoidsHebdo] = useState(entreeJour?.poids_kg?.toString() || profil.poids_kg.toString())
  const [taille, setTaille] = useState('')
  const [ressenti, setRessenti] = useState(3)
  const [sommeilJour, setSommeilJour] = useState(entreeJour?.sommeil_h?.toString() || '')

  async function enregistrerPoidsJour() {
    const p = Number(poidsJour)
    if (!Number.isFinite(p) || p <= 0) return
    await enregistrerSuiviJour({ date: aujourdHui, poids_kg: p })
    await mettreAJourProfil({ ...profil, poids_kg: p })
  }

  async function enregistrerSommeilJour() {
    const h = Number(sommeilJour)
    if (!Number.isFinite(h) || h <= 0) return
    await enregistrerSuiviJour({ date: aujourdHui, sommeil_h: h })
  }

  async function enregistrerCheckinHebdo() {
    const p = Number(poidsHebdo)
    if (!Number.isFinite(p) || p <= 0) return
    await enregistrerSuiviHebdo({
      date: aujourdHui,
      poids_kg: p,
      tourDeTaille_cm: taille ? Number(taille) : undefined,
      ressenti,
    })
    await enregistrerSuiviJour({ date: aujourdHui, poids_kg: p })
    await mettreAJourProfil({ ...profil, poids_kg: p })
  }

  // On ne garde que l'historique depuis le début du plan : un import Santé peut remonter
  // à bien avant, et ces jours-là ne doivent pas peser dans la moyenne mobile ni dans le
  // calcul "Perdu/Pris" (cohérent avec detecterStagnation, qui filtre déjà pareil).
  const suiviDepuisDebutPlan = useMemo(
    () => suiviJournalier.filter((e) => e.date >= profil.dateDebut),
    [suiviJournalier, profil.dateDebut]
  )
  const pointsMoyenne = useMemo(() => moyenneMobile7Jours(suiviDepuisDebutPlan), [suiviDepuisDebutPlan])
  const donneesPoids = useMemo(
    () => pointsMoyenne.map((p) => ({ date: p.date, moyenne: p.poidsMoyen })),
    [pointsMoyenne]
  )

  const donneesTaille = useMemo(
    () =>
      [...suiviHebdomadaire]
        .filter((e) => e.tourDeTaille_cm)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => ({ date: e.date, taille: e.tourDeTaille_cm })),
    [suiviHebdomadaire]
  )

  const stagnationActive = useMemo(() => {
    const alerteOuverte = alertesStagnation.find((a) => !a.resolue)
    if (alerteOuverte) return alerteOuverte
    if (detecterStagnation(suiviJournalier, profil.dateDebut)) {
      return { id: 'nouvelle', dateDetection: aujourdHui, resolue: false } as const
    }
    return null
  }, [alertesStagnation, suiviJournalier, aujourdHui, profil.dateDebut])

  const poidsDepart = profil.poidsDepart_kg
  const dernierMoyenne = pointsMoyenne.length > 0 ? pointsMoyenne[pointsMoyenne.length - 1].poidsMoyen : null
  // Positif = perte (poids de départ plus élevé que le poids actuel), négatif = prise.
  const ecart = dernierMoyenne !== null ? Math.round((poidsDepart - dernierMoyenne) * 10) / 10 : 0

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Suivi hebdomadaire</div>
        <h1>Ta progression</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {stagnationActive && <AlerteStagnationBanniere alerte={stagnationActive} />}

        <RecapVisuel />

        <div className="card pink">
          <div className="row-between">
            <div>
              <div className="progress-sub">Départ</div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{poidsDepart} kg</div>
            </div>
            <div className="center">
              <div className="progress-sub">{ecart < 0 ? 'Pris' : 'Perdu'}</div>
              <div style={{ fontWeight: 900, fontSize: '1.6rem', color: ecart < 0 ? 'var(--danger)' : 'var(--pink-deep)' }}>
                {ecart > 0 ? `-${ecart}` : ecart < 0 ? `+${Math.abs(ecart)}` : '0'} kg
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="progress-sub">Objectif</div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>
                -{profil.objectifPerte_kg} kg
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>⚖️ Pesée du jour</h3>
          <p className="small muted">Pèse-toi si tu veux, à la même heure de préférence. C'est la moyenne sur 7 jours qui compte, pas la valeur isolée.</p>
          <div className="field-row" style={{ alignItems: 'flex-end' }}>
            <div className="field mb-0" style={{ flex: 1 }}>
              <input type="number" step="0.1" value={poidsJour} onChange={(e) => setPoidsJour(e.target.value)} placeholder="Poids (kg)" />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={enregistrerPoidsJour}>Enregistrer</button>
          </div>
        </div>

        <div className="card">
          <h3>😴 Sommeil de la nuit dernière</h3>
          <p className="small muted">Utile les jours où tu ne portes pas ta montre — reprends la valeur donnée par ton téléphone.</p>
          <div className="field-row" style={{ alignItems: 'flex-end' }}>
            <div className="field mb-0" style={{ flex: 1 }}>
              <input
                type="number"
                step="0.1"
                value={sommeilJour}
                onChange={(e) => setSommeilJour(e.target.value)}
                placeholder="Durée (h), ex. 7.5"
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={enregistrerSommeilJour}>Enregistrer</button>
          </div>
        </div>

        {donneesPoids.length > 0 && (
          <div className="card" style={{ height: 220 }}>
            <h3>Moyenne mobile du poids (7 jours)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={donneesPoids}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e4e9" />
                <XAxis dataKey="date" tickFormatter={(v) => formatDateCourt(v)} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
                <Tooltip labelFormatter={(v) => formatDateCourt(v as string)} formatter={(v) => [`${v} kg`, 'Moyenne']} />
                <Line type="monotone" dataKey="moyenne" stroke="#ff7fac" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card yellow">
          <h3>📋 Check-in hebdomadaire</h3>
          <div className="field-row">
            <div className="field">
              <label>Poids (kg)</label>
              <input type="number" step="0.1" value={poidsHebdo} onChange={(e) => setPoidsHebdo(e.target.value)} />
            </div>
            <div className="field">
              <label>Tour de taille (cm)</label>
              <input type="number" step="0.5" value={taille} onChange={(e) => setTaille(e.target.value)} placeholder="Optionnel" />
            </div>
          </div>
          <div className="field">
            <label>Ressenti de forme</label>
            <div className="segmented" style={{ marginBottom: 0 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={ressenti === n ? 'active' : ''} onClick={() => setRessenti(n)}>
                  {['😩', '😕', '😐', '🙂', '😄'][n - 1]}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-yellow" onClick={enregistrerCheckinHebdo}>Enregistrer le check-in</button>
        </div>

        {donneesTaille.length > 1 ? (
          <div className="card" style={{ height: 220 }}>
            <h3>Tour de taille</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={donneesTaille}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e4e9" />
                <XAxis dataKey="date" tickFormatter={(v) => formatDateCourt(v)} tick={{ fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
                <Tooltip labelFormatter={(v) => formatDateCourt(v as string)} formatter={(v) => [`${v} cm`, 'Tour de taille']} />
                <Line type="monotone" dataKey="taille" stroke="#5fa8e6" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EtatVide emoji="📏" titre="Tour de taille" texte="Renseigne-le lors de tes check-ins pour voir son évolution ici." />
        )}
      </div>
    </div>
  )
}
