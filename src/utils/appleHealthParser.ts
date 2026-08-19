import type { Micronutriments } from '../types'

export interface EntreeAlimentaire {
  horodatage: string // startDate brut Apple Santé, ex. "2026-07-20 12:30:00 +0200"
  nom?: string
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
}

export interface ResultatImportSante {
  pas: Map<string, number> // clé = jour (YYYY-MM-DD)
  poids: Map<string, number> // clé = jour, valeur en kg
  sommeil: Map<string, number> // clé = jour (nuit attribuée au jour du réveil), valeur en heures
  nutrition: Map<string, EntreeAlimentaire> // clé = horodatage exact (un repas = une entrée)
  premiereDate: string | null
  derniereDate: string | null
}

// Format exact des horodatages Apple Santé : "2026-07-20 19:30:00 +0200". Ce n'est PAS
// un format standard ECMA-262 (espace au lieu de "T", décalage sans ":"), et `new Date(...)`
// le parse de façon incohérente selon le moteur JS : Chrome est permissif et l'accepte,
// mais Safari (donc tout iPhone) renvoie "Invalid Date" pour cette forme précise. D'où un
// import qui semblait fonctionner en test (Chromium) mais perdait silencieusement tout le
// sommeil et l'alimentation sur un vrai iPhone. On parse donc ce format nous-mêmes.
const REGEX_HORODATAGE_APPLE = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/

export function parserHorodatageApple(horodatage: string): number | null {
  const m = REGEX_HORODATAGE_APPLE.exec(horodatage)
  if (!m) return null
  const [, aaaa, mois, jour, heure, minute, seconde, signe, decalHeure, decalMinute] = m
  const brutUtc = Date.UTC(Number(aaaa), Number(mois) - 1, Number(jour), Number(heure), Number(minute), Number(seconde))
  const decalageMs = (Number(decalHeure) * 60 + Number(decalMinute)) * 60000
  return signe === '-' ? brutUtc + decalageMs : brutUtc - decalageMs
}

function nutritionVide(horodatage: string): EntreeAlimentaire {
  return {
    horodatage,
    calories: 0,
    proteines_g: 0,
    lipides_g: 0,
    glucides_g: 0,
    micros: {
      fer_mg: 0, calcium_mg: 0, magnesium_mg: 0, zinc_mg: 0,
      vitamineA_ug: 0, vitamineC_mg: 0, vitamineD_ug: 0, vitamineE_mg: 0,
      vitamineB6_mg: 0, vitamineB12_ug: 0, omega3_g: 0, fibres_g: 0,
    },
  }
}

const TYPE_PAS = 'HKQuantityTypeIdentifierStepCount'
const TYPE_POIDS = 'HKQuantityTypeIdentifierBodyMass'
const TYPE_SOMMEIL = 'HKCategoryTypeIdentifierSleepAnalysis'

type ChampNutrition =
  | { cible: 'macro'; champ: 'calories' | 'proteines_g' | 'lipides_g' | 'glucides_g'; unite: 'kcal' | 'g' }
  | { cible: 'micro'; champ: keyof Micronutriments; unite: 'g' | 'mg' | 'ug' }

