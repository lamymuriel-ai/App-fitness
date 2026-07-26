import { unzip } from 'fflate'
import type { Micronutriments } from '../types'

export interface NutritionJour {
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
}

export interface ResultatImportSante {
  pas: Map<string, number>
  poids: Map<string, number> // kg
  sommeil: Map<string, number> // heures
  nutrition: Map<string, NutritionJour>
  premiereDate: string | null
  derniereDate: string | null
}

function nutritionVide(): NutritionJour {
  return {
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

/**
 * Analyse le XML exporté par l'app Santé en un seul passage, sans construire de DOM
 * (les exports peuvent faire plusieurs dizaines de Mo). Les <Record> sont soit
 * auto-fermants, soit contiennent des <MetadataEntry> enfants (fréquent pour les
 * données nutritionnelles saisies via une app tierce) — les deux formes sont gérées.
 */
function extraireXml(xml: string): ResultatImportSante {
  const pas = new Map<string, number>()
  const poidsSommeCompte = new Map<string, { somme: number; compte: number }>()
  const sommeil = new Map<string, number>()
  const nutrition = new Map<string, NutritionJour>()

  const alternatives = TOUS_LES_TYPES_SUIVIS.join('|')
  const regexRecord = new RegExp(
    `<Record type="(${alternatives})"[^>]*?(?:/>|>[\\s\\S]*?</Record>)`,
    'g'
  )
  const regexOuverture = /^<Record\b[^>]*?(?:\/>|>)/
  const regexStart = /startDate="([^"]+)"/
  const regexEnd = /endDate="([^"]+)"/
  const regexValeur = /value="([^"]+)"/
  const regexUnite = /unit="([^"]+)"/

  let correspondance: RegExpExecArray | null
  while ((correspondance = regexRecord.exec(xml)) !== null) {
    const type = correspondance[1]
    const ouvertureMatch = regexOuverture.exec(correspondance[0])
    const ouverture = ouvertureMatch ? ouvertureMatch[0] : correspondance[0]

    const startMatch = regexStart.exec(ouverture)
    if (!startMatch) continue
    const jourDebut = startMatch[1].slice(0, 10)
    const valeurMatch = regexValeur.exec(ouverture)
    if (!valeurMatch) continue

    if (type === TYPE_PAS) {
      const valeur = Number(valeurMatch[1])
      if (!Number.isFinite(valeur)) continue
      pas.set(jourDebut, (pas.get(jourDebut) || 0) + valeur)
      continue
    }

    if (type === TYPE_POIDS) {
      const uniteMatch = regexUnite.exec(ouverture)
      const valeurBrute = Number(valeurMatch[1])
      if (!Number.isFinite(valeurBrute) || !uniteMatch) continue
      const kg = convertirPoidsEnKg(valeurBrute, uniteMatch[1])
      if (kg === null) continue
      const cumul = poidsSommeCompte.get(jourDebut) || { somme: 0, compte: 0 }
      cumul.somme += kg
      cumul.compte += 1
      poidsSommeCompte.set(jourDebut, cumul)
      continue
    }

    if (type === TYPE_SOMMEIL) {
      if (!valeurMatch[1].includes('Asleep')) continue // exclut "InBed" et "Awake"
      const endMatch = regexEnd.exec(ouverture)
      if (!endMatch) continue
      const debut = new Date(startMatch[1]).getTime()
      const fin = new Date(endMatch[1]).getTime()
      if (!Number.isFinite(debut) || !Number.isFinite(fin) || fin <= debut) continue
      const heures = (fin - debut) / 1000 / 60 / 60
      const jourFin = endMatch[1].slice(0, 10) // nuit attribuée au jour du réveil
      sommeil.set(jourFin, (sommeil.get(jourFin) || 0) + heures)
      continue
    }

    const mapping = MAPPING_NUTRITION[type]
    if (mapping) {
      const uniteMatch = regexUnite.exec(ouverture)
      const valeurBrute = Number(valeurMatch[1])
      if (!Number.isFinite(valeurBrute) || !uniteMatch) continue
      const convertie =
        mapping.unite === 'kcal'
          ? convertirEnergie(valeurBrute, uniteMatch[1])
          : convertirMasse(valeurBrute, uniteMatch[1], mapping.unite)
      if (convertie === null) continue

      const jourNutrition = nutrition.get(jourDebut) || nutritionVide()
      if (mapping.cible === 'macro') {
        jourNutrition[mapping.champ] += convertie
      } else {
        jourNutrition.micros[mapping.champ] += convertie
      }
      nutrition.set(jourDebut, jourNutrition)
    }
  }

  const poids = new Map<string, number>()
  for (const [jour, { somme, compte }] of poidsSommeCompte) {
    poids.set(jour, Math.round((somme / compte) * 10) / 10)
  }

  const tousLesJours = new Set<string>([
    ...pas.keys(),
    ...poids.keys(),
    ...sommeil.keys(),
    ...nutrition.keys(),
  ])
  const joursTries = Array.from(tousLesJours).sort()

  return {
    pas,
    poids,
    sommeil,
    nutrition,
    premiereDate: joursTries[0] || null,
    derniereDate: joursTries[joursTries.length - 1] || null,
  }
}

async function lireCommeTexte(file: File): Promise<string> {
  return file.text()
}

async function extraireXmlDuZip(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer())
  const fichiers = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(buffer, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
  const nomEntree = Object.keys(fichiers).find((nom) => nom.toLowerCase().endsWith('export.xml'))
  if (!nomEntree) {
    throw new Error("Le fichier export.xml est introuvable dans cette archive.")
  }
  return new TextDecoder('utf-8').decode(fichiers[nomEntree])
}

export async function analyserExportSante(file: File): Promise<ResultatImportSante> {
  const estZip = file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')

  const xml = estZip ? await extraireXmlDuZip(file) : await lireCommeTexte(file)

  if (!xml.includes('<HealthData')) {
    throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
  }

  return extraireXml(xml)
}
