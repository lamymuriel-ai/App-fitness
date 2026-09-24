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
      <button className="btn-ghost btn-sm" onClick={() => navigate('/recette')}>← Retour</button>

      <div className="card pink" style={{ padding: '10px 12px', marginBottom: 8, marginTop: 6 }}>
        <h1 style={{ fontSize: '1.05rem', marginBottom: 1 }}>
          {recette.emoji} {recette.nom}
        </h1>
        <p className="muted mb-0" style={{ fontSize: '0.78rem' }}>{recette.description}</p>
      </div>

      <div className="card blue" style={{ padding: '10px 12px', marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.88rem', marginBottom: 4 }}>🧺 Ingrédients</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 10, rowGap: 1 }}>
          {recette.ingredients.map((ing) => (
            <div
              key={ing.nom}
              className="row-between"
              style={{ fontSize: '0.74rem', padding: '2px 0', gap: 4 }}
            >
              <span>{ing.nom}</span>
              <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{ing.quantite}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card yellow" style={{ padding: '10px 12px', marginBottom: 8 }}>
        {recette.sectionsEtapes.map((section, iSection) => (
          <div key={section.titre} style={iSection > 0 ? { marginTop: 6 } : undefined}>
            <h3 style={{ fontSize: '0.84rem', marginBottom: 2 }}>{section.emoji} {section.titre}</h3>
            <ol style={{ paddingLeft: 16, margin: 0 }}>
              {section.etapes.map((etape, i) => (
                <li key={i} style={{ fontSize: '0.74rem', lineHeight: 1.25, marginBottom: 1 }}>
                  {etape}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '8px 12px', marginBottom: 8 }}>
        <p className="mb-0" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
          📊 {recette.parPortion.calories} kcal · {recette.parPortion.proteines_g}g protéines
          <span className="muted" style={{ fontWeight: 400 }}>
            {' '}{recette.portions > 1 ? `· par tranche (${recette.portions})` : '· par portion'}
          </span>
        </p>
      </div>
    </div>
  )
}
