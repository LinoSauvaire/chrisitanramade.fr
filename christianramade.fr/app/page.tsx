import { prisma } from '@/app/_lib/prisma'
import Image from 'next/image'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import { formatShootDate } from '@/app/_lib/format-shoot-date'
import Link from 'next/link'
import { Navbar } from '@/app/_components/navbar'
import { Footer } from '@/app/_components/footer'

export const dynamic = 'force-dynamic'

export default async function Home() {
    const [profile, homepage, series] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.homepage.findFirst({
            include: {
                featuredWorks: {
                    orderBy: { order: 'asc' },
                    include: {
                        series: {
                            select: {
                                slug: true,
                                name: true,
                                description: true,
                                shootDate: true,
                                shootDateLabel: true,
                                tags: true,
                                _count: { select: { photos: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma.series.findMany({
            where: { visibility: 'public', featured: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            include: { _count: { select: { photos: true } } },
        }),
    ])

    const name = profile?.name ?? 'Christian Ramade'
    const heroImageUrl = homepage?.heroImageUrl ?? null
    const heroText = homepage?.heroText || 'Capturer les moments de calme'
    const presentation =
        homepage?.presentation ||
        profile?.bio ||
        "Une exploration photographique des mutations sociales et environnementales contemporaines, privilégiant l'immersion et le temps long pour construire des récits visuels qui interrogent notre rapport au territoire."
    const featuredWorks = homepage?.featuredWorks ?? []

    return (
        <div className="flex min-h-screen flex-col bg-white pt-20">
            <Navbar name={name} active="accueil" />

            <main className="flex-1">
                {/* ─────────────────────────── Bannière Hero ─────────────────────────── */}
                <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-gray-900">
                    {/* Image de couverture : photo principale configurée dans /config/accueil */}
                    {heroImageUrl ? (
                        <Image
                            src={s3UrlToProxy(heroImageUrl) ?? heroImageUrl}
                            alt="Photo principale"
                            fill
                            className="object-cover opacity-60"
                            sizes="100vw"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                    )}

                    {/* Superposition textuelle */}
                    <div className="absolute inset-0 flex items-end">
                        <div className="mx-auto w-full max-w-6xl px-6 pb-16 lg:px-12">
                            <h1 className="font-serif text-4xl leading-tight text-white lg:text-5xl">
                                {heroText}
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
                                Une approche photographique explorant la relation entre la lumière, l'espace, l'histoire familiale et l'expérience humaine dans le paysage moderne.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────── Manifeste ─────────────────────────── */}
                <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:py-32">
                    <h2 className="font-serif text-3xl text-gray-900 lg:text-4xl">
                        La Démarche
                    </h2>
                    <p className="mt-6 text-base leading-relaxed text-gray-600">
                        {presentation}
                    </p>
                    <Link
                        href="/bio"
                        className="mt-10 inline-block border border-gray-300 px-8 py-3 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
                    >
                        Lire la biographie
                    </Link>
                </section>

                {/* ─────────────────────────── Œuvres Sélectionnées ─────────────────────────── */}
                <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-12">
                    {/* En-tête de section */}
                    <div className="mb-10 flex items-end justify-between border-b border-gray-100 pb-4">
                        <h2 className="font-serif text-2xl text-gray-900 lg:text-3xl">
                            Œuvres Sélectionnées
                        </h2>
                        <Link
                            href="/archives"
                            className="text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
                        >
                            Voir les archives
                        </Link>
                    </div>

                    {/* Grille : œuvres majeures configurées, sinon séries en vedette */}
                    {featuredWorks.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredWorks.map((work) => {
                                const s = work.series
                                const href = s?.slug ? `/galeries/${s.slug}` : null
                                const image = (
                                    <div className="relative aspect-square overflow-hidden rounded-sm bg-gray-100">
                                        <Image
                                            src={s3UrlToProxy(work.url) ?? work.url}
                                            alt={s?.name ?? 'Œuvre majeure'}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                )
                                const meta = (
                                    <div className="mt-4">
                                        {s && s.tags.length > 0 && (
                                            <p className="text-xs uppercase tracking-widest text-gray-400">
                                                {s.tags[0]}
                                            </p>
                                        )}
                                        <h3 className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-gray-600">
                                            {s?.name ?? 'Œuvre majeure'}
                                        </h3>
                                        {s?.description && (
                                            <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                                                {s.description}
                                            </p>
                                        )}
                                        {s && (
                                            <p className="mt-0.5 text-xs text-gray-400">
                                                {s._count.photos} photo{s._count.photos > 1 ? 's' : ''}
                                                {formatShootDate(s.shootDate, s.shootDateLabel) && (
                                                    <> · {formatShootDate(s.shootDate, s.shootDateLabel)}</>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )
                                return href ? (
                                    <Link key={work.id} href={href} className="group">
                                        {image}
                                        {meta}
                                    </Link>
                                ) : (
                                    <div key={work.id} className="group">
                                        {image}
                                        {meta}
                                    </div>
                                )
                            })}
                        </div>
                    ) : series.length === 0 ? (
                        <p className="py-20 text-center text-sm text-gray-400">
                            Aucune œuvre publique pour le moment.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {series.map((s) => (
                                <Link
                                    key={s.id}
                                    href={`/galeries/${s.slug}`}
                                    className="group"
                                >
                                    {/* Image carrée */}
                                    <div className="relative aspect-square overflow-hidden rounded-sm bg-gray-100">
                                        {s.coverUrl ? (
                                            <Image
                                                src={s3UrlToProxy(s.coverUrl) ?? s.coverUrl}
                                                alt={s.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <span className="text-sm text-gray-300">Pas de couverture</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Métadonnées */}
                                    <div className="mt-4">
                                        {s.tags.length > 0 && (
                                            <p className="text-xs uppercase tracking-widest text-gray-400">
                                                {s.tags[0]}
                                            </p>
                                        )}
                                        <h3 className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-gray-600">
                                            {s.name}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-gray-400">
                                            {s._count.photos} photo{s._count.photos > 1 ? 's' : ''}
                                            {formatShootDate(s.shootDate, s.shootDateLabel) && (
                                                <> · {formatShootDate(s.shootDate, s.shootDateLabel)}</>
                                            )}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Bouton fin de section */}
                    <div className="mt-16 text-center">
                        <Link
                            href="/archives"
                            className="inline-block border border-gray-300 px-10 py-3.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
                        >
                            Voir le portfolio complet
                        </Link>
                    </div>
                </section>
            </main>

            <Footer name={name} />
        </div>
    )
}
