import { Inflate } from 'fflate'
import { AnalyseurSanteIncremental, type ResultatImportSante } from '../utils/appleHealthParser'
import { localiserEntreeZip } from '../utils/zipLocalisateur'

export interface MessageEntree {
  file: File
  estZip: boolean
}

export type MessageSortie =
  | { type: 'progress'; ratio: number }
  | { type: 'result'; resultat: ResultatImportSante }
  | { type: 'error'; message: string }

const TAILLE_MAX_VERIF_ENTETE = 4096

// Taille de lecture forcée, volontairement petite : `file.stream()` délègue le
// découpage en morceaux au navigateur, et ce découpage n'est pas garanti pareil
// partout (Safari/iOS peut rendre des morceaux bien plus gros que Chrome). Pour
// un .zip très compressible (données Apple Watch très répétitives), un seul gros
// morceau compressé peut se décompresser en un morceau démesurément plus gros
// d'un coup — largement de quoi faire planter un onglet Safari sur iPhone. En
// découpant nous-mêmes via `file.slice()`, la taille du morceau lu (donc, dans le
// pire des cas, la taille du sursaut de décompression) reste sous notre contrôle
// quel que soit le navigateur.
const TAILLE_MORCEAU_LECTURE = 32 * 1024

// On tourne déjà dans un Worker (pas le fil principal), donc rendre la main à la
// boucle d'événements après CHAQUE morceau de 32 Ko ne sert à rien pour la
// réactivité de l'UI — et il n'y a pas de bouton d'annulation qui aurait besoin
// de ce point de contrôle régulier. `setTimeout(0)` a un coût minimum réel
// (souvent 1 à plusieurs ms) côté navigateur ; répété des dizaines de milliers de
// fois sur un gros fichier, cette seule pause artificielle pouvait représenter la
// majorité du temps d'import. On ne cède la main que de loin en loin, pour que la
// barre de progression reste vivante sans payer ce coût à chaque morceau.
const INTERVALLE_MIN_CEDE_MAIN_MS = 50
let dernierCedeMain = 0
async function cederLaMainSiNecessaire(): Promise<void> {
  const maintenant = performance.now()
  if (maintenant - dernierCedeMain < INTERVALLE_MIN_CEDE_MAIN_MS) return
  dernierCedeMain = maintenant
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function* lireParMorceaux(
  file: File,
  debut = 0,
  fin = file.size
): AsyncGenerator<{ chunk: Uint8Array; estDernier: boolean }> {
  let position = debut
  if (fin <= debut) {
    yield { chunk: new Uint8Array(0), estDernier: true }
    return
  }
  while (position < fin) {
    const finMorceau = Math.min(position + TAILLE_MORCEAU_LECTURE, fin)
    const buffer = await file.slice(position, finMorceau).arrayBuffer()
    position = finMorceau
    yield { chunk: new Uint8Array(buffer), estDernier: position >= fin }
  }
}

/**
 * Décompacte et analyse le .zip en flux, en localisant d'abord export.xml via le
 * répertoire central de l'archive (`localiserEntreeZip`, dans `zipLocalisateur.ts`)
 * plutôt qu'en scannant séquentiellement les en-têtes locaux comme le fait
 * fflate.Unzip. Cette dernière approche s'est révélée peu fiable sur de vrais
 * exports Apple Santé volumineux (erreur "unexpected eof"), très probablement à
 * cause du format d'écriture en flux utilisé par l'appareil (tailles inconnues à
 * l'avance dans l'en-tête local, ou zip64) — un cas que les en-têtes locaux seuls
 * ne permettent pas toujours de résoudre sans ambiguïté. Une fois l'entrée
 * localisée, seule sa plage d'octets compressés exacte est lue (par petits
 * morceaux, jamais toute l'archive), et décompressée avec le décodeur DEFLATE brut
 * de fflate — sans repasser par un parseur de conteneur zip.
 */
async function analyserZipEnFlux(
  file: File,
  analyseur: AnalyseurSanteIncremental,
  surProgression: (ratio: number) => void
): Promise<void> {
  const entree = await localiserEntreeZip(file, 'export.xml')
  if (!entree) {
    throw new Error("Le fichier export.xml est introuvable dans cette archive.")
  }
  if (entree.methodeCompression !== 8 && entree.methodeCompression !== 0) {
    throw new Error('Ce fichier utilise une méthode de compression non prise en charge.')
  }

  let enteteAccumulee = ''
  let enteteVerifiee = false
  const decoder = new TextDecoder('utf-8')

  const traiterTexteDecompresse = (texte: string) => {
    if (!enteteVerifiee) {
      enteteAccumulee += texte
      if (enteteAccumulee.includes('<HealthData')) {
        enteteVerifiee = true
      } else if (enteteAccumulee.length > TAILLE_MAX_VERIF_ENTETE) {
        throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
      } else {
        return // pas encore assez de texte accumulé pour trancher, on attend le prochain morceau
      }
    }
    analyseur.pousser(texte)
  }

  const total = entree.tailleCompressee
  let lu = 0

  if (entree.methodeCompression === 0) {
    // Méthode "store" : les données ne sont pas compressées, on les décode telles quelles.
    for await (const { chunk, estDernier } of lireParMorceaux(
      file,
      entree.offsetDonnees,
      entree.offsetDonnees + entree.tailleCompressee
    )) {
      lu += chunk.byteLength
      traiterTexteDecompresse(decoder.decode(chunk, { stream: !estDernier }))
      surProgression(total > 0 ? lu / total : 0)
      await cederLaMainSiNecessaire()
    }
    if (!enteteVerifiee) {
      throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
    }
    return
  }

  let erreurInflate: Error | null = null
  const inflateur = new Inflate((dat, final) => {
    if (erreurInflate) return
    try {
      traiterTexteDecompresse(decoder.decode(dat, { stream: !final }))
    } catch (e) {
      erreurInflate = e instanceof Error ? e : new Error("Erreur pendant l'analyse.")
    }
  })

  for await (const { chunk, estDernier } of lireParMorceaux(
    file,
    entree.offsetDonnees,
    entree.offsetDonnees + entree.tailleCompressee
  )) {
    if (erreurInflate) break
    lu += chunk.byteLength
    inflateur.push(chunk, estDernier)
    surProgression(total > 0 ? lu / total : 0)
    await cederLaMainSiNecessaire()
  }

  if (erreurInflate) {
    throw erreurInflate
  }
  if (!enteteVerifiee) {
    throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
  }
}

async function analyserXmlBrutEnFlux(
  file: File,
  analyseur: AnalyseurSanteIncremental,
  surProgression: (ratio: number) => void
): Promise<void> {
  const decoder = new TextDecoder('utf-8')
  const total = file.size
  let lu = 0
  let enteteAccumulee = ''
  let enteteVerifiee = false

  for await (const { chunk, estDernier } of lireParMorceaux(file)) {
    lu += chunk.byteLength
    const texte = decoder.decode(chunk, { stream: !estDernier })

    if (!enteteVerifiee) {
      enteteAccumulee += texte
      if (enteteAccumulee.includes('<HealthData')) {
        enteteVerifiee = true
      } else if (enteteAccumulee.length > TAILLE_MAX_VERIF_ENTETE) {
        throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
      } else {
        surProgression(total > 0 ? lu / total : 0)
        await cederLaMainSiNecessaire()
        continue
      }
    }

    analyseur.pousser(texte)
    surProgression(total > 0 ? lu / total : 0)
    await cederLaMainSiNecessaire()
  }

  if (!enteteVerifiee) {
    throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
  }
}

self.onmessage = async (event: MessageEvent<MessageEntree>) => {
  const { file, estZip } = event.data
  try {
    const analyseur = new AnalyseurSanteIncremental()
    const surProgression = (ratio: number) => {
      const message: MessageSortie = { type: 'progress', ratio }
      self.postMessage(message)
    }

    if (estZip) {
      await analyserZipEnFlux(file, analyseur, surProgression)
    } else {
      await analyserXmlBrutEnFlux(file, analyseur, surProgression)
    }

    const resultat = analyseur.finaliser()
    const message: MessageSortie = { type: 'result', resultat }
    self.postMessage(message)
  } catch (err) {
    const message: MessageSortie = {
      type: 'error',
      message: err instanceof Error ? err.message : "Erreur inconnue pendant l'analyse.",
    }
    self.postMessage(message)
  }
}

// Filet de sécurité : capture toute erreur qui échapperait au try/catch ci-dessus
// (ex. rejet de promesse non attendu) pour renvoyer un message exploitable plutôt
// que de laisser le Worker se terminer silencieusement avec un `onerror` vide côté
// thread principal (ce qui donne un message générique "manque de mémoire ?").
self.addEventListener('unhandledrejection', (event) => {
  const raison = (event as PromiseRejectionEvent).reason
  const message: MessageSortie = {
    type: 'error',
    message: raison instanceof Error ? raison.message : String(raison ?? "Erreur inconnue (promesse rejetée)."),
  }
  self.postMessage(message)
})
