import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import FormulaireRepas, { valeursVides, type ValeursRepasForm } from '../components/FormulaireRepas'
import { combinerDateEtHeureActuelle, genererId } from '../utils/date'

export default function AjouterRepasManuel() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { ajouterRepas } = useAppData()
  const valeursInitiales = (location.state as { valeursInitiales?: ValeursRepasForm } | null)?.valeursInitiales

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>Saisie manuelle</h1>
      <p className="muted">Renseigne toi-même les valeurs de ton repas.</p>

      <FormulaireRepas
        valeursInitiales={valeursInitiales || valeursVides()}
        texteBouton="Enregistrer le repas"
        onEnregistrer={async (valeurs) => {
          await ajouterRepas({
            id: genererId(),
            dateHeure: combinerDateEtHeureActuelle(searchParams.get('date')),
            type: valeurs.type,
            nom: valeurs.nom || 'Repas',
            methode: 'manuel',
            calories: valeurs.calories,
            proteines_g: valeurs.proteines_g,
            lipides_g: valeurs.lipides_g,
            glucides_g: valeurs.glucides_g,
            micros: valeurs.micros,
          })
          navigate('/journal', { replace: true })
        }}
      />
    </div>
  )
}
