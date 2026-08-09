import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/app/_lib/prisma'
import { Navbar } from '@/app/_components/navbar'
import { Footer } from '@/app/_components/footer'
import { ContactForm } from '@/app/_components/contact-form'

export const dynamic = 'force-dynamic'

function formatDateFr(date: Date): string {
    const months = [
        'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
        'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
    ]
    const d = new Date(date)
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default async function JournalArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const [profile, ticket] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.ticket.findUnique({ where: { slug } }),
    ])

    if (!ticket || ticket.status !== 'published') {
        notFound()
    }

    const name = profile?.name ?? 'Christian Ramade'
    const category = ticket.tags[0] ?? 'Note de terrain'

    return (
        <div className="flex min-h-screen flex-col bg-white pt-20">
            <Navbar name={name} active="journal" />

            <main className="flex-1">
                <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
                    {/* Retour */}
                    <Link
                        href="/journal"
                        className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Retour au journal
                    </Link>

                    {/* Métadonnées */}
                    <p className="text-xs uppercase tracking-widest text-gray-400">
                        {category.toUpperCase()} · {formatDateFr(ticket.createdAt)}
                    </p>

                    {/* Titre */}
                    <h1 className="mt-3 font-serif text-4xl leading-tight text-gray-900 lg:text-5xl">
                        {ticket.title}
                    </h1>

                    {/* Contenu */}
                    <div
                        className="mt-10 space-y-6 text-base leading-relaxed text-gray-700 [&_img]:rounded-sm [&_p]:my-4"
                        dangerouslySetInnerHTML={{ __html: ticket.content }}
                    />

                    {/* Tags */}
                    {ticket.tags.length > 0 && (
                        <div className="mt-12 flex flex-wrap gap-2 border-t border-gray-100 pt-8">
                            {ticket.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Formulaire de contact / réaction */}
                    <ContactForm articleSlug={ticket.slug} articleTitle={ticket.title} />
                </article>
            </main>

            <Footer name={name} />
        </div>
    )
}
