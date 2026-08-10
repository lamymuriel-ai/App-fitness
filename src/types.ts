// Types de données de l'application

export type Sexe = 'femme' | 'homme'
export type NiveauActivite = 'sedentaire' | 'leger' | 'modere' | 'actif'
export type Objectif = 'perte_poids' | 'maintien' | 'prise_masse'

export interface Micronutriments {
  fer_mg: number
  calcium_mg: number
  magnesium_mg: number
  zinc_mg: number
  vitamineA_ug: number
  vitamineC_mg: number
  vitamineD_ug: number
  vitamineE_mg: number
  vitamineB6_mg: number
  vitamineB12_ug: number
  omega3_g: number
  fibres_g: number
}

export const MICRO_VIDE: Micronutriments = {
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

export interface MicronutrimentInfo {
  cle: keyof Micronutriments
  label: string
  /** Version courte du label pour les affichages compacts (grille, pastilles) ; retombe sur `label` si absente. */
  labelCourt?: string
  unite: string
  reference: number
  emoji: string
}

export interface ObjectifsNutritionnels {
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
}

export interface ProfilUtilisatrice {
  prenom: string
  sexe: Sexe
  age: number
  taille_cm: number
  poids_kg: number
  poidsDepart_kg: number
  objectifPerte_kg: number
  dureeObjectif_semaines: number
  dateDebut: string // ISO date
  niveauActivite: NiveauActivite
  objectif: Objectif
  objectifsNutritionnels: ObjectifsNutritionnels
  objectifPas: number
  notesSante: string
  onboardingTermine: boolean
}

export type MethodeSaisie = 'photo' | 'code_barres' | 'manuel' | 'import_sante'
export type TypeRepas = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation'

export interface Repas {
  id: string
  dateHeure: string // ISO
  type: TypeRepas
  nom: string
  methode: MethodeSaisie
  photo?: string // dataURL, compressé
  codeBarres?: string
  quantite_g?: number
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
}

export interface ExerciceTemplate {
  nom: string
  series: number
  repsMin: number
  repsMax: number
  poidsDuCorps: boolean
  note?: string
  /** Explication de l'exercice/machine (à quoi ça ressemble, comment le régler). */
  description: string
  /** Solution de repli si la machine n'existe pas dans la salle (ou variante plus facile/dure pour un exercice à la maison). */
  alternative: string
}

export interface SeanceTemplate {
  id: 'A' | 'B' | 'C'
  nom: string
  lieu: 'salle' | 'maison'
  moment: string
  exercices: ExerciceTemplate[]
}

export interface SetLog {
  fait: boolean
  reps?: number
}

export type Difficulte = 'facile' | 'normal' | 'dur'

export interface ExerciceLog {
  nom: string
  poidsUtilise_kg?: number
  sets: SetLog[]
  difficulte?: Difficulte
}

export interface SeanceLog {
  id: string
  seanceTemplateId: 'A' | 'B' | 'C' | 'autre'
  date: string // ISO
  termineeA: string | null // ISO datetime de fin, null si en cours
  exercices: ExerciceLog[]
  /** Nom de l'activité de remplacement (natation, vélo...), seulement si seanceTemplateId === 'autre'. */
  nomActivite?: string
  duree_min?: number
}

export interface PoidsExercice {
  // mémorisation du dernier poids utilisé par exercice (clé = nom exercice)
  [nomExercice: string]: number
}

export interface SuiviJournalier {
  date: string // ISO YYYY-MM-DD, clé unique
  poids_kg?: number
  pas?: number
  sommeil_h?: number
}

export interface SuiviHebdomadaire {
  date: string // ISO date du check-in
  poids_kg: number
  tourDeTaille_cm?: number
  ressenti?: number // 1-5
  sommeil_h?: number
}

export interface AlerteStagnation {
  id: string
  dateDetection: string
  resolue: boolean
  choix?: 'calories' | 'pas'
  dateChoix?: string
}

export interface DonneesApp {
  profil: ProfilUtilisatrice
  repas: Repas[]
  seancesLog: SeanceLog[]
  poidsParExercice: PoidsExercice
  suiviJournalier: SuiviJournalier[]
  suiviHebdomadaire: SuiviHebdomadaire[]
  alertesStagnation: AlerteStagnation[]
}
