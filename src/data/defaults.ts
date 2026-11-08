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
  { cle: 'fer_mg', label: 'Fer', unite: 'mg', reference: 16, emoji: '🩸', sources: 'viande rouge, lentilles, épinards' },
  { cle: 'calcium_mg', label: 'Calcium', unite: 'mg', reference: 950, emoji: '🦴', sources: 'produits laitiers, fromage blanc, amandes' },
  { cle: 'magnesium_mg', label: 'Magnésium', labelCourt: 'Magnés.', unite: 'mg', reference: 360, emoji: '⚡', sources: 'oléagineux, chocolat noir, légumineuses' },
  { cle: 'zinc_mg', label: 'Zinc', unite: 'mg', reference: 11, emoji: '🛡️', sources: 'viande, œufs, graines de courge' },
  { cle: 'vitamineA_ug', label: 'Vitamine A', labelCourt: 'Vit. A', unite: 'µg', reference: 650, emoji: '👁️', sources: 'carottes, patate douce, épinards' },
  { cle: 'vitamineC_mg', label: 'Vitamine C', labelCourt: 'Vit. C', unite: 'mg', reference: 110, emoji: '🍊', sources: 'agrumes, kiwi, poivron' },
  { cle: 'vitamineD_ug', label: 'Vitamine D', labelCourt: 'Vit. D', unite: 'µg', reference: 15, emoji: '☀️', sources: 'poisson gras, œufs, un peu de soleil' },
  { cle: 'vitamineE_mg', label: 'Vitamine E', labelCourt: 'Vit. E', unite: 'mg', reference: 11, emoji: '🌰', sources: 'huiles végétales, amandes, avocat' },
  { cle: 'vitamineB6_mg', label: 'Vitamine B6', labelCourt: 'Vit. B6', unite: 'mg', reference: 1.6, emoji: '🧠', sources: 'volaille, poisson, pommes de terre' },
  { cle: 'vitamineB12_ug', label: 'Vitamine B12', labelCourt: 'Vit. B12', unite: 'µg', reference: 4, emoji: '🔋', sources: 'viande, poisson, œufs, produits laitiers' },
  { cle: 'fibres_g', label: 'Fibres', unite: 'g', reference: 30, emoji: '🌾', sources: 'légumes, légumineuses, céréales complètes' },
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
    // Ordre pensé pour le corps : le mouvement composé le plus exigeant (presse à cuisses)
    // en premier pendant que tu es fraîche, puis isolation du même groupe (jambes) tant
    // qu'on y est, ensuite le haut du corps (poussée composée puis isolation des épaules),
    // et le gainage toujours en dernier — le fatiguer plus tôt nuirait à la stabilité de
    // tous les exercices qui suivent.
    exercices: [
      { nom: 'Presse à cuisses', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Machine inclinée ou horizontale : dos calé contre le dossier, pieds à plat sur la plateforme devant toi. Pousse en tendant les jambes (sans verrouiller les genoux), puis reviens en pliant à ~90°. Cherche \"leg press\" dans la zone jambes.",
        alternative: 'Squats à poids du corps (ou avec un haltère tenu contre la poitrine), 5×15-20.',
        muscles: 'Quadriceps (avant des cuisses) en premier, avec fessiers et ischio-jambiers en soutien.',
        interet: "Renforce tout le bas du corps en sécurité (dos calé, pas de charge sur la colonne) — idéal pour construire de la force sur les jambes sans le risque technique du squat libre." },
      { nom: 'Extension des jambes', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise, dos droit, un rouleau rembourré posé sur le devant des tibias. Tends les jambes pour lever le rouleau, puis redescends lentement. Cherche \"leg extension\", souvent à côté du leg curl.",
        alternative: 'Fentes alternées ou squats bulgares (pied arrière surélevé), 5×12-15 par jambe.',
        muscles: 'Quadriceps, de façon isolée (pas d\'autre muscle qui prend le relais).',
        interet: "Cible précisément l'avant des cuisses, complète la presse à cuisses en isolant le quadriceps pour renforcer le genou et affiner le haut des jambes." },
      { nom: 'Adducteurs (machine)', series: 5, repsMin: 12, repsMax: 15, poidsDuCorps: false,
        description: "Assise, jambes écartées posées sur des coussinets latéraux. Rapproche les jambes en poussant les coussinets vers l'intérieur. Ne pas confondre avec la machine \"abducteurs\" (l'inverse), souvent juste à côté.",
        alternative: 'Squat sumo (pieds très écartés, pointes vers l\'extérieur) à poids du corps ou avec un haltère, 5×15.',
        muscles: 'Adducteurs (intérieur des cuisses).',
        interet: "Renforce une zone souvent négligée par les mouvements classiques, utile pour la stabilité du bassin et le tonus de l'intérieur des cuisses." },
      { nom: 'Développé couché (machine)', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Version guidée du développé couché : assise, dos plaqué contre un dossier incliné, tu pousses deux poignées vers l'avant/le haut. Cherche \"chest press\".",
        alternative: 'Pompes (sur les genoux si besoin), 5×10-15.',
        muscles: 'Pectoraux, avec triceps et épaules (deltoïdes avant) en soutien.',
        interet: "Développe la force de poussée du haut du corps ; la version guidée stabilise le mouvement, parfait pour progresser en charge sans se soucier de l'équilibre de la barre." },
      { nom: 'Élévations latérales (épaules)', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Machine \"lateral raise\" : assise, bras posés contre des coussinets latéraux, tu lèves les bras sur les côtés jusqu'à hauteur d'épaule. Différente d'une machine \"chest\" (pectoraux).",
        alternative: 'Haltères légers (2-5 kg), debout, bras le long du corps : lève-les sur les côtés jusqu\'à hauteur d\'épaule puis redescends lentement, 5×10-12.',
        muscles: 'Deltoïdes, faisceau latéral (le côté de l\'épaule).',
        interet: "Dessine l'arrondi de l'épaule et élargit visuellement le haut du corps ; un muscle peu sollicité par les développés (couché, épaules)." },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 45, poidsDuCorps: true, note: 'en secondes',
        description: "Appui sur les avant-bras et les pointes de pieds, corps aligné (pas de dos creusé ni de fesses trop hautes). Tiens la position le temps indiqué.",
        alternative: 'Planche sur les genoux (plus facile) si la position complète est trop dure.',
        muscles: 'Abdominaux profonds (transverse), lombaires et épaules (muscles stabilisateurs).',
        interet: "Renforce la sangle abdominale en profondeur et protège le bas du dos — la base de la stabilité du tronc pour tous les autres exercices." },
    ],
  },
  {
    id: 'B',
    nom: 'Séance B — Salle (haut du corps + tirage)',
    lieu: 'salle',
    moment: 'Midi',
    // Même logique que la séance A : le dos (tirage puis rowing, même groupe musculaire)
    // d'abord pendant que tu es fraîche, puis les épaules (poussée), et le leg curl — seul
    // exercice de jambes de cette séance — passe après le haut du corps puisqu'il n'y a pas
    // d'autre exercice de jambes à enchaîner avec lui ici. Les abdos (crunch puis gainage)
    // toujours en dernier.
    exercices: [
      { nom: 'Tirage vertical', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise face à la machine, cuisses calées sous les rouleaux, tu tires une barre au-dessus de la tête vers le haut de la poitrine, coudes vers le bas. Cherche \"lat pulldown\".",
        alternative: 'Tirage avec une bande élastique fixée en hauteur, ou rowing buste penché avec des haltères, 5×10-12.',
        muscles: 'Grand dorsal (le large muscle du dos), avec biceps et trapèzes en soutien.',
        interet: "Construit la largeur et la force du dos, en reproduisant le mouvement d'une traction (pull-up) sans avoir besoin de soulever tout son poids de corps." },
      { nom: 'Rowing (machine assise)', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise, pieds calés, tu tires deux poignées vers toi en ramenant les coudes en arrière, dos droit. Cherche \"seated row\" ou \"low row\" (même machine, souvent le même nom chez Technogym).",
        alternative: 'Rowing buste penché à l\'haltère (un genou et une main posés sur un banc, tire l\'haltère vers la hanche), 5×10-12 par bras.',
        muscles: 'Grand dorsal et trapèzes (milieu du dos), avec biceps en soutien.',
        interet: "Travaille l'épaisseur du dos et corrige la posture (contrebalance le temps passé penchée devant un écran) en rapprochant les omoplates." },
      { nom: 'Développé épaules (machine)', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Assise, dos droit contre le dossier, tu pousses deux poignées vers le haut au-dessus de la tête. Cherche \"shoulder press\".",
        alternative: 'Développé épaules à l\'haltère assise ou debout, ou pompes pike (fesses hautes, tête vers le sol), 5×10-12.',
        muscles: 'Deltoïdes (épaules), avec triceps en soutien.',
        interet: "Renforce la force de poussée au-dessus de la tête, utile au quotidien (ranger, porter) et complète le développé couché pour un haut du corps équilibré." },
      { nom: 'Leg curl (ischio-jambiers)', series: 5, repsMin: 10, repsMax: 12, poidsDuCorps: false,
        description: "Allongée ou assise selon la machine, un rouleau rembourré derrière les chevilles. Plie les genoux pour ramener le rouleau vers les fesses, puis reviens lentement. Souvent à côté du leg extension.",
        alternative: 'Pont fessier (allongée, genoux pliés, lève le bassin en serrant les fessiers/ischios) ou fentes arrière, 5×15.',
        muscles: 'Ischio-jambiers (arrière des cuisses), de façon isolée.',
        interet: "Équilibre le travail du quadriceps (presse, extension) — des ischios forts protègent le genou et réduisent le risque de blessure." },
      { nom: 'Crunch (machine ou au sol)', series: 5, repsMin: 12, repsMax: 15, poidsDuCorps: false,
        description: "Sur machine : assise, tu plies le buste vers l'avant en contractant les abdos. Au sol : allongée, genoux pliés, tu décolles les épaules du sol en contractant les abdos (pas de traction sur la nuque).",
        alternative: 'Crunch au sol à poids du corps, 5×15-20 — aucune machine nécessaire.',
        muscles: 'Grand droit de l\'abdomen (les "tablettes").',
        interet: "Travaille les abdos superficiels en complément du gainage, qui cible lui la profondeur — les deux ensemble renforcent toute la ceinture abdominale." },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 30, poidsDuCorps: true, note: 'en secondes',
        description: "Appui sur les avant-bras et les pointes de pieds, corps aligné (pas de dos creusé ni de fesses trop hautes). Tiens la position le temps indiqué.",
        alternative: 'Planche sur les genoux (plus facile) si la position complète est trop dure.',
        muscles: 'Abdominaux profonds (transverse), lombaires et épaules (muscles stabilisateurs).',
        interet: "Renforce la sangle abdominale en profondeur et protège le bas du dos — la base de la stabilité du tronc pour tous les autres exercices." },
    ],
  },
  {
    id: 'C',
    nom: 'Séance C — Maison (poids du corps)',
    lieu: 'maison',
    moment: 'Soir',
    // Jambes d'abord (squats puis fentes, pendant que l'équilibre et la fraîcheur sont là),
    // puis le haut du corps (pompes), puis dos/gainage ensemble (superman prépare le bas du
    // dos avant la planche), et mountain climbers en finisher cardio — pas besoin d'être
    // fraîche pour ce mouvement répétitif, et ça termine la séance sur un pic cardio.
    exercices: [
      { nom: 'Squats', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true,
        description: "Pieds largeur épaules, descends comme pour t'asseoir sur une chaise, dos droit, genoux qui suivent la direction des pieds, puis remonte.",
        alternative: 'Squat assis-debout sur une chaise (plus facile) ou squat sauté (plus dur).',
        muscles: 'Quadriceps, fessiers et ischio-jambiers — tout le bas du corps en un seul mouvement.',
        interet: "L'exercice le plus complet pour les jambes à la maison, sans matériel : renforce la force fonctionnelle (s'asseoir, se relever, monter des escaliers)." },
      { nom: 'Fentes alternées', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true, note: 'par jambe',
        description: "Un grand pas en avant, descends jusqu'à ce que les deux genoux soient à ~90°, genou arrière proche du sol sans le toucher, puis reviens et alterne les jambes.",
        alternative: 'Fentes statiques sur place (plus facile, moins d\'équilibre nécessaire) si les fentes en mouvement sont instables.',
        muscles: 'Quadriceps et fessiers, avec un vrai travail d\'équilibre en plus.',
        interet: "Renforce chaque jambe individuellement (corrige les déséquilibres gauche/droite) tout en travaillant la stabilité, utile pour la marche et la montée d'escaliers." },
      { nom: 'Pompes (genoux si besoin)', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true,
        description: "Mains un peu plus larges que les épaules, corps aligné, descends en pliant les coudes jusqu'à presque toucher le sol, puis pousse pour remonter.",
        alternative: 'Pompes mains sur une chaise/le canapé (plus facile) ou pompes déclinées, pieds surélevés (plus dur).',
        muscles: 'Pectoraux, triceps et épaules, avec les abdos qui gainent le corps.',
        interet: "Équivalent du développé couché sans matériel — développe la force de poussée du haut du corps en sollicitant aussi le gainage pour garder le corps aligné." },
      { nom: 'Superman (dos)', series: 3, repsMin: 15, repsMax: 20, poidsDuCorps: true,
        description: "Allongée sur le ventre, bras tendus devant toi. Lève simultanément bras et jambes en contractant le bas du dos, tiens une seconde, puis redescends.",
        alternative: 'Superman avec seulement les bras (ou seulement les jambes) qui se lèvent, en alternance, si la version complète est trop intense.',
        muscles: 'Lombaires (bas du dos) et fessiers.',
        interet: "Renforce le bas du dos dans le sens opposé des abdos — essentiel pour une posture équilibrée et pour protéger le dos au quotidien." },
      { nom: 'Gainage — planche', series: 3, repsMin: 30, repsMax: 45, poidsDuCorps: true, note: 'en secondes',
        description: "Appui sur les avant-bras et les pointes de pieds, corps aligné (pas de dos creusé ni de fesses trop hautes). Tiens la position le temps indiqué.",
        alternative: 'Planche sur les genoux (plus facile) si la position complète est trop dure.',
        muscles: 'Abdominaux profonds (transverse), lombaires et épaules (muscles stabilisateurs).',
        interet: "Renforce la sangle abdominale en profondeur et protège le bas du dos — la base de la stabilité du tronc pour tous les autres exercices." },
      { nom: 'Mountain climbers', series: 3, repsMin: 20, repsMax: 20, poidsDuCorps: true,
        description: "Position de planche haute (mains au sol, bras tendus), ramène rapidement un genou vers la poitrine puis l'autre, comme une course sur place à l'horizontale.",
        alternative: 'Mountain climbers lents (un genou à la fois, sans rythme rapide) si la version rapide essouffle trop vite.',
        muscles: 'Abdominaux et épaules en gainage, avec un travail cardio en plus.',
        interet: "Combine renforcement du tronc et travail cardio — fait monter le rythme cardiaque tout en sollicitant les abdos, pour brûler plus de calories pendant la séance." },
    ],
  },
]

