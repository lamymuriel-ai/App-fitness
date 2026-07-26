import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  ProfilUtilisatrice,
  Repas,
  SeanceLog,
  PoidsExercice,
  SuiviJournalier,
  SuiviHebdomadaire,
  AlerteStagnation,
} from '../types'
import { profilParDefaut } from '../data/defaults'
import * as db from '../db'

interface AppDataContextValue {
  chargement: boolean
  profil: ProfilUtilisatrice
  repas: Repas[]
  seancesLog: SeanceLog[]
  poidsParExercice: PoidsExercice
  suiviJournalier: SuiviJournalier[]
  suiviHebdomadaire: SuiviHebdomadaire[]
  alertesStagnation: AlerteStagnation[]

  mettreAJourProfil: (profil: ProfilUtilisatrice) => Promise<void>
  ajouterRepas: (repas: Repas) => Promise<void>
  ajouterRepasEnMasse: (repasArray: Repas[]) => Promise<void>
  supprimerRepasParId: (id: string) => Promise<void>
  enregistrerSeanceLog: (seance: SeanceLog) => Promise<void>
  definirPoidsExercice: (nom: string, poids_kg: number) => Promise<void>
  enregistrerSuiviJour: (entree: SuiviJournalier) => Promise<void>
  enregistrerSuiviJourEnMasse: (entrees: SuiviJournalier[]) => Promise<void>
  enregistrerSuiviHebdo: (entree: SuiviHebdomadaire) => Promise<void>
  enregistrerAlerteStagnation: (alerte: AlerteStagnation) => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [chargement, setChargement] = useState(true)
  const [profil, setProfil] = useState<ProfilUtilisatrice>(profilParDefaut())
  const [repas, setRepas] = useState<Repas[]>([])
  const [seancesLog, setSeancesLog] = useState<SeanceLog[]>([])
  const [poidsParExercice, setPoidsParExercice] = useState<PoidsExercice>({})
  const [suiviJournalier, setSuiviJournalier] = useState<SuiviJournalier[]>([])
  const [suiviHebdomadaire, setSuiviHebdomadaire] = useState<SuiviHebdomadaire[]>([])
  const [alertesStagnation, setAlertesStagnation] = useState<AlerteStagnation[]>([])

  useEffect(() => {
    ;(async () => {
      const [
        profilCharge,
        repasCharges,
        seancesChargees,
        poidsCharges,
        suiviJourCharge,
        suiviHebdoCharge,
        alertesChargees,
      ] = await Promise.all([
        db.chargerProfil(),
        db.chargerRepas(),
        db.chargerSeancesLog(),
        db.chargerPoidsParExercice(),
        db.chargerSuiviJournalier(),
        db.chargerSuiviHebdomadaire(),
        db.chargerAlertesStagnation(),
      ])
      if (profilCharge) setProfil(profilCharge)
      setRepas(repasCharges)
      setSeancesLog(seancesChargees)
      setPoidsParExercice(poidsCharges)
      setSuiviJournalier(suiviJourCharge)
      setSuiviHebdomadaire(suiviHebdoCharge)
      setAlertesStagnation(alertesChargees)
      setChargement(false)
    })()
  }, [])

  const value: AppDataContextValue = useMemo(
    () => ({
      chargement,
      profil,
      repas,
      seancesLog,
      poidsParExercice,
      suiviJournalier,
      suiviHebdomadaire,
      alertesStagnation,

      async mettreAJourProfil(nouveauProfil) {
        setProfil(nouveauProfil)
        await db.sauvegarderProfil(nouveauProfil)
      },

      async ajouterRepas(nouveauRepas) {
        setRepas((prev) => [...prev, nouveauRepas])
        await db.sauvegarderRepas(nouveauRepas)
      },

      async ajouterRepasEnMasse(repasArray) {
        setRepas((prev) => {
          const parId = new Map(prev.map((r) => [r.id, r]))
          for (const r of repasArray) parId.set(r.id, r)
          return Array.from(parId.values())
        })
        await db.sauvegarderRepasEnMasse(repasArray)
      },

      async supprimerRepasParId(id) {
        setRepas((prev) => prev.filter((r) => r.id !== id))
        await db.supprimerRepas(id)
      },

      async enregistrerSeanceLog(seance) {
        setSeancesLog((prev) => {
          const index = prev.findIndex((s) => s.id === seance.id)
          if (index >= 0) {
            const copie = [...prev]
            copie[index] = seance
            return copie
          }
          return [...prev, seance]
        })
        await db.sauvegarderSeanceLog(seance)
      },

      async definirPoidsExercice(nom, poids_kg) {
        setPoidsParExercice((prev) => ({ ...prev, [nom]: poids_kg }))
        await db.sauvegarderPoidsExercice(nom, poids_kg)
      },

      async enregistrerSuiviJour(entree) {
        setSuiviJournalier((prev) => {
          const index = prev.findIndex((e) => e.date === entree.date)
          if (index >= 0) {
            const copie = [...prev]
            copie[index] = { ...copie[index], ...entree }
            return copie
          }
          return [...prev, entree]
        })
        await db.sauvegarderSuiviJournalier(entree)
      },

      async enregistrerSuiviJourEnMasse(entrees) {
        const parDate = new Map(suiviJournalier.map((e) => [e.date, e]))
        for (const entree of entrees) {
          const existante = parDate.get(entree.date)
          parDate.set(entree.date, existante ? { ...existante, ...entree } : entree)
        }
        const fusionnees = entrees.map((e) => parDate.get(e.date)!)
        setSuiviJournalier(Array.from(parDate.values()))
        await db.sauvegarderSuiviJournalierEnMasse(fusionnees)
      },

      async enregistrerSuiviHebdo(entree) {
        setSuiviHebdomadaire((prev) => {
          const index = prev.findIndex((e) => e.date === entree.date)
          if (index >= 0) {
            const copie = [...prev]
            copie[index] = entree
            return copie
          }
          return [...prev, entree]
        })
        await db.sauvegarderSuiviHebdomadaire(entree)
      },

      async enregistrerAlerteStagnation(alerte) {
        setAlertesStagnation((prev) => {
          const index = prev.findIndex((a) => a.id === alerte.id)
          if (index >= 0) {
            const copie = [...prev]
            copie[index] = alerte
            return copie
          }
          return [...prev, alerte]
        })
        await db.sauvegarderAlerteStagnation(alerte)
      },
    }),
    [
      chargement,
      profil,
      repas,
      seancesLog,
      poidsParExercice,
      suiviJournalier,
      suiviHebdomadaire,
      alertesStagnation,
    ]
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData doit être utilisé dans un AppDataProvider')
  return ctx
}
