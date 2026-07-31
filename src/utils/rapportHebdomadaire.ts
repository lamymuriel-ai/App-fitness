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

const SOURCES_MICRO: Partial<Record<keyof Micronutriments, string>> = {
  fer_mg: 'viande rouge, lentilles, épinards',
  calcium_mg: 'produits laitiers, fromage blanc, amandes',
  magnesium_mg: 'oléagineux, chocolat noir, légumineuses',
  zinc_mg: 'viande, œufs, graines de courge',
  vitamineA_ug: 'carottes, patate douce, épinards',
  vitamineC_mg: 'agrumes, kiwi, poivron',
  vitamineD_ug: 'poisson gras, œufs, un peu de soleil',
  vitamineE_mg: 'huiles végétales, amandes, avocat',
  vitamineB6_mg: 'volaille, poisson, pommes de terre',
  vitamineB12_ug: 'viande, poisson, œufs, produits laitiers',
  fibres_g: 'légumes, légumineuses, céréales complètes',
}

export interface AnalyseHebdomadaire {
  titre: string
  points: string[]
}

/**
 * Commentaire en langage naturel sur la semaine, dans le même esprit qu'une analyse
 * ponctuelle : pas seulement les chiffres bruts, mais un avis (est-ce cohérent avec
 * l'objectif, qu'est-ce qui mérite un ajustement). Purement basé sur des règles/seuils —
 * ce n'est pas un avis médical.
 */
