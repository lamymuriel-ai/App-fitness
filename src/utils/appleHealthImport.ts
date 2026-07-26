import { unzip } from 'fflate'

export interface ResultatImportSante {
  parJour: Map<string, number> // date ISO (YYYY-MM-DD) -> nombre de pas
  premiereDate: string | null
  derniereDate: string | null
}

const TYPE_PAS = 'HKQuantityTypeIdentifierStepCount'

/** Repère les enregistrements de pas dans le XML exporté par l'app Santé, sans construire de DOM (fichiers potentiellement volumineux). */
function extraireXml(xml: string): ResultatImportSante {
  const parJour = new Map<string, number>()
  // Les exports Apple Santé écrivent chaque <Record .../> avec "type" en premier attribut.
  const regexRecord = new RegExp(`<Record[^>]*type="${TYPE_PAS}"[^>]*/>`, 'g')
  const regexStart = /startDate="([^"]+)"/
  const regexValeur = /value="([^"]+)"/

  let correspondance: RegExpExecArray | null
  while ((correspondance = regexRecord.exec(xml)) !== null) {
    const bloc = correspondance[0]
    const dateMatch = regexStart.exec(bloc)
    const valeurMatch = regexValeur.exec(bloc)
    if (!dateMatch || !valeurMatch) continue
    const jour = dateMatch[1].slice(0, 10) // "2026-07-20 07:00:00 +0200" -> "2026-07-20"
    const valeur = Number(valeurMatch[1])
    if (!Number.isFinite(valeur)) continue
    parJour.set(jour, (parJour.get(jour) || 0) + valeur)
  }

  const jours = Array.from(parJour.keys()).sort()
  return {
    parJour,
    premiereDate: jours[0] || null,
    derniereDate: jours[jours.length - 1] || null,
  }
}

async function lireCommeTexte(file: File): Promise<string> {
  return file.text()
}

async function extraireXmlDuZip(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer())
  const fichiers = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(buffer, (err, data) => {
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

export async function analyserExportSante(file: File): Promise<ResultatImportSante> {
  const estZip =
    file.type === 'application/zip' ||
    file.name.toLowerCase().endsWith('.zip')

  const xml = estZip ? await extraireXmlDuZip(file) : await lireCommeTexte(file)

  if (!xml.includes('<HealthData')) {
    throw new Error("Ce fichier ne ressemble pas à un export de l'app Santé (export.xml attendu).")
  }

  return extraireXml(xml)
}
