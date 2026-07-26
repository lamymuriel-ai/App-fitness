import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { useAppData } from '../context/AppDataContext'
import { totauxRepas } from '../utils/nutrition'
import { dateDuJourISO, formatDateCourt } from '../utils/date'
import GrilleMicronutriments from '../components/GrilleMicronutriments'
import AlertesNutriments from '../components/AlertesNutriments'

export default function Tendances() {
  const navigate = useNavigate()
  const { profil, repas } = useAppData()

  const donneesJours = useMemo(() => {
    const jours: { date: string; calories: number }[] = []
    const auj = new Date(dateDuJourISO())
    for (let i = 13; i >= 0; i--) {
      const d = new Date(auj)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const repasJour = repas.filter((r) => r.dateHeure.slice(0, 10) === iso)
      jours.push({ date: iso, calories: Math.round(totauxRepas(repasJour).calories) })
    }
    return jours
  }, [repas])

  const septDerniersJours = useMemo(() => {
    const auj = new Date(dateDuJourISO())
    const seuil = new Date(auj)
    seuil.setDate(seuil.getDate() - 6)
    return repas.filter((r) => new Date(r.dateHeure) >= seuil)
  }, [repas])
  const totauxSemaine = useMemo(() => totauxRepas(septDerniersJours), [septDerniersJours])
  const joursAvecDonnees = useMemo(() => {
    const dates = new Set(septDerniersJours.map((r) => r.dateHeure.slice(0, 10)))
    return Math.max(1, dates.size)
  }, [septDerniersJours])
  const moyenneMicrosSemaine = useMemo(() => {
    const cles = Object.keys(totauxSemaine.micros) as (keyof typeof totauxSemaine.micros)[]
    const moyenne = { ...totauxSemaine.micros }
    for (const cle of cles) moyenne[cle] = totauxSemaine.micros[cle] / joursAvecDonnees
    return moyenne
  }, [totauxSemaine, joursAvecDonnees])

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📈 Tendances</h1>
      <p className="muted">Calories sur les 14 derniers jours</p>

      <div className="card" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={donneesJours}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e4e9" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDateCourt(v)}
              tick={{ fontSize: 11 }}
              interval={1}
            />
            <YAxis tick={{ fontSize: 11 }} width={34} />
            <Tooltip
              labelFormatter={(v) => formatDateCourt(v as string)}
              formatter={(v) => [`${v} kcal`, 'Calories']}
            />
            <ReferenceLine y={profil.objectifsNutritionnels.calories} stroke="#ff7fac" strokeDasharray="4 4" />
            <Bar dataKey="calories" fill="#a8d8ff" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <AlertesNutriments apportsMoyens={moyenneMicrosSemaine} reference={profil.objectifsNutritionnels.micros} />

      <div className="card">
        <GrilleMicronutriments
          apports={moyenneMicrosSemaine}
          reference={profil.objectifsNutritionnels.micros}
          titre="Moyenne journalière (7 derniers jours)"
        />
      </div>
    </div>
  )
}
