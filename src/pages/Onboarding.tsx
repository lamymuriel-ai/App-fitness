import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import type { ProfilUtilisatrice } from '../types'
import { suggererObjectifsNutritionnels } from '../utils/nutrition'
import { dateDuJourISO } from '../utils/date'

const ETAPES = ['Toi', 'Objectif', 'Nutrition', 'Santé'] as const

export default function Onboarding() {
  const { profil, mettreAJourProfil, enregistrerSuiviJour } = useAppData()
  const navigate = useNavigate()
  const [etape, setEtape] = useState(0)
  const [form, setForm] = useState<ProfilUtilisatrice>({ ...profil })

  function majChamp<K extends keyof ProfilUtilisatrice>(cle: K, valeur: ProfilUtilisatrice[K]) {
    setForm((prev) => ({ ...prev, [cle]: valeur }))
  }

  function recalculerSuggestion() {
    const suggestion = suggererObjectifsNutritionnels(form)
    setForm((prev) => ({
      ...prev,
      objectifsNutritionnels: {
        ...prev.objectifsNutritionnels,
        calories: suggestion.calories,
        proteines_g: suggestion.proteines_g,
        lipides_g: suggestion.lipides_g,
        glucides_g: suggestion.glucides_g,
      },
    }))
  }

  async function terminer() {
    const profilFinal: ProfilUtilisatrice = {
      ...form,
      poidsDepart_kg: form.poids_kg,
      dateDebut: dateDuJourISO(),
      onboardingTermine: true,
    }
    await mettreAJourProfil(profilFinal)
    await enregistrerSuiviJour({ date: dateDuJourISO(), poids_kg: form.poids_kg })
    navigate('/', { replace: true })
  }

  return (
    <div className="screen" style={{ paddingBottom: 40 }}>
      <div className="app-header" style={{ padding: 0, marginBottom: 8 }}>
        <div className="eyebrow">Bienvenue 🌸</div>
        <h1>On calibre ton suivi</h1>
        <p className="muted">
          Ces valeurs sont préremplies à titre indicatif — modifie-les comme tu veux, tu pourras
          toujours les changer plus tard.
        </p>
      </div>

      <div className="segmented" style={{ marginTop: 16 }}>
        {ETAPES.map((nomEtape, i) => (
          <button key={nomEtape} className={i === etape ? 'active' : ''} onClick={() => setEtape(i)}>
            {nomEtape}
          </button>
        ))}
      </div>

      {etape === 0 && (
        <div className="card">
          <h3>Ton profil</h3>
          <div className="field">
            <label>Prénom (optionnel)</label>
            <input
              type="text"
              value={form.prenom}
              onChange={(e) => majChamp('prenom', e.target.value)}
              placeholder="Comment tu veux qu'on t'appelle ?"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Âge</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => majChamp('age', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Taille (cm)</label>
              <input
                type="number"
                value={form.taille_cm}
                onChange={(e) => majChamp('taille_cm', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Poids actuel (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.poids_kg}
                onChange={(e) => majChamp('poids_kg', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Sexe</label>
              <select value={form.sexe} onChange={(e) => majChamp('sexe', e.target.value as ProfilUtilisatrice['sexe'])}>
                <option value="femme">Femme</option>
                <option value="homme">Homme</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Niveau d'activité</label>
            <select
              value={form.niveauActivite}
              onChange={(e) => majChamp('niveauActivite', e.target.value as ProfilUtilisatrice['niveauActivite'])}
            >
              <option value="sedentaire">Sédentaire</option>
              <option value="leger">Léger (marche régulière)</option>
              <option value="modere">Modéré (sport 2-3x/semaine)</option>
              <option value="actif">Actif</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setEtape(1)}>Continuer</button>
        </div>
      )}

      {etape === 1 && (
        <div className="card">
          <h3>Ton objectif</h3>
          <div className="field">
            <label>Type d'objectif</label>
            <select value={form.objectif} onChange={(e) => majChamp('objectif', e.target.value as ProfilUtilisatrice['objectif'])}>
              <option value="perte_poids">Perte de graisse</option>
              <option value="maintien">Maintien</option>
              <option value="prise_masse">Prise de masse</option>
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Objectif de perte (kg)</label>
              <input
                type="number"
                step="0.5"
                value={form.objectifPerte_kg}
                onChange={(e) => majChamp('objectifPerte_kg', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Durée (semaines)</label>
              <input
                type="number"
                value={form.dureeObjectif_semaines}
                onChange={(e) => majChamp('dureeObjectif_semaines', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="field">
            <label>Objectif de pas quotidien</label>
            <input
              type="number"
              step="500"
              value={form.objectifPas}
              onChange={(e) => majChamp('objectifPas', Number(e.target.value))}
            />
            <div className="field-hint">Recommandé : 8000 à 9000 pas/jour</div>
          </div>
          <div className="btn-row">
            <button className="btn btn-outline" onClick={() => setEtape(0)}>Retour</button>
            <button className="btn btn-primary" onClick={() => setEtape(2)}>Continuer</button>
          </div>
        </div>
      )}

      {etape === 2 && (
        <div className="card">
          <h3>Objectifs nutritionnels quotidiens</h3>
          <p className="field-hint">
            Préremplis avec tes valeurs habituelles. Tu peux les garder ou demander une suggestion
            calculée à partir de ton profil.
          </p>
          <div className="field-row">
            <div className="field">
              <label>Calories (kcal)</label>
              <input
                type="number"
                value={form.objectifsNutritionnels.calories}
                onChange={(e) =>
                  majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, calories: Number(e.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Protéines (g)</label>
              <input
                type="number"
                value={form.objectifsNutritionnels.proteines_g}
                onChange={(e) =>
                  majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, proteines_g: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Lipides (g)</label>
              <input
                type="number"
                value={form.objectifsNutritionnels.lipides_g}
                onChange={(e) =>
                  majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, lipides_g: Number(e.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Glucides (g)</label>
              <input
                type="number"
                value={form.objectifsNutritionnels.glucides_g}
                onChange={(e) =>
                  majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, glucides_g: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <button className="btn btn-secondary" onClick={recalculerSuggestion} type="button">
            🔄 Suggérer à partir de mon profil
          </button>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setEtape(1)}>Retour</button>
            <button className="btn btn-primary" onClick={() => setEtape(3)}>Continuer</button>
          </div>
        </div>
      )}

      {etape === 3 && (
        <div className="card">
          <h3>Notes santé (facultatif)</h3>
          <div className="alert-banner info">
            <span className="icon">ℹ️</span>
            <p className="mb-0 small">
              Cet espace sert uniquement à noter des informations factuelles pour toi (ex. thyroïdite
              de Hashimoto, traitement en cours). L'application ne pose <strong>aucun diagnostic</strong> et
              ne donne <strong>aucun conseil médical</strong> — elle se limite à du suivi.
            </p>
          </div>
          <div className="field">
            <label>Notes libres</label>
            <textarea
              rows={4}
              value={form.notesSante}
              onChange={(e) => majChamp('notesSante', e.target.value)}
              placeholder="Ex. : Thyroïdite de Hashimoto suivie par mon médecin…"
            />
          </div>
          <div className="btn-row">
            <button className="btn btn-outline" onClick={() => setEtape(2)}>Retour</button>
            <button className="btn btn-primary" onClick={terminer}>C'est parti 🌸</button>
          </div>
        </div>
      )}
    </div>
  )
}
