import type { Micronutriments, ProfilUtilisatrice, Repas } from '../types'
import { MICRO_REFERENCE, SUPPLEMENTS_QUOTIDIENS } from '../data/defaults'

const FACTEURS_ACTIVITE: Record<ProfilUtilisatrice['niveauActivite'], number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
}

/** Formule de Mifflin-St Jeor — donne un ordre de grandeur, pas un avis médical. */
export function calculerMetabolismeBase(profil: ProfilUtilisatrice): number {
  const base = 10 * profil.poids_kg + 6.25 * profil.taille_cm - 5 * profil.age
  return profil.sexe === 'femme' ? base - 161 : base + 5
}

export function calculerDepenseTotale(profil: ProfilUtilisatrice): number {
  const bmr = calculerMetabolismeBase(profil)
  return Math.round(bmr * FACTEURS_ACTIVITE[profil.niveauActivite])
}

/** Suggestion de répartition calorique/macros à partir du profil. Purement indicatif. */
export function suggererObjectifsNutritionnels(profil: ProfilUtilisatrice) {
  const depense = calculerDepenseTotale(profil)
  let calories = depense
  if (profil.objectif === 'perte_poids') calories = depense - 450
  if (profil.objectif === 'prise_masse') calories = depense + 300
  calories = Math.max(1200, Math.round(calories / 10) * 10)

  const proteines_g = Math.round(profil.poids_kg * 2)
  const lipides_g = Math.round((calories * 0.32) / 9)
  const glucidesRestantes = calories - proteines_g * 4 - lipides_g * 9
  const glucides_g = Math.max(0, Math.round(glucidesRestantes / 4))

  return { calories, proteines_g, lipides_g, glucides_g }
}

export function totauxRepas(repas: Repas[]) {
  return repas.reduce(
    (acc, r) => {
      acc.calories += r.calories
      acc.proteines_g += r.proteines_g
      acc.lipides_g += r.lipides_g
      acc.glucides_g += r.glucides_g
      for (const cle of Object.keys(r.micros) as (keyof Micronutriments)[]) {
        acc.micros[cle] += r.micros[cle] || 0
      }
      return acc
    },
    {
      calories: 0,
      proteines_g: 0,
      lipides_g: 0,
      glucides_g: 0,
      micros: { ...vide() },
    }
  )
}

/** Ajoute la contribution fixe des compléments quotidiens (fer, magnésium...) à un apport déjà calculé. */
export function ajouterSupplements(micros: Micronutriments): Micronutriments {
  const resultat = { ...micros }
  for (const cle of Object.keys(SUPPLEMENTS_QUOTIDIENS) as (keyof Micronutriments)[]) {
    resultat[cle] += SUPPLEMENTS_QUOTIDIENS[cle] ?? 0
  }
  return resultat
}

/** Apport moyen quotidien en micronutriments sur les 7 derniers jours (jusqu'à dateReference incluse). */
export function calculerMoyenneMicrosSemaine(repas: Repas[], dateReference: string): Micronutriments {
  const seuil = new Date(`${dateReference}T00:00:00`)
  seuil.setDate(seuil.getDate() - 6)
  const septDerniersJours = repas.filter((r) => new Date(r.dateHeure) >= seuil)
  const totaux = totauxRepas(septDerniersJours)
  const joursAvecDonnees = Math.max(1, new Set(septDerniersJours.map((r) => r.dateHeure.slice(0, 10))).size)
  const moyenne = { ...totaux.micros }
  for (const cle of Object.keys(moyenne) as (keyof Micronutriments)[]) {
    moyenne[cle] = totaux.micros[cle] / joursAvecDonnees
  }
  return moyenne
}

function vide(): Micronutriments {
  return {
    fer_mg: 0,
    calcium_mg: 0,
    magnesium_mg: 0,
    zinc_mg: 0,
    vitamineA_ug: 0,
    vitamineC_mg: 0,
    vitamineD_ug: 0,
    vitamineE_mg: 0,
    vitamineB6_mg: 0,
    vitamineB12_ug: 0,
    omega3_g: 0,
    fibres_g: 0,
  }
}

export type StatutNutriment = 'faible' | 'ok' | 'eleve'

export interface AnalyseNutriment {
  cle: keyof Micronutriments
  label: string
  labelCourt: string
  unite: string
  emoji: string
  sources: string
  apport: number
  reference: number
  pourcentage: number
  statut: StatutNutriment
}

/**
 * Compare les apports moyens (jour ou semaine) aux repères de référence.
 * Seuils : < 70% = faible, > 180% = élevé (informatif, jamais un diagnostic).
 */
export function analyserMicronutriments(
  apportsMoyens: Micronutriments,
  referenceProfil: Micronutriments
): AnalyseNutriment[] {
  return MICRO_REFERENCE.map((info) => {
    const apport = apportsMoyens[info.cle] || 0
    const reference = referenceProfil[info.cle] || info.reference
    const pourcentage = reference > 0 ? Math.round((apport / reference) * 100) : 0
    let statut: StatutNutriment = 'ok'
    if (pourcentage < 70) statut = 'faible'
    else if (pourcentage > 180) statut = 'eleve'
    return {
      cle: info.cle,
      label: info.label,
      labelCourt: info.labelCourt ?? info.label,
      unite: info.unite,
      emoji: info.emoji,
      sources: info.sources,
      apport,
      reference,
      pourcentage,
      statut,
    }
  })
}
