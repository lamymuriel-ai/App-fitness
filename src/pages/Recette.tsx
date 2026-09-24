import { useNavigate } from 'react-router-dom'
import { RECETTES } from '../data/recettes'

const COULEURS = ['pink', 'blue'] as const

export default function Recette() {
  const navigate = useNavigate()

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Recette</div>
        <h1>🍽️ Tes recettes</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {RECETTES.map((recette, i) => (
          <button
            key={recette.id}
            className={`card ${COULEURS[i % COULEURS.length]}`}
            style={{
              width: '100%',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/recette/${recette.id}`)}
          >
            <div className="row-between" style={{ gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ marginBottom: 4, fontSize: '1.15rem' }}>
                  {recette.emoji} {recette.nom}
                </h2>
                <p className="mb-0" style={{ fontSize: '1rem' }}>{recette.description}</p>
              </div>
              <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
