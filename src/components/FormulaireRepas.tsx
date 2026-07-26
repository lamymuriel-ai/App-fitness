import { useState } from 'react'
import type { Micronutriments, TypeRepas } from '../types'
import { MICRO_REFERENCE } from '../data/defaults'
import { typeRepasSuggere } from '../utils/date'

const LABEL_TYPE: Record<TypeRepas, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

export interface ValeursRepasForm {
  nom: string
  type: TypeRepas
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
}

export default function FormulaireRepas({
  valeursInitiales,
  onEnregistrer,
  texteBouton = 'Enregistrer le repas',
  avertissement,
}: {
  valeursInitiales: ValeursRepasForm
  onEnregistrer: (valeurs: ValeursRepasForm) => void
  texteBouton?: string
  avertissement?: string
}) {
  const [valeurs, setValeurs] = useState<ValeursRepasForm>(valeursInitiales)
  const [detailsOuverts, setDetailsOuverts] = useState(false)

  function majMicro(cle: keyof Micronutriments, val: number) {
    setValeurs((prev) => ({ ...prev, micros: { ...prev.micros, [cle]: val } }))
  }

  return (
    <div>
      {avertissement && (
        <div className="alert-banner info">
          <span className="icon">✏️</span>
          <p className="mb-0 small">{avertissement}</p>
        </div>
      )}

      <div className="field">
        <label>Nom du repas</label>
        <input
          type="text"
          value={valeurs.nom}
          onChange={(e) => setValeurs((p) => ({ ...p, nom: e.target.value }))}
        />
      </div>

      <div className="field">
        <label>Type de repas</label>
        <select
          value={valeurs.type}
          onChange={(e) => setValeurs((p) => ({ ...p, type: e.target.value as TypeRepas }))}
        >
          {Object.entries(LABEL_TYPE).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Calories (kcal)</label>
        <input
          type="number"
          value={valeurs.calories}
          onChange={(e) => setValeurs((p) => ({ ...p, calories: Number(e.target.value) }))}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Protéines (g)</label>
          <input
            type="number"
            value={valeurs.proteines_g}
            onChange={(e) => setValeurs((p) => ({ ...p, proteines_g: Number(e.target.value) }))}
          />
        </div>
        <div className="field">
          <label>Lipides (g)</label>
          <input
            type="number"
            value={valeurs.lipides_g}
            onChange={(e) => setValeurs((p) => ({ ...p, lipides_g: Number(e.target.value) }))}
          />
        </div>
        <div className="field">
          <label>Glucides (g)</label>
          <input
            type="number"
            value={valeurs.glucides_g}
            onChange={(e) => setValeurs((p) => ({ ...p, glucides_g: Number(e.target.value) }))}
          />
        </div>
      </div>

      <button type="button" className="link-btn" onClick={() => setDetailsOuverts((v) => !v)}>
        {detailsOuverts ? '▾ Masquer les micronutriments' : '▸ Détail des micronutriments'}
      </button>

      {detailsOuverts && (
        <div className="mt-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {MICRO_REFERENCE.map((info) => (
            <div className="field mb-0" key={info.cle}>
              <label>{info.emoji} {info.label} ({info.unite})</label>
              <input
                type="number"
                step="0.1"
                value={valeurs.micros[info.cle]}
                onChange={(e) => majMicro(info.cle, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary mt-16" onClick={() => onEnregistrer(valeurs)}>
        {texteBouton}
      </button>
    </div>
  )
}

export function valeursVides(): ValeursRepasForm {
  return {
    nom: '',
    type: typeRepasSuggere(),
    calories: 0,
    proteines_g: 0,
    lipides_g: 0,
    glucides_g: 0,
    micros: {
      fer_mg: 0, calcium_mg: 0, magnesium_mg: 0, zinc_mg: 0,
      vitamineA_ug: 0, vitamineC_mg: 0, vitamineD_ug: 0, vitamineE_mg: 0,
      vitamineB6_mg: 0, vitamineB12_ug: 0, omega3_g: 0, fibres_g: 0,
    },
  }
}
