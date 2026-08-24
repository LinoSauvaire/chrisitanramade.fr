import { cookies } from 'next/headers'
import { getProfile } from '@/app/profil/actions'
import { LivresDashboard } from './livres-dashboard'

export default async function LivresPage() {
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

    const profile = await getProfile()

    // Normalise les livres pour la sérialisation RSC
    const books = (profile.books ?? []).map((b) => ({
        id: b.id,
        title: b.title ?? '',
        publisher: b.publisher ?? null,
        year: b.year ?? null,
        description: b.description ?? null,
        coverUrl: b.coverUrl ?? null,
        coverKey: b.coverKey ?? null,
        order: b.order ?? 0,
    }))

    return <LivresDashboard books={books} />
}