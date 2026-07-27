import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import FormulaireRepas, { type ValeursRepasForm } from '../components/FormulaireRepas'
import { compresserImage, estimerRepasDepuisPhoto } from '../utils/photoEstimate'
import { combinerDateEtHeureActuelle, genererId, typeRepasSuggere } from '../utils/date'

export default function AjouterRepasPhoto() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { ajouterRepas } = useAppData()
  const inputRef = useRef<HTMLInputElement>(null)

  const [photo, setPhoto] = useState<string | null>(null)
  const [analyseEnCours, setAnalyseEnCours] = useState(false)
  const [valeurs, setValeurs] = useState<ValeursRepasForm | null>(null)

  async function surSelectionFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    setAnalyseEnCours(true)
    try {
      const dataUrl = await compresserImage(fichier)
      setPhoto(dataUrl)
      const estimation = await estimerRepasDepuisPhoto(dataUrl)
      setValeurs({
        nom: estimation.nomSuggere,
        type: typeRepasSuggere(),
        calories: estimation.calories,
        proteines_g: estimation.proteines_g,
        lipides_g: estimation.lipides_g,
        glucides_g: estimation.glucides_g,
        micros: estimation.micros,
      })
    } finally {
      setAnalyseEnCours(false)
    }
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📷 Photo du repas</h1>

      {!photo && (
        <div className="card center">
          <p className="muted">Prends en photo ton assiette ou choisis une image existante.</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={surSelectionFichier}
          />
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
            📷 Prendre / choisir une photo
          </button>
        </div>
      )}

      {photo && (
        <div className="card center">
          <img src={photo} alt="Repas" style={{ width: '100%', borderRadius: 18, maxHeight: 260, objectFit: 'cover' }} />
        </div>
      )}

      {analyseEnCours && (
        <div className="card center">
          <p style={{ fontWeight: 800 }}>✨ Analyse de la photo en cours…</p>
          <p className="small muted mb-0">Estimation automatique des calories et nutriments.</p>
        </div>
      )}

      {valeurs && !analyseEnCours && (
        <FormulaireRepas
          valeursInitiales={valeurs}
          texteBouton="Valider et enregistrer"
          avertissement="Estimation automatique à partir de la photo — vérifie et ajuste les quantités avant d'enregistrer, le résultat reste approximatif."
          onEnregistrer={async (v) => {
            await ajouterRepas({
              id: genererId(),
              dateHeure: combinerDateEtHeureActuelle(searchParams.get('date')),
              type: v.type,
              nom: v.nom || 'Repas',
              methode: 'photo',
              photo: photo || undefined,
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
