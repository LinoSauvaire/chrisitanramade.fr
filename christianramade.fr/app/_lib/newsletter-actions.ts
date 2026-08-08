'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/_lib/prisma'

// ─────────────────────────── Newsletter ───────────────────────────

/**
 * Inscrit un email à la newsletter.
 */
export async function subscribeToNewsletter(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) return { error: 'Veuillez saisir votre adresse email.' }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Adresse email invalide.' }
  }

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } })
    if (existing) {
      return { error: undefined, success: true }
    }

    await prisma.subscriber.create({ data: { email } })
    return { error: undefined, success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de l\'inscription.' }
  }
}

/**
 * Désinscrit un email de la newsletter.
 */
export async function unsubscribeFromNewsletter(email: string) {
  try {
    await prisma.subscriber.delete({ where: { email: email.toLowerCase() } })
    return { error: undefined }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de la désinscription.' }
  }
}

// ─────────────────────────── Contact ───────────────────────────

/**
 * Envoie un message de contact (réaction sous un article) à l'adresse mail configurée.
 */
export async function sendContactMessage(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  const articleSlug = String(formData.get('articleSlug') ?? '').trim()
  const articleTitle = String(formData.get('articleTitle') ?? '').trim()

  if (!name) return { error: 'Veuillez indiquer votre nom.' }
  if (!email) return { error: 'Veuillez indiquer votre email.' }
  if (!message) return { error: 'Veuillez écrire un message.' }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Adresse email invalide.' }
  }

  const recipientEmail = process.env.CONTACT_EMAIL
  if (!recipientEmail) {
    console.error('CONTACT_EMAIL non configuré dans .env')
    return { error: 'Le formulaire de contact n\'est pas configuré.' }
  }

  try {
    // Utilise l'API SMTP native de Node via fetch vers un service d'email
    // ou simplement stocke le message en base pour traitement manuel
    // Ici on envoie via Resend/SMTP si configuré, sinon on log
    const emailHtml = `
      <h2>Nouveau message de contact</h2>
      <p><strong>De :</strong> ${name} (${email})</p>
      ${articleTitle ? `<p><strong>Article :</strong> ${articleTitle}</p>` : ''}
      ${articleSlug ? `<p><strong>Lien :</strong> https://christianramade.fr/journal/${articleSlug}</p>` : ''}
      <hr>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `

    // Si RESEND_API_KEY est configuré, on utilise Resend
    if (process.env.RESEND_API_KEY) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          reply_to: email,
          subject: articleTitle ? `Réaction — ${articleTitle}` : 'Nouveau message de contact',
          html: emailHtml,
        }),
      })

      if (!res.ok) {
        console.error('Erreur Resend:', await res.text())
        return { error: 'Erreur lors de l\'envoi du message.' }
      }
    } else {
      // Fallback : log le message (en attendant la configuration SMTP)
      console.log('--- Message de contact ---')
      console.log(`De: ${name} <${email}>`)
      console.log(`Article: ${articleTitle}`)
      console.log(`Message: ${message}`)
      console.log('--------------------------')
    }

    return { error: undefined, success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Erreur lors de l\'envoi du message.' }
  }
}
