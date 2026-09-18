import { prisma } from '@/app/_lib/prisma'
import { Navbar } from '@/app/_components/navbar'
import { Footer } from '@/app/_components/footer'
import { BooksGrid } from './books-grid'

export const dynamic = 'force-dynamic'

export default async function LivresPage() {
    const [profile, books] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.book.findMany({
            orderBy: { order: 'asc' },
        }),
    ])

    const name = profile?.name ?? 'Christian Ramade'

    return (
        <div className="flex min-h-screen flex-col bg-white pt-20">
            <Navbar name={name} active="livres" />

            <main className="flex-1">
                {/* En-tête */}
                <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:py-28">
                    <h1 className="font-serif text-4xl text-gray-900 lg:text-5xl">
                        Livres
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-gray-500">
                        Monographies et ouvrages édités autour de mes travaux photographiques.
                    </p>
                </div>

                {/* Grille des livres */}
                <div className="mx-auto max-w-6xl px-6 pb-24 lg:px-12">
                    {books.length === 0 ? (
                        <p className="py-20 text-center text-sm text-gray-400">
                            Aucun livre publié pour le moment.
                        </p>
                    ) : (
                        <BooksGrid books={books} />
                    )}
                </div>
            </main>

            <Footer name={name} />
        </div>
    )
}