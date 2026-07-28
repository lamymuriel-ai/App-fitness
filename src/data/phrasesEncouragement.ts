const PHRASES_ENCOURAGEMENT: string[] = [
  "Un jour à la fois, un choix à la fois — tu avances déjà plus que tu ne le crois.",
  "Pas besoin d'être parfaite aujourd'hui, juste un peu meilleure qu'hier.",
  "Chaque petite habitude compte, même les jours où tout semble aller de travers.",
  "Ton corps te fait confiance : nourris-le bien et bouge un peu, le reste suivra.",
  "La régularité gagne toujours contre la perfection. Continue, doucement mais sûrement.",
  "Aujourd'hui est une nouvelle occasion de prendre soin de toi.",
  "Les résultats ne se voient pas toujours dans la balance, mais ils se construisent chaque jour.",
  "Sois fière du chemin parcouru, pas seulement de celui qu'il reste à faire.",
  "Un petit pas aujourd'hui vaut mieux qu'un grand pas jamais fait.",
  "Tu n'as pas besoin d'être motivée tous les jours, juste de rester constante.",
  "Prends soin de toi comme tu prendrais soin d'une amie que tu aimes.",
  "Les jours difficiles font aussi partie du progrès — ne les efface pas de l'histoire.",
  "Bois de l'eau, bouge un peu, mange équilibré : le reste est du bonus.",
  "Ce n'est pas une course, c'est un mode de vie qui se construit doucement.",
  "Célèbre les petites victoires, elles s'additionnent plus vite que tu ne le penses.",
  "Ton objectif d'aujourd'hui : rester à l'écoute de ton corps, rien de plus.",
  "Chaque repas est une nouvelle chance, pas un jugement sur les précédents.",
  "La discipline d'aujourd'hui construit la confiance de demain.",
  "Tu fais déjà beaucoup rien qu'en suivant tes progrès — continue comme ça.",
  "Un bon départ ce matin, et la journée s'organise plus sereinement.",
]

/** Choisit une phrase de manière stable pour une date donnée (change chaque jour, sans tirage aléatoire à chaque rechargement). */
export function phraseDuJour(dateISO: string): string {
  const jours = Math.floor(new Date(`${dateISO}T00:00:00`).getTime() / 86400000)
  const index = ((jours % PHRASES_ENCOURAGEMENT.length) + PHRASES_ENCOURAGEMENT.length) % PHRASES_ENCOURAGEMENT.length
  return PHRASES_ENCOURAGEMENT[index]
}
