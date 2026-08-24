import { cookies } from 'next/headers'
import { getHomepage, getSeries } from './actions'
import { AccueilDashboard } from './accueil-dashboard'

export default async function AccueilPage() {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.get('config-auth')?.value === 'authenticated'

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    Vous devez être connecté.{' '}
                    <a href="/config" className="font-medium text-indigo-600">
                        Se connecter
                    </a>
                </p>
            </div>
        )
    }

    const [homepage, series] = await Promise.all([getHomepage(), getSeries()])

    // Normalise les champs pour la sérialisation RSC
    const normalized = {
        id: homepage.id,
        heroImageUrl: homepage.heroImageUrl ?? null,
        heroImageKey: homepage.heroImageKey ?? null,
        heroText: homepage.heroText ?? '',
        presentation: homepage.presentation ?? '',
        manifestoTitle: homepage.manifestoTitle ?? 'La Démarche',
        featuredWorks: (homepage.featuredWorks ?? []).map((w) => ({
            id: w.id,
            url: w.url ?? '',
            key: w.key ?? '',
            order: w.order ?? 0,
            seriesId: w.seriesId ?? null,
            series: w.series
                ? {
                      id: w.series.id,
                      name: w.series.name,
                      slug: w.series.slug,
                      coverUrl: w.series.coverUrl ?? null,
                  }
                : null,
        })),
    }

    const normalizedSeries = series.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        coverUrl: s.coverUrl ?? null,
    }))

    return <AccueilDashboard homepage={normalized} series={normalizedSeries} />
}