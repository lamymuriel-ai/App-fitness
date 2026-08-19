import type { SeanceLog } from '../types'
import { PLANNING_SEMAINE } from '../data/defaults'
import { ajouterJours, dateDuJourISO, debutSemaineISO } from './date'

const NB_SEANCES_PAR_SEMAINE = Object.values(PLANNING_SEMAINE).filter(Boolean).length

/**
 * Nombre de semaines calendaires consécutives où l'objectif hebdomadaire de séances a été
 * atteint, en remontant depuis la semaine en cours. La semaine en cours ne compte que si
 * elle a déjà atteint l'objectif — sinon elle est encore en train de se jouer et ne doit
 * pas casser artificiellement le streak avant même d'être terminée. Valorise la régularité
 * dans le temps plutôt que seulement le résultat du jour.
 */
export function calculerStreakSemaines(seancesLog: SeanceLog[], dateReference = dateDuJourISO()): number {
  function nbSeancesSemaine(lundi: string): number {
    const dimanche = ajouterJours(lundi, 6)
    return seancesLog.filter((s) => s.termineeA && s.date >= lundi && s.date <= dimanche).length
  }

  let lundi = debutSemaineISO(dateReference)
  let streak = 0
  if (nbSeancesSemaine(lundi) >= NB_SEANCES_PAR_SEMAINE) {
    streak++
  }
  lundi = ajouterJours(lundi, -7)
  while (nbSeancesSemaine(lundi) >= NB_SEANCES_PAR_SEMAINE) {
    streak++
    lundi = ajouterJours(lundi, -7)
  }
  return streak
}
