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

/**
 * Les Raccourcis iOS inserent souvent les nombres au format local (ex. "67,8" avec
 * une virgule decimale, "8 342" avec une espace comme separateur de milliers, ou
 * "67,8 kg" si la variable magique inseree est la mesure complete plutot que son
 * seul nombre). On normalise et on ignore une eventuelle unite de fin plutot que
 * de perdre silencieusement la valeur.
 */
function parserNombre(brut: string): number {
  // \s couvre l'espace normale et insecable (U+00A0) ; on ajoute l'espace fine insecable (U+202F).
  let s = brut.trim().replace(/[\s\u00A0\u202F]/g, '')
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.')
  } else if (s.includes(',') && s.includes('.')) {
    s = s.replace(/,/g, '')
  }
  const correspondance = /^-?\d+(\.\d+)?/.exec(s)
  return correspondance ? Number(correspondance[0]) : Number(s)
}

export default function ImportRapide() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profil, enregistrerSuiviJour, mettreAJourProfil } = useAppData()
  const [statut, setStatut] = useState<Statut>('en_cours')
  const [resume, setResume] = useState<ResumeImport>({ date: dateDuJourISO() })
  const [diagnostic, setDiagnostic] = useState<{ cle: string; valeur: string }[]>([])

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
        const pas = parserNombre(pasRaw)
        if (Number.isFinite(pas) && pas >= 0 && pas < 200000) valeurs.pas = Math.round(pas)
      }
      if (poidsRaw !== null) {
        const poids = parserNombre(poidsRaw)
        if (Number.isFinite(poids) && poids > 20 && poids < 400) valeurs.poids_kg = Math.round(poids * 10) / 10
      }
      if (sommeilRaw !== null) {
        const sommeil = parserNombre(sommeilRaw)
        if (Number.isFinite(sommeil) && sommeil >= 0 && sommeil < 24) valeurs.sommeil_h = Math.round(sommeil * 10) / 10
      }

      if (Object.keys(valeurs).length === 0) {
        setDiagnostic(Array.from(searchParams.entries()).map(([cle, valeur]) => ({ cle, valeur })))
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
            {diagnostic.length === 0
              ? "Ce lien ne contenait aucun paramètre. Vérifie la configuration de ton Raccourci."
              : "Ce lien contenait des paramètres, mais aucun n'a pu être lu comme un nombre valide :"}
          </p>
          {diagnostic.length > 0 && (
            <div style={{ background: '#f7f3f5', borderRadius: 12, padding: 12, marginBottom: 16, fontFamily: 'monospace', fontSize: '0.85rem', textAlign: 'left' }}>
              {diagnostic.map((d) => (
                <div key={d.cle}>{d.cle} = "{d.valeur}"</div>
              ))}
            </div>
          )}
          <button className="btn btn-primary mt-8" onClick={() => navigate('/plus/raccourci-ios')}>
            Voir le guide du Raccourci
          </button>
        </div>
      )}
    </div>
  )
}
