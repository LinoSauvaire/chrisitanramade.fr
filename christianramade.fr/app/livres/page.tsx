import { prisma } from '@/app/_lib/prisma'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import Image from 'next/image'
import { Navbar } from '@/app/_components/navbar'
import { Footer } from '@/app/_components/footer'

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
                        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                            {books.map((book) => (
                                <div key={book.id} className="group">
                                    {/* Couverture */}
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-100">
                                        {book.coverUrl ? (
                                            <Image
                                                src={s3UrlToProxy(book.coverUrl) ?? book.coverUrl}
                                                alt={book.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-gray-100">
                                                <span className="text-sm text-gray-300">Pas de couverture</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Métadonnées */}
                                    <div className="mt-4 flex items-baseline justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {book.title}
                                        </h3>
                                        <span className="text-xs text-gray-400">
                                            {book.year}
                                        </span>
                                    </div>
                                    {book.publisher && (
                                        <p className="mt-0.5 text-xs text-gray-400">
                                            {book.publisher}
                                        </p>
                                    )}
                                    {book.description && (
                                        <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                            {book.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer name={name} />
        </div>
    )
}