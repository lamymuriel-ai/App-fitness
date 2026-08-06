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
import { moyenneMobile7Jours } from './stagnation'

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

  // Poids : on compare la moyenne mobile 7 jours juste avant la semaine à celle en fin de
  // semaine — pas les pesées brutes de début/fin de semaine. Une pesée isolée varie
  // facilement de plus d'1 kg d'un jour à l'autre (eau, digestion, heure de la pesée) ; le
  // reste de l'appli (page Suivi) le dit explicitement ("c'est la moyenne sur 7 jours qui
  // compte, pas la valeur isolée") et le bilan hebdomadaire doit rester cohérent avec ça,
  // sinon un delta basé sur deux points bruts peut annoncer une "prise" trompeuse alors que
  // la tendance réelle est à la baisse.
  const pointsMoyennePoids = moyenneMobile7Jours(
    [...suiviJournalier, ...suiviHebdomadaire.map((e) => ({ date: e.date, poids_kg: e.poids_kg }))].filter(
      (e) => e.date >= profil.dateDebut
    )
  )
  const dernierPointAvant = (dateLimite: string) =>
    [...pointsMoyennePoids].reverse().find((p) => p.date <= dateLimite) ?? null
  const pointDebut = dernierPointAvant(semaineDebut)
  const pointFin = dernierPointAvant(semaineFin)
  const poids =
    pointDebut && pointFin && pointDebut.poidsMoyen !== null && pointFin.poidsMoyen !== null
      ? {
          debut: pointDebut.poidsMoyen,
          fin: pointFin.poidsMoyen,
          delta: Math.round((pointFin.poidsMoyen - pointDebut.poidsMoyen) * 10) / 10,
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

/**
 * Ajustements concrets proposés pour la semaine suivante (calories, micronutriments,
 * marche, sport, sommeil) à partir du bilan de la semaine écoulée. Un tableau vide
 * signifie "rien à changer, on garde le même cap" — on ne fabrique jamais un conseil
 * artificiel juste pour remplir la carte.
 */
export function genererConseilsSemaineSuivante(rapport: RapportHebdomadaire, profil: ProfilUtilisatrice): string[] {
  const conseils: string[] = []

  if (rapport.poids) {
    const delta = rapport.poids.delta
    if (profil.objectif === 'perte_poids') {
      if (delta > 0.3) {
        conseils.push(
          "⚖️ Le poids est reparti à la hausse cette semaine : réduis un peu les calories (-100 à 150 kcal/j) ou augmente l'activité (+1000-1500 pas/j) la semaine prochaine."
        )
      } else if (delta < -1.2) {
        conseils.push(
          '⚖️ La perte a été rapide cette semaine : remonte un peu les calories (+100-150 kcal/j) la semaine prochaine pour rester sur un rythme durable.'
        )
      }
    } else if (profil.objectif === 'prise_masse') {
      if (delta < -0.3) {
        conseils.push(
          "⚖️ Le poids a baissé alors que l'objectif est la prise de masse : augmente un peu les calories (+150-200 kcal/j) la semaine prochaine."
        )
      }
    } else if (Math.abs(delta) > 0.5) {
      conseils.push(
        `⚖️ Le poids a bougé de ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg cette semaine : ${delta > 0 ? 'réduis légèrement les calories' : 'ajoute un peu de calories'} la semaine prochaine pour revenir vers la stabilité.`
      )
    }
  }

  if (rapport.nbJoursAvecRepas >= 3 && conseils.length === 0) {
    const pctCalories = (rapport.calories.moyenne / rapport.calories.objectif) * 100
    if (pctCalories > 115) {
      conseils.push(`🍽️ Les calories ont dépassé l'objectif cette semaine (${Math.round(pctCalories)}%) : resserre un peu les portions la semaine prochaine.`)
    }
  }

  if (rapport.microsFaibles.length > 0) {
    const items = rapport.microsFaibles
      .slice(0, 2)
      .map((m) => `${m.label.toLowerCase()}${SOURCES_MICRO[m.cle] ? ` (${SOURCES_MICRO[m.cle]})` : ''}`)
      .join(', ')
    conseils.push(`🔬 Pense à ajouter un peu plus de ${items} la semaine prochaine.`)
  }

  if (rapport.pas) {
    const pctPas = (rapport.pas.moyenne / profil.objectifPas) * 100
    if (pctPas < 70) {
      conseils.push('👣 Vise un peu plus de marche la semaine prochaine (+1000 pas/j environ) pour te rapprocher de ton objectif.')
    }
  }

  const seancesManquees = rapport.seances.planifiees - rapport.seances.faites
  if (rapport.seances.planifiees > 0 && seancesManquees > 0) {
    conseils.push(
      `💪 ${seancesManquees} séance${seancesManquees > 1 ? 's' : ''} manquée${seancesManquees > 1 ? 's' : ''} cette semaine : essaie de toutes les caser la semaine prochaine, quitte à les faire en version courte.`
    )
  } else if (
    rapport.seances.planifiees > 0 &&
    seancesManquees <= 0 &&
    rapport.poids &&
    Math.abs(rapport.poids.delta) < 0.1 &&
    profil.objectif === 'perte_poids' &&
    rapport.nbJoursAvecRepas > 0 &&
    (rapport.calories.moyenne / rapport.calories.objectif) * 100 <= 105
  ) {
    conseils.push(
      "💪 Séances faites et calories dans les clous, mais le poids stagne : tu peux essayer d'ajouter une séance ou d'augmenter un peu les pas la semaine prochaine."
    )
  }

  if (rapport.sommeil_h && rapport.sommeil_h.moyenne < 7) {
    conseils.push('😴 Le sommeil était un peu court cette semaine : essaie de te coucher un peu plus tôt la semaine prochaine si possible.')
  }

  return conseils
}
