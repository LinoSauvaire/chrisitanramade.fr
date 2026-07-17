import { prisma } from '@/app/_lib/prisma'
import Image from 'next/image'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GaleriesPage() {
    const series = await prisma.series.findMany({
        where: { visibility: 'public' },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: { _count: { select: { photos: true } } },
    })

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-7xl px-6 py-16">
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
                    Galeries
                </h1>
                <p className="mb-12 text-gray-500">
                    Découvrez les séries photographiques de Christian Ramade.
                </p>

                {series.length === 0 ? (
                    <p className="text-gray-400">Aucune galerie publique pour le moment.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {series.map((s) => (
                            <Link
                                key={s.id}
                                href={`/galeries/${s.slug}`}
                                className="group overflow-hidden rounded-2xl"
                            >
                                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                    {s.coverUrl ? (
                                        <Image
                                            src={s3UrlToProxy(s.coverUrl) ?? s.coverUrl}
                                            alt={s.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-gray-100">
                                            <span className="text-gray-300">Pas de couverture</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4">
                                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                                        {s.name}
                                    </h2>
                                    {s.description && (
                                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                            {s.description}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-400">
                                        {s._count.photos} photo{s._count.photos > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
