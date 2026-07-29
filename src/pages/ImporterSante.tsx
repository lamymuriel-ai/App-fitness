import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import {
  analyserExportSante,
  parserHorodatageApple,
  type ResultatImportSante,
  type EntreeAlimentaire,
} from '../utils/appleHealthImport'
import { typeRepasSuggere, ajouterJours, dateDuJourISO } from '../utils/date'
import type { Repas, SuiviJournalier } from '../types'

type Etat = 'attente' | 'analyse' | 'import' | 'termine' | 'erreur'

// L'historique complet est déjà importé une première fois ; les imports suivants (répétés
// plusieurs fois par jour) n'ont besoin de couvrir que les derniers jours, pour éviter de
// réécrire à chaque fois des années de données déjà présentes dans l'appli.
const JOURS_A_IMPORTER = 3

/** Ne garde que les jours des JOURS_A_IMPORTER derniers jours (aujourd'hui inclus). */
function filtrerJoursRecents(resultat: ResultatImportSante): ResultatImportSante {
  const seuil = ajouterJours(dateDuJourISO(), -(JOURS_A_IMPORTER - 1))
  const filtrer = (map: Map<string, number>) => new Map([...map].filter(([jour]) => jour >= seuil))
  return {
    pas: filtrer(resultat.pas),
    poids: filtrer(resultat.poids),
    sommeil: filtrer(resultat.sommeil),
    nutrition: new Map([...resultat.nutrition].filter(([horodatage]) => horodatage.slice(0, 10) >= seuil)),
    premiereDate: resultat.premiereDate,
    derniereDate: resultat.derniereDate,
  }
}

function construireRepasImport(nutrition: Map<string, EntreeAlimentaire>): Repas[] {
  const resultats: Repas[] = []
  for (const [horodatage, valeurs] of nutrition) {
    const epochMs = parserHorodatageApple(horodatage)
    if (epochMs === null) continue // horodatage illisible, on ignore plutôt que de deviner
    // Heure locale telle qu'enregistrée (ex. "2026-07-20 19:30:00 +0200" -> 19), pas celle du fuseau
    // du navigateur qui affiche l'appli : le type de repas doit refléter l'heure réelle du repas.
    const heureMatch = /^\d{4}-\d{2}-\d{2} (\d{2}):/.exec(horodatage)
    const heureLocale = heureMatch ? Number(heureMatch[1]) : new Date(epochMs).getUTCHours()
    resultats.push({
      id: `sante-import-${horodatage}`,
      dateHeure: new Date(epochMs).toISOString(),
      type: typeRepasSuggere(heureLocale),
      nom: valeurs.nom || 'Repas importé (Santé)',
      methode: 'import_sante',
      calories: Math.round(valeurs.calories),
      proteines_g: Math.round(valeurs.proteines_g * 10) / 10,
      lipides_g: Math.round(valeurs.lipides_g * 10) / 10,
      glucides_g: Math.round(valeurs.glucides_g * 10) / 10,
      micros: valeurs.micros,
    })
  }
  return resultats
}

function construireSuiviJours(resultat: ResultatImportSante): SuiviJournalier[] {
  const jours = new Set<string>([...resultat.pas.keys(), ...resultat.poids.keys(), ...resultat.sommeil.keys()])
  return Array.from(jours).map((jour) => ({
    date: jour,
    ...(resultat.pas.has(jour) ? { pas: Math.round(resultat.pas.get(jour)!) } : {}),
    ...(resultat.poids.has(jour) ? { poids_kg: resultat.poids.get(jour)! } : {}),
    ...(resultat.sommeil.has(jour) ? { sommeil_h: Math.round(resultat.sommeil.get(jour)! * 10) / 10 } : {}),
  }))
}

