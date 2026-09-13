// Charge les variables d'environnement (.env) avant tout import qui les lit
import 'dotenv/config'

import { prisma } from '../app/_lib/prisma'
import { Prisma } from '../app/generated/prisma/client'
import {
  downloadFileFromS3,
  uploadOptimizedBuffer,
  deleteFileFromS3,
} from '../app/_lib/S3Uploader'
import { generateResponsiveSizes, IMAGE_SIZES } from '../app/_lib/image-optimizer'

/**
 * Script de migration : optimise les photos existantes qui n'ont pas encore
 * de variantes responsives (les 260 photos uploadées avant le pipeline Sharp).
 *
 * Pour chaque photo :
 *   1. Télécharge l'original depuis S3.
 *   2. Génère 4 tailles WebP (full/large/medium/small) avec Sharp.
 *   3. Upload les variantes en S3.
 *   4. Met à jour la photo (url/key → version full, variants).
 *   5. Supprime l'ancien original (optionnel, via --delete-original).
 *
 * Usage:
 *   npx tsx scripts/migrate-photos.ts
 *   npx tsx scripts/migrate-photos.ts --delete-original   # supprime les originaux
 *   npx tsx scripts/migrate-photos.ts --limit 10          # traite seulement 10 photos
 */
async function main() {
  const deleteOriginal = process.argv.includes('--delete-original')
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined

  // Photos sans variantes = pas encore optimisées
  const photos = await prisma.photo.findMany({
    where: { variants: { equals: Prisma.DbNull } },
    orderBy: { createdAt: 'asc' },
    ...(limit ? { take: limit } : {}),
  })

  console.log(`📸 ${photos.length} photo(s) à optimiser.`)

  let ok = 0
  let failed = 0

  for (const photo of photos) {
    try {
      // 1. Télécharge l'original
      const { buffer } = await downloadFileFromS3(photo.key)
      console.log(`  ↳ ${photo.key} (${(buffer.length / 1024).toFixed(0)} Ko)`)

      // 2. Génère les tailles responsives
      const sizes = await generateResponsiveSizes(buffer)

      // Clé de base dérivée de l'ancienne clé (sans extension)
      const baseKey = photo.key.replace(/\.[^.]+$/, '')

      // 3. Upload des variantes
      const uploaded = await Promise.all(
        sizes.map((s) =>
          uploadOptimizedBuffer(s.buffer, baseKey, s.suffix, 'image/webp'),
        ),
      )

      const full = uploaded.find((u) => u.key.endsWith('-full.webp')) ?? uploaded[0]

      const variants = IMAGE_SIZES.map((size, idx) => ({
        suffix: size.suffix,
        width: size.width,
        url: uploaded[idx].url,
        key: uploaded[idx].key,
      }))

      // 4. Met à jour la photo
      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          url: full.url,
          key: full.key,
          variants,
        },
      })

      // 5. Supprime l'ancien original (optionnel)
      if (deleteOriginal && photo.key !== full.key) {
        await deleteFileFromS3(photo.key).catch(() => {})
      }

      ok++
      console.log(`  ✅ ${photo.id} → ${variants.length} variantes`)
    } catch (err) {
      failed++
      console.error(`  ❌ ${photo.id} (${photo.key}):`, err)
    }
  }

  console.log(`\nTerminé : ${ok} optimisée(s), ${failed} en échec.`)
  if (failed > 0) {
    console.log('Relancez le script pour réessayer les photos en échec (idempotent).')
  }
}

main()
  .catch((err) => {
    console.error('❌ Erreur fatale:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })