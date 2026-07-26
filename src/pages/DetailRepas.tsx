import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import FormulaireRepas from '../components/FormulaireRepas'
import { formatDateLong, formatHeure } from '../utils/date'

export default function DetailRepas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { repas, ajouterRepas, supprimerRepasParId } = useAppData()

  const item = repas.find((r) => r.id === id)

  if (!item) {
    return (
      <div className="screen">
        <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
        <p>Repas introuvable.</p>
      </div>
    )
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>

      {item.photo && <img src={item.photo} alt="" style={{ width: '100%', borderRadius: 18, maxHeight: 240, objectFit: 'cover' }} />}

      <h1 className="mt-16">{item.nom}</h1>
      <p className="muted">{formatDateLong(item.dateHeure)} à {formatHeure(item.dateHeure)}</p>

      <FormulaireRepas
        valeursInitiales={{
          nom: item.nom,
          type: item.type,
          calories: item.calories,
          proteines_g: item.proteines_g,
          lipides_g: item.lipides_g,
          glucides_g: item.glucides_g,
          micros: item.micros,
        }}
        texteBouton="Mettre à jour"
        onEnregistrer={async (v) => {
          await ajouterRepas({ ...item, ...v })
          navigate('/journal', { replace: true })
        }}
      />

      <button
        className="btn btn-outline mt-16"
        style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
        onClick={async () => {
          await supprimerRepasParId(item.id)
          navigate('/journal', { replace: true })
        }}
      >
        🗑️ Supprimer ce repas
      </button>
    </div>
  )
}
