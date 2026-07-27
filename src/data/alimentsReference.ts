import type { Micronutriments } from '../types'

export type MomentRepas = 'petit_dejeuner' | 'repas' | 'collation'

export interface AlimentReference {
  id: string
  nom: string
  emoji: string
  /** Portion "normale" suggérée pour une personne, en grammes. */
  portionReference_g: number
  /** À quel(s) moment(s) de la journée cet aliment se prête naturellement (filtre rapide). */
  moments: MomentRepas[]
  /** Valeurs nutritionnelles pour 100 g de cet aliment (repères généraux, pas une base précise type CIQUAL). */
  pour100g: {
    calories: number
    proteines_g: number
    lipides_g: number
    glucides_g: number
    micros: Partial<Micronutriments>
  }
}

// Repères nutritionnels généraux pour 100 g — à titre informatif (comme le reste de
// l'appli), pas une base de données scientifique précise. Couvre volontairement un
// éventail de familles d'aliments (protéines, féculents, légumes, fruits, oléagineux,
// laitiers) pour pouvoir répondre à des manques variés (protéines, fer, calcium,
// oméga-3, fibres...).
export const ALIMENTS_REFERENCE: AlimentReference[] = [
  { id: 'poulet', nom: 'Blanc de poulet', emoji: '🍗', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 165, proteines_g: 31, lipides_g: 3.6, glucides_g: 0, micros: { vitamineB6_mg: 0.6, zinc_mg: 1 } } },
  { id: 'oeuf', nom: 'Œufs', emoji: '🥚', portionReference_g: 100, moments: ['petit_dejeuner', 'repas'], // ~2 œufs
    pour100g: { calories: 155, proteines_g: 13, lipides_g: 11, glucides_g: 1.1, micros: { vitamineD_ug: 2, vitamineB12_ug: 1.1, vitamineA_ug: 160, fer_mg: 1.8 } } },
  { id: 'saumon', nom: 'Saumon', emoji: '🐟', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 208, proteines_g: 20, lipides_g: 13, glucides_g: 0, micros: { omega3_g: 2.3, vitamineD_ug: 11, vitamineB12_ug: 3.2 } } },
  { id: 'thon', nom: 'Thon (conserve au naturel)', emoji: '🐟', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 116, proteines_g: 26, lipides_g: 1, glucides_g: 0, micros: { omega3_g: 0.3, vitamineB12_ug: 2.2, vitamineD_ug: 1.7 } } },
  { id: 'sardines', nom: 'Sardines (conserve à l\'huile, égouttées)', emoji: '🐟', portionReference_g: 90, moments: ['repas'],
    pour100g: { calories: 208, proteines_g: 25, lipides_g: 11, glucides_g: 0, micros: { omega3_g: 1.5, calcium_mg: 380, vitamineD_ug: 4.8, vitamineB12_ug: 8.9 } } },
  { id: 'boeuf', nom: 'Bœuf haché 5%', emoji: '🥩', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 137, proteines_g: 21, lipides_g: 5, glucides_g: 0, micros: { fer_mg: 2.6, zinc_mg: 4.8, vitamineB12_ug: 2.6 } } },
  { id: 'tofu', nom: 'Tofu', emoji: '🧊', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 76, proteines_g: 8, lipides_g: 4.8, glucides_g: 1.9, micros: { fer_mg: 1.6, calcium_mg: 350, magnesium_mg: 30 } } },
  { id: 'lentilles', nom: 'Lentilles cuites', emoji: '🫘', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 116, proteines_g: 9, lipides_g: 0.4, glucides_g: 20, micros: { fer_mg: 3.3, fibres_g: 7.9, magnesium_mg: 36 } } },
  { id: 'pois_chiches', nom: 'Pois chiches cuits', emoji: '🫘', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 164, proteines_g: 8.9, lipides_g: 2.6, glucides_g: 27, micros: { fer_mg: 2.9, fibres_g: 7.6, magnesium_mg: 48 } } },
  { id: 'yaourt', nom: 'Yaourt nature', emoji: '🥣', portionReference_g: 125, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 61, proteines_g: 3.5, lipides_g: 3.3, glucides_g: 4.7, micros: { calcium_mg: 125, vitamineB12_ug: 0.4 } } },
  { id: 'fromage_blanc', nom: 'Fromage blanc 20%', emoji: '🥛', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 78, proteines_g: 8, lipides_g: 3, glucides_g: 4, micros: { calcium_mg: 100 } } },
  { id: 'lait', nom: 'Lait demi-écrémé', emoji: '🥛', portionReference_g: 200, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 46, proteines_g: 3.3, lipides_g: 1.6, glucides_g: 4.8, micros: { calcium_mg: 120, vitamineB12_ug: 0.4 } } },
  { id: 'epinards', nom: 'Épinards cuits', emoji: '🥬', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 23, proteines_g: 2.9, lipides_g: 0.4, glucides_g: 3.6, micros: { fer_mg: 2.7, vitamineA_ug: 470, vitamineC_mg: 10, magnesium_mg: 58, fibres_g: 2.4 } } },
  { id: 'brocoli', nom: 'Brocoli cuit', emoji: '🥦', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 35, proteines_g: 2.4, lipides_g: 0.4, glucides_g: 7, micros: { vitamineC_mg: 65, fibres_g: 3.3, calcium_mg: 47 } } },
  { id: 'poivron', nom: 'Poivron rouge', emoji: '🫑', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 31, proteines_g: 1, lipides_g: 0.3, glucides_g: 6, micros: { vitamineC_mg: 128, vitamineA_ug: 157, fibres_g: 2.1 } } },
  { id: 'patate_douce', nom: 'Patate douce cuite', emoji: '🍠', portionReference_g: 200, moments: ['repas'],
    pour100g: { calories: 86, proteines_g: 1.6, lipides_g: 0.1, glucides_g: 20, micros: { vitamineA_ug: 700, fibres_g: 3, vitamineC_mg: 2.4 } } },
  { id: 'riz_complet', nom: 'Riz complet cuit', emoji: '🍚', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 123, proteines_g: 2.7, lipides_g: 1, glucides_g: 26, micros: { magnesium_mg: 43, fibres_g: 1.8 } } },
  { id: 'quinoa', nom: 'Quinoa cuit', emoji: '🍚', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 120, proteines_g: 4.4, lipides_g: 1.9, glucides_g: 21, micros: { fer_mg: 1.5, magnesium_mg: 64, fibres_g: 2.8 } } },
  { id: 'avoine', nom: 'Flocons d\'avoine', emoji: '🥣', portionReference_g: 50, moments: ['petit_dejeuner'],
    pour100g: { calories: 389, proteines_g: 13, lipides_g: 7, glucides_g: 66, micros: { fer_mg: 4.7, magnesium_mg: 177, fibres_g: 10.6, zinc_mg: 4 } } },
  { id: 'banane', nom: 'Banane', emoji: '🍌', portionReference_g: 120, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 89, proteines_g: 1.1, lipides_g: 0.3, glucides_g: 23, micros: { magnesium_mg: 27, fibres_g: 2.6, vitamineB6_mg: 0.4 } } },
  { id: 'orange', nom: 'Orange', emoji: '🍊', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 47, proteines_g: 0.9, lipides_g: 0.1, glucides_g: 12, micros: { vitamineC_mg: 53, fibres_g: 2.4 } } },
  { id: 'kiwi', nom: 'Kiwi', emoji: '🥝', portionReference_g: 100, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 61, proteines_g: 1.1, lipides_g: 0.5, glucides_g: 15, micros: { vitamineC_mg: 93, fibres_g: 3 } } },
  { id: 'avocat', nom: 'Avocat', emoji: '🥑', portionReference_g: 100, moments: ['petit_dejeuner', 'repas'],
    pour100g: { calories: 160, proteines_g: 2, lipides_g: 15, glucides_g: 9, micros: { fibres_g: 6.7, vitamineE_mg: 2.1, magnesium_mg: 29 } } },
  { id: 'amandes', nom: 'Amandes', emoji: '🌰', portionReference_g: 30, moments: ['collation'],
    pour100g: { calories: 579, proteines_g: 21, lipides_g: 50, glucides_g: 22, micros: { magnesium_mg: 270, vitamineE_mg: 25.6, fibres_g: 12.5, calcium_mg: 269 } } },
  { id: 'noix', nom: 'Noix', emoji: '🌰', portionReference_g: 30, moments: ['collation'],
    pour100g: { calories: 654, proteines_g: 15, lipides_g: 65, glucides_g: 14, micros: { omega3_g: 9, magnesium_mg: 158, vitamineE_mg: 0.7, fibres_g: 6.7 } } },
  { id: 'graines_chia', nom: 'Graines de chia', emoji: '🌱', portionReference_g: 20, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 486, proteines_g: 17, lipides_g: 31, glucides_g: 42, micros: { omega3_g: 17.8, calcium_mg: 631, fibres_g: 34.4, magnesium_mg: 335 } } },
  { id: 'beurre_cacahuete', nom: 'Beurre de cacahuète', emoji: '🥜', portionReference_g: 20, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 588, proteines_g: 25, lipides_g: 50, glucides_g: 20, micros: { magnesium_mg: 168, vitamineE_mg: 9.3, fibres_g: 6 } } },
]
