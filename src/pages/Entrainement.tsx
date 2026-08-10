import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useAppData } from '../context/AppDataContext'
import { SEANCES_TEMPLATES, PLANNING_SEMAINE } from '../data/defaults'
import { dateDuJourISO, debutSemaineISO, formatDateCourt, formatDateLong, genererId } from '../utils/date'
import { EtatVide } from '../components/ui'
import type { SeanceLog } from '../types'

function repsTotalExercice(ex: SeanceLog['exercices'][number]): number {
  return ex.sets.reduce((s, set) => s + (set.fait ? set.reps || 0 : 0), 0)
}

export default function Entrainement() {
  const navigate = useNavigate()
  const { seancesLog, enregistrerSeanceLog, supprimerSeanceLog } = useAppData()
  const [onglet, setOnglet] = useState<'seances' | 'historique'>('seances')
  const [sousOnglet, setSousOnglet] = useState<'seances' | 'progression'>('seances')
  const [semainesOuvertes, setSemainesOuvertes] = useState<Set<string>>(new Set())
  const [seancesOuvertes, setSeancesOuvertes] = useState<Set<string>>(new Set())
  const [formulaireAutreOuvert, setFormulaireAutreOuvert] = useState(false)
  const [nomAutreActivite, setNomAutreActivite] = useState('')
  const [dureeAutreActivite, setDureeAutreActivite] = useState('')

  const aujourdHui = dateDuJourISO()
  const debutSemaine = debutSemaineISO(aujourdHui)
  const idSeanceDuJour = PLANNING_SEMAINE[new Date().getDay()]

  const autreActiviteDuJour = seancesLog.find(
    (s) => s.date === aujourdHui && s.seanceTemplateId === 'autre' && s.termineeA
  )

  async function enregistrerAutreActivite() {
    if (!nomAutreActivite.trim()) return
    await enregistrerSeanceLog({
      id: genererId(),
      seanceTemplateId: 'autre',
      date: aujourdHui,
      termineeA: new Date().toISOString(),
      exercices: [],
      nomActivite: nomAutreActivite.trim(),
      duree_min: dureeAutreActivite ? Number(dureeAutreActivite) : undefined,
    })
    setFormulaireAutreOuvert(false)
    setNomAutreActivite('')
    setDureeAutreActivite('')
  }

  const terminees = useMemo(
    () =>
      [...seancesLog]
        .filter((s) => s.termineeA)
        .sort((a, b) => (b.termineeA || '').localeCompare(a.termineeA || '')),
    [seancesLog]
  )

  const semaines = useMemo(() => {
    const groupes = new Map<string, SeanceLog[]>()
    for (const log of terminees) {
      const debut = debutSemaineISO(log.date)
      if (!groupes.has(debut)) groupes.set(debut, [])
      groupes.get(debut)!.push(log)
    }
    return [...groupes.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [terminees])

  const nomsExercices = useMemo(() => {
    const vus = new Set<string>()
    const ordre: string[] = []
    for (const template of SEANCES_TEMPLATES) {
      for (const ex of template.exercices) {
        if (!vus.has(ex.nom)) {
          vus.add(ex.nom)
          ordre.push(ex.nom)
        }
      }
    }
    for (const log of terminees) {
      for (const ex of log.exercices) {
        if (!vus.has(ex.nom)) {
          vus.add(ex.nom)
          ordre.push(ex.nom)
        }
      }
    }
    return ordre.filter((nom) => terminees.some((log) => log.exercices.some((e) => e.nom === nom)))
  }, [terminees])

  const [exerciceChoisi, setExerciceChoisi] = useState(nomsExercices[0] || '')
  const nomExerciceActif = nomsExercices.includes(exerciceChoisi) ? exerciceChoisi : nomsExercices[0] || ''

  const templateExercice = SEANCES_TEMPLATES.flatMap((t) => t.exercices).find((e) => e.nom === nomExerciceActif)
  const estPoidsDuCorps = templateExercice?.poidsDuCorps ?? false

  const donneesProgression = useMemo(() => {
    if (!nomExerciceActif) return []
    return [...terminees]
      .filter((log) => log.exercices.some((e) => e.nom === nomExerciceActif))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((log) => {
        const ex = log.exercices.find((e) => e.nom === nomExerciceActif)!
        return {
          date: log.date,
          poids: ex.poidsUtilise_kg ?? null,
          reps: repsTotalExercice(ex),
        }
      })
  }, [terminees, nomExerciceActif])

  const valeurCle = estPoidsDuCorps ? 'reps' : 'poids'
  const donneesAvecValeur = donneesProgression.filter((d) => d[valeurCle] !== null && d[valeurCle] > 0)
  const premiereValeur = donneesAvecValeur[0]?.[valeurCle] ?? null
  const derniereValeur = donneesAvecValeur[donneesAvecValeur.length - 1]?.[valeurCle] ?? null
  const progression =
    premiereValeur !== null && derniereValeur !== null ? Math.round((derniereValeur - premiereValeur) * 10) / 10 : null

  function toggleSemaine(cle: string) {
    setSemainesOuvertes((prev) => {
      const next = new Set(prev)
      if (next.has(cle)) next.delete(cle)
      else next.add(cle)
      return next
    })
  }

  function toggleSeance(id: string) {
    setSeancesOuvertes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Entraînement</div>
        <h1>Tes séances</h1>
        <p className="muted">3 séances par semaine, exercice par exercice (pas en circuit).</p>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        <div className="segmented">
          <button className={onglet === 'seances' ? 'active' : ''} onClick={() => setOnglet('seances')}>
            Séances
          </button>
          <button className={onglet === 'historique' ? 'active' : ''} onClick={() => setOnglet('historique')}>
            Historique
          </button>
        </div>

        {onglet === 'seances' &&
          SEANCES_TEMPLATES.map((seance) => {
            // Faite un autre jour cette semaine (pas seulement aujourd'hui) : ça reste "Revoir"
            // tant qu'on n'est pas reparti sur une nouvelle semaine calendaire.
            const faiteCetteSemaine = seancesLog.some(
              (s) => s.seanceTemplateId === seance.id && s.date >= debutSemaine && s.termineeA
            )
            const estAujourdHui = seance.id === idSeanceDuJour
            const [titreCourt, description] = seance.nom.split(' — ')
            return (
              <div
                className={`card ${faiteCetteSemaine ? 'green' : seance.lieu === 'salle' ? 'blue' : 'yellow'}`}
                style={{ padding: 14, marginBottom: 10 }}
                key={seance.id}
              >
                <div className="row-between" style={{ alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', margin: 0 }}>{titreCourt}</h3>
                      {estAujourdHui && <span className="pill pink">Aujourd'hui</span>}
                      {faiteCetteSemaine && <span className="pill green">✓ faite cette semaine</span>}
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
                    {faiteCetteSemaine ? 'Revoir' : 'Commencer'}
                  </button>
                </div>
              </div>
            )
          })}

        {onglet === 'seances' &&
          (autreActiviteDuJour ? (
            <div className="card green" style={{ padding: 14, marginBottom: 10 }}>
              <div className="row-between" style={{ alignItems: 'center', gap: 10 }}>
                <p className="small" style={{ fontWeight: 700, margin: 0 }}>
                  🏊 {autreActiviteDuJour.nomActivite} faite aujourd'hui
                  {autreActiviteDuJour.duree_min ? ` · ${autreActiviteDuJour.duree_min} min` : ''}
                </p>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => supprimerSeanceLog(autreActiviteDuJour.id)}
                  aria-label="Supprimer cette activité"
                >
                  🗑️
                </button>
              </div>
            </div>
          ) : formulaireAutreOuvert ? (
            <div className="card" style={{ padding: 14, marginBottom: 10 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>🏊 Autre activité aujourd'hui</h3>
              <div className="field-row" style={{ alignItems: 'flex-end' }}>
                <div className="field" style={{ flex: 2 }}>
                  <label>Activité</label>
                  <input
                    type="text"
                    value={nomAutreActivite}
                    onChange={(e) => setNomAutreActivite(e.target.value)}
                    placeholder="Natation, vélo, randonnée..."
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Durée (min)</label>
                  <input
                    type="number"
                    value={dureeAutreActivite}
                    onChange={(e) => setDureeAutreActivite(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="Optionnel"
                  />
                </div>
              </div>
              <div className="row gap-8 mt-8">
                <button className="btn btn-secondary btn-sm" onClick={enregistrerAutreActivite}>
                  Enregistrer
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setFormulaireAutreOuvert(false)}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button className="link-btn" onClick={() => setFormulaireAutreOuvert(true)}>
              🏊 Pas de salle aujourd'hui ? Enregistrer une autre activité →
            </button>
          ))}

        {onglet === 'historique' &&
          (terminees.length === 0 ? (
            <EtatVide emoji="💪" titre="Pas encore de séance terminée" texte="Tes séances passées apparaîtront ici." />
          ) : (
            <>
              <div className="segmented">
                <button className={sousOnglet === 'seances' ? 'active' : ''} onClick={() => setSousOnglet('seances')}>
                  Par séance
                </button>
                <button className={sousOnglet === 'progression' ? 'active' : ''} onClick={() => setSousOnglet('progression')}>
                  Progression
                </button>
              </div>

              {sousOnglet === 'seances' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {semaines.map(([debutSemaineHisto, logs]) => {
                    const ouverte = semainesOuvertes.has(debutSemaineHisto) || semaines[0][0] === debutSemaineHisto
                    return (
                      <div className="card" key={debutSemaineHisto} style={{ padding: 14 }}>
                        <button
                          className="row-between"
                          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0 }}
                          onClick={() => toggleSemaine(debutSemaineHisto)}
                        >
                          <span style={{ fontWeight: 800 }}>Semaine du {formatDateLong(debutSemaineHisto)}</span>
                          <span className="muted small">
                            {logs.length} séance{logs.length > 1 ? 's' : ''} {ouverte ? '▲' : '▼'}
                          </span>
                        </button>

                        {ouverte && (
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {logs.map((log) => {
                              const template = SEANCES_TEMPLATES.find((t) => t.id === log.seanceTemplateId)
                              const setsFaits = log.exercices.reduce((s, e) => s + e.sets.filter((x) => x.fait).length, 0)
                              const setsTotal = log.exercices.reduce((s, e) => s + e.sets.length, 0)
                              const detailOuvert = seancesOuvertes.has(log.id)
                              return (
                                <div key={log.id} style={{ background: '#fbf6f8', borderRadius: 12, padding: 10 }}>
                                  <button
                                    className="row-between"
                                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0 }}
                                    onClick={() => toggleSeance(log.id)}
                                  >
                                    <span>
                                      <strong>
                                        {log.seanceTemplateId === 'autre' ? `🏊 ${log.nomActivite}` : template?.nom || log.seanceTemplateId}
                                      </strong>{' '}
                                      <span className="muted small">{formatDateCourt(log.date)}</span>
                                    </span>
                                    {log.seanceTemplateId === 'autre' ? (
                                      log.duree_min && <span className="pill green">{log.duree_min} min</span>
                                    ) : (
                                      <span className="pill green">{setsFaits}/{setsTotal} séries</span>
                                    )}
                                  </button>

                                  {detailOuvert && (
                                    <div style={{ marginTop: 8 }}>
                                      {log.exercices.map((ex) => (
                                        <div className="list-row" key={ex.nom} style={{ padding: '8px 0' }}>
                                          <span className="small">{ex.nom}</span>
                                          <span className="muted small">
                                            {ex.poidsUtilise_kg ? `${ex.poidsUtilise_kg} kg · ` : ''}
                                            {ex.sets.filter((s) => s.fait).length}/{ex.sets.length} séries
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {sousOnglet === 'progression' && (
                <div>
                  <div className="field">
                    <label>Exercice</label>
                    <select value={nomExerciceActif} onChange={(e) => setExerciceChoisi(e.target.value)}>
                      {nomsExercices.map((nom) => (
                        <option key={nom} value={nom}>
                          {nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {donneesAvecValeur.length > 1 ? (
                    <div className="card" style={{ height: 240 }}>
                      <div className="row-between">
                        <h3 className="mb-0">{estPoidsDuCorps ? 'Répétitions totales' : 'Poids utilisé'}</h3>
                        {progression !== null && progression !== 0 && (
                          <span className={`pill ${progression > 0 ? 'green' : 'warning'}`}>
                            {progression > 0 ? '+' : ''}
                            {progression}
                            {estPoidsDuCorps ? ' reps' : ' kg'}
                          </span>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={donneesAvecValeur}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e4e9" />
                          <XAxis dataKey="date" tickFormatter={(v) => formatDateCourt(v)} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
                          <Tooltip
                            labelFormatter={(v) => formatDateCourt(v as string)}
                            formatter={(v) => [estPoidsDuCorps ? `${v} reps` : `${v} kg`, estPoidsDuCorps ? 'Répétitions' : 'Poids']}
                          />
                          <Line type="monotone" dataKey={valeurCle} stroke="#ff7fac" strokeWidth={3} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EtatVide
                      emoji="📈"
                      titre="Pas encore assez de données"
                      texte="Fais cet exercice sur au moins deux séances pour voir sa progression."
                    />
                  )}
                </div>
              )}
            </>
          ))}
      </div>
    </div>
  )
}
