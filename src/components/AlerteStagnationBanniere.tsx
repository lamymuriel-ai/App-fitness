import { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import type { AlerteStagnation } from '../types'
import { dateDuJourISO, genererId } from '../utils/date'

export default function AlerteStagnationBanniere({ alerte }: { alerte: AlerteStagnation }) {
  const { profil, mettreAJourProfil, enregistrerAlerteStagnation } = useAppData()
  const [choixFait, setChoixFait] = useState<'calories' | 'pas' | null>(null)

  async function choisir(choix: 'calories' | 'pas') {
    const id = alerte.id === 'nouvelle' ? genererId() : alerte.id
    await enregistrerAlerteStagnation({
      id,
      dateDetection: alerte.dateDetection,
      resolue: true,
      choix,
      dateChoix: dateDuJourISO(),
    })

    if (choix === 'calories') {
      await mettreAJourProfil({
        ...profil,
        objectifsNutritionnels: {
          ...profil.objectifsNutritionnels,
          calories: Math.max(1200, profil.objectifsNutritionnels.calories - 125),
        },
      })
    } else {
      await mettreAJourProfil({
        ...profil,
        objectifPas: profil.objectifPas + 1250,
      })
    }
    setChoixFait(choix)
  }

  if (choixFait) {
    return (
      <div className="alert-banner info">
        <span className="icon">✅</span>
        <p className="mb-0">
          {choixFait === 'calories'
            ? "C'est noté : ton objectif calorique a été réduit de 125 kcal/j."
            : "C'est noté : ton objectif de pas a été augmenté de 1250/j."}
        </p>
      </div>
    )
  }

  return (
    <div className="alert-banner warning">
      <span className="icon">⏸️</span>
      <div style={{ width: '100%' }}>
        <p style={{ fontWeight: 800, marginBottom: 4 }}>Ta moyenne de poids stagne depuis 2 semaines</p>
        <p className="small">
          C'est normal, ça arrive. Choisis un seul ajustement à la fois pour relancer la tendance :
        </p>
        <div className="btn-row mt-8">
          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => choisir('calories')}>
            − 100-150 kcal/j
          </button>
          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => choisir('pas')}>
            + 1000-1500 pas/j
          </button>
        </div>
      </div>
    </div>
  )
}
