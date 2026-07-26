import type { Micronutriments } from '../types'

export interface EstimationRepas {
  nomSuggere: string
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
}

// Bibliothèque de profils de repas plausibles, utilisée pour produire une
// première estimation à partir d'une photo. Ce n'est PAS une reconnaissance
// d'image réelle : c'est un point de départ que l'utilisatrice doit toujours
// vérifier et corriger avant d'enregistrer (voir écran de correction).
//
// Point d'intégration futur : remplacer `estimerRepasDepuisPhoto` par un
// appel à une API de vision (ex. modèle Claude avec capacité vision) qui
// retournerait une estimation réelle à partir des pixels de la photo.
const PROFILS_REPAS: EstimationRepas[] = [
  {
    nomSuggere: 'Salade composée + protéine',
    calories: 420,
    proteines_g: 32,
    lipides_g: 18,
    glucides_g: 30,
    micros: {
      fer_mg: 3.2, calcium_mg: 90, magnesium_mg: 60, zinc_mg: 2.5,
      vitamineA_ug: 180, vitamineC_mg: 35, vitamineD_ug: 0.5, vitamineE_mg: 2.8,
      vitamineB6_mg: 0.4, vitamineB12_ug: 0.8, omega3_g: 0.4, fibres_g: 6,
    },
  },
  {
    nomSuggere: 'Assiette riz / légumes / viande ou poisson',
    calories: 560,
    proteines_g: 38,
    lipides_g: 16,
    glucides_g: 62,
    micros: {
      fer_mg: 3.8, calcium_mg: 60, magnesium_mg: 80, zinc_mg: 3.5,
      vitamineA_ug: 120, vitamineC_mg: 20, vitamineD_ug: 1.2, vitamineE_mg: 1.6,
      vitamineB6_mg: 0.6, vitamineB12_ug: 1.5, omega3_g: 0.6, fibres_g: 5,
    },
  },
  {
    nomSuggere: 'Pâtes / féculents avec sauce légère',
    calories: 610,
    proteines_g: 22,
    lipides_g: 14,
    glucides_g: 90,
    micros: {
      fer_mg: 2.6, calcium_mg: 120, magnesium_mg: 55, zinc_mg: 2,
      vitamineA_ug: 60, vitamineC_mg: 10, vitamineD_ug: 0.2, vitamineE_mg: 1.2,
      vitamineB6_mg: 0.3, vitamineB12_ug: 0.3, omega3_g: 0.2, fibres_g: 4,
    },
  },
  {
    nomSuggere: 'Petit-déjeuner (tartines, yaourt, fruit)',
    calories: 340,
    proteines_g: 14,
    lipides_g: 12,
    glucides_g: 46,
    micros: {
      fer_mg: 1.6, calcium_mg: 220, magnesium_mg: 40, zinc_mg: 1.2,
      vitamineA_ug: 80, vitamineC_mg: 40, vitamineD_ug: 0.4, vitamineE_mg: 1,
      vitamineB6_mg: 0.2, vitamineB12_ug: 0.6, omega3_g: 0.1, fibres_g: 4,
    },
  },
  {
    nomSuggere: 'Bol type buddha bowl (légumineuses, légumes, céréales)',
    calories: 480,
    proteines_g: 24,
    lipides_g: 16,
    glucides_g: 58,
    micros: {
      fer_mg: 4.5, calcium_mg: 140, magnesium_mg: 110, zinc_mg: 3,
      vitamineA_ug: 300, vitamineC_mg: 45, vitamineD_ug: 0, vitamineE_mg: 3,
      vitamineB6_mg: 0.5, vitamineB12_ug: 0.1, omega3_g: 0.5, fibres_g: 11,
    },
  },
  {
    nomSuggere: 'Collation (fruit, oléagineux, laitage)',
    calories: 190,
    proteines_g: 8,
    lipides_g: 10,
    glucides_g: 18,
    micros: {
      fer_mg: 0.9, calcium_mg: 100, magnesium_mg: 45, zinc_mg: 0.8,
      vitamineA_ug: 30, vitamineC_mg: 15, vitamineD_ug: 0.1, vitamineE_mg: 2,
      vitamineB6_mg: 0.1, vitamineB12_ug: 0.2, omega3_g: 0.3, fibres_g: 3,
    },
  },
]

/** Calcule une empreinte simple (luminosité moyenne + dominante) à partir d'une image. */
async function empreinteImage(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const taille = 16
      canvas.width = taille
      canvas.height = taille
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(Math.random() * 1000)
        return
      }
      ctx.drawImage(img, 0, 0, taille, taille)
      const data = ctx.getImageData(0, 0, taille, taille).data
      let somme = 0
      for (let i = 0; i < data.length; i += 4) {
        somme += data[i] + data[i + 1] * 2 + data[i + 2] * 3
      }
      resolve(somme)
    }
    img.onerror = () => resolve(Math.random() * 1000)
    img.src = dataUrl
  })
}

/**
 * Estimation automatique à partir d'une photo de repas.
 * Retourne une estimation approximative à corriger : les quantités et valeurs
 * doivent toujours être ajustées par l'utilisatrice avant l'enregistrement.
 */
export async function estimerRepasDepuisPhoto(dataUrl: string): Promise<EstimationRepas> {
  const empreinte = await empreinteImage(dataUrl)
  const index = Math.floor(empreinte) % PROFILS_REPAS.length
  const profil = PROFILS_REPAS[index]
  // légère variation pour ne pas être parfaitement identique à chaque fois
  const variation = 0.9 + ((empreinte % 20) / 100)
  return {
    ...profil,
    calories: Math.round(profil.calories * variation),
    proteines_g: Math.round(profil.proteines_g * variation),
    lipides_g: Math.round(profil.lipides_g * variation),
    glucides_g: Math.round(profil.glucides_g * variation),
    micros: Object.fromEntries(
      Object.entries(profil.micros).map(([k, v]) => [k, Math.round(v * variation * 10) / 10])
    ) as unknown as Micronutriments,
  }
}

export function compresserImage(file: File, maxLargeur = 800, qualite = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(1, maxLargeur / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas non disponible'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', qualite))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
