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

  // Protéines supplémentaires
  { id: 'dinde', nom: 'Blanc de dinde', emoji: '🦃', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 135, proteines_g: 29, lipides_g: 1.5, glucides_g: 0, micros: { vitamineB6_mg: 0.5, zinc_mg: 1.5 } } },
  { id: 'jambon_blanc', nom: 'Jambon blanc', emoji: '🍖', portionReference_g: 60, moments: ['repas', 'collation'],
    pour100g: { calories: 107, proteines_g: 20, lipides_g: 2.5, glucides_g: 0.5, micros: { zinc_mg: 1.3, vitamineB12_ug: 0.5 } } },
  { id: 'crevettes', nom: 'Crevettes cuites', emoji: '🍤', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 99, proteines_g: 20, lipides_g: 1.5, glucides_g: 0.2, micros: { vitamineB12_ug: 1.4, zinc_mg: 1.3, omega3_g: 0.3 } } },
  { id: 'cabillaud', nom: 'Cabillaud cuit', emoji: '🐟', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 105, proteines_g: 23, lipides_g: 1, glucides_g: 0, micros: { vitamineB12_ug: 1.5, vitamineD_ug: 1 } } },
  { id: 'maquereau', nom: 'Maquereau', emoji: '🐟', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 205, proteines_g: 19, lipides_g: 14, glucides_g: 0, micros: { omega3_g: 2.5, vitamineD_ug: 8, vitamineB12_ug: 8.7 } } },
  { id: 'seitan', nom: 'Seitan', emoji: '🍢', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 130, proteines_g: 25, lipides_g: 2, glucides_g: 4, micros: { fer_mg: 2 } } },
  { id: 'edamame', nom: 'Edamame', emoji: '🫛', portionReference_g: 100, moments: ['repas', 'collation'],
    pour100g: { calories: 121, proteines_g: 11, lipides_g: 5, glucides_g: 10, micros: { fer_mg: 2.3, fibres_g: 5, magnesium_mg: 64 } } },
  { id: 'haricots_rouges', nom: 'Haricots rouges cuits', emoji: '🫘', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 127, proteines_g: 8.7, lipides_g: 0.5, glucides_g: 22.8, micros: { fer_mg: 2.9, fibres_g: 6.4, magnesium_mg: 45 } } },
  { id: 'skyr', nom: 'Skyr nature', emoji: '🥣', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 63, proteines_g: 11, lipides_g: 0.2, glucides_g: 4, micros: { calcium_mg: 120, vitamineB12_ug: 0.5 } } },
  { id: 'fromage_cottage', nom: 'Fromage cottage', emoji: '🧀', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 98, proteines_g: 11, lipides_g: 4.3, glucides_g: 3.4, micros: { calcium_mg: 83 } } },

  // Légumes supplémentaires
  { id: 'carotte', nom: 'Carotte cuite', emoji: '🥕', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 35, proteines_g: 0.8, lipides_g: 0.2, glucides_g: 8, micros: { vitamineA_ug: 850, fibres_g: 3 } } },
  { id: 'courgette', nom: 'Courgette cuite', emoji: '🥒', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 17, proteines_g: 1.2, lipides_g: 0.3, glucides_g: 3, micros: { vitamineC_mg: 10, fibres_g: 1 } } },
  { id: 'tomate', nom: 'Tomate', emoji: '🍅', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 18, proteines_g: 0.9, lipides_g: 0.2, glucides_g: 3.9, micros: { vitamineC_mg: 14, fibres_g: 1.2 } } },
  { id: 'champignon', nom: 'Champignons cuits', emoji: '🍄', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 22, proteines_g: 3, lipides_g: 0.3, glucides_g: 2, micros: { vitamineD_ug: 0.2, fibres_g: 1.5 } } },
  { id: 'chou_fleur', nom: 'Chou-fleur cuit', emoji: '🥦', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 25, proteines_g: 2, lipides_g: 0.3, glucides_g: 4, micros: { vitamineC_mg: 44, fibres_g: 2 } } },
  { id: 'haricots_verts', nom: 'Haricots verts cuits', emoji: '🌱', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 31, proteines_g: 1.8, lipides_g: 0.2, glucides_g: 7, micros: { fibres_g: 3.4, vitamineC_mg: 12 } } },
  { id: 'salade_verte', nom: 'Salade verte', emoji: '🥗', portionReference_g: 50, moments: ['repas'],
    pour100g: { calories: 15, proteines_g: 1.4, lipides_g: 0.2, glucides_g: 2, micros: { vitamineA_ug: 150, fibres_g: 1.3 } } },
  { id: 'concombre', nom: 'Concombre', emoji: '🥒', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 15, proteines_g: 0.7, lipides_g: 0.1, glucides_g: 3.6, micros: { vitamineC_mg: 3 } } },
  { id: 'aubergine', nom: 'Aubergine cuite', emoji: '🍆', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 25, proteines_g: 1, lipides_g: 0.2, glucides_g: 6, micros: { fibres_g: 3 } } },
  { id: 'betterave', nom: 'Betterave cuite', emoji: '🟣', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 44, proteines_g: 1.7, lipides_g: 0.2, glucides_g: 10, micros: { fibres_g: 2.8, fer_mg: 0.8 } } },

  // Fruits supplémentaires
  { id: 'pomme', nom: 'Pomme', emoji: '🍎', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 52, proteines_g: 0.3, lipides_g: 0.2, glucides_g: 14, micros: { fibres_g: 2.4, vitamineC_mg: 4.6 } } },
  { id: 'poire', nom: 'Poire', emoji: '🍐', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 57, proteines_g: 0.4, lipides_g: 0.1, glucides_g: 15, micros: { fibres_g: 3.1, vitamineC_mg: 4.3 } } },
  { id: 'fraises', nom: 'Fraises', emoji: '🍓', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 32, proteines_g: 0.7, lipides_g: 0.3, glucides_g: 7.7, micros: { vitamineC_mg: 59, fibres_g: 2 } } },
  { id: 'myrtilles', nom: 'Myrtilles', emoji: '🫐', portionReference_g: 100, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 57, proteines_g: 0.7, lipides_g: 0.3, glucides_g: 14, micros: { vitamineC_mg: 9.7, fibres_g: 2.4 } } },
  { id: 'pamplemousse', nom: 'Pamplemousse', emoji: '🍊', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 42, proteines_g: 0.8, lipides_g: 0.1, glucides_g: 11, micros: { vitamineC_mg: 31, fibres_g: 1.6 } } },
  { id: 'mangue', nom: 'Mangue', emoji: '🥭', portionReference_g: 120, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 60, proteines_g: 0.8, lipides_g: 0.4, glucides_g: 15, micros: { vitamineC_mg: 36, vitamineA_ug: 54, fibres_g: 1.6 } } },
  { id: 'raisin', nom: 'Raisin', emoji: '🍇', portionReference_g: 100, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 69, proteines_g: 0.7, lipides_g: 0.2, glucides_g: 18, micros: { vitamineC_mg: 3.2, fibres_g: 0.9 } } },

  // Féculents supplémentaires
  { id: 'pates_completes', nom: 'Pâtes complètes cuites', emoji: '🍝', portionReference_g: 200, moments: ['repas'],
    pour100g: { calories: 124, proteines_g: 5, lipides_g: 1.1, glucides_g: 25, micros: { fibres_g: 3.9, magnesium_mg: 30 } } },
  { id: 'pain_complet', nom: 'Pain complet', emoji: '🍞', portionReference_g: 60, moments: ['petit_dejeuner', 'repas'],
    pour100g: { calories: 247, proteines_g: 9, lipides_g: 3.4, glucides_g: 41, micros: { fibres_g: 7, magnesium_mg: 65 } } },
  { id: 'boulgour', nom: 'Boulgour cuit', emoji: '🍚', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 83, proteines_g: 3.1, lipides_g: 0.2, glucides_g: 19, micros: { fibres_g: 4.5, magnesium_mg: 16 } } },
  { id: 'sarrasin', nom: 'Sarrasin cuit', emoji: '🍚', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 92, proteines_g: 3.4, lipides_g: 0.6, glucides_g: 20, micros: { magnesium_mg: 51, fibres_g: 2.7 } } },
  { id: 'pomme_de_terre', nom: 'Pomme de terre vapeur', emoji: '🥔', portionReference_g: 200, moments: ['repas'],
    pour100g: { calories: 87, proteines_g: 1.9, lipides_g: 0.1, glucides_g: 20, micros: { vitamineC_mg: 13, fibres_g: 1.8 } } },

  // Oléagineux et graines supplémentaires
  { id: 'noisettes', nom: 'Noisettes', emoji: '🌰', portionReference_g: 30, moments: ['collation'],
    pour100g: { calories: 628, proteines_g: 15, lipides_g: 61, glucides_g: 17, micros: { vitamineE_mg: 15, magnesium_mg: 163, fibres_g: 9.7 } } },
  { id: 'graines_courge', nom: 'Graines de courge', emoji: '🎃', portionReference_g: 20, moments: ['collation'],
    pour100g: { calories: 559, proteines_g: 30, lipides_g: 49, glucides_g: 11, micros: { zinc_mg: 7.8, magnesium_mg: 592, fer_mg: 8.8 } } },
  { id: 'graines_lin', nom: 'Graines de lin', emoji: '🌱', portionReference_g: 15, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 534, proteines_g: 18, lipides_g: 42, glucides_g: 29, micros: { omega3_g: 22.8, fibres_g: 27, magnesium_mg: 392 } } },
  { id: 'pistaches', nom: 'Pistaches', emoji: '🌰', portionReference_g: 30, moments: ['collation'],
    pour100g: { calories: 560, proteines_g: 20, lipides_g: 45, glucides_g: 28, micros: { vitamineB6_mg: 1.7, magnesium_mg: 121, fibres_g: 10 } } },

  // Autres
  { id: 'houmous', nom: 'Houmous', emoji: '🫓', portionReference_g: 40, moments: ['collation', 'repas'],
    pour100g: { calories: 166, proteines_g: 8, lipides_g: 10, glucides_g: 11, micros: { fer_mg: 1.6, fibres_g: 6 } } },
  { id: 'chocolat_noir', nom: 'Chocolat noir 70%', emoji: '🍫', portionReference_g: 20, moments: ['collation'],
    pour100g: { calories: 598, proteines_g: 7.8, lipides_g: 43, glucides_g: 46, micros: { magnesium_mg: 228, fer_mg: 11.9, fibres_g: 11 } } },
  { id: 'comte', nom: 'Comté', emoji: '🧀', portionReference_g: 30, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 417, proteines_g: 28, lipides_g: 33, glucides_g: 0, micros: { calcium_mg: 880, vitamineB12_ug: 1.3, zinc_mg: 4 } } },
  { id: 'mozzarella', nom: 'Mozzarella', emoji: '🧀', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 280, proteines_g: 22, lipides_g: 21, glucides_g: 2, micros: { calcium_mg: 505, vitamineB12_ug: 1.9 } } },

  // Protéines — deuxième vague
  { id: 'porc', nom: 'Filet mignon de porc', emoji: '🥩', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 143, proteines_g: 26, lipides_g: 4, glucides_g: 0, micros: { vitamineB6_mg: 0.5, zinc_mg: 2 } } },
  { id: 'agneau', nom: 'Gigot d\'agneau', emoji: '🍖', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 175, proteines_g: 25, lipides_g: 8, glucides_g: 0, micros: { fer_mg: 1.9, zinc_mg: 4.5, vitamineB12_ug: 2.3 } } },
  { id: 'canard', nom: 'Magret de canard', emoji: '🦆', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 201, proteines_g: 19, lipides_g: 13, glucides_g: 0, micros: { fer_mg: 2.7, zinc_mg: 2, vitamineB12_ug: 0.4 } } },
  { id: 'lapin', nom: 'Lapin', emoji: '🐇', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 173, proteines_g: 21, lipides_g: 8, glucides_g: 0, micros: { vitamineB12_ug: 5, fer_mg: 1.3, zinc_mg: 1.7 } } },
  { id: 'foie_volaille', nom: 'Foie de volaille', emoji: '🍖', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 167, proteines_g: 25, lipides_g: 6, glucides_g: 1, micros: { fer_mg: 8.5, vitamineA_ug: 3300, vitamineB12_ug: 16 } } },
  { id: 'tempeh', nom: 'Tempeh', emoji: '🧊', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 192, proteines_g: 20, lipides_g: 11, glucides_g: 8, micros: { fer_mg: 2.7, magnesium_mg: 81, fibres_g: 9 } } },
  { id: 'lait_soja', nom: 'Lait de soja', emoji: '🥛', portionReference_g: 200, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 33, proteines_g: 3.3, lipides_g: 1.8, glucides_g: 1.8, micros: { calcium_mg: 120, vitamineB12_ug: 0.5 } } },
  { id: 'calamars', nom: 'Calamars cuits', emoji: '🦑', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 92, proteines_g: 15.6, lipides_g: 1.4, glucides_g: 3.1, micros: { vitamineB12_ug: 1.3, zinc_mg: 1.5 } } },
  { id: 'moules', nom: 'Moules cuites', emoji: '🦪', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 86, proteines_g: 12, lipides_g: 2.2, glucides_g: 3.7, micros: { fer_mg: 4, vitamineB12_ug: 12, zinc_mg: 1.6 } } },
  { id: 'truite', nom: 'Truite cuite', emoji: '🐟', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 148, proteines_g: 21, lipides_g: 6.6, glucides_g: 0, micros: { omega3_g: 1, vitamineD_ug: 10, vitamineB12_ug: 5 } } },
  { id: 'dorade', nom: 'Dorade cuite', emoji: '🐟', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 118, proteines_g: 20, lipides_g: 4, glucides_g: 0, micros: { vitamineB12_ug: 2, vitamineD_ug: 3 } } },

  // Légumineuses et céréales — deuxième vague
  { id: 'petits_pois', nom: 'Petits pois cuits', emoji: '🟢', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 81, proteines_g: 5.4, lipides_g: 0.4, glucides_g: 14, micros: { fibres_g: 5.5, vitamineC_mg: 14, fer_mg: 1.6 } } },
  { id: 'millet', nom: 'Millet cuit', emoji: '🍚', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 119, proteines_g: 3.5, lipides_g: 1, glucides_g: 23, micros: { magnesium_mg: 44, fibres_g: 1.3 } } },
  { id: 'epeautre', nom: 'Épeautre cuit', emoji: '🌾', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 127, proteines_g: 5, lipides_g: 0.8, glucides_g: 26, micros: { magnesium_mg: 60, fibres_g: 4 } } },
  { id: 'pain_seigle', nom: 'Pain de seigle', emoji: '🍞', portionReference_g: 60, moments: ['petit_dejeuner', 'repas'],
    pour100g: { calories: 219, proteines_g: 7, lipides_g: 1.2, glucides_g: 45, micros: { fibres_g: 6, magnesium_mg: 46 } } },
  { id: 'semoule', nom: 'Semoule cuite', emoji: '🍚', portionReference_g: 180, moments: ['repas'],
    pour100g: { calories: 112, proteines_g: 3.8, lipides_g: 0.2, glucides_g: 23, micros: { magnesium_mg: 12, fibres_g: 1.5 } } },

  // Légumes — deuxième vague
  { id: 'poireau', nom: 'Poireau cuit', emoji: '🥬', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 22, proteines_g: 1.2, lipides_g: 0.3, glucides_g: 4, micros: { vitamineC_mg: 8, fibres_g: 1.8 } } },
  { id: 'celeri', nom: 'Céleri', emoji: '🥬', portionReference_g: 100, moments: ['repas'],
    pour100g: { calories: 16, proteines_g: 0.7, lipides_g: 0.2, glucides_g: 3, micros: { fibres_g: 1.6, vitamineC_mg: 3 } } },
  { id: 'radis', nom: 'Radis', emoji: '🌶️', portionReference_g: 80, moments: ['repas'],
    pour100g: { calories: 16, proteines_g: 0.7, lipides_g: 0.1, glucides_g: 3.4, micros: { vitamineC_mg: 15, fibres_g: 1.6 } } },
  { id: 'navet', nom: 'Navet cuit', emoji: '🥔', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 22, proteines_g: 0.9, lipides_g: 0.1, glucides_g: 5, micros: { vitamineC_mg: 12, fibres_g: 2 } } },
  { id: 'artichaut', nom: 'Artichaut cuit', emoji: '🌿', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 47, proteines_g: 3.3, lipides_g: 0.2, glucides_g: 10, micros: { fibres_g: 5.4, magnesium_mg: 60 } } },
  { id: 'asperges', nom: 'Asperges cuites', emoji: '🥬', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 20, proteines_g: 2.2, lipides_g: 0.2, glucides_g: 3.9, micros: { fibres_g: 2, vitamineC_mg: 5.6, fer_mg: 0.9 } } },
  { id: 'choux_bruxelles', nom: 'Choux de Bruxelles cuits', emoji: '🥬', portionReference_g: 150, moments: ['repas'],
    pour100g: { calories: 36, proteines_g: 2.6, lipides_g: 0.3, glucides_g: 7, micros: { vitamineC_mg: 62, fibres_g: 3.8 } } },
  { id: 'fenouil', nom: 'Fenouil', emoji: '🌿', portionReference_g: 120, moments: ['repas'],
    pour100g: { calories: 31, proteines_g: 1.2, lipides_g: 0.2, glucides_g: 7, micros: { vitamineC_mg: 12, fibres_g: 3.1 } } },

  // Fruits — deuxième vague
  { id: 'ananas', nom: 'Ananas', emoji: '🍍', portionReference_g: 130, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 50, proteines_g: 0.5, lipides_g: 0.1, glucides_g: 13, micros: { vitamineC_mg: 48, fibres_g: 1.4 } } },
  { id: 'melon', nom: 'Melon', emoji: '🍈', portionReference_g: 150, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 34, proteines_g: 0.8, lipides_g: 0.2, glucides_g: 8, micros: { vitamineC_mg: 18, vitamineA_ug: 169 } } },
  { id: 'pasteque', nom: 'Pastèque', emoji: '🍉', portionReference_g: 200, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 30, proteines_g: 0.6, lipides_g: 0.2, glucides_g: 8, micros: { vitamineC_mg: 8 } } },
  { id: 'cerises', nom: 'Cerises', emoji: '🍒', portionReference_g: 120, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 63, proteines_g: 1.1, lipides_g: 0.2, glucides_g: 16, micros: { vitamineC_mg: 7, fibres_g: 2.1 } } },
  { id: 'abricot', nom: 'Abricot', emoji: '🍑', portionReference_g: 120, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 48, proteines_g: 1.4, lipides_g: 0.4, glucides_g: 11, micros: { vitamineA_ug: 96, vitamineC_mg: 10, fibres_g: 2 } } },
  { id: 'figue', nom: 'Figue', emoji: '🟣', portionReference_g: 100, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 74, proteines_g: 0.8, lipides_g: 0.3, glucides_g: 19, micros: { fibres_g: 2.9, calcium_mg: 35 } } },
  { id: 'prune', nom: 'Prune', emoji: '🟣', portionReference_g: 100, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 46, proteines_g: 0.7, lipides_g: 0.3, glucides_g: 11, micros: { vitamineC_mg: 9.5, fibres_g: 1.4 } } },
  { id: 'clementine', nom: 'Clémentine', emoji: '🍊', portionReference_g: 100, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 47, proteines_g: 0.9, lipides_g: 0.2, glucides_g: 12, micros: { vitamineC_mg: 49, fibres_g: 1.7 } } },

  // Oléagineux et graines — deuxième vague
  { id: 'noix_cajou', nom: 'Noix de cajou', emoji: '🌰', portionReference_g: 30, moments: ['collation'],
    pour100g: { calories: 553, proteines_g: 18, lipides_g: 44, glucides_g: 30, micros: { magnesium_mg: 292, zinc_mg: 5.8, fer_mg: 6.7 } } },
  { id: 'graines_tournesol', nom: 'Graines de tournesol', emoji: '🌻', portionReference_g: 20, moments: ['collation'],
    pour100g: { calories: 584, proteines_g: 21, lipides_g: 51, glucides_g: 20, micros: { vitamineE_mg: 35, magnesium_mg: 325, zinc_mg: 5 } } },
  { id: 'sesame', nom: 'Graines de sésame', emoji: '🌱', portionReference_g: 15, moments: ['collation', 'repas'],
    pour100g: { calories: 573, proteines_g: 18, lipides_g: 50, glucides_g: 23, micros: { calcium_mg: 975, fer_mg: 14.6, magnesium_mg: 351 } } },

  // Produits laitiers et autres — deuxième vague
  { id: 'feta', nom: 'Feta', emoji: '🧀', portionReference_g: 40, moments: ['repas', 'collation'],
    pour100g: { calories: 264, proteines_g: 14, lipides_g: 21, glucides_g: 4, micros: { calcium_mg: 493, vitamineB12_ug: 1.7 } } },
  { id: 'parmesan', nom: 'Parmesan', emoji: '🧀', portionReference_g: 20, moments: ['repas'],
    pour100g: { calories: 431, proteines_g: 38, lipides_g: 29, glucides_g: 4, micros: { calcium_mg: 1184, zinc_mg: 2.75, vitamineB12_ug: 1.6 } } },
  { id: 'beurre_amande', nom: 'Beurre d\'amande', emoji: '🥜', portionReference_g: 20, moments: ['petit_dejeuner', 'collation'],
    pour100g: { calories: 614, proteines_g: 21, lipides_g: 56, glucides_g: 19, micros: { magnesium_mg: 270, vitamineE_mg: 24, calcium_mg: 347, fer_mg: 3.5 } } },
]
