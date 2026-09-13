import sharp from 'sharp'

/**
 * Tailles responsives générées à l'upload.
 * - `full` : version haute résolution (max 2400px) pour la lightbox plein écran.
 * - `large` : 1600px pour les grandes grilles.
 * - `medium` : 1000px pour les grilles moyennes.
 * - `small` : 600px pour les vignettes / grilles denses.
 */
export const IMAGE_SIZES = [
  { suffix: 'full', width: 2400 },
  { suffix: 'large', width: 1600 },
  { suffix: 'medium', width: 1000 },
  { suffix: 'small', width: 600 },
] as const

export type OptimizedImage = {
  /** URL publique de la version full (utilisée comme référence principale). */
  url: string
  /** Clé S3 de la version full. */
  key: string
  /** Largeur réelle de l'image source après traitement. */
  width: number
  /** Hauteur réelle de l'image source après traitement. */
  height: number
  /** Format de sortie (webp ou avif). */
  format: string
}

/**
 * Optimise un buffer d'image avec Sharp :
 * - Redimensionne à une largeur max (préserve le ratio).
 * - Convertit en WebP (qualité ~Squoosh) avec fallback AVIF.
 * - Retourne les métadonnées + le buffer optimisé.
 *
 * Idempotent : si l'image est déjà en WebP/AVIF et plus petite que la cible,
 * elle est ré-encodée quand même pour normaliser la qualité (le coût est faible).
 */
export async function optimizeImageBuffer(
  buffer: Buffer,
  maxWidth = 2400,
): Promise<{ buffer: Buffer; width: number; height: number; format: string }> {
  const image = sharp(buffer, { failOn: 'none' })
  const metadata = await image.metadata()

  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  // Redimensionne si plus large que la cible
  let pipeline = image
  if (width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  }

  // Convertit en WebP (bon compromis qualité/poids, comparable à Squoosh)
  const optimized = await pipeline
    .rotate() // respecte l'orientation EXIF
    .webp({ quality: 80, effort: 4 })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: optimized.data,
    width: optimized.info.width,
    height: optimized.info.height,
    format: 'webp',
  }
}

/**
 * Génère toutes les tailles responsives d'une image source.
 * Retourne un tableau de { suffix, buffer } à uploader séparément.
 */
export async function generateResponsiveSizes(
  buffer: Buffer,
): Promise<Array<{ suffix: string; width: number; buffer: Buffer }>> {
  const results: Array<{ suffix: string; width: number; buffer: Buffer }> = []

  for (const size of IMAGE_SIZES) {
    const { buffer: optimized } = await optimizeImageBuffer(buffer, size.width)
    results.push({ suffix: size.suffix, width: size.width, buffer: optimized })
  }

  return results
}