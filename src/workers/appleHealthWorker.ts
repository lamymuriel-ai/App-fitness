import { unzip } from 'fflate'
import { extraireXml } from '../utils/appleHealthParser'

export interface MessageEntree {
  buffer: ArrayBuffer
  estZip: boolean
}

export type MessageSortie =
  | { type: 'progress'; ratio: number }
  | { type: 'result'; resultat: Awaited<ReturnType<typeof extraireXml>> }
  | { type: 'error'; message: string }

async function extraireXmlDuZip(buffer: ArrayBuffer): Promise<string> {
  const fichiers = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(new Uint8Array(buffer), (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
  const nomEntree = Object.keys(fichiers).find((nom) => nom.toLowerCase().endsWith('export.xml'))
  if (!nomEntree) {
    throw new Error("Le fichier export.xml est introuvable dans cette archive.")
  }
  return new TextDecoder('utf-8').decode(fichiers[nomEntree])
}

self.onmessage = async (event: MessageEvent<MessageEntree>) => {
  const { buffer, estZip } = event.data
  try {
    const xml = estZip ? await extraireXmlDuZip(buffer) : new TextDecoder('utf-8').decode(buffer)

    if (!xml.includes('<HealthData')) {
      throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
    }

    const resultat = await extraireXml(xml, (ratio) => {
      const message: MessageSortie = { type: 'progress', ratio }
      self.postMessage(message)
    })

    const message: MessageSortie = { type: 'result', resultat }
    self.postMessage(message)
  } catch (err) {
    const message: MessageSortie = {
      type: 'error',
      message: err instanceof Error ? err.message : 'Erreur inconnue pendant l\'analyse.',
    }
    self.postMessage(message)
  }
}
