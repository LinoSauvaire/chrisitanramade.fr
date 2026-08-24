import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { prisma } from '@/app/_lib/prisma'
import { formatShootDate } from '@/app/_lib/format-shoot-date'
import { GalleryClient } from './gallery-client'
import { SeriesDescription } from './series-description'
import { Navbar } from '@/app/_components/navbar'
import { Footer } from '@/app/_components/footer'

export const dynamic = 'force-dynamic'

export default async function GalerieDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const [profile, series] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.series.findUnique({
            where: { slug },
            include: {
                photos: { orderBy: { order: 'asc' } },
                linkedTicket: {
                    select: { id: true, title: true, slug: true, status: true },
                },
            },
        }),
    ])

    if (!series || series.visibility !== 'public') {
        notFound()
    }

    const name = profile?.name ?? 'Christian Ramade'

    const linkedArticle =
        series.linkedTicket && series.linkedTicket.status === 'published'
            ? series.linkedTicket
            : null

    return (
        <div className="flex min-h-screen flex-col bg-white pt-20">
            <Navbar name={name} active="archives" />

            <main className="flex-1">
            <div className="mx-auto max-w-7xl px-6 py-16">
                {/* Retour */}
                <Link
                    href="/archives"
                    className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Retour à la galerie
                </Link>

                {/* En-tête */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        {series.name}
                    </h1>
                    {series.description && (
                        <SeriesDescription text={series.description} />
                    )}

                   
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        {formatShootDate(series.shootDate, series.shootDateLabel) && (
                            <span>{formatShootDate(series.shootDate, series.shootDateLabel)}</span>
                        )}
                        <span>{series.photos.length} photos</span>
                        {series.tags.length > 0 && (
                            <div className="flex gap-1.5">
                                {series.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                     {linkedArticle && (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                        <Link
                            href={`/journal/${linkedArticle.slug}`}
                            className="inline-flex items-center gap-2 border border-gray-300 px-8 py-3.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
                        >
                            Lire l'article — {linkedArticle.title}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                )}
                </div>

                {/* Grille de photos avec lightbox */}
                {series.photos.length === 0 ? (
                    <p className="text-gray-400">Aucune photo dans cette galerie.</p>
                ) : (
                    <GalleryClient photos={series.photos} seriesName={series.name} />
                )}

                {/* Bouton vers l'article lié */}
                
            </div>
            </main>

            <Footer name={name} />
        </div>
    )
}
