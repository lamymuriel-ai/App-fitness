import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import FormulaireRepas from '../components/FormulaireRepas'

function versDateLocale(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function versHeureLocale(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function construireDateHeureISO(date: string, heure: string): string {
  const [h, m] = heure.split(':').map(Number)
  const d = new Date(`${date}T00:00:00`)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export default function DetailRepas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { repas, ajouterRepas, supprimerRepasParId } = useAppData()

  const item = repas.find((r) => r.id === id)

  const [dateModifiee, setDateModifiee] = useState(item ? versDateLocale(item.dateHeure) : '')
  const [heureModifiee, setHeureModifiee] = useState(item ? versHeureLocale(item.dateHeure) : '')

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

      <div className="field-row">
        <div className="field">
          <label>Date</label>
          <input type="date" value={dateModifiee} onChange={(e) => setDateModifiee(e.target.value)} />
        </div>
        <div className="field">
          <label>Heure</label>
          <input type="time" value={heureModifiee} onChange={(e) => setHeureModifiee(e.target.value)} />
        </div>
      </div>

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
          await ajouterRepas({ ...item, ...v, dateHeure: construireDateHeureISO(dateModifiee, heureModifiee) })
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
