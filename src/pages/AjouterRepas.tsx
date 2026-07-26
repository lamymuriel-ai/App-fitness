import { useNavigate } from 'react-router-dom'

export default function AjouterRepas() {
  const navigate = useNavigate()

  return (
    <div className="screen">
      <div className="row-between" style={{ marginBottom: 16 }}>
        <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      </div>
      <h1>Ajouter un repas</h1>
      <p className="muted">Choisis la méthode la plus rapide pour toi.</p>

      <button
        className="card"
        style={{ width: '100%', border: '2px solid var(--pink)', textAlign: 'left' }}
        onClick={() => navigate('/journal/ajouter/photo')}
      >
        <div className="row gap-12">
          <span style={{ fontSize: '2rem' }}>📷</span>
          <div>
            <h3 className="mb-0">Photo du repas</h3>
            <p className="small muted mb-0">L'appli estime automatiquement calories et nutriments, à toi de valider.</p>
          </div>
        </div>
      </button>

      <button
        className="card"
        style={{ width: '100%', border: '2px solid var(--blue)', textAlign: 'left' }}
        onClick={() => navigate('/journal/ajouter/scan')}
      >
        <div className="row gap-12">
          <span style={{ fontSize: '2rem' }}>📦</span>
          <div>
            <h3 className="mb-0">Scanner un code-barres</h3>
            <p className="small muted mb-0">Profil nutritionnel automatique d'un produit emballé.</p>
          </div>
        </div>
      </button>

      <button
        className="card"
        style={{ width: '100%', border: '2px solid var(--yellow)', textAlign: 'left' }}
        onClick={() => navigate('/journal/ajouter/manuel')}
      >
        <div className="row gap-12">
          <span style={{ fontSize: '2rem' }}>✍️</span>
          <div>
            <h3 className="mb-0">Saisie manuelle</h3>
            <p className="small muted mb-0">Tu renseignes toi-même les valeurs.</p>
          </div>
        </div>
      </button>
    </div>
  )
}
