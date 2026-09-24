import { useParams, useNavigate } from 'react-router-dom'
import { RECETTES } from '../data/recettes'

export default function DetailRecette() {
  const { id } = useParams()
  const navigate = useNavigate()
  const recette = RECETTES.find((r) => r.id === id)

  if (!recette) {
    return (
      <div className="screen">
        <button className="btn-ghost btn" onClick={() => navigate('/recette')}>← Retour</button>
        <p>Recette introuvable.</p>
      </div>
    )
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate('/recette')}>← Retour</button>

      <div className="card pink">
        <h1 style={{ marginBottom: 6, fontSize: '1.5rem' }}>
          {recette.emoji} {recette.nom}
        </h1>
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
  )
}
