import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { analyserExportSante, type ResultatImportSante, type EntreeAlimentaire } from '../utils/appleHealthImport'
import { formatDateCourt, typeRepasSuggere } from '../utils/date'
import type { Repas, SuiviJournalier } from '../types'

type Etat = 'attente' | 'analyse' | 'apercu' | 'import' | 'termine' | 'erreur'

function construireRepasImport(nutrition: Map<string, EntreeAlimentaire>): Repas[] {
  const resultats: Repas[] = []
  for (const [horodatage, valeurs] of nutrition) {
    const date = new Date(horodatage)
    if (Number.isNaN(date.getTime())) continue // horodatage illisible, on ignore plutôt que de deviner
    // Heure locale telle qu'enregistrée (ex. "2026-07-20 19:30:00 +0200" -> 19), pas celle du fuseau
    // du navigateur qui affiche l'appli : le type de repas doit refléter l'heure réelle du repas.
    const heureMatch = /^\d{4}-\d{2}-\d{2} (\d{2}):/.exec(horodatage)
    const heureLocale = heureMatch ? Number(heureMatch[1]) : date.getHours()
    resultats.push({
      id: `sante-import-${horodatage}`,
      dateHeure: date.toISOString(),
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
  const [resultat, setResultat] = useState<ResultatImportSante | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [resume, setResume] = useState({ jours: 0, repas: 0 })

  async function surSelectionFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    setEtat('analyse')
    setErreur(null)
    try {
      const res = await analyserExportSante(fichier)
      const totalJours = new Set([
        ...res.pas.keys(),
        ...res.poids.keys(),
        ...res.sommeil.keys(),
        ...res.nutrition.keys(),
      ]).size
      if (totalJours === 0) {
        setErreur("Aucune donnée exploitable (pas, poids, sommeil ou alimentation) n'a été trouvée dans ce fichier.")
        setEtat('erreur')
        return
      }
      setResultat(res)
      setEtat('apercu')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Fichier illisible.')
      setEtat('erreur')
    }
  }

  async function confirmerImport() {
    if (!resultat) return
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
          <div className="card blue">
            <h3>Comment exporter tes données</h3>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>Ouvre l'app <strong>Santé</strong> sur ton iPhone</li>
              <li>Touche ta photo de profil (en haut à droite)</li>
              <li><strong>Exporter toutes les données de santé</strong></li>
              <li>Choisis "Enregistrer dans Fichiers" ou envoie-toi le fichier <code>export.zip</code></li>
              <li>Sélectionne ce fichier ci-dessous</li>
            </ol>
          </div>

          <div className="card">
            <h3>Ce qui sera importé</h3>
            <p className="small muted mb-0">
              👣 Pas · ⚖️ Poids · 😴 Sommeil · 🍽️ Alimentation (calories, macros et certains
              micronutriments) — uniquement si ces données existent dans Santé (ex. l'alimentation
              n'y est présente que si une autre app y écrivait déjà tes repas). Les autres
              catégories (fréquence cardiaque, distance, entraînements…) ne sont pas importées, ce
              ne sont pas des données suivies par cette appli.
            </p>
          </div>

          <div className="card center">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,.xml,application/zip,text/xml"
              style={{ display: 'none' }}
              onChange={surSelectionFichier}
            />
            <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={etat === 'analyse'}>
              {etat === 'analyse' ? 'Analyse en cours…' : '📁 Choisir le fichier export'}
            </button>
            <p className="small muted mt-8 mb-0">
              Le fichier peut être volumineux (plusieurs dizaines de Mo) — l'analyse se fait entièrement sur ton
              appareil, rien n'est envoyé sur internet. Ça peut prendre jusqu'à une minute pour un gros fichier.
            </p>
          </div>

          {erreur && (
            <div className="alert-banner warning">
              <span className="icon">⚠️</span>
              <p className="mb-0 small">{erreur}</p>
            </div>
          )}
        </>
      )}

      {etat === 'apercu' && resultat && (
        <div className="card">
          <h3>✨ Données trouvées</h3>
          <p className="muted small mb-0">
            Période du {resultat.premiereDate && formatDateCourt(resultat.premiereDate)} au{' '}
            {resultat.derniereDate && formatDateCourt(resultat.derniereDate)}
          </p>
          <div className="mt-16" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatApercu emoji="👣" label="Pas" nb={resultat.pas.size} unite="jour" />
            <StatApercu emoji="⚖️" label="Poids" nb={resultat.poids.size} unite="jour" />
            <StatApercu emoji="😴" label="Sommeil" nb={resultat.sommeil.size} unite="jour" />
            <StatApercu emoji="🍽️" label="Alimentation" nb={resultat.nutrition.size} unite="repas" />
          </div>
          <p className="small muted mt-16">
            Pour un jour donné, une valeur déjà enregistrée dans l'appli (poids, pas, sommeil) sera
            remplacée par celle venant de Santé. Chaque repas importé (ex. depuis Micron ou une
            autre app connectée à Santé) devient une entrée séparée dans ton journal, avec son nom
            et son heure quand ils sont disponibles — modifiable ensuite comme n'importe quel repas.
            Un nouvel import remplace les entrées déjà importées plutôt que de les dupliquer.
          </p>
          <button className="btn btn-primary" onClick={confirmerImport}>
            Importer
          </button>
        </div>
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

function StatApercu({ emoji, label, nb, unite }: { emoji: string; label: string; nb: number; unite: string }) {
  return (
    <div style={{ background: '#f7f3f5', borderRadius: 14, padding: '10px 12px' }}>
      <div style={{ fontWeight: 800 }}>{emoji} {label}</div>
      <div className="muted small">{nb} {unite}{nb !== 1 && !unite.endsWith('s') ? 's' : ''}</div>
    </div>
  )
}