const MAPPING_NUTRITION: Record<string, ChampNutrition> = {
  HKQuantityTypeIdentifierDietaryEnergyConsumed: { cible: 'macro', champ: 'calories', unite: 'kcal' },
  HKQuantityTypeIdentifierDietaryProtein: { cible: 'macro', champ: 'proteines_g', unite: 'g' },
  HKQuantityTypeIdentifierDietaryFatTotal: { cible: 'macro', champ: 'lipides_g', unite: 'g' },
  HKQuantityTypeIdentifierDietaryCarbohydrates: { cible: 'macro', champ: 'glucides_g', unite: 'g' },
  HKQuantityTypeIdentifierDietaryFiber: { cible: 'micro', champ: 'fibres_g', unite: 'g' },
  HKQuantityTypeIdentifierDietaryIron: { cible: 'micro', champ: 'fer_mg', unite: 'mg' },
  HKQuantityTypeIdentifierDietaryCalcium: { cible: 'micro', champ: 'calcium_mg', unite: 'mg' },
  HKQuantityTypeIdentifierDietaryMagnesium: { cible: 'micro', champ: 'magnesium_mg', unite: 'mg' },
  HKQuantityTypeIdentifierDietaryZinc: { cible: 'micro', champ: 'zinc_mg', unite: 'mg' },
  HKQuantityTypeIdentifierDietaryVitaminA: { cible: 'micro', champ: 'vitamineA_ug', unite: 'ug' },
  HKQuantityTypeIdentifierDietaryVitaminC: { cible: 'micro', champ: 'vitamineC_mg', unite: 'mg' },
  HKQuantityTypeIdentifierDietaryVitaminD: { cible: 'micro', champ: 'vitamineD_ug', unite: 'ug' },
  HKQuantityTypeIdentifierDietaryVitaminE: { cible: 'micro', champ: 'vitamineE_mg', unite: 'mg' },
  HKQuantityTypeIdentifierDietaryVitaminB6: { cible: 'micro', champ: 'vitamineB6_mg', unite: 'mg' },
  HKQuantityTypeIdentifierDietaryVitaminB12: { cible: 'micro', champ: 'vitamineB12_ug', unite: 'ug' },
}

const TOUS_LES_TYPES_SUIVIS = [
  TYPE_PAS,
  TYPE_POIDS,
  TYPE_SOMMEIL,
  ...Object.keys(MAPPING_NUTRITION),
]

/** Convertit une masse d'une unité HealthKit vers l'unité cible demandée. Retourne null si l'unité n'est pas reconnue (on préfère ignorer une valeur plutôt que deviner une conversion fausse). */
function convertirMasse(valeur: number, uniteSource: string, uniteCible: 'g' | 'mg' | 'ug'): number | null {
  const u = uniteSource.trim().toLowerCase()
  let grammes: number | null = null
  if (u === 'g') grammes = valeur
  else if (u === 'mg') grammes = valeur / 1000
  else if (u === 'mcg' || u === 'µg' || u === 'ug') grammes = valeur / 1_000_000
  if (grammes === null) return null
  if (uniteCible === 'g') return grammes
  if (uniteCible === 'mg') return grammes * 1000
  return grammes * 1_000_000
}

function convertirEnergie(valeur: number, uniteSource: string): number | null {
  const u = uniteSource.trim().toLowerCase()
  if (u === 'kcal' || u === 'cal') return valeur
  if (u === 'kj') return valeur / 4.184
  return null
}

function convertirPoidsEnKg(valeur: number, uniteSource: string): number | null {
  const u = uniteSource.trim().toLowerCase()
  if (u === 'kg') return valeur
  if (u === 'lb' || u === 'lbs' || u === 'pound') return valeur * 0.45359237
  if (u === 'g') return valeur / 1000
  return null
}

const REGEX_RECORD = new RegExp(
  `<Record type="(${TOUS_LES_TYPES_SUIVIS.join('|')})"[^>]*?(?:/>|>[\\s\\S]*?</Record>)`,
  'g'
)
const REGEX_CORRELATION_ALIMENT = /<Correlation type="HKCorrelationTypeIdentifierFood"[^>]*?>[\s\S]*?<\/Correlation>/g
const REGEX_OUVERTURE = /^<Record\b[^>]*?(?:\/>|>)/
const REGEX_START = /startDate="([^"]+)"/
const REGEX_END = /endDate="([^"]+)"/
const REGEX_VALEUR = /value="([^"]+)"/
const REGEX_UNITE = /unit="([^"]+)"/
const REGEX_SOURCE = /sourceName="([^"]*)"/
const REGEX_NOM = /<MetadataEntry key="HKFoodType" value="([^"]*)"/
const REGEX_STARTDATES_IMBRIQUEES = /<Record\b[^>]*?startDate="([^"]+)"/g