export default function ImporterSante() {
  const navigate = useNavigate()
  const { enregistrerSuiviJourEnMasse, ajouterRepasEnMasse } = useAppData()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etat, setEtat] = useState<Etat>('attente')
  const [erreur, setErreur] = useState<string | null>(null)
  const [resume, setResume] = useState({ jours: 0, repas: 0 })
  const [progression, setProgression] = useState(0)
  const [tailleFichierMo, setTailleFichierMo] = useState<number | null>(null)

  async function surSelectionFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    setEtat('analyse')
    setErreur(null)
    setProgression(0)
    setTailleFichierMo(Math.round((fichier.size / 1024 / 1024) * 10) / 10)
    try {
      const resComplet = await analyserExportSante(fichier, setProgression)
      const res = filtrerJoursRecents(resComplet)
      const totalJours = new Set([
        ...res.pas.keys(),
        ...res.poids.keys(),
        ...res.sommeil.keys(),
        ...res.nutrition.keys(),
      ]).size
      if (totalJours === 0) {
        setErreur(
          `Aucune donnée exploitable (pas, poids, sommeil ou alimentation) n'a été trouvée dans les ${JOURS_A_IMPORTER} derniers jours de ce fichier.`
        )
        setEtat('erreur')
        return
      }
      // Importe directement sans étape de confirmation intermédiaire : un import se fait
      // plusieurs fois par jour, autant limiter ça à un seul geste (choisir le fichier).
      await effectuerImport(res)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Fichier illisible.')
      setEtat('erreur')
    }
  }

  async function effectuerImport(resultat: ResultatImportSante) {
    setEtat('import')
    const suivi = construireSuiviJours(resultat)
    const repasImportes = construireRepasImport(resultat.nutrition)
    if (suivi.length > 0) await enregistrerSuiviJourEnMasse(suivi)
    if (repasImportes.length > 0) await ajouterRepasEnMasse(repasImportes)
    setResume({ jours: suivi.length, repas: repasImportes.length })
    setEtat('termine')
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>🍏 Importer depuis Santé</h1>

      {(etat === 'attente' || etat === 'analyse' || etat === 'erreur') && (
        <>
          <div className="card center">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,.xml,application/zip,text/xml"
              style={{ display: 'none' }}
              onChange={surSelectionFichier}
            />
            <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={etat === 'analyse'}>
              {etat === 'analyse' ? `Analyse en cours… ${Math.round(progression * 100)}%` : '📁 Choisir le fichier export'}
            </button>
            {etat === 'analyse' && (
              <div className="progress-track mt-8">
                <div className="progress-fill pink" style={{ width: `${Math.round(progression * 100)}%` }} />
              </div>
            )}
            <p className="small muted mt-8 mb-0">
              {tailleFichierMo !== null && etat === 'analyse'
                ? `Fichier de ${tailleFichierMo} Mo — `
                : ''}
              L'analyse se fait entièrement sur ton appareil, rien n'est envoyé sur internet.
              {tailleFichierMo !== null && tailleFichierMo > 150
                ? ' Ce fichier est volumineux (souvent le cas avec une Apple Watch utilisée depuis longtemps) : ça peut prendre plusieurs minutes, et le navigateur peut avoir du mal si la mémoire du téléphone est limitée.'
                : ' Ça peut prendre jusqu\'à une minute pour un gros fichier.'}
            </p>
          </div>

          {erreur && (
            <div className="alert-banner warning">
              <span className="icon">⚠️</span>
              <p className="mb-0 small">{erreur}</p>
            </div>
          )}

          <div className="card blue">
            <h3>Comment exporter tes données</h3>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>Ouvre l'app <strong>Santé</strong> sur ton iPhone</li>
              <li>Touche ta photo de profil (en haut à droite)</li>
              <li><strong>Exporter toutes les données de santé</strong></li>
              <li>Choisis "Enregistrer dans Fichiers" ou envoie-toi le fichier <code>export.zip</code></li>
              <li>Sélectionne ce fichier ci-dessus</li>
            </ol>
          </div>

          <div className="card">
            <h3>Ce qui sera importé</h3>
            <p className="small muted mb-0">
              👣 Pas · ⚖️ Poids · 😴 Sommeil · 🍽️ Alimentation (calories, macros et certains
              micronutriments) — uniquement si ces données existent dans Santé (ex. l'alimentation
              n'y est présente que si une autre app y écrivait déjà tes repas). Les autres
              catégories (fréquence cardiaque, distance, entraînements…) ne sont pas importées, ce
              ne sont pas des données suivies par cette appli. Seuls les {JOURS_A_IMPORTER} derniers
              jours sont pris en compte (le reste de l'historique est supposé déjà importé).
            </p>
          </div>
        </>
      )}

      {etat === 'import' && (
        <div className="card center">
          <p style={{ fontWeight: 800 }}>⏳ Import en cours…</p>
        </div>
      )}

      {etat === 'termine' && (
        <div className="card">
          <h3>✅ Import terminé</h3>
          <p>
            {resume.jours} jour{resume.jours !== 1 ? 's' : ''} de suivi (pas/poids/sommeil) mis à jour
            {resume.repas > 0 && (
              <> et {resume.repas} repas ajouté{resume.repas !== 1 ? 's' : ''} au journal</>
            )}.
          </p>
          <div className="btn-row">
            <button className="btn btn-outline" onClick={() => navigate('/journal')}>
              Voir le journal
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/suivi')}>
              Voir le suivi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
