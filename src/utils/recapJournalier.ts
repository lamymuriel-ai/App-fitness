import type { ProfilUtilisatrice, Repas, SeanceLog, SuiviJournalier } from '../types'
import { PLANNING_SEMAINE } from '../data/defaults'
import { totauxRepas } from './nutrition'

export type StatutMetrique = 'ok' | 'attention' | 'absent'
export type StatutSport = StatutMetrique | 'repos'

export interface RecapJour {
  date: string // ISO YYYY-MM-DD
  sommeil: StatutMetrique
  calories: StatutMetrique
  pas: StatutMetrique
  sport: StatutSport
  global: StatutMetrique
}

const TOLERANCE_CALORIES_MAX = 0.15 // toléré jusqu'à +15% au-dessus de l'objectif
const SOMMEIL_MIN_H = 7

function statutSommeil(entree: SuiviJournalier | undefined): StatutMetrique {
  if (entree?.sommeil_h === undefined) return 'absent'
  return entree.sommeil_h >= SOMMEIL_MIN_H ? 'ok' : 'attention'
}

function statutPas(entree: SuiviJournalier | undefined, objectifPas: number): StatutMetrique {
  if (entree?.pas === undefined) return 'absent'
  return entree.pas >= objectifPas ? 'ok' : 'attention'
}

function statutCalories(repasDuJour: Repas[], objectifCalories: number): StatutMetrique {
  if (repasDuJour.length === 0) return 'absent'
  // Objectif de perte de graisse : rester sous l'objectif (voire bien en dessous) est
  // toujours dans les clous, seul un dépassement compte comme un écart à ajuster.
  const { calories } = totauxRepas(repasDuJour)
  return calories <= objectifCalories * (1 + TOLERANCE_CALORIES_MAX) ? 'ok' : 'attention'
}

function statutSport(date: string, seancesLog: SeanceLog[]): StatutSport {
  // Une séance réellement faite ce jour-là compte, même un jour où rien n'était prévu
  // (planning déplacé, séance de rattrapage...) — on ne se limite pas à vérifier si LA
  // séance prévue ce jour précis a été cochée.
  const seanceFaite = seancesLog.some((s) => s.date === date && s.termineeA)
  if (seanceFaite) return 'ok'
  const jourSemaine = new Date(`${date}T00:00:00`).getDay()
  const idSeancePrevue = PLANNING_SEMAINE[jourSemaine]
  return idSeancePrevue ? 'attention' : 'repos'
}

function statutGlobal(statuts: StatutMetrique[]): StatutMetrique {
  const avecDonnees = statuts.filter((s) => s !== 'absent')
  if (avecDonnees.length === 0) return 'absent'
  return avecDonnees.some((s) => s === 'attention') ? 'attention' : 'ok'
}

export function calculerRecapJour(
  date: string,
  profil: ProfilUtilisatrice,
  suiviJournalier: SuiviJournalier[],
  repas: Repas[],
  seancesLog: SeanceLog[]
): RecapJour {
  const entree = suiviJournalier.find((e) => e.date === date)
  const repasDuJour = repas.filter((r) => r.dateHeure.slice(0, 10) === date)

  const sommeil = statutSommeil(entree)
  const calories = statutCalories(repasDuJour, profil.objectifsNutritionnels.calories)
  const pas = statutPas(entree, profil.objectifPas)
  const sport = statutSport(date, seancesLog)

  const metriquesPourGlobal: StatutMetrique[] = [sommeil, calories, pas]
  if (sport !== 'repos') metriquesPourGlobal.push(sport)

  return {
    date,
    sommeil,
    calories,
    pas,
    sport,
    global: statutGlobal(metriquesPourGlobal),
  }
}