/**
 * Un « scanner » incrémental générique : on lui pousse du texte au fil de l'eau (par
 * morceaux, ex. depuis un flux de décompression), il applique une regex globale et ne
 * garde en mémoire que le reliquat non encore confirmé comme complet (utile quand une
 * balise est coupée pile à la frontière entre deux morceaux). La mémoire consommée reste
 * bornée par la taille d'un repère + la distance jusqu'au prochain repère trouvé, jamais
 * par la taille totale du document.
 */
class ScannerIncremental {
  private buffer = ''
  private readonly regex: RegExp
  private readonly surMatch: (correspondance: RegExpExecArray) => void

  constructor(regex: RegExp, surMatch: (correspondance: RegExpExecArray) => void) {
    this.regex = regex
    this.surMatch = surMatch
  }

  pousser(texte: string) {
    this.buffer += texte
    this.regex.lastIndex = 0
    let dernierIndexTraite = 0
    let correspondance: RegExpExecArray | null
    while ((correspondance = this.regex.exec(this.buffer)) !== null) {
      this.surMatch(correspondance)
      dernierIndexTraite = this.regex.lastIndex
    }
    this.buffer = this.buffer.slice(dernierIndexTraite)

    // Garde-fou : un <Record> ou <Correlation> valide ne dépasse jamais quelques Ko.
    // Si le reliquat grossit sans qu'aucune correspondance ne soit trouvée (ex. les
    // entrées d'alimentation sont rares comparées au volume de fréquence cardiaque
    // entre deux repas notés), c'est qu'il ne contient que du contenu qui ne
    // correspondra jamais — sans ce plafond, ce texte serait gardé indéfiniment ET
    // entièrement re-scanné à chaque nouveau morceau poussé (coût croissant avec la
    // taille du fichier), ce qui peut expliquer un ralentissement ou un plantage sur
    // un très gros fichier.
    if (this.buffer.length > ScannerIncremental.TAILLE_MAX_RELIQUAT) {
      this.buffer = this.buffer.slice(-ScannerIncremental.TAILLE_CONSERVEE_SI_DEPASSEMENT)
    }
  }

  private static readonly TAILLE_MAX_RELIQUAT = 65536
  private static readonly TAILLE_CONSERVEE_SI_DEPASSEMENT = 8192

  tailleReliquat() {
    return this.buffer.length
  }
}

/**
 * Analyseur incrémental de l'export Santé : on pousse le texte décompressé au fil de
 * l'eau (voir `appleHealthWorker.ts`) plutôt que de charger le document entier en une
 * seule chaîne, ce qui serait irréaliste pour un long historique Apple Watch (le XML
 * décompressé peut atteindre plusieurs Go alors que le .zip ne fait « que » quelques
 * centaines de Mo, du fait de la forte répétitivité des données).
 */
export class AnalyseurSanteIncremental {
  private readonly pasParJourEtSource = new Map<string, Map<string, number>>()
  private readonly poidsSommeCompte = new Map<string, { somme: number; compte: number }>()
  private readonly sommeilIntervalles = new Map<string, Array<{ debut: number; fin: number }>>()
  private readonly nutrition = new Map<string, EntreeAlimentaire>()
  private readonly nomsAliments = new Map<string, string>()

  private readonly scannerRecord = new ScannerIncremental(REGEX_RECORD, (m) => this.traiterRecord(m))
  private readonly scannerCorrelation = new ScannerIncremental(REGEX_CORRELATION_ALIMENT, (m) =>
    this.traiterCorrelationAliment(m[0])
  )

