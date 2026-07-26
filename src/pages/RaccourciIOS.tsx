import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function urlImportRapide(): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${window.location.origin}${base}#/import-rapide?pas=[Pas]&poids=[Poids]`
}

export default function RaccourciIOS() {
  const navigate = useNavigate()
  const [copie, setCopie] = useState(false)
  const url = urlImportRapide()

  async function copier() {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // copie manuelle en secours si le presse-papier n'est pas accessible
    }
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📲 Raccourci iOS</h1>
      <p className="muted">
        Une fois configuré, un seul tap (ou "Dis Siri…") envoie tes pas et ton poids du jour
        depuis Santé vers l'appli — plus besoin d'ouvrir Santé toi-même.
      </p>

      <div className="alert-banner info">
        <span className="icon">ℹ️</span>
        <p className="mb-0 small">
          Ça se configure une seule fois, directement dans l'app <strong>Raccourcis</strong> d'Apple
          (déjà installée sur ton iPhone). Les noms d'actions ci-dessous peuvent varier légèrement
          selon ta version d'iOS.
        </p>
      </div>

      <div className="card">
        <h3>1. Créer le raccourci</h3>
        <p>Ouvre l'app <strong>Raccourcis</strong> → onglet "Mes raccourcis" → bouton <strong>+</strong>.</p>
      </div>

      <div className="card">
        <h3>2. Ajouter tes pas du jour</h3>
        <p>Ajoute l'action <strong>« Rechercher des échantillons de santé »</strong> :</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Type : <strong>Nombre de pas</strong></li>
          <li>Date : <strong>Aujourd'hui</strong></li>
          <li>Combiner les échantillons : <strong>Somme</strong></li>
        </ul>
      </div>

      <div className="card">
        <h3>3. Ajouter ton poids</h3>
        <p>Ajoute une deuxième action <strong>« Rechercher des échantillons de santé »</strong> :</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Type : <strong>Poids</strong></li>
          <li>Date : <strong>7 derniers jours</strong></li>
          <li>Combiner les échantillons : <strong>Valeur la plus récente</strong></li>
        </ul>
        <p className="small muted mb-0">
          Le sommeil n'est volontairement pas inclus ici : son calcul via Raccourcis est plus
          complexe. Utilise l'import de fichier (Plus → Importer depuis Santé) pour le sommeil.
        </p>
      </div>

      <div className="card">
        <h3>4. Ouvrir le lien vers l'appli</h3>
        <p>Ajoute l'action <strong>« Ouvrir des URL »</strong>, puis compose l'URL en insérant les résultats des étapes précédentes comme "variables magiques" (appuie sur la puce grise correspondante) à la place de <code>[Pas]</code> et <code>[Poids]</code> :</p>
        <div style={{ background: '#f7f3f5', borderRadius: 12, padding: 12, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {url}
        </div>
        <button className="btn btn-secondary mt-8" onClick={copier}>
          {copie ? '✓ Copié' : '📋 Copier le modèle'}
        </button>
      </div>

      <div className="card">
        <h3>5. Nommer et activer</h3>
        <p className="mb-0">
          Donne-lui un nom (ex. "Envoyer à Léa Forme"), puis dans les réglages du raccourci active
          <strong> "Ajouter à Siri"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong> pour
          le lancer d'un tap.
        </p>
      </div>

      <button className="btn btn-primary" onClick={() => navigate('/plus')}>
        Terminé
      </button>
    </div>
  )
}
