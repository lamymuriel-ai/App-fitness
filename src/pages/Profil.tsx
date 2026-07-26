import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import type { ProfilUtilisatrice } from '../types'
import { suggererObjectifsNutritionnels } from '../utils/nutrition'
import { MICRO_REFERENCE } from '../data/defaults'

export default function Profil() {
  const { profil, mettreAJourProfil } = useAppData()
  const navigate = useNavigate()
  const [form, setForm] = useState<ProfilUtilisatrice>({ ...profil })
  const [enregistre, setEnregistre] = useState(false)

  function majChamp<K extends keyof ProfilUtilisatrice>(cle: K, valeur: ProfilUtilisatrice[K]) {
    setForm((prev) => ({ ...prev, [cle]: valeur }))
    setEnregistre(false)
  }

  function recalculerSuggestion() {
    const suggestion = suggererObjectifsNutritionnels(form)
    setForm((prev) => ({
      ...prev,
      objectifsNutritionnels: { ...prev.objectifsNutritionnels, ...suggestion },
    }))
    setEnregistre(false)
  }

  async function enregistrer() {
    await mettreAJourProfil(form)
    setEnregistre(true)
  }

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>👤 Mon profil</h1>

      <div className="card">
        <h3>Informations</h3>
        <div className="field">
          <label>Prénom</label>
          <input type="text" value={form.prenom} onChange={(e) => majChamp('prenom', e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Âge</label>
            <input type="number" value={form.age} onChange={(e) => majChamp('age', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Taille (cm)</label>
            <input type="number" value={form.taille_cm} onChange={(e) => majChamp('taille_cm', Number(e.target.value))} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Poids actuel (kg)</label>
            <input type="number" step="0.1" value={form.poids_kg} onChange={(e) => majChamp('poids_kg', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Niveau d'activité</label>
            <select value={form.niveauActivite} onChange={(e) => majChamp('niveauActivite', e.target.value as ProfilUtilisatrice['niveauActivite'])}>
              <option value="sedentaire">Sédentaire</option>
              <option value="leger">Léger</option>
              <option value="modere">Modéré</option>
              <option value="actif">Actif</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Objectif</h3>
        <div className="field-row">
          <div className="field">
            <label>Perte visée (kg)</label>
            <input type="number" step="0.5" value={form.objectifPerte_kg} onChange={(e) => majChamp('objectifPerte_kg', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Durée (semaines)</label>
            <input type="number" value={form.dureeObjectif_semaines} onChange={(e) => majChamp('dureeObjectif_semaines', Number(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label>Objectif de pas quotidien</label>
          <input type="number" step="500" value={form.objectifPas} onChange={(e) => majChamp('objectifPas', Number(e.target.value))} />
        </div>
      </div>

      <div className="card">
        <h3>Objectifs nutritionnels quotidiens</h3>
        <div className="field-row">
          <div className="field">
            <label>Calories</label>
            <input
              type="number"
              value={form.objectifsNutritionnels.calories}
              onChange={(e) => majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, calories: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Protéines (g)</label>
            <input
              type="number"
              value={form.objectifsNutritionnels.proteines_g}
              onChange={(e) => majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, proteines_g: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Lipides (g)</label>
            <input
              type="number"
              value={form.objectifsNutritionnels.lipides_g}
              onChange={(e) => majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, lipides_g: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Glucides (g)</label>
            <input
              type="number"
              value={form.objectifsNutritionnels.glucides_g}
              onChange={(e) => majChamp('objectifsNutritionnels', { ...form.objectifsNutritionnels, glucides_g: Number(e.target.value) })}
            />
          </div>
        </div>
        <button className="btn btn-secondary" type="button" onClick={recalculerSuggestion}>
          🔄 Suggérer à partir de mon profil
        </button>

        <div className="mt-16" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {MICRO_REFERENCE.map((info) => (
            <div className="field mb-0" key={info.cle}>
              <label>{info.emoji} {info.label} ({info.unite})</label>
              <input
                type="number"
                step="0.1"
                value={form.objectifsNutritionnels.micros[info.cle]}
                onChange={(e) =>
                  majChamp('objectifsNutritionnels', {
                    ...form.objectifsNutritionnels,
                    micros: { ...form.objectifsNutritionnels.micros, [info.cle]: Number(e.target.value) },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Notes santé</h3>
        <div className="alert-banner info">
          <span className="icon">ℹ️</span>
          <p className="mb-0 small">
            Espace informatif uniquement — aucun diagnostic ni conseil médical n'est fourni par
            l'application.
          </p>
        </div>
        <div className="field mb-0">
          <textarea rows={4} value={form.notesSante} onChange={(e) => majChamp('notesSante', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary" onClick={enregistrer}>
        {enregistre ? '✓ Enregistré' : 'Enregistrer les modifications'}
      </button>
    </div>
  )
}
