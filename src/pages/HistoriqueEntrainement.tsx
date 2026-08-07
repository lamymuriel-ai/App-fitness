import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useAppData } from '../context/AppDataContext'
import { SEANCES_TEMPLATES } from '../data/defaults'
import { debutSemaineISO, formatDateCourt, formatDateLong } from '../utils/date'
import { EtatVide } from '../components/ui'
import type { SeanceLog } from '../types'

function repsTotalExercice(ex: SeanceLog['exercices'][number]): number {
  return ex.sets.reduce((s, set) => s + (set.fait ? set.reps || 0 : 0), 0)
}

export default function HistoriqueEntrainement() {
  const navigate = useNavigate()
  const { seancesLog } = useAppData()
  const [onglet, setOnglet] = useState<'seances' | 'progression'>('seances')
  const [semainesOuvertes, setSemainesOuvertes] = useState<Set<string>>(new Set())
  const [seancesOuvertes, setSeancesOuvertes] = useState<Set<string>>(new Set())

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
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>🕘 Historique des séances</h1>

      {terminees.length === 0 ? (
        <EtatVide emoji="💪" titre="Pas encore de séance terminée" texte="Tes séances passées apparaîtront ici." />
      ) : (
        <>
          <div className="segmented">
            <button className={onglet === 'seances' ? 'active' : ''} onClick={() => setOnglet('seances')}>
              Par séance
            </button>
            <button className={onglet === 'progression' ? 'active' : ''} onClick={() => setOnglet('progression')}>
              Progression
            </button>
          </div>

          {onglet === 'seances' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {semaines.map(([debutSemaine, logs]) => {
                const ouverte = semainesOuvertes.has(debutSemaine) || semaines[0][0] === debutSemaine
                return (
                  <div className="card" key={debutSemaine} style={{ padding: 14 }}>
                    <button
                      className="row-between"
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0 }}
                      onClick={() => toggleSemaine(debutSemaine)}
                    >
                      <span style={{ fontWeight: 800 }}>Semaine du {formatDateLong(debutSemaine)}</span>
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
                                  <strong>{template?.nom || log.seanceTemplateId}</strong>{' '}
                                  <span className="muted small">{formatDateCourt(log.date)}</span>
                                </span>
                                <span className="pill green">{setsFaits}/{setsTotal} séries</span>
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

          {onglet === 'progression' && (
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
                      <Line
                        type="monotone"
                        dataKey={valeurCle}
                        stroke="#ff7fac"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
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
      )}
    </div>
  )
}
