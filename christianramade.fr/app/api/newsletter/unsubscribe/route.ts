import { NextResponse } from 'next/server'
import { prisma } from '@/app/_lib/prisma'

/**
 * Désinscription newsletter via lien email.
 * GET /api/newsletter/unsubscribe?email=foo@bar.com
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.redirect(new URL('/?unsubscribed=0', request.url))
  }

  try {
    await prisma.subscriber.delete({
      where: { email: email.toLowerCase() },
    })
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fafafa;">
        <div style="text-align:center;padding:40px;">
          <h1 style="font-size:24px;color:#1a1a1a;">Désinscription confirmée</h1>
          <p style="color:#666;margin-top:8px;">Vous ne recevrez plus la newsletter.</p>
          <a href="https://christianramade.fr" style="display:inline-block;margin-top:20px;color:#1a1a1a;text-decoration:underline;">Retour au site</a>
        </div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    )
  } catch (err) {
    // Déjà désinscrit ou erreur
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fafafa;">
        <div style="text-align:center;padding:40px;">
          <h1 style="font-size:24px;color:#1a1a1a;">Déjà désinscrit</h1>
          <p style="color:#666;margin-top:8px;">Cet email n'est plus abonné à la newsletter.</p>
          <a href="https://christianramade.fr" style="display:inline-block;margin-top:20px;color:#1a1a1a;text-decoration:underline;">Retour au site</a>
        </div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    )
  }
}
