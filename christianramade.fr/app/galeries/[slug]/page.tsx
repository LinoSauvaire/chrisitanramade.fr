import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/app/_lib/prisma'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

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
        },
    })

    if (!series || series.visibility !== 'public') {
        notFound()
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-7xl px-6 py-16">
                {/* Retour */}
                <Link
                    href="/galeries"
                    className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Retour aux galeries
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
                        {series.shootDate && (
                            <span>
                                {new Intl.DateTimeFormat('fr-FR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                }).format(new Date(series.shootDate))}
                            </span>
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
                </div>

                {/* Grille de photos */}
                {series.photos.length === 0 ? (
                    <p className="text-gray-400">Aucune photo dans cette galerie.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {series.photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
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
            </div>
        </div>
    )
}
