import type {
  ProfilUtilisatrice,
  Repas,
  SeanceLog,
  SuiviJournalier,
  SuiviHebdomadaire,
  Micronutriments,
} from '../types'
import { PLANNING_SEMAINE } from '../data/defaults'
import { totauxRepas, ajouterSupplements, analyserMicronutriments } from './nutrition'
import { ajouterJours } from './date'

export interface RapportHebdomadaire {
  semaineDebut: string
  semaineFin: string
  nbJoursAvecRepas: number
  calories: { moyenne: number; objectif: number }
  proteines_g: { moyenne: number; objectif: number }
  lipides_g: { moyenne: number; objectif: number }
  glucides_g: { moyenne: number; objectif: number }
  microsFaibles: { cle: keyof Micronutriments; label: string; emoji: string; pourcentage: number }[]
  pas: { moyenne: number; nbJours: number } | null
  sommeil_h: { moyenne: number; nbJours: number } | null
  poids: { debut: number; fin: number; delta: number } | null
  seances: { faites: number; planifiees: number }
}

/**
 * Calcule le bilan d'une semaine calendaire (lundi → dimanche) à partir des données déjà
 * en mémoire — rien n'est persisté, le rapport est toujours recalculé à la volée pour
 * n'importe quelle semaine passée.
 */
export function genererRapportHebdomadaire(
  semaineDebut: string,
  profil: ProfilUtilisatrice,
  repas: Repas[],
  suiviJournalier: SuiviJournalier[],
  suiviHebdomadaire: SuiviHebdomadaire[],
  seancesLog: SeanceLog[]
): RapportHebdomadaire {
  const semaineFin = ajouterJours(semaineDebut, 6)
  const dansLaSemaine = (date: string) => date >= semaineDebut && date <= semaineFin

  const repasSemaine = repas.filter((r) => dansLaSemaine(r.dateHeure.slice(0, 10)))
  const joursAvecRepas = new Set(repasSemaine.map((r) => r.dateHeure.slice(0, 10)))
  // On moyenne sur les jours réellement renseignés (pas toujours 7) : sinon une semaine
  // partiellement suivie afficherait des moyennes artificiellement basses.
  const nbJoursPourMoyenne = Math.max(1, joursAvecRepas.size)
  const totaux = totauxRepas(repasSemaine)

  const objectifs = profil.objectifsNutritionnels
  const calories = { moyenne: totaux.calories / nbJoursPourMoyenne, objectif: objectifs.calories }
  const proteines_g = { moyenne: totaux.proteines_g / nbJoursPourMoyenne, objectif: objectifs.proteines_g }
  const lipides_g = { moyenne: totaux.lipides_g / nbJoursPourMoyenne, objectif: objectifs.lipides_g }
  const glucides_g = { moyenne: totaux.glucides_g / nbJoursPourMoyenne, objectif: objectifs.glucides_g }

  const moyenneMicros = { ...totaux.micros }
  for (const cle of Object.keys(moyenneMicros) as (keyof Micronutriments)[]) {
    moyenneMicros[cle] = totaux.micros[cle] / nbJoursPourMoyenne
  }
  const microsFaibles = analyserMicronutriments(ajouterSupplements(moyenneMicros), objectifs.micros)
    .filter((n) => n.statut === 'faible')
    .map((n) => ({ cle: n.cle, label: n.label, emoji: n.emoji, pourcentage: n.pourcentage }))

  const suiviSemaine = suiviJournalier.filter((e) => dansLaSemaine(e.date))

  const pasValeurs = suiviSemaine.filter((e) => e.pas !== undefined).map((e) => e.pas as number)
  const pas =
    pasValeurs.length > 0
      ? { moyenne: pasValeurs.reduce((a, b) => a + b, 0) / pasValeurs.length, nbJours: pasValeurs.length }
      : null

  const sommeilValeurs = suiviSemaine.filter((e) => e.sommeil_h !== undefined).map((e) => e.sommeil_h as number)
  const sommeil_h =
    sommeilValeurs.length > 0
      ? { moyenne: sommeilValeurs.reduce((a, b) => a + b, 0) / sommeilValeurs.length, nbJours: sommeilValeurs.length }
      : null

  // Poids : on combine le suivi journalier (souvent quotidien via l'import Santé) et le
  // suivi hebdomadaire (check-in manuel) pour repérer le premier et le dernier poids connu
  // de la semaine, peu importe d'où il vient.
  const pointsPoids = [
    ...suiviSemaine
      .filter((e) => e.poids_kg !== undefined)
      .map((e) => ({ date: e.date, poids_kg: e.poids_kg as number })),
    ...suiviHebdomadaire.filter((e) => dansLaSemaine(e.date)).map((e) => ({ date: e.date, poids_kg: e.poids_kg })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  const poids =
    pointsPoids.length > 0
      ? {
          debut: pointsPoids[0].poids_kg,
          fin: pointsPoids[pointsPoids.length - 1].poids_kg,
          delta: pointsPoids[pointsPoids.length - 1].poids_kg - pointsPoids[0].poids_kg,
        }
      : null

  const seancesFaites = seancesLog.filter((s) => dansLaSemaine(s.date) && s.termineeA).length
  const planifiees = Object.values(PLANNING_SEMAINE).filter((v) => v !== null).length

  return {
    semaineDebut,
    semaineFin,
    nbJoursAvecRepas: joursAvecRepas.size,
    calories,
    proteines_g,
    lipides_g,
    glucides_g,
    microsFaibles,
    pas,
    sommeil_h,
    poids,
    seances: { faites: seancesFaites, planifiees },
  }
}
