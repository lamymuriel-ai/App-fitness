import type { SuiviJournalier } from '../types'

export interface PointMoyenne {
  date: string
  poidsMoyen: number | null
}

/** Calcule la moyenne mobile sur 7 jours du poids, jour par jour. */
export function moyenneMobile7Jours(entrees: SuiviJournalier[]): PointMoyenne[] {
  const avecPoids = entrees
    .filter((e) => typeof e.poids_kg === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))

  if (avecPoids.length === 0) return []

  const points: PointMoyenne[] = []
  for (let i = 0; i < avecPoids.length; i++) {
    const dateCourante = new Date(avecPoids[i].date)
    const fenetre = avecPoids.filter((e) => {
      const d = new Date(e.date)
      const diffJours = (dateCourante.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diffJours >= 0 && diffJours < 7
    })
    const moyenne =
      fenetre.reduce((sum, e) => sum + (e.poids_kg || 0), 0) / fenetre.length
    points.push({ date: avecPoids[i].date, poidsMoyen: Math.round(moyenne * 10) / 10 })
  }
  return points
}

/**
 * Détecte une stagnation : la moyenne mobile n'a pas baissé sur les 2 dernières semaines
 * (comparaison de la moyenne de la semaine la plus récente vs celle de la semaine précédente).
 */
export function detecterStagnation(entrees: SuiviJournalier[]): boolean {
  const points = moyenneMobile7Jours(entrees)
  if (points.length < 14) return false

  const dernieres14 = points.slice(-14)
  const semaine1 = dernieres14.slice(0, 7)
  const semaine2 = dernieres14.slice(7, 14)

  const moyenne1 =
    semaine1.reduce((s, p) => s + (p.poidsMoyen || 0), 0) / semaine1.length
  const moyenne2 =
    semaine2.reduce((s, p) => s + (p.poidsMoyen || 0), 0) / semaine2.length

  const evolution = moyenne2 - moyenne1
  // Stagnation si la moyenne n'a pas diminué d'au moins 0.1 kg
  return evolution > -0.1
}
