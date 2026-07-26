// Localise une entrée précise d'une archive .zip via son répertoire central
// (fin de fichier), plutôt qu'en scannant séquentiellement les en-têtes locaux
// comme le fait fflate.Unzip. C'est nécessaire pour les gros exports Apple Santé :
// leur .zip est généré en flux par l'appareil (qui ne connaît pas la taille finale
// à l'avance), et peut donc utiliser soit le "data descriptor" (bit 3 des drapeaux,
// taille écrite après les données), soit le format zip64 pour les tailles/offsets
// qui dépassent 4 Go — deux cas où l'en-tête local seul ne suffit pas à savoir où
// s'arrêtent les données compressées d'une entrée. Le répertoire central, lui, est
// toujours écrit à la fin avec les tailles réelles, quel que soit ce que l'en-tête
// local contenait au moment de l'écriture : c'est la seule source fiable.

const SIGNATURE_EOCD = 0x06054b50
const SIGNATURE_EOCD64_LOCATOR = 0x07064b50
const SIGNATURE_EOCD64 = 0x06064b50
const SIGNATURE_CENTRAL_DIR = 0x02014b50
const SIGNATURE_LOCAL_HEADER = 0x04034b50
const SENTINEL_32 = 0xffffffff

function lireU16(d: Uint8Array, b: number): number {
  return d[b] | (d[b + 1] << 8)
}

