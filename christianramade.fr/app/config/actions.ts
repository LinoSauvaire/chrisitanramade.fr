'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/app/_lib/prisma'
import { uploadFileToS3, deleteFileFromS3, uploadOptimizedBuffer } from '@/app/_lib/S3Uploader'
import { generateResponsiveSizes, IMAGE_SIZES } from '@/app/_lib/image-optimizer'
import { parseSortDateFromLabel } from '@/app/_lib/format-shoot-date'

/**
 * Server Action : vérifie le mot de passe saisi par l'utilisateur.
 * Si le mot de passe est correct, un cookie de session est posé.
 * Le mot de passe attendu est lu côté serveur uniquement (jamais exposé au client).
 */
export async function authenticate(_prevState: { error?: string } | undefined, formData: FormData) {
  const password = formData.get('password')
  const expectedPassword = process.env.CONFIG_PASSWORD

  if (!expectedPassword) {
    return { error: 'Le mot de passe n\'est pas configuré sur le serveur.' }
  }

  if (typeof password !== 'string' || password !== expectedPassword) {
    return { error: 'Mot de passe incorrect.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('config-auth', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 heures
  })

  return { error: undefined }
}

/**
 * Server Action : déconnecte l'utilisateur en supprimant le cookie de session.
 */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('config-auth')
}

// ─────────────────────────── Helpers ───────────────────────────

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function requireAuth() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('config-auth')?.value === 'authenticated'
  if (!auth) throw new Error('Non autorisé')
}

// ─────────────────────────── Series ───────────────────────────

/**
 * Récupère toutes les séries, triées par ordre puis date de création.
 */
export async function getSeries() {
  return prisma.series.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { photos: true } } },
  })
}

/**
 * Récupère une série par son ID avec ses photos.
 */
export async function getSeriesById(id: string) {
  return prisma.series.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: 'asc' } },
    },
  })
}

/**
 * Récupère les tickets publiés (id + titre) pour le dropdown de liaison.
 */
export async function getPublishedTickets() {
  return prisma.ticket.findMany({
    where: { status: 'published' },
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Crée une nouvelle série avec une photo de couverture optionnelle.
 */
export async function createSeries(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth()

  try {
    const name = String(formData.get('name') ?? '').trim()
    if (!name) return { error: 'Le nom est requis.' }

    const file = formData.get('cover') as File | null
    let coverUrl: string | undefined

    if (file && file.size > 0) {
      const { url } = await uploadFileToS3(file)
      coverUrl = url
    }

    const slug = slugify(name)

    const series = await prisma.series.create({
      data: {
        name,
        slug,
        coverUrl,
      },
    })

    revalidatePath('/config')
    return { error: undefined, seriesId: series.id }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la création de la série.' }
  }
}

/**
 * Met à jour une série (nom, description, date, visibilité, tags, couverture).
 */
export async function updateSeries(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth()

  try {
    const id = String(formData.get('id') ?? '')
    const name = String(formData.get('name') ?? '').trim()
    if (!id) return { error: 'ID manquant.' }
    if (!name) return { error: 'Le nom est requis.' }

    const description = String(formData.get('description') ?? '').trim() || null
    const shootDateLabel = String(formData.get('shootDateLabel') ?? '').trim() || null
    const shootDate = shootDateLabel ? parseSortDateFromLabel(shootDateLabel) : null
    const referenceUrl = String(formData.get('referenceUrl') ?? '').trim() || null
    const linkedTicketId = String(formData.get('linkedTicketId') ?? '').trim() || null
    const visibility = String(formData.get('visibility') ?? 'private')
    const tagsRaw = String(formData.get('tags') ?? '').trim()
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const file = formData.get('cover') as File | null
    let coverUrl: string | undefined

    if (file && file.size > 0) {
      const { url } = await uploadFileToS3(file)
      coverUrl = url
    }

    await prisma.series.update({
      where: { id },
      data: {
        name,
        slug: slugify(name),
        description,
        shootDate,
        shootDateLabel,
        referenceUrl,
        linkedTicketId,
        visibility,
        tags,
        ...(coverUrl ? { coverUrl } : {}),
      },
    })

    revalidatePath('/config')
    revalidatePath(`/config/${id}`)
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la modification de la série.' }
  }
}

/**
 * Supprime une série et ses photos (S3 + BDD).
 */
export async function deleteSeries(id: string) {
  await requireAuth()

  try {
    const photos = await prisma.photo.findMany({
      where: { seriesId: id },
      select: { key: true },
    })

    await Promise.all(photos.map((p) => deleteFileFromS3(p.key).catch(() => {})))

    await prisma.series.delete({ where: { id } })

    revalidatePath('/config')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression de la série.' }
  }
}

/**
 * Met à jour l'ordre des séries.
 */
export async function reorderSeries(orderedIds: string[]) {
  await requireAuth()

  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.series.update({ where: { id }, data: { order: index } }),
      ),
    )
    revalidatePath('/config')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la réorganisation.' }
  }
}

/**
 * Met à jour l'ordre des photos d'une série.
 */
