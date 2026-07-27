import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function urlImportRapide(avecSommeil: boolean): string {
  const base = import.meta.env.BASE_URL || '/'
  const params = avecSommeil ? 'pas=[Pas]&poids=[Poids]&sommeil=[Sommeil]' : 'pas=[Pas]&poids=[Poids]'
  return `${window.location.origin}${base}#/import-rapide?${params}`
}

export default function RaccourciIOS() {
  const navigate = useNavigate()
  const [copie, setCopie] = useState(false)
  const [avecSommeil, setAvecSommeil] = useState(false)
  const url = urlImportRapide(avecSommeil)

  async function copier() {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // copie manuelle en secours si le presse-papier n'est pas accessible
    }
  }

  const etapeUrl = avecSommeil ? 5 : 4
  const etapeFinale = avecSommeil ? 6 : 5

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📲 Raccourci iOS</h1>
      <p className="muted">
        Une fois configuré, un seul tap (ou "Dis Siri…") envoie tes pas{avecSommeil ? ', ton poids et ton sommeil' : ' et ton poids'} du
        jour depuis Santé vers l'appli — plus besoin d'ouvrir Santé toi-même.
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
        <div className="alert-banner info mt-8">
          <span className="icon">⚠️</span>
          <p className="mb-0 small">
            Important : sans filtre, cette recherche additionne les pas de <strong>chaque source</strong>{' '}
            (iPhone et Watch comptent souvent les mêmes pas chacun de leur côté), ce qui gonfle le total.
            Ajoute un <strong>Filtre</strong> à l'action : <strong>Où</strong> → <strong>Nom de la source</strong>{' '}
            → <strong>contient</strong> → le nom de l'appareil que tu portes toute la journée (ex. "Apple
            Watch de Muriel" — visible dans Santé → Parcourir → Pas → onglet "Sources de données").
            N'utilise qu'une seule source, sinon la somme reste faussée.
          </p>
        </div>
      </div>

      <div className="card">
        <h3>3. Ajouter ton poids</h3>
        <p>Ajoute une deuxième action <strong>« Rechercher des échantillons de santé »</strong> :</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Type : <strong>Poids</strong></li>
          <li>Date : <strong>7 derniers jours</strong></li>
          <li>Combiner les échantillons : <strong>Valeur la plus récente</strong></li>
        </ul>
      </div>

      <div className="card yellow">
        <div className="row-between">
          <h3 className="mb-0">😴 Inclure aussi le sommeil ?</h3>
        </div>
        <p className="small muted">
          C'est possible, mais plus fastidieux à construire : Raccourcis n'a pas de bouton "durée de
          sommeil" tout fait, il faut calculer la somme des phases "endormi" toi-même en quelques
          actions supplémentaires. Je n'ai pas pu tester cette partie sur un vrai iPhone — les noms
          d'actions ci-dessous sont à vérifier une fois dans l'app, ça peut demander un peu de
          tâtonnement.
        </p>
        <button className="btn btn-yellow" onClick={() => setAvecSommeil((v) => !v)}>
          {avecSommeil ? '✓ Inclus — masquer les étapes' : "Oui, montre-moi comment faire"}
        </button>
      </div>

      {avecSommeil && (
        <div className="card">
          <h3>4. Ajouter ton sommeil (avancé)</h3>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            <li>
              Action <strong>« Rechercher des échantillons de santé »</strong> — Type :{' '}
              <strong>Analyse du sommeil</strong>, Date : <strong>Dernières 24 heures</strong>.
            </li>
            <li>
              Action <strong>« Répéter pour chaque élément »</strong> sur le résultat précédent.
            </li>
            <li>
              À l'intérieur de la boucle : une condition <strong>« Si »</strong> — si la
              variable magique <strong>Valeur</strong> de l'élément contient <strong>"Asleep"</strong> ou{' '}
              <strong>"Endormi"</strong> :
              <ul style={{ paddingLeft: 20 }}>
                <li>Action <strong>« Trouver la différence entre les dates »</strong> entre le
                  <strong> Début</strong> et la <strong> Fin</strong> de l'élément, en <strong>heures</strong>.</li>
                <li>Action <strong>« Ajouter à la variable »</strong> pour empiler ce résultat dans une
                  liste (crée une variable "Durées" avant la boucle).</li>
              </ul>
            </li>
            <li>
              Après la boucle : action <strong>« Calculer les statistiques »</strong> sur la variable
              "Durées", statistique <strong>Somme</strong> → c'est ton total d'heures de sommeil.
            </li>
          </ol>
          <p className="small muted mt-8 mb-0">
            Si ça bloque, laisse tomber cette partie : le raccourci fonctionnera très bien pour pas +
            poids seuls, et tu pourras toujours importer le sommeil via le fichier d'export complet
            (Plus → Importer depuis Santé).
          </p>
        </div>
      )}

      <div className="card">
        <h3>{etapeUrl}. Ouvrir le lien vers l'appli</h3>
        <p>
          Ajoute l'action <strong>« Ouvrir des URL »</strong>, puis compose l'URL en insérant les
          résultats des étapes précédentes comme "variables magiques" (appuie sur la puce grise
          correspondante) à la place de <code>[Pas]</code>, <code>[Poids]</code>
          {avecSommeil && <> et <code>[Sommeil]</code></>} :
        </p>
        <div style={{ background: '#f7f3f5', borderRadius: 12, padding: 12, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {url}
        </div>
        <button className="btn btn-secondary mt-8" onClick={copier}>
          {copie ? '✓ Copié' : '📋 Copier le modèle'}
        </button>
      </div>

      <div className="card">
        <h3>{etapeFinale}. Nommer et activer</h3>
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
