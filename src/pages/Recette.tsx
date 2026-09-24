import { useState } from 'react'
import { RECETTES } from '../data/recettes'

export default function Recette() {
  const [index, setIndex] = useState(0)
  const recette = RECETTES[index]
  const plusieursRecettes = RECETTES.length > 1

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Recette</div>
        <h1>🍽️ Tes recettes</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {plusieursRecettes && (
          <div className="row-between mb-16">
            <button
              className="btn-ghost btn-sm"
              onClick={() => setIndex((i) => (i - 1 + RECETTES.length) % RECETTES.length)}
              aria-label="Recette précédente"
            >
              ←
            </button>
            <div className="center">
              <div style={{ fontWeight: 800 }}>{recette.emoji} {recette.nom}</div>
              <div className="muted small">{index + 1} / {RECETTES.length}</div>
            </div>
            <button
              className="btn-ghost btn-sm"
              onClick={() => setIndex((i) => (i + 1) % RECETTES.length)}
              aria-label="Recette suivante"
            >
              →
            </button>
          </div>
        )}

        <div className="card pink">
          <h2 style={{ marginBottom: 6 }}>
            {recette.emoji} {recette.nom}
          </h2>
          <p className="mb-0" style={{ fontSize: '1.05rem' }}>{recette.description}</p>
        </div>

        <div className="card blue">
          <h3>🧺 Ingrédients</h3>
          {recette.ingredients.map((ing) => (
            <div className="list-row" key={ing.nom}>
              <span style={{ fontSize: '1.05rem' }}>{ing.nom}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{ing.quantite}</span>
            </div>
          ))}
        </div>

        <div className="card yellow">
          {recette.sectionsEtapes.map((section, iSection) => (
            <div key={section.titre} className={iSection > 0 ? 'mt-16' : undefined}>
              <h3>{section.emoji} {section.titre}</h3>
              <ol style={{ paddingLeft: 22, margin: 0 }}>
                {section.etapes.map((etape, i) => (
                  <li key={i} style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 10 }}>
                    {etape}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>📊 Valeurs nutritionnelles</h3>
          <p className="muted mb-0" style={{ fontSize: '1rem' }}>
            {recette.portions > 1 ? `Par tranche, pour ${recette.portions} tranches` : 'Pour 1 portion'}
          </p>
          <div className="row gap-12 mt-8" style={{ justifyContent: 'space-around' }}>
            <div className="center">
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{recette.parPortion.calories}</div>
              <div className="muted" style={{ fontSize: '1rem' }}>kcal</div>
            </div>
            <div className="center">
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{recette.parPortion.proteines_g}g</div>
              <div className="muted" style={{ fontSize: '1rem' }}>protéines</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
