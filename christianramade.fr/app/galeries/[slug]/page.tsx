import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { prisma } from '@/app/_lib/prisma'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import { formatShootDate } from '@/app/_lib/format-shoot-date'

export const dynamic = 'force-dynamic'

export default async function GalerieDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const series = await prisma.series.findUnique({
        where: { slug },
        include: {
            photos: { orderBy: { order: 'asc' } },
            linkedTicket: {
                select: { id: true, title: true, slug: true, status: true },
            },
        },
    })

    if (!series || series.visibility !== 'public') {
        notFound()
    }

    const linkedArticle =
        series.linkedTicket && series.linkedTicket.status === 'published'
            ? series.linkedTicket
            : null

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-7xl px-6 py-16">
                {/* Retour */}
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Retour à l'accueil
                </Link>

                {/* En-tête */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        {series.name}
                    </h1>
                    {series.description && (
                        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-gray-500">
                            {series.description}
                        </p>
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

                {/* Grille de photos */}
                {series.photos.length === 0 ? (
                    <p className="text-gray-400">Aucune photo dans cette galerie.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {series.photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative aspect-[4/3] overflow-hidden bg-gray-100"
                            >
                                <Image
                                    src={s3UrlToProxy(photo.url) ?? photo.url}
                                    alt={series.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Bouton vers l'article lié */}
                
            </div>
        </div>
    )
}
