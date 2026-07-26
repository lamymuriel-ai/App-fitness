import { Unzip, UnzipInflate } from 'fflate'
import { AnalyseurSanteIncremental, type ResultatImportSante } from '../utils/appleHealthParser'

export interface MessageEntree {
  buffer: ArrayBuffer
  estZip: boolean
}

export type MessageSortie =
  | { type: 'progress'; ratio: number }
  | { type: 'result'; resultat: ResultatImportSante }
  | { type: 'error'; message: string }

const TAILLE_MORCEAU = 4 * 1024 * 1024 // 4 Mo : assez gros pour être efficace, assez petit pour rester réactif
const TAILLE_MAX_VERIF_ENTETE = 4096

/**
 * Décompacte et analyse le .zip en flux : on pousse les octets bruts du .zip par
 * morceaux dans fflate.Unzip, qui restitue le contenu décompressé de export.xml par
 * morceaux via son callback `ondata` — jamais le document complet en une seule chaîne.
 * C'est indispensable pour un long historique Apple Watch : les données très répétitives
 * (fréquence cardiaque en continu, etc.) peuvent faire gonfler un .zip de quelques
 * centaines de Mo en plusieurs Go de XML une fois décompressé, ce qu'un téléphone ne
 * peut pas garder entièrement en mémoire sous forme d'une seule chaîne JavaScript.
 */
async function analyserZipEnFlux(
  buffer: ArrayBuffer,
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

  const total = buffer.byteLength
  let offset = 0
  if (total === 0) {
    unzipper.push(new Uint8Array(0), true)
  }
  while (offset < total) {
    if (erreurDetectee) break
    const fin = Math.min(offset + TAILLE_MORCEAU, total)
    const morceau = new Uint8Array(buffer, offset, fin - offset)
    const estDernier = fin >= total
    unzipper.push(morceau, estDernier)
    offset = fin
    surProgression(offset / total)
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
  buffer: ArrayBuffer,
  analyseur: AnalyseurSanteIncremental,
  surProgression: (ratio: number) => void
): Promise<void> {
  const decoder = new TextDecoder('utf-8')
  const total = buffer.byteLength
  let offset = 0
  let enteteAccumulee = ''
  let enteteVerifiee = false

  while (offset < total) {
    const fin = Math.min(offset + TAILLE_MORCEAU, total)
    const estDernier = fin >= total
    const texte = decoder.decode(new Uint8Array(buffer, offset, fin - offset), { stream: !estDernier })
    offset = fin

    if (!enteteVerifiee) {
      enteteAccumulee += texte
      if (enteteAccumulee.includes('<HealthData')) {
        enteteVerifiee = true
      } else if (enteteAccumulee.length > TAILLE_MAX_VERIF_ENTETE) {
        throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
      } else {
        surProgression(offset / total)
        await new Promise((resolve) => setTimeout(resolve, 0))
        continue
      }
    }

    analyseur.pousser(texte)
    surProgression(offset / total)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  if (!enteteVerifiee) {
    throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
  }
}

self.onmessage = async (event: MessageEvent<MessageEntree>) => {
  const { buffer, estZip } = event.data
  try {
    const analyseur = new AnalyseurSanteIncremental()
    const surProgression = (ratio: number) => {
      const message: MessageSortie = { type: 'progress', ratio }
      self.postMessage(message)
    }

    if (estZip) {
      await analyserZipEnFlux(buffer, analyseur, surProgression)
    } else {
      await analyserXmlBrutEnFlux(buffer, analyseur, surProgression)
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
