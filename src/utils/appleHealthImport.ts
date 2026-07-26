export type { EntreeAlimentaire, ResultatImportSante } from './appleHealthParser'
export { parserHorodatageApple } from './appleHealthParser'
import type { MessageEntree, MessageSortie } from '../workers/appleHealthWorker'
import type { ResultatImportSante } from './appleHealthParser'

/**
 * Lance l'analyse dans un Web Worker : le fichier est transmis tel quel (jamais chargé
 * entièrement en mémoire sur le thread principal) et lu par petits morceaux à
 * l'intérieur du Worker. Le décompactage du .zip et le balayage du XML (potentiellement
 * plusieurs centaines de Mo, voire plusieurs Go une fois décompressé, pour un long
 * historique Apple Watch) tournent hors du fil principal, pour que l'interface reste
 * réactive et affiche une vraie progression au lieu de sembler figée.
 */
export async function analyserExportSante(
  file: File,
  onProgression?: (ratio: number) => void
): Promise<ResultatImportSante> {
  const estZip = file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/appleHealthWorker.ts', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = (event: MessageEvent<MessageSortie>) => {
      const message = event.data
      if (message.type === 'progress') {
        onProgression?.(message.ratio)
      } else if (message.type === 'result') {
        worker.terminate()
        resolve(message.resultat)
      } else {
        worker.terminate()
        reject(new Error(message.message))
      }
    }

    worker.onerror = (event) => {
      worker.terminate()
      const details = [event.message, event.filename ? `(${event.filename}:${event.lineno})` : '']
        .filter(Boolean)
        .join(' ')
      reject(new Error(details || "Erreur pendant l'analyse du fichier — le navigateur a peut-être manqué de mémoire."))
    }

    const entree: MessageEntree = { file, estZip }
    worker.postMessage(entree)
  })
}
