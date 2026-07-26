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
