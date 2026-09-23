import { RECETTES } from '../data/recettes'

export default function Recette() {
  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Recette</div>
        <h1>🍽️ Tes recettes</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {RECETTES.map((recette) => (
          <div key={recette.id}>
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
              <h3>🌀 Au Thermomix</h3>
              <ol style={{ paddingLeft: 22, margin: 0 }}>
                {recette.etapesThermomix.map((etape, i) => (
                  <li key={i} style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 10 }}>
                    {etape}
                  </li>
                ))}
              </ol>

              <h3 className="mt-16">🔥 À l'Air Fryer</h3>
              <ol style={{ paddingLeft: 22, margin: 0 }}>
                {recette.etapesAirFryer.map((etape, i) => (
                  <li key={i} style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 10 }}>
                    {etape}
                  </li>
                ))}
              </ol>
            </div>

            <div className="card">
              <h3>📊 Valeurs nutritionnelles</h3>
              <p className="muted mb-0" style={{ fontSize: '1rem' }}>
                Par tranche, pour {recette.portions} tranches
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
        ))}
      </div>
    </div>
  )
}
