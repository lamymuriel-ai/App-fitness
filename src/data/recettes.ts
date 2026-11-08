export interface IngredientRecette {
  nom: string
  quantite: string
}

/** Groupe d'étapes (ex. "Au Thermomix" puis "À l'Air Fryer", ou une seule section "Au shaker"). */
export interface SectionEtapes {
  titre: string
  emoji: string
  etapes: string[]
}

export interface Recette {
  id: string
  nom: string
  emoji: string
  description: string
  portions: number
  ingredients: IngredientRecette[]
  sectionsEtapes: SectionEtapes[]
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
      { nom: 'Graines de lin (à moudre)', quantite: '15 g' },
      { nom: 'Skyr', quantite: '330 g' },
      { nom: 'Œufs', quantite: '3' },
      { nom: "Flocons d'avoine", quantite: '80 g' },
      { nom: 'Farine de blé', quantite: '120 g' },
      { nom: 'Whey isolat native', quantite: '20 g' },
      { nom: 'Levure boulangère sèche', quantite: '11 g' },
      { nom: 'Sel', quantite: '4 g' },
      { nom: 'Graines de chia', quantite: '15 g' },
      { nom: 'Graines de courge', quantite: '20 g' },
    ],
    sectionsEtapes: [
      {
        titre: 'Au Thermomix',
        emoji: '🌀',
        etapes: [
          'Moudre les graines de lin seules : 20 sec / vitesse 10. Réserver.',
          'Mettre le skyr et les œufs dans le bol : 10 sec / vitesse 4 pour mélanger.',
          "Ajouter les flocons d'avoine, la farine, la whey, la levure boulangère, le sel, le lin moulu, le chia et les graines de courge : 20 sec / vitesse 4, jusqu'à obtenir une pâte homogène.",
          'Verser la pâte dans un moule à cake beurré ou chemisé.',
          "Couvrir le moule d'un torchon et laisser lever 30 à 45 min dans un endroit tiède (ex : four éteint avec juste la lumière allumée), jusqu'à ce que la pâte ait gonflé — c'est de la levure boulangère, elle a besoin de ce temps de pousse avant la cuisson (contrairement à de la levure chimique).",
        ],
      },
      {
        titre: 'Au four',
        emoji: '🔥',
        etapes: [
          'Préchauffer le four à 180°C (chaleur tournante).',
          "Enfourner le moule couvert d'aluminium et cuire 40 min, puis retirer le papier et poursuivre la cuisson 20 min pour bien colorer le dessus (1h de cuisson au total). Vérifier à la lame : elle doit sortir sèche.",
          "Laisser tiédir dans le moule avant de démouler, puis couper en 8 tranches.",
        ],
      },
    ],
    parPortion: { calories: 130, proteines_g: 9.5 },
  },
  {
    id: 'smoothie-proteine-fruits-rouges',
    nom: 'Smoothie protéiné fruits rouges',
    emoji: '🥤',
    description: "Un shaker rapide à préparer, idéal après une séance ou en collation.",
    portions: 1,
    ingredients: [
      { nom: 'Fruits rouges congelés', quantite: '150 g' },
      { nom: 'Whey isolat native', quantite: '25 g' },
      { nom: "Lait d'amande non sucré", quantite: '125 ml' },
      { nom: 'Eau', quantite: '125 ml' },
    ],
    sectionsEtapes: [
      {
        titre: 'Au shaker',
        emoji: '🥤',
        etapes: [
          "Verser l'eau et le lait d'amande dans le shaker.",
          'Ajouter la whey et secouer pour bien la dissoudre.',
          'Ajouter les fruits rouges congelés et secouer énergiquement.',
          'Laisser reposer 1 à 2 min, secouer à nouveau, puis boire.',
        ],
      },
    ],
    parPortion: { calories: 155, proteines_g: 24 },
  },
]
