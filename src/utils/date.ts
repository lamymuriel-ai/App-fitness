/**
 * Sérialise une date en ISO (YYYY-MM-DD) à partir de ses composants LOCAUX — jamais via
 * `toISOString()`, qui convertit en UTC et fait donc glisser la date d'un jour en arrière
 * pour tout fuseau en avance sur UTC (ex. Europe/Paris) : minuit local devient 22h ou 23h
 * la veille en UTC, donc "aujourd'hui" ou "lundi" se réafficherait comme la veille.
 */
function versISOLocale(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dateDuJourISO(): string {
  return versISOLocale(new Date())
}

/**
 * Sérialise une date+heure en ISO LOCAL (sans "Z" ni décalage) — même principe que
 * `versISOLocale`, jamais via `toISOString()`. Un `dateHeure` de repas doit rester associé au
 * même jour calendaire quel que soit le fuseau : `toISOString()` convertit en UTC, donc un repas
 * pris peu après minuit (ex. 00h30, fuseau en avance sur UTC) glisserait sur la veille dès que
 * du code lit `dateHeure.slice(0, 10)` pour en déduire le jour (Journal, Dashboard, tendances...).
 * Une chaîne sans décalage est réinterprétée comme heure locale par `new Date(...)` (spécifiée
 * par ECMA-262 pour les formes date-heure, contrairement aux formes date seule qui sont UTC),
 * donc le round-trip stockage → relecture reste cohérent sur un même appareil.
 */
export function versDateHeureLocaleISO(d: Date): string {
  const heure = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const seconde = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${versISOLocale(d)}T${heure}:${minute}:${seconde}.${ms}`
}

export function formatDateCourt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatHeure(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function estAujourdhui(iso: string): boolean {
  return iso.slice(0, 10) === dateDuJourISO()
}

/**
 * Numéro de la semaine du plan (1 = première semaine), aligné sur les semaines
 * calendaires lundi-dimanche utilisées partout ailleurs dans l'appli (Récap visuel,
 * bilan hebdomadaire...). Si le plan démarre un jour autre que lundi, les quelques jours
 * avant le premier lundi complet sont absorbés dans la semaine 1 plutôt que de basculer
 * en semaine 2 après seulement 7 jours calendaires (ex. démarrer un dimanche ne doit pas
 * afficher "semaine 2" dès le dimanche suivant, alors qu'aucune semaine lundi-dimanche
 * complète n'est encore terminée).
 */
export function numeroSemaine(dateDebutISO: string, dateReferenceISO = dateDuJourISO()): number {
  const lundiDebut = debutSemaineISO(dateDebutISO)
  const lundiSemaine1 = dateDebutISO === lundiDebut ? lundiDebut : ajouterJours(lundiDebut, 7)
  const lundiReference = debutSemaineISO(dateReferenceISO)
  if (lundiReference <= lundiSemaine1) return 1
  const joursEntre = Math.round(
    (new Date(`${lundiReference}T00:00:00`).getTime() - new Date(`${lundiSemaine1}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  return 1 + Math.round(joursEntre / 7)
}

/** Lundi de la semaine calendaire contenant la date donnée (par défaut aujourd'hui), au format ISO (YYYY-MM-DD). */
export function debutSemaineISO(dateISO = dateDuJourISO()): string {
  const d = new Date(`${dateISO}T00:00:00`)
  const jourSemaine = d.getDay() // 0 = dimanche, 1 = lundi, ...
  const decalage = jourSemaine === 0 ? 6 : jourSemaine - 1
  d.setDate(d.getDate() - decalage)
  return versISOLocale(d)
}

/** Nombre de jours entre deux dates ISO (YYYY-MM-DD), positif si `dateFinISO` est après `dateDebutISO`. */
export function joursEntre(dateDebutISO: string, dateFinISO: string): number {
  return Math.round(
    (new Date(`${dateFinISO}T00:00:00`).getTime() - new Date(`${dateDebutISO}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

/** Ajoute (ou retranche si négatif) un nombre de jours à une date ISO (YYYY-MM-DD), en heure locale. */
export function ajouterJours(dateISO: string, n: number): string {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() + n)
  return versISOLocale(d)
}

/**
 * Construit un horodatage pour "maintenant", mais sur le jour ISO donné plutôt
 * qu'aujourd'hui — utile quand on ajoute un repas en consultant un autre jour que
 * celui du jour même (sinon il serait daté d'aujourd'hui et disparaîtrait du jour
 * qu'on est en train de regarder). Sans date fournie, équivaut à l'heure actuelle.
 */
export function combinerDateEtHeureActuelle(dateISO?: string | null): string {
  const maintenant = new Date()
  if (!dateISO) return versDateHeureLocaleISO(maintenant)
  const d = new Date(`${dateISO}T00:00:00`)
  d.setHours(maintenant.getHours(), maintenant.getMinutes(), maintenant.getSeconds(), maintenant.getMilliseconds())
  return versDateHeureLocaleISO(d)
}

export function typeRepasSuggere(heure = new Date().getHours()): 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation' {
  if (heure < 10) return 'petit_dejeuner'
  if (heure < 14) return 'dejeuner'
  if (heure < 18) return 'collation'
  return 'diner'
}

let compteurId = 0
export function genererId(): string {
  compteurId += 1
  return `${Date.now().toString(36)}-${compteurId}-${Math.random().toString(36).slice(2, 8)}`
}
