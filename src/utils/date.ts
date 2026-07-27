export function dateDuJourISO(): string {
  return new Date().toISOString().slice(0, 10)
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

export function joursDepuis(iso: string): number {
  const debut = new Date(iso).getTime()
  const maintenant = Date.now()
  return Math.floor((maintenant - debut) / (1000 * 60 * 60 * 24))
}

export function numeroSemaine(dateDebutISO: string): number {
  const jours = joursDepuis(dateDebutISO)
  return Math.max(1, Math.floor(jours / 7) + 1)
}

/** Lundi de la semaine calendaire contenant la date donnée (par défaut aujourd'hui), au format ISO (YYYY-MM-DD). */
export function debutSemaineISO(dateISO = dateDuJourISO()): string {
  const d = new Date(`${dateISO}T00:00:00`)
  const jourSemaine = d.getDay() // 0 = dimanche, 1 = lundi, ...
  const decalage = jourSemaine === 0 ? 6 : jourSemaine - 1
  d.setDate(d.getDate() - decalage)
  return d.toISOString().slice(0, 10)
}

/** Ajoute (ou retranche si négatif) un nombre de jours à une date ISO (YYYY-MM-DD), en heure locale. */
export function ajouterJours(dateISO: string, n: number): string {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Construit un horodatage pour "maintenant", mais sur le jour ISO donné plutôt
 * qu'aujourd'hui — utile quand on ajoute un repas en consultant un autre jour que
 * celui du jour même (sinon il serait daté d'aujourd'hui et disparaîtrait du jour
 * qu'on est en train de regarder). Sans date fournie, équivaut à `new Date().toISOString()`.
 */
export function combinerDateEtHeureActuelle(dateISO?: string | null): string {
  if (!dateISO) return new Date().toISOString()
  const maintenant = new Date()
  const d = new Date(`${dateISO}T00:00:00`)
  d.setHours(maintenant.getHours(), maintenant.getMinutes(), maintenant.getSeconds(), maintenant.getMilliseconds())
  return d.toISOString()
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
