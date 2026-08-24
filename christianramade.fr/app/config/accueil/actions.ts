'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/app/_lib/prisma'
import { uploadFileToS3, deleteFileFromS3 } from '@/app/_lib/S3Uploader'

// ─────────────────────────── Helpers ───────────────────────────

async function requireAuth() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('config-auth')?.value === 'authenticated'
  if (!auth) throw new Error('Non autorisé')
}

/**
 * Récupère ou crée la page d'accueil (singleton).
 */
async function getOrCreateHomepage() {
  let homepage = await prisma.homepage.findFirst({
    include: {
      featuredWorks: {
        orderBy: { order: 'asc' },
        include: { series: { select: { id: true, name: true, slug: true, coverUrl: true } } },
      },
    },
  })

  if (!homepage) {
    homepage = await prisma.homepage.create({
      data: {},
      include: {
        featuredWorks: {
          orderBy: { order: 'asc' },
          include: { series: { select: { id: true, name: true, slug: true, coverUrl: true } } },
        },
      },
    })
  }

  return homepage
}

// ─────────────────────────── Lecture ───────────────────────────

export async function getHomepage() {
  return getOrCreateHomepage()
}

/**
 * Récupère les galeries (séries) existantes pour la sélection d'œuvres majeures.
 */
export async function getSeries() {
  return prisma.series.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      coverUrl: true,
    },
  })
}

// ─────────────────────────── Photo principale ───────────────────────────

/**
 * Met à jour la photo principale (hero) et son texte associé.
 */
export async function updateHero(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth()

  try {
    const homepage = await getOrCreateHomepage()
    const heroText = String(formData.get('heroText') ?? '').trim()

    const file = formData.get('heroImage') as File | null
    let heroImageUrl: string | undefined
    let heroImageKey: string | undefined

    if (file && file.size > 0) {
      // Supprime l'ancienne image si elle existe
      if (homepage.heroImageKey) {
        await deleteFileFromS3(homepage.heroImageKey).catch(() => {})
      }
      const { url, key } = await uploadFileToS3(file)
      heroImageUrl = url
      heroImageKey = key
    }

    await prisma.homepage.update({
      where: { id: homepage.id },
      data: {
        heroText,
        ...(heroImageUrl ? { heroImageUrl, heroImageKey } : {}),
      },
    })

    revalidatePath('/config/accueil')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la mise à jour de la photo principale.' }
  }
}

/**
 * Supprime la photo principale (S3 + BDD).
 */
export async function deleteHeroImage() {
  await requireAuth()

  try {
    const homepage = await getOrCreateHomepage()

    if (homepage.heroImageKey) {
      await deleteFileFromS3(homepage.heroImageKey).catch(() => {})
    }

    await prisma.homepage.update({
      where: { id: homepage.id },
      data: { heroImageUrl: null, heroImageKey: null },
    })

    revalidatePath('/config/accueil')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression de la photo principale.' }
  }
}

// ─────────────────────────── Présentation ───────────────────────────

/**
 * Met à jour le texte de présentation et le titre du manifeste (slogan).
 */
export async function updatePresentation(
  prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAuth()

  try {
    const homepage = await getOrCreateHomepage()
    const presentation = String(formData.get('presentation') ?? '').trim()
    const manifestoTitle = String(formData.get('manifestoTitle') ?? '').trim()

    await prisma.homepage.update({
      where: { id: homepage.id },
      data: {
        presentation,
        ...(manifestoTitle ? { manifestoTitle } : {}),
      },
    })

    revalidatePath('/config/accueil')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la mise à jour de la présentation.' }
  }
}

// ─────────────────────────── Œuvres majeures ───────────────────────────

const MAX_FEATURED_WORKS = 6

/**
 * Ajoute une galerie existante comme œuvre majeure (max 6 au total).
 */
export async function addFeaturedSeries(
  prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAuth()

  try {
    const homepage = await getOrCreateHomepage()
    const seriesId = String(formData.get('seriesId') ?? '').trim()
    if (!seriesId) return { error: 'Aucune galerie sélectionnée.' }

    const currentCount = homepage.featuredWorks.length
    if (currentCount >= MAX_FEATURED_WORKS) {
      return { error: `Limite de ${MAX_FEATURED_WORKS} œuvres majeures atteinte.` }
    }

    // Vérifie que la galerie existe et n'est pas déjà ajoutée
    const series = await prisma.series.findUnique({ where: { id: seriesId } })
    if (!series) return { error: 'Galerie introuvable.' }

    const alreadyAdded = homepage.featuredWorks.some((w) => w.seriesId === seriesId)
    if (alreadyAdded) return { error: 'Cette galerie est déjà ajoutée.' }

    const lastWork = await prisma.featuredWork.findFirst({
      where: { homepageId: homepage.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    await prisma.featuredWork.create({
      data: {
        url: series.coverUrl ?? '',
        key: '',
        seriesId,
        homepageId: homepage.id,
        order: (lastWork?.order ?? -1) + 1,
      },
    })

    revalidatePath('/config/accueil')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de l\'ajout de la galerie.' }
  }
}

/**
 * Supprime une œuvre majeure (S3 + BDD).
 */
export async function deleteFeaturedWork(id: string) {
  await requireAuth()

  try {
    const work = await prisma.featuredWork.findUnique({ where: { id } })
    if (!work) return { error: 'Œuvre introuvable.' }

    await deleteFileFromS3(work.key).catch(() => {})
    await prisma.featuredWork.delete({ where: { id } })

    revalidatePath('/config/accueil')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression de l\'œuvre.' }
  }
}

/**
 * Réordonne les œuvres majeures.
 */
export async function reorderFeaturedWorks(orderedIds: string[]) {
  await requireAuth()

  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.featuredWork.update({ where: { id }, data: { order: index } }),
      ),
    )
    revalidatePath('/config/accueil')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors du réordonnancement.' }
  }
}

/**
 * Déconnecte l'utilisateur.
 */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('config-auth')
}