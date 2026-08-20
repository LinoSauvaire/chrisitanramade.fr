import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSeriesById, getPublishedTickets } from '../actions'
import { EditSeriesDashboard } from './edit-dashboard'

export default async function EditSeriesPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

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

    const [rawSeries, tickets] = await Promise.all([
        getSeriesById(id),
        getPublishedTickets(),
    ])

    if (!rawSeries) {
        notFound()
    }

    // Normalise les champs pour éviter les undefined après sérialisation RSC
    const series = {
        ...rawSeries,
        tags: rawSeries.tags ?? [],
        description: rawSeries.description ?? null,
        coverUrl: rawSeries.coverUrl ?? null,
        shootDate: rawSeries.shootDate ?? null,
        shootDateLabel: rawSeries.shootDateLabel ?? null,
        referenceUrl: rawSeries.referenceUrl ?? null,
        linkedTicketId: rawSeries.linkedTicketId ?? null,
        visibility: rawSeries.visibility ?? 'private',
        photos: (rawSeries.photos ?? []).map((p) => ({
            ...p,
            url: p.url ?? '',
            key: p.key ?? '',
        })),
    }

    return <EditSeriesDashboard series={series} tickets={tickets} />
}
