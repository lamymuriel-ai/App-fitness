import { useNavigate } from 'react-router-dom'

export default function Plus() {
  const navigate = useNavigate()

  return (
    <div>
      <div className="app-header">
        <div className="eyebrow">Plus</div>
        <h1>Réglages & aide</h1>
      </div>
      <div className="screen" style={{ paddingTop: 0 }}>
        <button className="card" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate('/plus/aide-memoire')}>
          <div className="row gap-12">
            <span style={{ fontSize: '2rem' }}>📝</span>
            <div>
              <h3 className="mb-0">Aide-mémoire</h3>
              <p className="small muted mb-0">Erreurs à éviter, rappels de méthode</p>
            </div>
          </div>
        </button>

        <button className="card" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate('/plus/profil')}>
          <div className="row gap-12">
            <span style={{ fontSize: '2rem' }}>👤</span>
            <div>
              <h3 className="mb-0">Mon profil</h3>
              <p className="small muted mb-0">Objectifs, activité, notes santé</p>
            </div>
          </div>
        </button>

        <button className="card" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate('/plus/importer-sante')}>
          <div className="row gap-12">
            <span style={{ fontSize: '2rem' }}>🍏</span>
            <div>
              <h3 className="mb-0">Importer depuis Santé</h3>
              <p className="small muted mb-0">Récupère ton historique de pas depuis l'app Santé d'Apple</p>
            </div>
          </div>
        </button>

        <div className="card">
          <div className="alert-banner info" style={{ margin: 0 }}>
            <span className="icon">ℹ️</span>
            <p className="mb-0 small">
              Cette application propose un suivi factuel de tes habitudes. Elle ne remplace en
              aucun cas un avis médical. En cas de doute ou de signal inhabituel (fatigue
              extrême, perte de poids très rapide…), parles-en à un professionnel de santé.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
