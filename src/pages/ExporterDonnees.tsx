import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { dateDuJourISO } from '../utils/date'

export default function ExporterDonnees() {
  const navigate = useNavigate()
  const { profil, repas, suiviJournalier, suiviHebdomadaire, seancesLog } = useAppData()

  const depuis = profil.dateDebut

  function exporter() {
    const repasDepuis = repas
      .filter((r) => r.dateHeure.slice(0, 10) >= depuis)
      // La photo (dataURL en base64) alourdirait beaucoup le fichier pour rien : ce qui
      // compte pour une analyse, ce sont les valeurs nutritionnelles, pas l'image.
      .map(({ photo: _photo, ...r }) => r)

    const donnees = {
      periode: { debut: depuis, fin: dateDuJourISO() },
      objectifs: profil.objectifsNutritionnels,
      objectifPas: profil.objectifPas,
      poidsDepart_kg: profil.poidsDepart_kg,
      objectifPerte_kg: profil.objectifPerte_kg,
      suiviJournalier: suiviJournalier.filter((e) => e.date >= depuis),
      suiviHebdomadaire: suiviHebdomadaire.filter((e) => e.date >= depuis),
      repas: repasDepuis,
      seancesLog: seancesLog.filter((s) => s.date >= depuis),
    }

    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lea-forme-export-${depuis}-au-${dateDuJourISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📤 Exporter mes données</h1>
      <p className="muted">
        Télécharge un petit fichier (JSON) avec ce que tu as toi-même renseigné dans l'appli
        depuis le début de ton plan ({depuis}) — poids, pas, sommeil, repas et séances. Pratique
        à envoyer pour une analyse, bien plus léger qu'un export Santé complet.
      </p>

      <div className="card center">
        <button className="btn btn-primary" onClick={exporter}>
          📤 Télécharger le fichier
        </button>
        <p className="small muted mt-8 mb-0">
          Tout reste sur ton appareil jusqu'à ce que tu partages le fichier toi-même — rien n'est
          envoyé automatiquement.
        </p>
      </div>
    </div>
  )
}
