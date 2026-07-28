import type { ReactNode } from 'react'

export function BarreProgression({
  valeur,
  objectif,
  couleur = 'pink',
}: {
  valeur: number
  objectif: number
  couleur?: 'pink' | 'blue' | 'yellow' | 'green' | 'purple' | 'navy'
}) {
  const pourcentage = objectif > 0 ? Math.min(100, Math.round((valeur / objectif) * 100)) : 0
  return (
    <div className="progress-track">
      <div className={`progress-fill ${couleur}`} style={{ width: `${pourcentage}%` }} />
    </div>
  )
}

function LigneMacro({
  label,
  couleurTexte,
  couleurBarre,
  valeur,
  objectif,
}: {
  label: string
  couleurTexte: string
  couleurBarre: 'pink' | 'blue' | 'yellow' | 'green'
  valeur: number
  objectif: number
}) {
  const restant = Math.max(0, Math.round(objectif - valeur))
  return (
    <div>
      <div className="row-between" style={{ gap: 6, minWidth: 0 }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.8rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          <span style={{ color: couleurTexte }}>{label}</span> {Math.round(valeur)}/{Math.round(objectif)}g
        </span>
        <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
          {restant}g restant
        </span>
      </div>
      <div style={{ marginTop: 3 }}>
        <BarreProgression valeur={valeur} objectif={objectif} couleur={couleurBarre} />
      </div>
    </div>
  )
}

export function BarreMacros({
  proteines_g,
  lipides_g,
  glucides_g,
  objectifProteines_g,
  objectifLipides_g,
  objectifGlucides_g,
}: {
  proteines_g: number
  lipides_g: number
  glucides_g: number
  objectifProteines_g: number
  objectifLipides_g: number
  objectifGlucides_g: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <LigneMacro
        label="Prot."
        couleurTexte="var(--blue-deep)"
        couleurBarre="blue"
        valeur={proteines_g}
        objectif={objectifProteines_g}
      />
      <LigneMacro
        label="Gluc."
        couleurTexte="#3f9955"
        couleurBarre="green"
        valeur={glucides_g}
        objectif={objectifGlucides_g}
      />
      <LigneMacro
        label="Lip."
        couleurTexte="#a3821f"
        couleurBarre="yellow"
        valeur={lipides_g}
        objectif={objectifLipides_g}
      />
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
