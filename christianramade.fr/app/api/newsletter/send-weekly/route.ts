import { NextResponse } from 'next/server'
import { prisma } from '@/app/_lib/prisma'

/**
 * Route API appelée par un cron (ex: cron-job.org, Vercel Cron, etc.)
 * GET /api/newsletter/send-weekly?secret=XXX
 *
 * Détecte les tickets publiés dans les 7 derniers jours,
 * et envoie un email à tous les abonnés.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.NEWSLETTER_CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  // Tickets publiés dans les 7 derniers jours
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const newTickets = await prisma.ticket.findMany({
    where: {
      status: 'published',
      createdAt: { gte: oneWeekAgo },
    },
    select: { id: true, title: true, slug: true, excerpt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const subscribers = await prisma.subscriber.findMany({
    select: { email: true },
  })

  if (subscribers.length === 0) {
    return NextResponse.json({ message: 'Aucun abonné.', sent: 0 })
  }

  if (newTickets.length === 0) {
    return NextResponse.json({ message: 'Aucun nouveau ticket cette semaine.', sent: 0 })
  }

  const profile = await prisma.profile.findFirst()
  const authorName = profile?.name ?? 'Christian Ramade'

  // Construit le HTML de l'email
  const ticketsList = newTickets
    .map(
      (t) => `
        <li style="margin-bottom:16px;">
          <a href="https://christianramade.fr/journal/${t.slug}" style="color:#1a1a1a;text-decoration:none;font-size:16px;font-weight:600;">
            ${t.title}
          </a>
          ${t.excerpt ? `<p style="color:#666;font-size:14px;margin-top:4px;">${t.excerpt}</p>` : ''}
        </li>`,
    )
    .join('')

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;">
      <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:8px;">${authorName}</h1>
      <p style="color:#666;font-size:14px;margin-bottom:24px;">
        ${newTickets.length} nouveau${newTickets.length > 1 ? 'x' : ''} billet${newTickets.length > 1 ? 's' : ''} d'humeur cette semaine
      </p>
      <ul style="list-style:none;padding:0;margin:0;">
        ${ticketsList}
      </ul>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
      <p style="font-size:12px;color:#999;">
        Vous recevez cet email car vous êtes inscrit à la newsletter de ${authorName}.<br>
        <a href="https://christianramade.fr/api/newsletter/unsubscribe?email=EMAIL_PLACEHOLDER" style="color:#999;">Se désinscrire</a>
      </p>
    </div>
  `

  let sent = 0
  let errors = 0

  if (resendApiKey) {
    // Envoi via Resend (batch par 50 pour éviter les limites)
    for (let i = 0; i < subscribers.length; i += 50) {
      const batch = subscribers.slice(i, i + 50)
      const bcc = batch.map((s) => s.email)

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [fromEmail],
            bcc,
            subject: `${newTickets.length} nouveau${newTickets.length > 1 ? 'x' : ''} billet${newTickets.length > 1 ? 's' : ''} d'humeur — ${authorName}`,
            html: html.replace(/EMAIL_PLACEHOLDER/g, ''),
          }),
        })

        if (res.ok) {
          sent += batch.length
        } else {
          console.error('Erreur Resend:', await res.text())
          errors++
        }
      } catch (err) {
        console.error('Erreur envoi:', err)
        errors++
      }
    }
  } else {
    // Pas de Resend configuré : log seulement
    console.log(`[Newsletter] ${newTickets.length} nouveaux tickets, ${subscribers.length} abonnés`)
    console.log(`[Newsletter] RESEND_API_KEY non configuré — aucun email envoyé`)
    sent = subscribers.length
  }

  return NextResponse.json({
    newTickets: newTickets.length,
    subscribers: subscribers.length,
    sent,
    errors,
  })
}
