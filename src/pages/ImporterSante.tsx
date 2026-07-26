import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { analyserExportSante, type ResultatImportSante } from '../utils/appleHealthImport'
import { formatDateCourt } from '../utils/date'

type Etat = 'attente' | 'analyse' | 'apercu' | 'import' | 'termine' | 'erreur'

export default function ImporterSante() {
  const navigate = useNavigate()
  const { enregistrerSuiviJourEnMasse } = useAppData()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etat, setEtat] = useState<Etat>('attente')
  const [resultat, setResultat] = useState<ResultatImportSante | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [nbImportes, setNbImportes] = useState(0)

  async function surSelectionFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    setEtat('analyse')
    setErreur(null)
    try {
      const res = await analyserExportSante(fichier)
      if (res.parJour.size === 0) {
        setErreur("Aucune donnée de pas n'a été trouvée dans ce fichier.")
        setEtat('erreur')
        return
      }
      setResultat(res)
      setEtat('apercu')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Fichier illisible.')
      setEtat('erreur')
    }
  }

  async function confirmerImport() {
    if (!resultat) return
    setEtat('import')
    const entrees = Array.from(resultat.parJour.entries()).map(([date, pas]) => ({
      date,
      pas: Math.round(pas),
    }))
    await enregistrerSuiviJourEnMasse(entrees)
    setNbImportes(entrees.length)
    setEtat('termine')
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>🍏 Importer depuis Santé</h1>

      {(etat === 'attente' || etat === 'analyse' || etat === 'erreur') && (
        <>
          <div className="card blue">
            <h3>Comment exporter tes données</h3>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>Ouvre l'app <strong>Santé</strong> sur ton iPhone</li>
              <li>Touche ta photo de profil (en haut à droite)</li>
              <li><strong>Exporter toutes les données de santé</strong></li>
              <li>Choisis "Enregistrer dans Fichiers" ou envoie-toi le fichier <code>export.zip</code></li>
              <li>Sélectionne ce fichier ci-dessous</li>
            </ol>
          </div>

          <div className="card center">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,.xml,application/zip,text/xml"
              style={{ display: 'none' }}
              onChange={surSelectionFichier}
            />
            <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={etat === 'analyse'}>
              {etat === 'analyse' ? 'Analyse en cours…' : '📁 Choisir le fichier export'}
            </button>
            <p className="small muted mt-8 mb-0">
              Le fichier peut être volumineux (plusieurs dizaines de Mo) — l'analyse se fait entièrement sur ton
              appareil, rien n'est envoyé sur internet.
            </p>
          </div>

          {erreur && (
            <div className="alert-banner warning">
              <span className="icon">⚠️</span>
              <p className="mb-0 small">{erreur}</p>
            </div>
          )}
        </>
      )}

      {etat === 'apercu' && resultat && (
        <div className="card">
          <h3>✨ Données trouvées</h3>
          <p>
            <strong>{resultat.parJour.size}</strong> jours avec un nombre de pas — période du{' '}
            {resultat.premiereDate && formatDateCourt(resultat.premiereDate)} au{' '}
            {resultat.derniereDate && formatDateCourt(resultat.derniereDate)}
          </p>
          <p className="small muted">
            Si un jour a déjà un nombre de pas enregistré manuellement dans l'appli, il sera remplacé par la
            valeur venant de Santé.
          </p>
          <button className="btn btn-primary" onClick={confirmerImport}>
            Importer {resultat.parJour.size} jours
          </button>
        </div>
      )}

      {etat === 'import' && (
        <div className="card center">
          <p style={{ fontWeight: 800 }}>⏳ Import en cours…</p>
        </div>
      )}

      {etat === 'termine' && (
        <div className="card">
          <h3>✅ Import terminé</h3>
          <p>{nbImportes} jours ont été mis à jour avec tes données de pas.</p>
          <button className="btn btn-primary" onClick={() => navigate('/suivi')}>
            Voir le suivi
          </button>
        </div>
      )}
    </div>
  )
}
