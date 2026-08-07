import type { ProfilUtilisatrice, Repas, SeanceLog, SuiviJournalier } from '../types'
import { PLANNING_SEMAINE } from '../data/defaults'
import { totauxRepas } from './nutrition'
import { ajouterJours, dateDuJourISO, debutSemaineISO } from './date'

const NB_SEANCES_PAR_SEMAINE = Object.values(PLANNING_SEMAINE).filter(Boolean).length

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

  // Une fois les séances de la semaine toutes faites (même décalées par rapport au
  // planning habituel), le reste de la semaine est du repos — pas la peine de continuer
  // à réclamer une séance "prévue" ce jour-là si l'objectif de la semaine est déjà atteint.
  const lundiSemaine = debutSemaineISO(date)
  const nbSeancesFaitesSemaine = seancesLog.filter(
    (s) => s.termineeA && s.date >= lundiSemaine && s.date <= ajouterJours(lundiSemaine, 6)
  ).length
  if (nbSeancesFaitesSemaine >= NB_SEANCES_PAR_SEMAINE) return 'repos'

  const jourSemaine = new Date(`${date}T00:00:00`).getDay()
  const idSeancePrevue = PLANNING_SEMAINE[jourSemaine]
  if (!idSeancePrevue) return 'repos'
  // Un jour à venir ne peut pas encore être "à ajuster" : la séance prévue n'a simplement
  // pas encore eu lieu, ce n'est pas un écart constaté.
  if (date > dateDuJourISO()) return 'absent'
  return 'attention'
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
