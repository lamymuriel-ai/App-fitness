import type {
  ProfilUtilisatrice,
  MicronutrimentInfo,
  Micronutriments,
  SeanceTemplate,
} from '../types'
import { dateDuJourISO } from '../utils/date'

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
  { cle: 'fibres_g', label: 'Fibres', unite: 'g', reference: 30, emoji: '🌾' },
  // Pas d'oméga-3 ici : Micron ne le synchronise pas vers Santé (confirmé), la valeur
  // importée est donc toujours 0 — l'inclure ferait remonter un faux manque en
  // permanence dans les alertes et les suggestions de repas, pour une donnée qu'on ne
  // mesure en réalité pas du tout.
]

export function profilParDefaut(): ProfilUtilisatrice {
  const aujourdHui = dateDuJourISO()
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
      { nom: 'Presse à cuisses', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Machine inclinée ou horizontale : dos calé contre le dossier, pieds à plat sur la plateforme devant toi. Pousse en tendant les jambes (sans verrouiller les genoux), puis reviens en pliant à ~90°. Cherche \"leg press\" dans la zone jambes.",
        alternative: 'Squats à poids du corps (ou avec un haltère tenu contre la poitrine), 3×15-20.' },
      { nom: 'Développé couché (machine)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Version guidée du développé couché : assise, dos plaqué contre un dossier incliné, tu pousses deux poignées vers l'avant/le haut. Cherche \"chest press\".",
        alternative: 'Pompes (sur les genoux si besoin), 3×10-15.' },
      { nom: 'Extension des jambes', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise, dos droit, un rouleau rembourré posé sur le devant des tibias. Tends les jambes pour lever le rouleau, puis redescends lentement. Cherche \"leg extension\", souvent à côté du leg curl.",
        alternative: 'Fentes alternées ou squats bulgares (pied arrière surélevé), 3×12-15 par jambe.' },
      { nom: 'Adducteurs (machine)', series: 3, repsMin: 12, repsMax: 15, poidsDuCorps: false,
        description: "Assise, jambes écartées posées sur des coussinets latéraux. Rapproche les jambes en poussant les coussinets vers l'intérieur. Ne pas confondre avec la machine \"abducteurs\" (l'inverse), souvent juste à côté.",
        alternative: 'Squat sumo (pieds très écartés, pointes vers l\'extérieur) à poids du corps ou avec un haltère, 3×15.' },
      { nom: 'Élévations latérales (épaules)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Machine \"lateral raise\" : assise, bras posés contre des coussinets latéraux, tu lèves les bras sur les côtés jusqu'à hauteur d'épaule. Différente d'une machine \"chest\" (pectoraux).",
        alternative: 'Haltères légers (2-5 kg), debout, bras le long du corps : lève-les sur les côtés jusqu\'à hauteur d\'épaule puis redescends lentement, 3×10-12.' },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 45, poidsDuCorps: true, note: 'en secondes',
        description: "Appui sur les avant-bras et les pointes de pieds, corps aligné (pas de dos creusé ni de fesses trop hautes). Tiens la position le temps indiqué.",
        alternative: 'Planche sur les genoux (plus facile) si la position complète est trop dure.' },
    ],
  },
  {
    id: 'B',
    nom: 'Séance B — Salle (haut du corps + tirage)',
    lieu: 'salle',
    moment: 'Midi',
    exercices: [
      { nom: 'Tirage vertical', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise face à la machine, cuisses calées sous les rouleaux, tu tires une barre au-dessus de la tête vers le haut de la poitrine, coudes vers le bas. Cherche \"lat pulldown\".",
        alternative: 'Tirage avec une bande élastique fixée en hauteur, ou rowing buste penché avec des haltères, 3×10-12.' },
      { nom: 'Rowing (machine assise)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise, pieds calés, tu tires deux poignées vers toi en ramenant les coudes en arrière, dos droit. Cherche \"seated row\".",
        alternative: 'Rowing buste penché à l\'haltère (un genou et une main posés sur un banc, tire l\'haltère vers la hanche), 3×10-12 par bras.' },
      { nom: 'Leg curl (ischio-jambiers)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Allongée ou assise selon la machine, un rouleau rembourré derrière les chevilles. Plie les genoux pour ramener le rouleau vers les fesses, puis reviens lentement. Souvent à côté du leg extension.",
        alternative: 'Pont fessier (allongée, genoux pliés, lève le bassin en serrant les fessiers/ischios) ou fentes arrière, 3×15.' },
      { nom: 'Développé épaules (machine)', series: 3, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise, dos droit contre le dossier, tu pousses deux poignées vers le haut au-dessus de la tête. Cherche \"shoulder press\".",
        alternative: 'Développé épaules à l\'haltère assise ou debout, ou pompes pike (fesses hautes, tête vers le sol), 3×10-12.' },
      { nom: 'Crunch (machine ou au sol)', series: 3, repsMin: 12, repsMax: 15, poidsDuCorps: false,
        description: "Sur machine : assise, tu plies le buste vers l'avant en contractant les abdos. Au sol : allongée, genoux pliés, tu décolles les épaules du sol en contractant les abdos (pas de traction sur la nuque).",
        alternative: 'Crunch au sol à poids du corps, 3×15-20 — aucune machine nécessaire.' },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 30, poidsDuCorps: true, note: 'en secondes',
        description: "Appui sur les avant-bras et les pointes de pieds, corps aligné (pas de dos creusé ni de fesses trop hautes). Tiens la position le temps indiqué.",
        alternative: 'Planche sur les genoux (plus facile) si la position complète est trop dure.' },
    ],
  },
  {
    id: 'C',
    nom: 'Séance C — Maison (poids du corps)',
    lieu: 'maison',
    moment: 'Soir',
    exercices: [
      { nom: 'Squats', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true,
        description: "Pieds largeur épaules, descends comme pour t'asseoir sur une chaise, dos droit, genoux qui suivent la direction des pieds, puis remonte.",
        alternative: 'Squat assis-debout sur une chaise (plus facile) ou squat sauté (plus dur).' },
      { nom: 'Pompes (genoux si besoin)', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true,
        description: "Mains un peu plus larges que les épaules, corps aligné, descends en pliant les coudes jusqu'à presque toucher le sol, puis pousse pour remonter.",
        alternative: 'Pompes mains sur une chaise/le canapé (plus facile) ou pompes déclinées, pieds surélevés (plus dur).' },
      { nom: 'Fentes alternées', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true, note: 'par jambe',
        description: "Un grand pas en avant, descends jusqu'à ce que les deux genoux soient à ~90°, genou arrière proche du sol sans le toucher, puis reviens et alterne les jambes.",
        alternative: 'Fentes statiques sur place (plus facile, moins d\'équilibre nécessaire) si les fentes en mouvement sont instables.' },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 45, poidsDuCorps: true, note: 'en secondes',
        description: "Appui sur les avant-bras et les pointes de pieds, corps aligné (pas de dos creusé ni de fesses trop hautes). Tiens la position le temps indiqué.",
        alternative: 'Planche sur les genoux (plus facile) si la position complète est trop dure.' },
      { nom: 'Superman (dos)', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true,
        description: "Allongée sur le ventre, bras tendus devant toi. Lève simultanément bras et jambes en contractant le bas du dos, tiens une seconde, puis redescends.",
        alternative: 'Superman avec seulement les bras (ou seulement les jambes) qui se lèvent, en alternance, si la version complète est trop intense.' },
      { nom: 'Mountain climbers', series: 3, repsMin: 20, repsMax: 20, poidsDuCorps: true,
        description: "Position de planche haute (mains au sol, bras tendus), ramène rapidement un genou vers la poitrine puis l'autre, comme une course sur place à l'horizontale.",
        alternative: 'Mountain climbers lents (un genou à la fois, sans rythme rapide) si la version rapide essouffle trop vite.' },
    ],
  },
]

// Programme hebdomadaire indicatif : jours où chaque séance est prévue.
// 0 = dimanche ... 6 = samedi
// Lundi et samedi en salle (séances A et B), mercredi à la maison (séance C).
export const PLANNING_SEMAINE: Record<number, 'A' | 'B' | 'C' | null> = {
  0: null,
  1: 'A',
  2: null,
  3: 'C',
  4: null,
  5: null,
  6: 'B',
}
