import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { dateDuJourISO, formatDateLong } from '../utils/date'

type Statut = 'en_cours' | 'ok' | 'vide'

interface ResumeImport {
  date: string
  pas?: number
  poids_kg?: number
  sommeil_h?: number
}

export default function ImportRapide() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profil, enregistrerSuiviJour, mettreAJourProfil } = useAppData()
  const [statut, setStatut] = useState<Statut>('en_cours')
  const [resume, setResume] = useState<ResumeImport>({ date: dateDuJourISO() })

  const paramsCle = searchParams.toString()

  useEffect(() => {
    setStatut('en_cours')
    async function traiter() {
      const dateParam = searchParams.get('date')
      const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : dateDuJourISO()

      const pasRaw = searchParams.get('pas')
      const poidsRaw = searchParams.get('poids')
      const sommeilRaw = searchParams.get('sommeil')

      const valeurs: { pas?: number; poids_kg?: number; sommeil_h?: number } = {}

      if (pasRaw !== null) {
        const pas = Number(pasRaw)
        if (Number.isFinite(pas) && pas >= 0 && pas < 200000) valeurs.pas = Math.round(pas)
      }
      if (poidsRaw !== null) {
        const poids = Number(poidsRaw)
        if (Number.isFinite(poids) && poids > 20 && poids < 400) valeurs.poids_kg = Math.round(poids * 10) / 10
      }
      if (sommeilRaw !== null) {
        const sommeil = Number(sommeilRaw)
        if (Number.isFinite(sommeil) && sommeil >= 0 && sommeil < 24) valeurs.sommeil_h = Math.round(sommeil * 10) / 10
      }

      if (Object.keys(valeurs).length === 0) {
        setStatut('vide')
        return
      }

      await enregistrerSuiviJour({ date, ...valeurs })
      if (valeurs.poids_kg !== undefined && date === dateDuJourISO()) {
        await mettreAJourProfil({ ...profil, poids_kg: valeurs.poids_kg })
      }
      setResume({ date, ...valeurs })
      setStatut('ok')
    }
    traiter()
    // Se redéclenche uniquement quand les paramètres d'URL changent (ex. onglet réutilisé par le Raccourci).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsCle])

  return (
    <div className="screen center" style={{ paddingTop: '15vh' }}>
      {statut === 'en_cours' && (
        <>
          <div style={{ fontSize: '2.5rem' }}>⏳</div>
          <p className="muted">Enregistrement…</p>
        </>
      )}

      {statut === 'ok' && (
        <div className="card">
          <div style={{ fontSize: '2.5rem' }}>✅</div>
          <h2>C'est enregistré !</h2>
          <p className="muted">{formatDateLong(resume.date)}</p>
          <div className="row gap-8" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {resume.pas !== undefined && <span className="pill blue">👣 {resume.pas.toLocaleString('fr-FR')} pas</span>}
            {resume.poids_kg !== undefined && <span className="pill pink">⚖️ {resume.poids_kg} kg</span>}
            {resume.sommeil_h !== undefined && <span className="pill yellow">😴 {resume.sommeil_h} h</span>}
          </div>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>
            Aller au tableau de bord
          </button>
        </div>
      )}

      {statut === 'vide' && (
        <div className="card">
          <div style={{ fontSize: '2.5rem' }}>🤔</div>
          <h2>Rien à enregistrer</h2>
          <p className="muted">
            Ce lien ne contenait aucune donnée valide (pas, poids ou sommeil). Vérifie la
            configuration de ton Raccourci.
          </p>
          <button className="btn btn-primary mt-8" onClick={() => navigate('/plus/raccourci-ios')}>
            Voir le guide du Raccourci
          </button>
        </div>
      )}
    </div>
  )
}