export function genererAnalyseHebdomadaire(
  rapport: RapportHebdomadaire,
  profil: ProfilUtilisatrice
): AnalyseHebdomadaire {
  const points: string[] = []
  let signauxPositifs = 0
  let signauxNegatifs = 0

  if (rapport.poids) {
    const delta = rapport.poids.delta
    if (profil.objectif === 'perte_poids') {
      if (delta < -1.2) {
        points.push(
          `⚖️ Le poids a baissé de ${Math.abs(delta).toFixed(1)} kg cette semaine — c'est une perte assez rapide. Une perte de graisse durable tourne plutôt autour de 0,3 à 0,8 kg/semaine ; si ça se répète, vérifie que tu manges assez.`
        )
        signauxNegatifs += 1
      } else if (delta <= -0.1) {
        points.push(`⚖️ Le poids a baissé de ${Math.abs(delta).toFixed(1)} kg cette semaine, cohérent avec ton objectif de perte.`)
        signauxPositifs += 1
      } else if (delta < 0.3) {
        points.push(
          `⚖️ Le poids est resté globalement stable cette semaine — normal, il fluctue d'un jour à l'autre (eau, digestion...), c'est la tendance sur plusieurs semaines qui compte vraiment.`
        )
      } else {
        points.push(
          `⚖️ Le poids a un peu augmenté cette semaine (+${delta.toFixed(1)} kg). Une semaine seule n'a rien d'inquiétant ; si ça se confirme sur 2-3 semaines, ce sera le signal d'ajuster calories ou activité.`
        )
        signauxNegatifs += 1
      }
    } else if (profil.objectif === 'prise_masse') {
      if (delta > 0.1) {
        points.push(`⚖️ Le poids a augmenté de ${delta.toFixed(1)} kg cette semaine, cohérent avec ton objectif de prise de masse.`)
        signauxPositifs += 1
      } else if (delta > -0.3) {
        points.push('⚖️ Le poids est resté à peu près stable cette semaine.')
      } else {
        points.push(
          `⚖️ Le poids a baissé de ${Math.abs(delta).toFixed(1)} kg cette semaine, à l'inverse de ton objectif de prise de masse — à surveiller si ça continue.`
        )
        signauxNegatifs += 1
      }
    } else {
      if (Math.abs(delta) < 0.5) {
        points.push(`⚖️ Le poids est resté stable cette semaine (${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg), cohérent avec un objectif de maintien.`)
        signauxPositifs += 1
      } else {
        points.push(`⚖️ Le poids a bougé de ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg cette semaine — à surveiller si tu vises la stabilité.`)
        signauxNegatifs += 1
      }
    }
  }

  if (rapport.nbJoursAvecRepas > 0) {
    const pctCalories = (rapport.calories.moyenne / rapport.calories.objectif) * 100
    if (pctCalories > 115) {
      points.push(`🍽️ Les calories moyennes dépassent l'objectif d'environ ${Math.round(pctCalories - 100)}% cette semaine — à surveiller pour rester sur la trajectoire de perte.`)
      signauxNegatifs += 1
    } else if (pctCalories < 60) {
      points.push(`🍽️ Les calories moyennes sont assez basses cette semaine (${Math.round(pctCalories)}% de l'objectif) — vérifie que ce n'est pas juste dû à des repas non enregistrés.`)
    } else {
      points.push(`🍽️ Les apports caloriques sont bien alignés avec ton objectif (${Math.round(pctCalories)}% en moyenne).`)
      signauxPositifs += 1
    }

    const pctProteines = (rapport.proteines_g.moyenne / rapport.proteines_g.objectif) * 100
    if (pctProteines < 75) {
      points.push(`🥩 Les protéines sont un peu justes cette semaine (${Math.round(pctProteines)}% de l'objectif) — utile d'y penser pour préserver la masse musculaire pendant la perte.`)
    }
  }

  if (rapport.nbJoursAvecRepas > 0 && rapport.microsFaibles.length === 0) {
    points.push('🔬 Aucun micronutriment ne ressort comme faible cette semaine, plutôt une bonne diversité alimentaire.')
    signauxPositifs += 1
  } else if (rapport.microsFaibles.length > 0) {
    const items = rapport.microsFaibles
      .slice(0, 3)
      .map((m) => `${m.label.toLowerCase()}${SOURCES_MICRO[m.cle] ? ` (${SOURCES_MICRO[m.cle]})` : ''}`)
      .join(', ')
    points.push(`🔬 Quelques micronutriments un peu faibles cette semaine : ${items}.`)
  }

  if (rapport.pas) {
    const pctPas = (rapport.pas.moyenne / profil.objectifPas) * 100
    if (pctPas >= 90) {
      points.push(`👣 Bon rythme côté pas, ${Math.round(rapport.pas.moyenne).toLocaleString('fr-FR')}/j en moyenne.`)
      signauxPositifs += 1
    } else if (pctPas < 70) {
      points.push(`👣 Nettement en dessous de l'objectif de pas cette semaine (${Math.round(rapport.pas.moyenne).toLocaleString('fr-FR')}/j en moyenne).`)
      signauxNegatifs += 1
    } else {
      points.push(`👣 Un peu en dessous de l'objectif de pas cette semaine (${Math.round(rapport.pas.moyenne).toLocaleString('fr-FR')}/j en moyenne).`)
    }
  }

  if (rapport.sommeil_h) {
    if (rapport.sommeil_h.moyenne >= 7) {
      points.push(`😴 Le sommeil est suffisant en moyenne (${rapport.sommeil_h.moyenne.toFixed(1)}h/nuit).`)
      signauxPositifs += 1
    } else {
      points.push(`😴 Le sommeil est un peu court en moyenne (${rapport.sommeil_h.moyenne.toFixed(1)}h/nuit) — ça joue aussi sur la récupération et l'appétit.`)
      signauxNegatifs += 1
    }
  }

  if (rapport.seances.planifiees > 0) {
    if (rapport.seances.faites >= rapport.seances.planifiees) {
      points.push('💪 Toutes les séances prévues ont été faites cette semaine, bravo !')
      signauxPositifs += 1
    } else if (rapport.seances.faites > 0) {
      points.push(`💪 ${rapport.seances.faites}/${rapport.seances.planifiees} séances faites cette semaine.`)
    } else {
      points.push('💪 Aucune séance faite cette semaine.')
      signauxNegatifs += 1
    }
  }

  let titre = '🌸 Semaine correcte dans l\'ensemble'
  if (signauxPositifs - signauxNegatifs >= 2) titre = '🌸 Bilan plutôt positif, tu es sur la bonne voie'
  else if (signauxNegatifs - signauxPositifs >= 2) titre = "🌸 Une semaine plus difficile, sans rien d'alarmant"

  return { titre, points }
}
