import { prisma } from '@/app/_lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/app/_components/navbar'
import { Footer } from '@/app/_components/footer'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

export const dynamic = 'force-dynamic'

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim()
}

function formatDateFr(date: Date): string {
    const months = [
        'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
        'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
    ]
    const d = new Date(date)
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default async function JournalPage() {
    const [profile, tickets] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.ticket.findMany({
            where: { status: 'published' },
            orderBy: { createdAt: 'desc' },
        }),
    ])

    const name = profile?.name ?? 'Christian Ramade'

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Navbar name={name} active="journal" />

            <main className="flex-1">
                {/* En-tête */}
                <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:py-28">
                    <h1 className="font-serif text-4xl text-gray-900 lg:text-5xl">
                        Blog
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-gray-500 ">
                        Notes de terrain d'observation, réflexions techniques et études visuelles issues de projets récents.
                    </p>
                </div>

                {/* Grille d'articles */}
                <div className="mx-auto max-w-6xl px-6 pb-24 lg:px-12">
                    {tickets.length === 0 ? (
                        <p className="py-20 text-center text-sm text-gray-400">
                            Aucun article publié pour le moment.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {tickets.map((ticket) => {
                                const excerpt = ticket.excerpt || stripHtml(ticket.content).slice(0, 150)
                                const category = ticket.tags[0] ?? 'Note de terrain'

                                return (
                                    <Link
                                        key={ticket.id}
                                        href={`/journal/${ticket.slug}`}
                                        className="group flex flex-col rounded-sm border border-gray-100 bg-white p-8 transition-colors hover:bg-gray-50 lg:p-10"
                                    >
                                        {/* Métadonnées */}
                                        <p className="text-xs uppercase tracking-widest text-gray-400">
                                            {category.toUpperCase()} · {formatDateFr(ticket.createdAt)}
                                        </p>

                                        {/* Titre */}
                                        <h3 className="mt-3 text-lg font-semibold leading-snug text-gray-900 group-hover:text-gray-600">
                                            {ticket.title}
                                        </h3>

                                        {/* Extrait */}
                                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500">
                                            {excerpt}
                                        </p>

                                        {/* Lien de lecture */}
                                        <span className="mt-4 text-xs uppercase tracking-widest text-gray-900 transition-colors group-hover:text-gray-600">
                                            Lire l'article →
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* Bouton */}
                    <div className="mt-16 text-center">
                        <button className="inline-block border border-gray-300 px-10 py-3.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white">
                            Lire les archives du journal
                        </button>
                    </div>
                </div>
            </main>

            <Footer name={name} />
        </div>
    )
}