function lireU32(d: Uint8Array, b: number): number {
  return (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0
}

function lireU64(d: Uint8Array, b: number): number {
  return lireU32(d, b) + lireU32(d, b + 4) * 4294967296
}

export interface EntreeZipLocalisee {
  offsetDonnees: number
  tailleCompressee: number
  methodeCompression: number
}

async function trouverSignatureEocd(file: File): Promise<{ buffer: Uint8Array; debutFenetre: number; posEocd: number }> {
  const total = file.size
  const tailleFenetre = Math.min(total, 65557) // 22 (EOCD) + 65535 (commentaire max)
  const debutFenetre = total - tailleFenetre
  const buffer = new Uint8Array(await file.slice(debutFenetre, total).arrayBuffer())

  for (let i = buffer.length - 22; i >= 0; i--) {
    if (lireU32(buffer, i) === SIGNATURE_EOCD) {
      return { buffer, debutFenetre, posEocd: i }
    }
  }
  throw new Error("Ce fichier ne ressemble pas à une archive .zip valide (fin d'archive introuvable).")
}

async function lireCentralDir(file: File): Promise<Uint8Array> {
  const { buffer, debutFenetre, posEocd } = await trouverSignatureEocd(file)

  let offsetCentralDir = lireU32(buffer, posEocd + 16)
  let tailleCentralDir = lireU32(buffer, posEocd + 12)
  const nbEntrees = lireU16(buffer, posEocd + 10)

  if (offsetCentralDir === SENTINEL_32 || tailleCentralDir === SENTINEL_32 || nbEntrees === 0xffff) {
    const posLocator = posEocd - 20
    if (posLocator < 0 || lireU32(buffer, posLocator) !== SIGNATURE_EOCD64_LOCATOR) {
      throw new Error("Archive zip64 non reconnue.")
    }
    const offsetEocd64 = lireU64(buffer, posLocator + 8)

    let bufEocd64: Uint8Array
    let baseEocd64: number
    if (offsetEocd64 >= debutFenetre) {
      bufEocd64 = buffer
      baseEocd64 = offsetEocd64 - debutFenetre
    } else {
      bufEocd64 = new Uint8Array(await file.slice(offsetEocd64, offsetEocd64 + 56).arrayBuffer())
      baseEocd64 = 0
    }
    if (lireU32(bufEocd64, baseEocd64) !== SIGNATURE_EOCD64) {
      throw new Error("Archive zip64 non reconnue.")
    }
    tailleCentralDir = lireU64(bufEocd64, baseEocd64 + 40)
    offsetCentralDir = lireU64(bufEocd64, baseEocd64 + 48)
  }

  return new Uint8Array(await file.slice(offsetCentralDir, offsetCentralDir + tailleCentralDir).arrayBuffer())
}

// Reproduit l'ordre des champs de l'extra field zip64 (id 0x0001) : taille non
// compressée, puis taille compressée, puis offset d'en-tête local — chacun présent
// uniquement si son champ standard 32 bits valait la sentinelle 0xFFFFFFFF.
function resoudreTaillesZip64(
  d: Uint8Array,
  debutExtra: number,
  longueurExtra: number,
  tailleCompressee: number,
  tailleNonCompressee: number,
  offsetEnTeteLocal: number
): { tailleCompressee: number; offsetEnTeteLocal: number } {
  const besoinSc = tailleCompressee === SENTINEL_32
  const besoinSu = tailleNonCompressee === SENTINEL_32
  const besoinOff = offsetEnTeteLocal === SENTINEL_32
  if (!besoinSc && !besoinOff) {
    return { tailleCompressee, offsetEnTeteLocal }
  }

  let p = debutExtra
  const finExtra = debutExtra + longueurExtra
  while (p + 4 <= finExtra) {
    const idChamp = lireU16(d, p)
    const tailleChamp = lireU16(d, p + 2)
    if (idChamp === 1) {
      let q = p + 4
      if (besoinSu) {
        q += 8 // on ignore la taille non compressée, pas utile ici
      }
      const sc = besoinSc ? lireU64(d, q) : tailleCompressee
      if (besoinSc) q += 8
      const off = besoinOff ? lireU64(d, q) : offsetEnTeteLocal
      return { tailleCompressee: sc, offsetEnTeteLocal: off }
    }
    p += 4 + tailleChamp
  }
  throw new Error('Archive zip64 : champ de taille étendue introuvable.')
}

/**
 * Cherche dans le répertoire central de l'archive une entrée dont le nom se
 * termine par `suffixNom` (ex. "export.xml"), et renvoie son offset de données
 * (après l'en-tête local) et sa taille compressée réelle.
 */
export async function localiserEntreeZip(file: File, suffixNom: string): Promise<EntreeZipLocalisee | null> {
  const centralDir = await lireCentralDir(file)
  const suffixMinuscule = suffixNom.toLowerCase()

  let pos = 0
  while (pos + 46 <= centralDir.length && lireU32(centralDir, pos) === SIGNATURE_CENTRAL_DIR) {
    const methodeCompression = lireU16(centralDir, pos + 10)
    const tailleCompresseeBrute = lireU32(centralDir, pos + 20)
    const tailleNonCompresseeBrute = lireU32(centralDir, pos + 24)
    const longueurNom = lireU16(centralDir, pos + 28)
    const longueurExtra = lireU16(centralDir, pos + 30)
    const longueurCommentaire = lireU16(centralDir, pos + 32)
    const offsetEnTeteLocalBrut = lireU32(centralDir, pos + 42)
    const nom = new TextDecoder('utf-8').decode(centralDir.subarray(pos + 46, pos + 46 + longueurNom))

    if (nom.toLowerCase().endsWith(suffixMinuscule)) {
      const { tailleCompressee, offsetEnTeteLocal } = resoudreTaillesZip64(
        centralDir,
        pos + 46 + longueurNom,
        longueurExtra,
        tailleCompresseeBrute,
        tailleNonCompresseeBrute,
        offsetEnTeteLocalBrut
      )

      const enteteLocal = new Uint8Array(await file.slice(offsetEnTeteLocal, offsetEnTeteLocal + 30).arrayBuffer())
      if (lireU32(enteteLocal, 0) !== SIGNATURE_LOCAL_HEADER) {
        throw new Error("Archive .zip corrompue (en-tête local introuvable à l'emplacement attendu).")
      }
      const longueurNomLocal = lireU16(enteteLocal, 26)
      const longueurExtraLocal = lireU16(enteteLocal, 28)
      const offsetDonnees = offsetEnTeteLocal + 30 + longueurNomLocal + longueurExtraLocal

      return { offsetDonnees, tailleCompressee, methodeCompression }
    }

    pos += 46 + longueurNom + longueurExtra + longueurCommentaire
  }

  return null
}
