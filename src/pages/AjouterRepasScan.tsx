import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { useAppData } from '../context/AppDataContext'
import FormulaireRepas, { type ValeursRepasForm } from '../components/FormulaireRepas'
import { rechercherProduitParCodeBarres, mettreAlEchelle, type ProduitCodeBarres } from '../utils/barcode'
import { genererId, typeRepasSuggere } from '../utils/date'

export default function AjouterRepasScan() {
  const navigate = useNavigate()
  const { ajouterRepas } = useAppData()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  const [codeManuel, setCodeManuel] = useState('')
  const [camDisponible, setCamDisponible] = useState(true)
  const [recherche, setRecherche] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [produit, setProduit] = useState<ProduitCodeBarres | null>(null)
  const [quantite, setQuantite] = useState(100)
  const [valeurs, setValeurs] = useState<ValeursRepasForm | null>(null)

  useEffect(() => {
    const lecteur = new BrowserMultiFormatReader()
    let annule = false
    lecteur
      .decodeFromVideoDevice(undefined, videoRef.current!, (resultat) => {
        if (resultat && !annule) {
          lancerRecherche(resultat.getText())
        }
      })
      .then((controls) => {
        controlsRef.current = controls
      })
      .catch(() => {
        setCamDisponible(false)
      })
    return () => {
      annule = true
      controlsRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function lancerRecherche(code: string) {
    if (recherche) return
    setRecherche(true)
    setErreur(null)
    try {
      const resultat = await rechercherProduitParCodeBarres(code)
      if (!resultat) {
        setErreur("Produit introuvable pour ce code-barres. Tu peux le saisir manuellement.")
      } else {
        controlsRef.current?.stop()
        setProduit(resultat)
        setQuantite(100)
      }
    } catch {
      setErreur("Impossible de contacter la base de données produits. Vérifie ta connexion.")
    } finally {
      setRecherche(false)
    }
  }

  function validerQuantite() {
    if (!produit) return
    const echelle = mettreAlEchelle(produit, quantite)
    setValeurs({
      nom: echelle.nom,
      type: typeRepasSuggere(),
      calories: echelle.calories,
      proteines_g: echelle.proteines_g,
      lipides_g: echelle.lipides_g,
      glucides_g: echelle.glucides_g,
      micros: echelle.micros,
    })
  }

  const apercu = produit ? mettreAlEchelle(produit, quantite) : null

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📦 Scanner un code-barres</h1>

      {!produit && !valeurs && (
        <>
          {camDisponible ? (
            <div className="card center">
              <video ref={videoRef} style={{ width: '100%', borderRadius: 18 }} muted playsInline />
              <p className="small muted mt-8 mb-0">Vise le code-barres du produit avec la caméra.</p>
            </div>
          ) : (
            <div className="alert-banner info">
              <span className="icon">ℹ️</span>
              <p className="mb-0 small">Caméra indisponible. Saisis le code-barres manuellement ci-dessous.</p>
            </div>
          )}

          {erreur && (
            <div className="alert-banner warning">
              <span className="icon">⚠️</span>
              <p className="mb-0 small">{erreur}</p>
            </div>
          )}

          <div className="card">
            <div className="field">
              <label>Ou saisis le code-barres</label>
              <input
                type="text"
                inputMode="numeric"
                value={codeManuel}
                onChange={(e) => setCodeManuel(e.target.value)}
                placeholder="Ex. 3017620422003"
              />
            </div>
            <button
              className="btn btn-secondary"
              disabled={!codeManuel || recherche}
              onClick={() => lancerRecherche(codeManuel)}
            >
              {recherche ? 'Recherche…' : 'Rechercher le produit'}
            </button>
          </div>
        </>
      )}

      {produit && !valeurs && apercu && (
        <div className="card">
          <div className="row gap-12">
            {produit.imageUrl && <img src={produit.imageUrl} className="thumb" alt="" />}
            <h3 className="mb-0">{produit.nom}</h3>
          </div>
          <div className="field mt-16">
            <label>Quantité consommée (g)</label>
            <input
              type="number"
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
            />
          </div>
          <p className="muted small">
            Aperçu : {apercu.calories} kcal · {apercu.proteines_g}g protéines · {apercu.lipides_g}g lipides ·{' '}
            {apercu.glucides_g}g glucides
          </p>
          <button className="btn btn-primary" onClick={validerQuantite}>Continuer</button>
        </div>
      )}

      {valeurs && (
        <FormulaireRepas
          valeursInitiales={valeurs}
          texteBouton="Valider et enregistrer"
          avertissement="Valeurs issues de la base Open Food Facts pour la quantité indiquée — vérifie et ajuste si besoin avant d'enregistrer."
          onEnregistrer={async (v) => {
            await ajouterRepas({
              id: genererId(),
              dateHeure: new Date().toISOString(),
              type: v.type,
              nom: v.nom || 'Repas',
              methode: 'code_barres',
              codeBarres: codeManuel || undefined,
              quantite_g: quantite,
              calories: v.calories,
              proteines_g: v.proteines_g,
              lipides_g: v.lipides_g,
              glucides_g: v.glucides_g,
              micros: v.micros,
            })
            navigate('/journal', { replace: true })
          }}
        />
      )}
    </div>
  )
}
