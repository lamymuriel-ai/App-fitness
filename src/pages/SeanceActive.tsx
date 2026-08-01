import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { SEANCES_TEMPLATES } from '../data/defaults'
import { dateDuJourISO, genererId } from '../utils/date'
import type { SeanceLog, ExerciceLog, Difficulte } from '../types'

const AJUSTEMENT_KG = 2.5

const OPTIONS_DIFFICULTE: { valeur: Difficulte; emoji: string; label: string }[] = [
  { valeur: 'facile', emoji: '😌', label: 'Facile' },
  { valeur: 'normal', emoji: '🙂', label: 'Normal' },
  { valeur: 'dur', emoji: '😤', label: 'Dur' },
]

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

  const [etapeBilan, setEtapeBilan] = useState(false)

  const progression = useMemo(() => {
    const totalSets = log.exercices.reduce((s, e) => s + e.sets.length, 0)
    const setsFaits = log.exercices.reduce((s, e) => s + e.sets.filter((x) => x.fait).length, 0)
    return totalSets > 0 ? Math.round((setsFaits / totalSets) * 100) : 0
  }, [log])

  // Séance précédente du même type dont au moins un exercice a été noté (facile/normal/dur),
  // pour proposer de recalculer les poids de la séance du jour à partir de ce ressenti.
  const seancePrecedenteNotee = useMemo(() => {
    if (!template) return null
    const precedente = seancesLog
      .filter((s) => s.seanceTemplateId === template.id && s.termineeA && s.id !== log.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (!precedente || !precedente.exercices.some((e) => e.difficulte)) return null
    return precedente
  }, [seancesLog, template, log.id])

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

  async function recalculerPoids() {
    if (!seancePrecedenteNotee) return
    const copie = structuredClone(log)
    for (const exLog of copie.exercices) {
      const exPrecedent = seancePrecedenteNotee.exercices.find((e) => e.nom === exLog.nom)
      if (!exPrecedent?.difficulte || exPrecedent.poidsUtilise_kg === undefined) continue
      if (exPrecedent.difficulte === 'dur') exLog.poidsUtilise_kg = Math.max(0, exPrecedent.poidsUtilise_kg - AJUSTEMENT_KG)
      else if (exPrecedent.difficulte === 'facile') exLog.poidsUtilise_kg = exPrecedent.poidsUtilise_kg + AJUSTEMENT_KG
      else exLog.poidsUtilise_kg = exPrecedent.poidsUtilise_kg
    }
    setLog(copie)
    await enregistrerSeanceLog(copie)
    await Promise.all(
      copie.exercices
        .filter((e) => e.poidsUtilise_kg !== undefined)
        .map((e) => definirPoidsExercice(e.nom, e.poidsUtilise_kg as number))
    )
  }

  async function definirDifficulte(iEx: number, difficulte: Difficulte) {
    const copie = structuredClone(log)
    copie.exercices[iEx].difficulte = difficulte
    setLog(copie)
    await enregistrerSeanceLog(copie)
  }

  async function finaliserSeance() {
    const copie = structuredClone(log)
    copie.termineeA = new Date().toISOString()
    setLog(copie)
    await enregistrerSeanceLog(copie)
    navigate('/entrainement', { replace: true })
  }

  function terminerSeance() {
    // Si la séance est déjà terminée, on garde une mise à jour directe (pas besoin de
    // redemander le ressenti d'exercices déjà notés la première fois).
    if (log.termineeA) {
      finaliserSeance()
      return
    }
    const auMoinsUnExerciceFait = log.exercices.some((e) => e.sets.length > 0 && e.sets.every((s) => s.fait))
    if (!auMoinsUnExerciceFait) {
      finaliserSeance()
      return
    }
    setEtapeBilan(true)
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

      {seancePrecedenteNotee && !log.termineeA && !etapeBilan && (
        <button className="btn btn-outline" onClick={recalculerPoids}>
          🔄 Recalculer les poids selon la dernière séance
        </button>
      )}

      {etapeBilan ? (
        <>
          <p className="muted small">
            C'était comment ? Ça sert à ajuster les poids de la prochaine séance.
          </p>
          {log.exercices.map((exLog, iEx) => {
            const ex = template.exercices[iEx]
            if (!exLog.sets.every((s) => s.fait) || exLog.sets.length === 0) return null
            return (
              <div className="card" key={ex.nom}>
                <h3 style={{ marginBottom: 8 }}>{ex.nom}</h3>
                <div className="segmented" style={{ marginBottom: 0 }}>
                  {OPTIONS_DIFFICULTE.map((option) => (
                    <button
                      key={option.valeur}
                      className={exLog.difficulte === option.valeur ? 'active' : ''}
                      onClick={() => definirDifficulte(iEx, option.valeur)}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <button className="btn btn-primary mt-8" onClick={finaliserSeance}>
            Valider et terminer la séance
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