// Programme hebdomadaire indicatif : jours où chaque séance est prévue.
// 0 = dimanche ... 6 = samedi
// Lundi et samedi en salle (séances A et B). Le mercredi n'a plus de séance de muscu
// fixe, remplacé par la boxe le jeudi (voir ACTIVITES_RECURRENTES ci-dessous).
export const PLANNING_SEMAINE: Record<number, 'A' | 'B' | 'C' | null> = {
  0: null,
  1: 'A',
  2: null,
  3: null,
  4: null,
  5: null,
  6: 'B',
}

export interface ActiviteRecurrente {
  nom: string
  duree_min: number
}

// Activités hors programme de muscu, mais tout aussi fixes chaque semaine (loggées
// comme "autre activité" plutôt que via un SeanceTemplate A/B/C).
export const ACTIVITES_RECURRENTES: Record<number, ActiviteRecurrente | null> = {
  0: null,
  1: null,
  2: null,
  3: null,
  4: { nom: 'Boxe', duree_min: 60 },
  5: null,
  6: null,
}

// Nombre de séances (muscu + activités récurrentes) attendues par semaine.
export const NB_SEANCES_PAR_SEMAINE =
  Object.values(PLANNING_SEMAINE).filter(Boolean).length +
  Object.values(ACTIVITES_RECURRENTES).filter(Boolean).length

// Modèles de séance de muscu réellement programmés cette semaine (ex. exclut une séance
// retirée du planning comme la C, même si son contenu reste disponible pour l'historique).
const IDS_SEANCES_PLANIFIEES = new Set(Object.values(PLANNING_SEMAINE).filter(Boolean))
export const SEANCES_TEMPLATES_PLANIFIEES = SEANCES_TEMPLATES.filter((s) => IDS_SEANCES_PLANIFIEES.has(s.id))

// Activités récurrentes uniques (par nom) actuellement programmées, toutes fréquences
// confondues — sert à les lister une seule fois (ex. pour un récapitulatif hebdomadaire).
export const ACTIVITES_RECURRENTES_UNIQUES = Array.from(
  new Map(
    Object.values(ACTIVITES_RECURRENTES)
      .filter((a): a is ActiviteRecurrente => a !== null)
      .map((a) => [a.nom, a])
  ).values()
)
