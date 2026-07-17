import { cookies } from 'next/headers'
import { getProfile } from './actions'
import { ProfileDashboard } from './profile-dashboard'

export default async function ProfilPage() {
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

    // Normalise les champs pour la sérialisation RSC
    const normalizedProfile = {
        ...profile,
        name: profile.name ?? '',
        bio: profile.bio ?? '',
        avatarUrl: profile.avatarUrl ?? null,
        timeline: (profile.timeline ?? []).map((t) => ({
            ...t,
            title: t.title ?? '',
            year: t.year ?? '',
            description: t.description ?? null,
        })),
        books: (profile.books ?? []).map((b) => ({
            ...b,
            title: b.title ?? '',
            publisher: b.publisher ?? null,
            year: b.year ?? null,
            description: b.description ?? null,
            coverUrl: b.coverUrl ?? null,
            coverKey: b.coverKey ?? null,
        })),
    }

    return <ProfileDashboard profile={normalizedProfile} />
}