export async function reorderPhotos(seriesId: string, orderedIds: string[]) {
  await requireAuth()

  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.photo.update({ where: { id }, data: { order: index } }),
      ),
    )
    revalidatePath('/config')
    revalidatePath(`/config/${seriesId}`)
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la réorganisation des photos.' }
  }
}

// ─────────────────────────── Photos ───────────────────────────

/**
 * Upload une ou plusieurs photos et les associe à une série.
 */
export async function uploadPhotos(prevState: { error?: string } | undefined, formData: FormData) {
  try {
    await requireAuth()

    const seriesId = String(formData.get('seriesId') ?? '')
    if (!seriesId) return { error: 'ID de série manquant.' }

    const files = formData.getAll('photos') as File[]
    const validFiles = files.filter((f) => f.size > 0)

    if (validFiles.length === 0) return { error: 'Aucune photo sélectionnée.' }

    const lastPhoto = await prisma.photo.findFirst({
      where: { seriesId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const startOrder = (lastPhoto?.order ?? -1) + 1

    const uploads = await Promise.all(
      validFiles.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer())

        // Optimise l'image : redimensionne + convertit en WebP
        const sizes = await generateResponsiveSizes(buffer)

        // Clé de base partagée par toutes les variantes
        const baseKey = `uploads/${Date.now()}-${file.name
          .replace(/[^a-zA-Z0-9._-]/g, '-')
          .replace(/\.[^.]+$/, '')}`

        // Upload de toutes les variantes en parallèle
        const uploaded = await Promise.all(
          sizes.map((s) =>
            uploadOptimizedBuffer(s.buffer, baseKey, s.suffix, 'image/webp'),
          ),
        )

        // La version "full" est la référence principale
        const full = uploaded.find((u) => u.key.endsWith('-full.webp')) ?? uploaded[0]

        const variants = IMAGE_SIZES.map((size, idx) => ({
          suffix: size.suffix,
          width: size.width,
          url: uploaded[idx].url,
          key: uploaded[idx].key,
        }))

        return prisma.photo.create({
          data: {
            url: full.url,
            key: full.key,
            seriesId,
            order: startOrder + i,
            variants,
          },
        })
      }),
    )

    // Si la série n'a pas encore de couverture, on prend la première photo
    const series = await prisma.series.findUnique({ where: { id: seriesId } })
    if (series && !series.coverUrl && uploads.length > 0) {
      await prisma.series.update({
        where: { id: seriesId },
        data: { coverUrl: uploads[0].url },
      })
    }

    revalidatePath('/config')
    revalidatePath(`/config/${seriesId}`)
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    // Log détaillé pour diagnostiquer en production (S3, sharp, auth, timeout…)
    console.error('[uploadPhotos] Erreur :', err)
    const reason =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error('[uploadPhotos] Détail complet :', err && typeof err === 'object' && 'stack' in err ? (err as Error).stack : reason)
    return { error: `Erreur lors de l'upload des photos. (${reason})` }
  }
}

/**
 * Supprime une photo (S3 + BDD).
 */
export async function deletePhoto(id: string) {
  await requireAuth()

  try {
    const photo = await prisma.photo.findUnique({ where: { id } })
    if (!photo) return { error: 'Photo introuvable.' }

    await deleteFileFromS3(photo.key).catch(() => {})
    await prisma.photo.delete({ where: { id } })

    revalidatePath('/config')
    revalidatePath(`/config/${photo.seriesId}`)
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression de la photo.' }
  }
}

/**
 * Supprime toutes les photos d'une série (S3 + BDD).
 */
export async function deleteAllPhotos(seriesId: string) {
  await requireAuth()

  try {
    const photos = await prisma.photo.findMany({
      where: { seriesId },
      select: { key: true },
    })

    await Promise.all(photos.map((p) => deleteFileFromS3(p.key).catch(() => {})))

    await prisma.photo.deleteMany({ where: { seriesId } })

    revalidatePath('/config')
    revalidatePath(`/config/${seriesId}`)
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression des photos.' }
  }
}

/**
 * Définit une photo comme couverture de sa série.
 */
export async function setCoverPhoto(photoId: string) {
  await requireAuth()

  try {
    const photo = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!photo) return { error: 'Photo introuvable.' }

    await prisma.series.update({
      where: { id: photo.seriesId },
      data: { coverUrl: photo.url },
    })

    revalidatePath('/config')
    revalidatePath(`/config/${photo.seriesId}`)
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la définition de la couverture.' }
  }
}

/**
 * Met à jour la légende (titre) et l'année d'une photo.
 */
export async function updatePhotoCaption(photoId: string, caption: string, year: string) {
  await requireAuth()

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { series: { select: { slug: true } } },
    })
    if (!photo) return { error: 'Photo introuvable.' }

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        caption: caption.trim() || null,
        year: year.trim() || null,
      },
    })

    revalidatePath(`/config/${photo.seriesId}`)
    revalidatePath(`/galeries/${photo.series.slug}`)
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la mise à jour de la légende.' }
  }
}
