import type { Micronutriments } from '../types'

export interface ProduitCodeBarres {
  nom: string
  quantite_g: number
  calories: number
  proteines_g: number
  lipides_g: number
  glucides_g: number
  micros: Micronutriments
  imageUrl?: string
}

function nombre(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Recherche un produit via l'API publique Open Food Facts à partir de son
 * code-barres. Les valeurs sont ramenées à 100 g par défaut ; l'utilisatrice
 * ajuste ensuite la quantité réellement consommée.
 */
export async function rechercherProduitParCodeBarres(
  codeBarres: string
): Promise<ProduitCodeBarres | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    codeBarres
  )}.json`

  const reponse = await fetch(url)
  if (!reponse.ok) {
    throw new Error("Impossible de contacter la base de données produits.")
  }
  const data = await reponse.json()
  if (data.status !== 1 || !data.product) {
    return null
  }

  const p = data.product
  const n = p.nutriments || {}

  const nom: string = p.product_name_fr || p.product_name || p.generic_name || 'Produit sans nom'

  const micros: Micronutriments = {
    fer_mg: nombre(n['iron_100g']) * 1000, // Open Food Facts donne le fer en g/100g
    calcium_mg: nombre(n['calcium_100g']) * 1000,
    magnesium_mg: nombre(n['magnesium_100g']) * 1000,
    zinc_mg: nombre(n['zinc_100g']) * 1000,
    vitamineA_ug: nombre(n['vitamin-a_100g']) * 1_000_000,
    vitamineC_mg: nombre(n['vitamin-c_100g']) * 1000,
    vitamineD_ug: nombre(n['vitamin-d_100g']) * 1_000_000,
    vitamineE_mg: nombre(n['vitamin-e_100g']) * 1000,
    vitamineB6_mg: nombre(n['vitamin-b6_100g']) * 1000,
    vitamineB12_ug: nombre(n['vitamin-b12_100g']) * 1_000_000,
    omega3_g: nombre(n['omega-3-fat_100g']),
    fibres_g: nombre(n['fiber_100g']),
  }

  return {
    nom,
    quantite_g: 100,
    calories: Math.round(nombre(n['energy-kcal_100g'])),
    proteines_g: Math.round(nombre(n['proteins_100g'])),
    lipides_g: Math.round(nombre(n['fat_100g'])),
    glucides_g: Math.round(nombre(n['carbohydrates_100g'])),
    micros,
    imageUrl: p.image_small_url,
  }
}

/** Met à l'échelle les valeurs nutritionnelles d'un produit (données pour 100g) vers une quantité donnée. */
export function mettreAlEchelle(produit: ProduitCodeBarres, quantite_g: number): ProduitCodeBarres {
  const ratio = quantite_g / 100
  return {
    ...produit,
    quantite_g,
    calories: Math.round(produit.calories * ratio),
    proteines_g: Math.round(produit.proteines_g * ratio * 10) / 10,
    lipides_g: Math.round(produit.lipides_g * ratio * 10) / 10,
    glucides_g: Math.round(produit.glucides_g * ratio * 10) / 10,
    micros: Object.fromEntries(
      Object.entries(produit.micros).map(([k, v]) => [k, Math.round((v as number) * ratio * 100) / 100])
    ) as unknown as Micronutriments,
  }
}
