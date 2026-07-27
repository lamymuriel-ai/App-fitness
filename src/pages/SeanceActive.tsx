import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { SEANCES_TEMPLATES } from '../data/defaults'
import { dateDuJourISO, genererId } from '../utils/date'
import type { SeanceLog, ExerciceLog } from '../types'

export default function SeanceActive() {
  const { templateId } = useParams()
  return <SeanceActiveInner key={templateId} />
}

function SeanceActiveInner() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const { seancesLog, enregistrerSeanceLog, poidsParExercice, definirPoidsExercice } = useAppData()

  const template = SEANCES_TEMPLATES.find((s) => s.id === templateId)
  const aujourdHui = dateDuJourISO()

  const logExistant = seancesLog.find(
    (s) => s.seanceTemplateId === templateId && s.date === aujourdHui
  )

  const [log, setLog] = useState<SeanceLog>(() => {
    if (logExistant) return logExistant
    if (!template) {
      return { id: genererId(), seanceTemplateId: 'A', date: aujourdHui, termineeA: null, exercices: [] }
    }
    const exercices: ExerciceLog[] = template.exercices.map((ex) => ({
      nom: ex.nom,
      poidsUtilise_kg: ex.poidsDuCorps ? undefined : poidsParExercice[ex.nom],
      sets: Array.from({ length: ex.series }, () => ({ fait: false })),
    }))
    return {
      id: genererId(),
      seanceTemplateId: template.id,
      date: aujourdHui,
      termineeA: null,
      exercices,
    }
  })

  const progression = useMemo(() => {
    const totalSets = log.exercices.reduce((s, e) => s + e.sets.length, 0)
    const setsFaits = log.exercices.reduce((s, e) => s + e.sets.filter((x) => x.fait).length, 0)
    return totalSets > 0 ? Math.round((setsFaits / totalSets) * 100) : 0
  }, [log])

  if (!template) {
    return (
      <div className="screen">
        <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
        <p>Séance introuvable.</p>
      </div>
    )
  }

  async function basculerExercice(iEx: number) {
    const copie = structuredClone(log)
    const dejaFait = copie.exercices[iEx].sets.every((s) => s.fait)
    copie.exercices[iEx].sets = copie.exercices[iEx].sets.map(() => ({ fait: !dejaFait }))
    setLog(copie)
    await enregistrerSeanceLog(copie)
  }

  async function majPoids(iEx: number, poids: number) {
    const copie = structuredClone(log)
    copie.exercices[iEx].poidsUtilise_kg = poids
    setLog(copie)
    await enregistrerSeanceLog(copie)
    await definirPoidsExercice(copie.exercices[iEx].nom, poids)
  }

  async function terminerSeance() {
    const copie = structuredClone(log)
    copie.termineeA = new Date().toISOString()
    setLog(copie)
    await enregistrerSeanceLog(copie)
    navigate('/entrainement', { replace: true })
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>{template.nom}</h1>
      <p className="muted">
        On fait les 3 séries d'un exercice à la suite (avec repos entre chaque série), puis on
        passe au suivant — ce n'est pas un circuit.
      </p>

      <div className="card">
        <div className="progress-label-row">
          <span style={{ fontWeight: 800 }}>Progression</span>
          <span className="progress-sub">{progression}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill green" style={{ width: `${progression}%` }} />
        </div>
      </div>

      {template.exercices.map((ex, iEx) => {
        const exLog = log.exercices[iEx]
        return (
          <div className="card" key={ex.nom}>
            <h3>{ex.nom}</h3>
            <p className="muted small mb-0">
              {ex.series} séries × {ex.repsMin === ex.repsMax ? ex.repsMin : `${ex.repsMin}-${ex.repsMax}`}
              {ex.note ? ` (${ex.note})` : ' répétitions'}
            </p>

            {!ex.poidsDuCorps && (
              <div className="field mt-8">
                <label>Poids utilisé (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={exLog?.poidsUtilise_kg ?? ''}
                  onChange={(e) => majPoids(iEx, Number(e.target.value))}
                  placeholder="Ex. 25"
                />
                <div className="field-hint">Mémorisé automatiquement pour ta prochaine séance.</div>
              </div>
            )}

            <button
              className={`set-check-single mt-8 ${exLog?.sets.every((s) => s.fait) ? 'done' : ''}`}
              onClick={() => basculerExercice(iEx)}
            >
              {exLog?.sets.every((s) => s.fait) ? '✓ Fait' : 'OK'}
            </button>
          </div>
        )
      })}

      <button className="btn btn-primary mt-8" onClick={terminerSeance}>
        {log.termineeA ? '✓ Séance terminée — mettre à jour' : 'Terminer la séance'}
      </button>
    </div>
  )
}
