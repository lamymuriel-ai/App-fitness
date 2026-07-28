import type {
  ProfilUtilisatrice,
  MicronutrimentInfo,
  Micronutriments,
  SeanceTemplate,
} from '../types'

/**
 * Compléments pris chaque jour (1 gélule de fer Aroma-Zone, 1 gélule de magnésium
 * Aroma-Zone — la posologie indiquée est 3 gélules/jour mais 1 seule est prise ici,
 * d'où le magnésium et la B6 divisés par 3). Valeurs lues sur les étiquettes, à
 * ajouter systématiquement aux apports du jour en plus de l'alimentation.
 */
export const SUPPLEMENTS_QUOTIDIENS: Partial<Micronutriments> = {
  fer_mg: 14,
  vitamineC_mg: 80,
  magnesium_mg: 100,
  vitamineB6_mg: 0.47,
}

export const MICRO_REFERENCE: MicronutrimentInfo[] = [
  { cle: 'fer_mg', label: 'Fer', unite: 'mg', reference: 16, emoji: '🩸' },
  { cle: 'calcium_mg', label: 'Calcium', unite: 'mg', reference: 950, emoji: '🦴' },
  { cle: 'magnesium_mg', label: 'Magnésium', labelCourt: 'Magnés.', unite: 'mg', reference: 360, emoji: '⚡' },
  { cle: 'zinc_mg', label: 'Zinc', unite: 'mg', reference: 11, emoji: '🛡️' },
  { cle: 'vitamineA_ug', label: 'Vitamine A', labelCourt: 'Vit. A', unite: 'µg', reference: 650, emoji: '👁️' },
  { cle: 'vitamineC_mg', label: 'Vitamine C', labelCourt: 'Vit. C', unite: 'mg', reference: 110, emoji: '🍊' },
  { cle: 'vitamineD_ug', label: 'Vitamine D', labelCourt: 'Vit. D', unite: 'µg', reference: 15, emoji: '☀️' },
  { cle: 'vitamineE_mg', label: 'Vitamine E', labelCourt: 'Vit. E', unite: 'mg', reference: 11, emoji: '🌰' },
  { cle: 'vitamineB6_mg', label: 'Vitamine B6', labelCourt: 'Vit. B6', unite: 'mg', reference: 1.6, emoji: '🧠' },
  { cle: 'vitamineB12_ug', label: 'Vitamine B12', labelCourt: 'Vit. B12', unite: 'µg', reference: 4, emoji: '🔋' },
  { cle: 'omega3_g', label: 'Oméga-3', unite: 'g', reference: 2, emoji: '🐟' },
  { cle: 'fibres_g', label: 'Fibres', unite: 'g', reference: 30, emoji: '🌾' },
]

export function profilParDefaut(): ProfilUtilisatrice {
  const aujourdHui = new Date().toISOString().slice(0, 10)
  return {
    prenom: '',
    sexe: 'femme',
    age: 46,
    taille_cm: 163,
    poids_kg: 68,
    poidsDepart_kg: 68,
    objectifPerte_kg: 5,
    dureeObjectif_semaines: 12,
    dateDebut: aujourdHui,
    niveauActivite: 'modere',
    objectif: 'perte_poids',
    objectifsNutritionnels: {
      calories: 1550,
      proteines_g: 136,
      lipides_g: 55,
      glucides_g: 128,
      micros: {
        fer_mg: 16,
        calcium_mg: 950,
        magnesium_mg: 360,
        zinc_mg: 11,
        vitamineA_ug: 650,
        vitamineC_mg: 110,
        vitamineD_ug: 15,
        vitamineE_mg: 11,
        vitamineB6_mg: 1.6,
        vitamineB12_ug: 4,
        omega3_g: 2,
        fibres_g: 30,
      },
    },
    objectifPas: 8500,
    notesSante: '',
    onboardingTermine: false,
  }
}

export const SEANCES_TEMPLATES: SeanceTemplate[] = [
  {
    id: 'A',
    nom: 'Séance A — Salle (bas du corps + poussée)',
    lieu: 'salle',
    moment: 'Midi',
    exercices: [
      { nom: 'Presse à cuisses', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Développé couché (machine)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Extension des jambes', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Élévations latérales (épaules)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 45, poidsDuCorps: true, note: 'en secondes' },
    ],
  },
  {
    id: 'B',
    nom: 'Séance B — Salle (haut du corps + tirage)',
    lieu: 'salle',
    moment: 'Midi',
    exercices: [
      { nom: 'Tirage vertical', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Rowing (machine assise)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Leg curl (ischio-jambiers)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Développé épaules (machine)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false },
      { nom: 'Crunch (machine ou au sol)', series: 3, repsMin: 12, repsMax: 15, poidsDuCorps: false },
    ],
  },
  {
    id: 'C',
    nom: 'Séance C — Maison (poids du corps)',
    lieu: 'maison',
    moment: 'Soir',
    exercices: [
      { nom: 'Squats', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true },
      { nom: 'Pompes (genoux si besoin)', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true },
      { nom: 'Fentes alternées', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true, note: 'par jambe' },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 45, poidsDuCorps: true, note: 'en secondes' },
      { nom: 'Superman (dos)', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true },
      { nom: 'Mountain climbers', series: 3, repsMin: 20, repsMax: 20, poidsDuCorps: true },
    ],
  },
]

// Programme hebdomadaire indicatif : jours où chaque séance est prévue.
// 0 = dimanche ... 6 = samedi
export const PLANNING_SEMAINE: Record<number, 'A' | 'B' | 'C' | null> = {
  0: null,
  1: 'A',
  2: null,
  3: 'B',
  4: null,
  5: 'C',
  6: null,
}
