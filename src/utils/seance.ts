import type { SeanceLog } from '../types'

/**
 * Une séance ne compte comme "faite" que si TOUTES les séries de TOUS ses exercices sont
 * cochées — pas seulement parce qu'elle a été ouverte et "Terminer la séance" cliqué. Sans
 * ce contrôle, une séance jamais réellement pratiquée (0 série cochée) se finalise quand
 * même dès qu'on appuie sur "Terminer" (terminerSeance() saute l'étape bilan et finalise
 * directement si aucun exercice n'est complet), et ce log — vide mais avec termineeA rempli
 * — était ensuite compté comme faite partout (semaine, streak, récap du jour).
 *
 * Une "autre activité" (natation, vélo...) n'a pas d'exercices/séries : elle compte comme
 * faite dès qu'elle est enregistrée (termineeA rempli), c'est le seul cas particulier.
 */
export function seanceEstReussie(log: SeanceLog): boolean {
  if (!log.termineeA) return false
  if (log.seanceTemplateId === 'autre') return true
  if (log.exercices.length === 0) return false
  return log.exercices.every((ex) => ex.sets.length > 0 && ex.sets.every((set) => set.fait))
}
