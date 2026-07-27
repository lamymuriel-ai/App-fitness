import type { ReactNode } from 'react'

export function BarreProgression({
  valeur,
  objectif,
  couleur = 'pink',
}: {
  valeur: number
  objectif: number
  couleur?: 'pink' | 'blue' | 'yellow' | 'green'
}) {
  const pourcentage = objectif > 0 ? Math.min(100, Math.round((valeur / objectif) * 100)) : 0
  return (
    <div className="progress-track">
      <div className={`progress-fill ${couleur}`} style={{ width: `${pourcentage}%` }} />
    </div>
  )
}

export function BarreMacros({
  proteines_g,
  lipides_g,
  glucides_g,
}: {
  proteines_g: number
  lipides_g: number
  glucides_g: number
}) {
  const totalCal = proteines_g * 4 + lipides_g * 9 + glucides_g * 4
  const pctP = totalCal > 0 ? (proteines_g * 4 * 100) / totalCal : 0
  const pctL = totalCal > 0 ? (lipides_g * 9 * 100) / totalCal : 0
  const pctG = totalCal > 0 ? (glucides_g * 4 * 100) / totalCal : 0
  return (
    <div>
      <div className="macro-bar">
        <div className="macro-protein" style={{ width: `${pctP}%` }} />
        <div className="macro-fat" style={{ width: `${pctL}%` }} />
        <div className="macro-carbs" style={{ width: `${pctG}%` }} />
      </div>
      <div className="macro-legend">
        <span style={{ color: 'var(--pink-deep)' }}>Prot. {Math.round(proteines_g)}g</span>
        <span style={{ color: '#a3821f' }}>Lip. {Math.round(lipides_g)}g</span>
        <span style={{ color: 'var(--blue-deep)' }}>Gluc. {Math.round(glucides_g)}g</span>
      </div>
    </div>
  )
}

export function Pastille({
  couleur = 'pink',
  children,
}: {
  couleur?: 'pink' | 'blue' | 'yellow' | 'green' | 'warning' | 'danger'
  children: ReactNode
}) {
  return <span className={`pill ${couleur}`}>{children}</span>
}

export function EtatVide({ emoji, titre, texte }: { emoji: string; titre: string; texte?: string }) {
  return (
    <div className="empty-state">
      <span className="emoji">{emoji}</span>
      <h3>{titre}</h3>
      {texte && <p>{texte}</p>}
    </div>
  )
}

export function FeuilleModale({
  ouverte,
  onFermer,
  children,
}: {
  ouverte: boolean
  onFermer: () => void
  children: ReactNode
}) {
  if (!ouverte) return null
  return (
    <div className="sheet-backdrop" onClick={onFermer}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  )
}
