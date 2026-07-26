import { Unzip, UnzipInflate } from 'fflate'
import { AnalyseurSanteIncremental, type ResultatImportSante } from '../utils/appleHealthParser'

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

async function* lireParMorceaux(file: File): AsyncGenerator<{ chunk: Uint8Array; estDernier: boolean }> {
  const total = file.size
  let position = 0
  if (total === 0) {
    yield { chunk: new Uint8Array(0), estDernier: true }
    return
  }
  while (position < total) {
    const fin = Math.min(position + TAILLE_MORCEAU_LECTURE, total)
    const buffer = await file.slice(position, fin).arrayBuffer()
    position = fin
    yield { chunk: new Uint8Array(buffer), estDernier: position >= total }
  }
}

/**
 * Décompacte et analyse le .zip en flux : le fichier lui-même est lu par petits
 * morceaux (jamais chargé entièrement en mémoire, même sous forme d'un seul
 * ArrayBuffer compressé), poussés dans fflate.Unzip qui restitue le contenu
 * décompressé de export.xml par morceaux via son callback `ondata`. C'est indispensable
 * pour un long historique Apple Watch : les données très répétitives (fréquence
 * cardiaque en continu, etc.) peuvent faire gonfler un .zip de quelques centaines de Mo
 * en plusieurs Go de XML une fois décompressé — largement au-delà de ce qu'un téléphone
 * peut garder en mémoire, y compris pour la seule archive compressée d'origine.
 */
async function analyserZipEnFlux(
  file: File,
  analyseur: AnalyseurSanteIncremental,
  surProgression: (ratio: number) => void
): Promise<void> {
  let entreeTrouvee = false
  let enteteAccumulee = ''
  let enteteVerifiee = false
  let erreurDetectee: string | null = null
  const decoder = new TextDecoder('utf-8')

  const unzipper = new Unzip((fichier) => {
    if (erreurDetectee) return
    if (!fichier.name.toLowerCase().endsWith('export.xml')) return
    entreeTrouvee = true
    fichier.ondata = (err, chunk, final) => {
      if (erreurDetectee) return
      if (err) {
        erreurDetectee = err.message || 'Erreur de décompression.'
        return
      }
      const texte = decoder.decode(chunk, { stream: !final })

      if (!enteteVerifiee) {
        enteteAccumulee += texte
        if (enteteAccumulee.includes('<HealthData')) {
          enteteVerifiee = true
        } else if (enteteAccumulee.length > TAILLE_MAX_VERIF_ENTETE) {
          erreurDetectee = "Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu)."
          return
        } else {
          return // pas encore assez de texte accumulé pour trancher, on attend le prochain morceau
        }
      }

      analyseur.pousser(texte)
    }
    fichier.start()
  })
  unzipper.register(UnzipInflate)

  const total = file.size
  let lu = 0

  for await (const { chunk, estDernier } of lireParMorceaux(file)) {
    if (erreurDetectee) break
    lu += chunk.byteLength
    unzipper.push(chunk, estDernier)
    surProgression(total > 0 ? lu / total : 0)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  if (erreurDetectee) {
    throw new Error(erreurDetectee)
  }
  if (!entreeTrouvee) {
    throw new Error("Le fichier export.xml est introuvable dans cette archive.")
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
        await new Promise((resolve) => setTimeout(resolve, 0))
        continue
      }
    }

    analyseur.pousser(texte)
    surProgression(total > 0 ? lu / total : 0)
    await new Promise((resolve) => setTimeout(resolve, 0))
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
