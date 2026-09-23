export interface IngredientRecette {
  nom: string
  quantite: string
}

export interface Recette {
  id: string
  nom: string
  emoji: string
  description: string
  portions: number
  ingredients: IngredientRecette[]
  etapesThermomix: string[]
  etapesAirFryer: string[]
  parPortion: {
    calories: number
    proteines_g: number
  }
}

export const RECETTES: Recette[] = [
  {
    id: 'pain-proteine-skyr-avoine-graines',
    nom: 'Pain protéiné skyr, avoine & graines',
    emoji: '🍞',
    description: "Un pain riche en protéines, à tartiner ou à manger tel quel au petit-déjeuner.",
    portions: 8,
    ingredients: [
      { nom: 'Skyr', quantite: '330 g' },
      { nom: 'Œufs', quantite: '3' },
      { nom: "Flocons d'avoine", quantite: '80 g' },
      { nom: 'Farine de blé', quantite: '60 g' },
      { nom: 'Levure', quantite: '11 g' },
      { nom: 'Sel', quantite: '4 g' },
      { nom: 'Graines de chia', quantite: '15 g' },
      { nom: 'Graines de lin (à moudre)', quantite: '15 g' },
      { nom: 'Graines de courge', quantite: '20 g' },
    ],
    etapesThermomix: [
      'Moudre les graines de lin seules : 20 sec / vitesse 10. Réserver.',
      'Mettre le skyr et les œufs dans le bol : 10 sec / vitesse 4 pour mélanger.',
      "Ajouter les flocons d'avoine, la farine, la levure, le sel, le lin moulu, le chia et les graines de courge : 20 sec / vitesse 4, jusqu'à obtenir une pâte homogène.",
      'Verser la pâte dans un moule à cake beurré ou chemisé, adapté à ton Air Fryer.',
    ],
    etapesAirFryer: [
      'Cuire 35 à 40 min à 155-160°C.',
      "Vérifier la cuisson avec la pointe d'un couteau : elle doit ressortir sèche.",
      "Laisser tiédir dans le moule avant de démouler, puis couper en 8 tranches.",
    ],
    parPortion: { calories: 130, proteines_g: 9.5 },
  },
]