  private traiterCorrelationAliment(bloc: string) {
    const nomMatch = REGEX_NOM.exec(bloc)
    if (!nomMatch || !nomMatch[1]) return
    // On associe le nom à la date de la corrélation ELLE-MÊME, mais aussi à celle de
    // CHACUN des <Record> imbriqués (protéines, lipides, calories...) : leur startDate ne
    // correspond pas toujours exactement à celui de la corrélation parente (précision,
    // arrondi d'écriture selon l'app source), et traiterRecord() ne cherche le nom que
    // sous l'horodatage exact de CE record précis — sans ça, un nom pourtant présent dans
    // le fichier pouvait ne jamais s'associer et le repas retombait sur le libellé générique.
    REGEX_STARTDATES_IMBRIQUEES.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = REGEX_STARTDATES_IMBRIQUEES.exec(bloc)) !== null) {
      this.nomsAliments.set(m[1], nomMatch[1])
    }
  }

  private traiterRecord(correspondance: RegExpExecArray) {
    const type = correspondance[1]
    const blocComplet = correspondance[0]

    const ouvertureMatch = REGEX_OUVERTURE.exec(blocComplet)
    const ouverture = ouvertureMatch ? ouvertureMatch[0] : blocComplet

    const startMatch = REGEX_START.exec(ouverture)
    if (!startMatch) return
    const horodatage = startMatch[1]
    const jourDebut = horodatage.slice(0, 10)
    const valeurMatch = REGEX_VALEUR.exec(ouverture)
    if (!valeurMatch) return

    if (type === TYPE_PAS) {
      const valeur = Number(valeurMatch[1])
      if (!Number.isFinite(valeur)) return
      // On somme par source (iPhone, Apple Watch, une autre appli...) plutôt que
      // globalement : chaque source enregistre ses propres échantillons tout au long de
      // la journée (souvent nombreux et légitimement additifs pour une même source), mais
      // deux sources DIFFÉRENTES couvrent en général la même portion de journée en
      // parallèle — les additionner compte deux fois les mêmes pas (ex. une montre à 1523
      // pas remontant à 2330 après import). Le total du jour retenu est le maximum parmi
      // les sources plutôt que leur somme — voir `finaliser()`.
      const sourceMatch = REGEX_SOURCE.exec(ouverture)
      const source = sourceMatch ? sourceMatch[1] : ''
      const parSource = this.pasParJourEtSource.get(jourDebut) || new Map<string, number>()
      parSource.set(source, (parSource.get(source) || 0) + valeur)
      this.pasParJourEtSource.set(jourDebut, parSource)
      return
    }

    if (type === TYPE_POIDS) {
      const uniteMatch = REGEX_UNITE.exec(ouverture)
      const valeurBrute = Number(valeurMatch[1])
      if (!Number.isFinite(valeurBrute) || !uniteMatch) return
      const kg = convertirPoidsEnKg(valeurBrute, uniteMatch[1])
      if (kg === null) return
      const cumul = this.poidsSommeCompte.get(jourDebut) || { somme: 0, compte: 0 }
      cumul.somme += kg
      cumul.compte += 1
      this.poidsSommeCompte.set(jourDebut, cumul)
      return
    }

    if (type === TYPE_SOMMEIL) {
      if (!valeurMatch[1].includes('Asleep')) return // exclut "InBed" et "Awake"
      const endMatch = REGEX_END.exec(ouverture)
      if (!endMatch) return
      const debut = parserHorodatageApple(startMatch[1])
      const fin = parserHorodatageApple(endMatch[1])
      if (debut === null || fin === null || fin <= debut) return
      // On stocke chaque intervalle brut plutôt que de sommer directement : plusieurs
      // sources (Apple Watch, iPhone, une appli tierce) peuvent chacune écrire leur propre
      // analyse de sommeil pour la même nuit, avec des plages qui se chevauchent largement.
      // Les additionner telles quelles double-compte le sommeil réel (ex. 13,6h pour une
      // vraie nuit de ~7h). Il faut fusionner les intervalles avant de sommer — voir
      // `finaliser()`.
      const jourFin = endMatch[1].slice(0, 10) // nuit attribuée au jour du réveil
      const intervalles = this.sommeilIntervalles.get(jourFin) || []
      intervalles.push({ debut, fin })
      this.sommeilIntervalles.set(jourFin, intervalles)
      return
    }

    const mapping = MAPPING_NUTRITION[type]
    if (mapping) {
      const uniteMatch = REGEX_UNITE.exec(ouverture)
      const valeurBrute = Number(valeurMatch[1])
      if (!Number.isFinite(valeurBrute) || !uniteMatch) return
      const convertie =
        mapping.unite === 'kcal'
          ? convertirEnergie(valeurBrute, uniteMatch[1])
          : convertirMasse(valeurBrute, uniteMatch[1], mapping.unite)
      if (convertie === null) return

      const entree = this.nutrition.get(horodatage) || nutritionVide(horodatage)
      if (mapping.cible === 'macro') {
        entree[mapping.champ] += convertie
      } else {
        entree.micros[mapping.champ] += convertie
      }
      if (!entree.nom) {
        entree.nom = this.nomsAliments.get(horodatage) || REGEX_NOM.exec(blocComplet)?.[1]
      }
      this.nutrition.set(horodatage, entree)
    }
  }

  /** Pousse un morceau de texte décompressé. Peut être appelé autant de fois que nécessaire. */
  pousser(texte: string) {
    this.scannerCorrelation.pousser(texte)
    this.scannerRecord.pousser(texte)
  }

  /** Reliquat total actuellement gardé en mémoire (pour surveillance/tests uniquement). */
  reliquatOctets() {
    return this.scannerCorrelation.tailleReliquat() + this.scannerRecord.tailleReliquat()
  }

  /** À appeler une fois tout le contenu poussé, pour obtenir le résultat final agrégé. */
  finaliser(): ResultatImportSante {
    const poids = new Map<string, number>()
    for (const [jour, { somme, compte }] of this.poidsSommeCompte) {
      poids.set(jour, Math.round((somme / compte) * 10) / 10)
    }

    const sommeil = new Map<string, number>()
    for (const [jour, intervalles] of this.sommeilIntervalles) {
      sommeil.set(jour, Math.round(fusionnerEtSommerHeures(intervalles) * 10) / 10)
    }

    const pas = new Map<string, number>()
    for (const [jour, parSource] of this.pasParJourEtSource) {
      pas.set(jour, Math.round(Math.max(...parSource.values())))
    }

    const tousLesJours = new Set<string>([
      ...pas.keys(),
      ...poids.keys(),
      ...sommeil.keys(),
      ...Array.from(this.nutrition.keys()).map((h) => h.slice(0, 10)),
    ])
    const joursTries = Array.from(tousLesJours).sort()

    return {
      pas,
      poids,
      sommeil,
      nutrition: this.nutrition,
      premiereDate: joursTries[0] || null,
      derniereDate: joursTries[joursTries.length - 1] || null,
    }
  }
}

/**
 * Fusionne des intervalles de sommeil potentiellement chevauchants (plusieurs sources
 * peuvent chacune écrire leur propre analyse pour la même nuit) et retourne la durée
 * totale réellement couverte, en heures — pas la somme brute de chaque intervalle.
 */
function fusionnerEtSommerHeures(intervalles: Array<{ debut: number; fin: number }>): number {
  if (intervalles.length === 0) return 0
  const tries = [...intervalles].sort((a, b) => a.debut - b.debut)
  let total = 0
  let debutCourant = tries[0].debut
  let finCourante = tries[0].fin
  for (let i = 1; i < tries.length; i++) {
    const { debut, fin } = tries[i]
    if (debut <= finCourante) {
      finCourante = Math.max(finCourante, fin)
    } else {
      total += finCourante - debutCourant
      debutCourant = debut
      finCourante = fin
    }
  }
  total += finCourante - debutCourant
  return total / 1000 / 60 / 60
}
