'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/app/_lib/prisma'
import { uploadFileToS3, deleteFileFromS3 } from '@/app/_lib/S3Uploader'

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

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || 'ticket'
  let suffix = 1
  while (true) {
    const existing = await prisma.ticket.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!existing || existing.id === excludeId) return slug
    suffix++
    slug = `${slugify(base)}-${suffix}`
  }
}

// ─────────────────────────── Lecture ───────────────────────────

export async function getTickets() {
  return prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
  })
}

// ─────────────────────────── Mutations ───────────────────────────

/**
 * Crée un nouveau ticket (brouillon vide) et redirige vers l'éditeur.
 */
export async function createTicket() {
  await requireAuth()

  const slug = await ensureUniqueSlug('Nouveau ticket')

  const ticket = await prisma.ticket.create({
    data: {
      title: 'Nouveau ticket',
      slug,
      content: '',
      status: 'draft',
    },
  })

  revalidatePath('/ticket')
  redirect(`/ticket/${ticket.id}`)
}

/**
 * Met à jour un ticket (titre, contenu, statut, tags, couverture).
 */
export async function updateTicket(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth()

  try {
    const id = String(formData.get('id') ?? '')
    const title = String(formData.get('title') ?? '').trim()
    if (!id) return { error: 'ID manquant.' }
    if (!title) return { error: 'Le titre est requis.' }

    const content = String(formData.get('content') ?? '')
    const excerpt = String(formData.get('excerpt') ?? '').trim() || null
    const status = String(formData.get('status') ?? 'draft')
    const tagsRaw = String(formData.get('tags') ?? '').trim()
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const file = formData.get('cover') as File | null
    let coverUrl: string | undefined
    let coverKey: string | undefined

    if (file && file.size > 0) {
      // Supprime l'ancienne couverture si elle existe
      const existing = await prisma.ticket.findUnique({
        where: { id },
        select: { coverKey: true },
      })
      if (existing?.coverKey) {
        await deleteFileFromS3(existing.coverKey).catch(() => {})
      }
      const { url, key } = await uploadFileToS3(file)
      coverUrl = url
      coverKey = key
    }

    const slug = await ensureUniqueSlug(title, id)

    await prisma.ticket.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt,
        status,
        tags,
        ...(coverUrl ? { coverUrl } : {}),
        ...(coverKey ? { coverKey } : {}),
      },
    })

    revalidatePath('/ticket')
    revalidatePath(`/ticket/${id}`)
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la modification du ticket.' }
  }
}

/**
 * Supprime un ticket.
 */
export async function deleteTicket(id: string) {
  await requireAuth()

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { coverKey: true },
    })

    if (ticket?.coverKey) {
      await deleteFileFromS3(ticket.coverKey).catch(() => {})
    }

    await prisma.ticket.delete({ where: { id } })

    revalidatePath('/ticket')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la suppression du ticket.' }
  }
}

/**
 * Réordonne les tickets.
 */
export async function reorderTickets(orderedIds: string[]) {
  await requireAuth()

  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.ticket.update({ where: { id }, data: { order: index } }),
      ),
    )
    revalidatePath('/ticket')
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la réorganisation.' }
  }
}

/**
 * Déconnecte l'utilisateur.
 */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('config-auth')
}
