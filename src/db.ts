import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  ProfilUtilisatrice,
  Repas,
  SeanceLog,
  PoidsExercice,
  SuiviJournalier,
  SuiviHebdomadaire,
  AlerteStagnation,
} from './types'

interface AppDB extends DBSchema {
  profil: {
    key: string
    value: ProfilUtilisatrice
  }
  repas: {
    key: string
    value: Repas
    indexes: { parDate: string }
  }
  seancesLog: {
    key: string
    value: SeanceLog
    indexes: { parDate: string }
  }
  poidsParExercice: {
    key: string
    value: { nom: string; poids_kg: number }
  }
  suiviJournalier: {
    key: string
    value: SuiviJournalier
  }
  suiviHebdomadaire: {
    key: string
    value: SuiviHebdomadaire
  }
  alertesStagnation: {
    key: string
    value: AlerteStagnation
  }
}

const DB_NAME = 'lea-forme-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profil')) {
          db.createObjectStore('profil')
        }
        if (!db.objectStoreNames.contains('repas')) {
          const store = db.createObjectStore('repas', { keyPath: 'id' })
          store.createIndex('parDate', 'dateHeure')
        }
        if (!db.objectStoreNames.contains('seancesLog')) {
          const store = db.createObjectStore('seancesLog', { keyPath: 'id' })
          store.createIndex('parDate', 'date')
        }
        if (!db.objectStoreNames.contains('poidsParExercice')) {
          db.createObjectStore('poidsParExercice', { keyPath: 'nom' })
        }
        if (!db.objectStoreNames.contains('suiviJournalier')) {
          db.createObjectStore('suiviJournalier', { keyPath: 'date' })
        }
        if (!db.objectStoreNames.contains('suiviHebdomadaire')) {
          db.createObjectStore('suiviHebdomadaire', { keyPath: 'date' })
        }
        if (!db.objectStoreNames.contains('alertesStagnation')) {
          db.createObjectStore('alertesStagnation', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

const PROFIL_KEY = 'profil-actuel'

export async function chargerProfil(): Promise<ProfilUtilisatrice | undefined> {
  const db = await getDb()
  return db.get('profil', PROFIL_KEY)
}

export async function sauvegarderProfil(profil: ProfilUtilisatrice) {
  const db = await getDb()
  await db.put('profil', profil, PROFIL_KEY)
}

export async function chargerRepas(): Promise<Repas[]> {
  const db = await getDb()
  return db.getAll('repas')
}

export async function sauvegarderRepas(repas: Repas) {
  const db = await getDb()
  await db.put('repas', repas)
}

export async function supprimerRepas(id: string) {
  const db = await getDb()
  await db.delete('repas', id)
}

/** Écrit plusieurs repas en une seule transaction (utilisé pour l'import en masse). */
export async function sauvegarderRepasEnMasse(repasArray: Repas[]) {
  const db = await getDb()
  const tx = db.transaction('repas', 'readwrite')
  await Promise.all([...repasArray.map((r) => tx.store.put(r)), tx.done])
}

export async function chargerSeancesLog(): Promise<SeanceLog[]> {
  const db = await getDb()
  return db.getAll('seancesLog')
}

export async function sauvegarderSeanceLog(seance: SeanceLog) {
  const db = await getDb()
  await db.put('seancesLog', seance)
}

export async function supprimerSeanceLog(id: string) {
  const db = await getDb()
  await db.delete('seancesLog', id)
}

export async function chargerPoidsParExercice(): Promise<PoidsExercice> {
  const db = await getDb()
  const all = await db.getAll('poidsParExercice')
  const result: PoidsExercice = {}
  for (const item of all) {
    result[item.nom] = item.poids_kg
  }
  return result
}

export async function sauvegarderPoidsExercice(nom: string, poids_kg: number) {
  const db = await getDb()
  await db.put('poidsParExercice', { nom, poids_kg })
}

export async function chargerSuiviJournalier(): Promise<SuiviJournalier[]> {
  const db = await getDb()
  return db.getAll('suiviJournalier')
}

export async function sauvegarderSuiviJournalier(entree: SuiviJournalier) {
  const db = await getDb()
  await db.put('suiviJournalier', entree)
}

/** Écrit plusieurs entrées en une seule transaction (utilisé pour l'import en masse). */
export async function sauvegarderSuiviJournalierEnMasse(entrees: SuiviJournalier[]) {
  const db = await getDb()
  const tx = db.transaction('suiviJournalier', 'readwrite')
  await Promise.all([...entrees.map((entree) => tx.store.put(entree)), tx.done])
}

export async function chargerSuiviHebdomadaire(): Promise<SuiviHebdomadaire[]> {
  const db = await getDb()
  return db.getAll('suiviHebdomadaire')
}

export async function sauvegarderSuiviHebdomadaire(entree: SuiviHebdomadaire) {
  const db = await getDb()
  await db.put('suiviHebdomadaire', entree)
}

export async function chargerAlertesStagnation(): Promise<AlerteStagnation[]> {
  const db = await getDb()
  return db.getAll('alertesStagnation')
}

export async function sauvegarderAlerteStagnation(alerte: AlerteStagnation) {
  const db = await getDb()
  await db.put('alertesStagnation', alerte)
}
