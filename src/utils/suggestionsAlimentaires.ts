import type { Micronutriments, ObjectifsNutritionnels } from '../types'
import { ALIMENTS_REFERENCE, type AlimentReference, type MomentRepas } from '../data/alimentsReference'
import { MICRO_REFERENCE } from '../data/defaults'
import { analyserMicronutriments } from './nutrition'

export interface SuggestionAliment {
  aliment: AlimentReference
  portion_g: number
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
  raisons: string[]
}

export interface BudgetRestant {
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
}

/** Calorie/macros restant sur l'objectif du jour, plafonné à 0 (jamais négatif). */
export function calculerBudgetRestant(
  totauxJour: { calories: number; proteines_g: number; lipides_g: number; glucides_g: number },
  objectifs: ObjectifsNutritionnels
): BudgetRestant {
  return {
    calories: Math.max(0, objectifs.calories - totauxJour.calories),
    proteines_g: Math.max(0, objectifs.proteines_g - totauxJour.proteines_g),
    lipides_g: Math.max(0, objectifs.lipides_g - totauxJour.lipides_g),
    glucides_g: Math.max(0, objectifs.glucides_g - totauxJour.glucides_g),
  }
}

const MICRO_VIDE: Micronutriments = {
  fer_mg: 0, calcium_mg: 0, magnesium_mg: 0, zinc_mg: 0,
  vitamineA_ug: 0, vitamineC_mg: 0, vitamineD_ug: 0, vitamineE_mg: 0,
  vitamineB6_mg: 0, vitamineB12_ug: 0, omega3_g: 0, fibres_g: 0,
}

function pourPortion(aliment: AlimentReference, portion_g: number) {
  const ratio = portion_g / 100
  const micros: Micronutriments = { ...MICRO_VIDE }
  for (const cle of Object.keys(aliment.pour100g.micros) as (keyof Micronutriments)[]) {
    micros[cle] = (aliment.pour100g.micros[cle] || 0) * ratio
  }
  return {
    calories: aliment.pour100g.calories * ratio,
    proteines_g: aliment.pour100g.proteines_g * ratio,
    lipides_g: aliment.pour100g.lipides_g * ratio,
    glucides_g: aliment.pour100g.glucides_g * ratio,
    micros,
  }
}

const PORTION_MINIMALE_G = 15 // en dessous, la suggestion n'a plus vraiment de sens

/**
 * Propose des aliments pour compléter la journée à partir de ce qu'il reste à
 * manger (calories/macros) et des micronutriments faibles cette semaine — jamais des
 * aliments qui feraient dépasser l'objectif calorique du jour. Purement informatif,
 * basé sur un petit répertoire d'aliments courants (src/data/alimentsReference.ts),
 * pas une recommandation nutritionnelle personnalisée.
 */
export function genererSuggestions(
  budgetRestant: BudgetRestant,
  moyenneMicrosSemaine: Micronutriments,
  reference: Micronutriments,
  limite = 5,
  filtreMoment?: MomentRepas
): SuggestionAliment[] {
  if (budgetRestant.calories < PORTION_MINIMALE_G) return [] // quasi plus de marge, rien à proposer

  const analyseMicros = analyserMicronutriments(moyenneMicrosSemaine, reference)
  const microsFaibles = new Set(analyseMicros.filter((a) => a.statut === 'faible').map((a) => a.cle))

  const candidats: { suggestion: SuggestionAliment; score: number }[] = []

  for (const aliment of ALIMENTS_REFERENCE) {
    if (filtreMoment && !aliment.moments.includes(filtreMoment)) continue

    // On part de la portion de référence, réduite si besoin pour tenir dans les
    // calories restantes (jamais l'inverse : on ne propose jamais plus que ce qui reste).
    let portion_g = aliment.portionReference_g
    const caloriesPortionPleine = (aliment.pour100g.calories * portion_g) / 100
    if (caloriesPortionPleine > budgetRestant.calories) {
      portion_g = (budgetRestant.calories / aliment.pour100g.calories) * 100
    }
    if (portion_g < PORTION_MINIMALE_G) continue // portion devenue trop petite pour être utile

    const valeurs = pourPortion(aliment, portion_g)

    // Chaque critère est noté sur la même échelle (0 à 4), proportionnellement à sa
    // contribution réelle au besoin — pas un bonus fixe. Sans ça, "riche en protéines"
    // dominerait toujours le classement même quand le vrai manque de la semaine est un
    // micronutriment précis (ex. le fer), puisqu'un bonus fixe plus élevé pour les
    // protéines masquerait des aliments qui comblent une carence bien plus marquée.
    const SEUIL_CONTRIBUTION = 0.15 // en dessous, la contribution est jugée trop faible pour être mise en avant
    const POIDS_MAX = 4

    const raisons: string[] = []
    let score = 0

    if (budgetRestant.proteines_g > 0) {
      const contribution = valeurs.proteines_g / budgetRestant.proteines_g
      if (contribution >= SEUIL_CONTRIBUTION) {
        score += Math.min(contribution, 1) * POIDS_MAX
        raisons.push(`Riche en protéines (il t'en reste ~${Math.round(budgetRestant.proteines_g)} g à atteindre)`)
      }
    }

    for (const info of MICRO_REFERENCE) {
      if (!microsFaibles.has(info.cle)) continue
      const contribution = (valeurs.micros[info.cle] || 0) / info.reference
      if (contribution >= SEUIL_CONTRIBUTION) {
        score += Math.min(contribution, 1) * POIDS_MAX
        raisons.push(`${info.emoji} Riche en ${info.label.toLowerCase()} (un peu faible cette semaine)`)
      }
    }

    if (raisons.length === 0) {
      raisons.push("Complète ce qu'il te reste pour aujourd'hui")
    }

    candidats.push({
      score,
      suggestion: {
        aliment,
        portion_g: Math.round(portion_g),
        calories: valeurs.calories,
        proteines_g: valeurs.proteines_g,
        lipides_g: valeurs.lipides_g,
        glucides_g: valeurs.glucides_g,
        micros: valeurs.micros,
        raisons,
      },
    })
  }

  return candidats
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map((c) => c.suggestion)
}
