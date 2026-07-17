import { ensureBucketExists } from '@/app/_lib/S3Uploader'

/**
 * Script utilitaire pour vérifier/créer le bucket S3.
 * Usage: npx tsx scripts/init-s3.ts
 */
async function main() {
  console.log('Vérification du bucket S3…')
  await ensureBucketExists()
  console.log('✅ Bucket S3 prêt.')
}

main().catch((err) => {
  console.error('❌ Erreur:', err)
  process.exit(1)
})
