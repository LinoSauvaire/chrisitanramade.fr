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
 * Récupère ou crée le profil unique (singleton).
 */
async function getOrCreateProfile() {
  let profile = await prisma.profile.findFirst({
    include: {
      timeline: { orderBy: { year: 'desc' } },
      books: { orderBy: { order: 'asc' } },
    },
  })

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        name: 'Christian Ramade',
        bio: "Spécialisé dans la photographie documentaire au long cours, mon travail s'attache à explorer les mutations sociales et environnementales contemporaines. Privilégiant l'immersion et le temps long, je cherche à construire des récits visuels qui interrogent notre rapport au territoire et aux identités locales.",
      },
      include: {
        timeline: { orderBy: { year: 'desc' } },
        books: { orderBy: { order: 'asc' } },
      },
    })
  }

  return profile
}

// ─────────────────────────── Lecture ───────────────────────────

export async function getProfile() {
  return getOrCreateProfile()
}

// ─────────────────────────── Profil ───────────────────────────

/**
 * Met à jour la biographie et le nom du profil.
 */
export async function updateProfile(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth()

  try {
    const profile = await getOrCreateProfile()
    const name = String(formData.get('name') ?? '').trim()
    const tagline = String(formData.get('tagline') ?? '').trim()
    const bio = String(formData.get('bio') ?? '').trim()

    // Upload de la photo de profil (optionnel)
    const file = formData.get('avatar') as File | null
    let avatarUrl: string | undefined

    if (file && file.size > 0) {
      // Supprime l'ancienne photo si elle existe
      if (profile.avatarUrl) {
        const oldKey = profile.avatarUrl.match(/\/uploads\/(.+)$/)?.[1]
        if (oldKey) await deleteFileFromS3(oldKey).catch(() => {})
      }
      const { url } = await uploadFileToS3(file)
      avatarUrl = url
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(name ? { name } : {}),
        ...(tagline ? { tagline } : {}),
        bio,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    })

    revalidatePath('/profil')
    revalidatePath('/')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la mise à jour du profil.' }
  }
}

// ─────────────────────────── Timeline ───────────────────────────

/**
 * Ajoute un élément au parcours.
 */
export async function addTimelineItem(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth()

  try {
    const profile = await getOrCreateProfile()
    const title = String(formData.get('title') ?? '').trim()
    const year = String(formData.get('year') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim() || null
    const location = String(formData.get('location') ?? '').trim() || null

    if (!title) return { error: 'Le titre est requis.' }

    const lastItem = await prisma.timelineItem.findFirst({
      where: { profileId: profile.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    await prisma.timelineItem.create({
      data: {
        title,
        year,
        description,
        location,
        profileId: profile.id,
        order: (lastItem?.order ?? -1) + 1,
      },
    })

    revalidatePath('/profil')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de l\'ajout.' }
  }
}

/**
 * Supprime un élément du parcours.
 */
export async function deleteTimelineItem(id: string) {
  await requireAuth()

  try {
    await prisma.timelineItem.delete({ where: { id } })
    revalidatePath('/profil')
    revalidatePath('/bio')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression.' }
  }
}

// ─────────────────────────── Livres ───────────────────────────

/**
 * Ajoute un livre avec couverture S3.
 */
export async function addBook(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth()

  try {
    const profile = await getOrCreateProfile()
    const title = String(formData.get('title') ?? '').trim()
    const publisher = String(formData.get('publisher') ?? '').trim() || null
    const year = String(formData.get('year') ?? '').trim() || null
    const description = String(formData.get('description') ?? '').trim() || null

    if (!title) return { error: 'Le titre est requis.' }

    const file = formData.get('cover') as File | null
    let coverUrl: string | undefined
    let coverKey: string | undefined

    if (file && file.size > 0) {
      const { url, key } = await uploadFileToS3(file)
      coverUrl = url
      coverKey = key
    }

    const lastBook = await prisma.book.findFirst({
      where: { profileId: profile.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    await prisma.book.create({
      data: {
        title,
        publisher,
        year,
        description,
        coverUrl,
        coverKey,
        profileId: profile.id,
        order: (lastBook?.order ?? -1) + 1,
      },
    })

    revalidatePath('/profil')
    revalidatePath('/config/livres')
    revalidatePath('/livres')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de l\'ajout du livre.' }
  }
}

/**
 * Supprime un livre et sa couverture S3.
 */
export async function deleteBook(id: string) {
  await requireAuth()

  try {
    const book = await prisma.book.findUnique({
      where: { id },
      select: { coverKey: true },
    })

    if (book?.coverKey) {
      await deleteFileFromS3(book.coverKey).catch(() => {})
    }

    await prisma.book.delete({ where: { id } })
    revalidatePath('/profil')
    revalidatePath('/config/livres')
    revalidatePath('/livres')
    revalidatePath('/bio')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression du livre.' }
  }
}

/**
 * Réordonne les livres (drag & drop).
 */
export async function reorderBooks(bookIds: string[]) {
  await requireAuth()

  try {
    await Promise.all(
      bookIds.map((id, index) =>
        prisma.book.update({ where: { id }, data: { order: index } }),
      ),
    )
    revalidatePath('/profil')
    revalidatePath('/config/livres')
    revalidatePath('/livres')
    revalidatePath('/bio')
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
