import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import FormulaireRepas, { valeursVides } from '../components/FormulaireRepas'
import { genererId } from '../utils/date'

export default function AjouterRepasManuel() {
  const navigate = useNavigate()
  const { ajouterRepas } = useAppData()

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>Saisie manuelle</h1>
      <p className="muted">Renseigne toi-même les valeurs de ton repas.</p>

      <FormulaireRepas
        valeursInitiales={valeursVides()}
        texteBouton="Enregistrer le repas"
        onEnregistrer={async (valeurs) => {
          await ajouterRepas({
            id: genererId(),
            dateHeure: new Date().toISOString(),
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
