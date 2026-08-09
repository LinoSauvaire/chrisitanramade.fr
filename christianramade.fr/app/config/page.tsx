import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { PasswordForm } from './password-form'
import { ConfigDashboard } from './config-dashboard'
import { getSeries } from './actions'

export const metadata: Metadata = {
    title: 'Christian Ramade — Atelier',
}

export default async function ConfigPage() {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.get('config-auth')?.value === 'authenticated'
    const passwordConfigured = !!process.env.CONFIG_PASSWORD

    // Si le mot de passe n'est pas configuré sur le serveur
    if (!passwordConfigured) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
                <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Configuration</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Veuillez configurer <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">CONFIG_PASSWORD</code> dans le fichier <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">.env</code>.
                </p>
            </div>
        )
    }

    // Si l'utilisateur n'est pas authentifié, afficher le formulaire
    if (!isAuthenticated) {
        return <PasswordForm />
    }

    // Utilisateur authentifié : récupérer les séries et afficher le dashboard
    const series = await getSeries()

    return <ConfigDashboard series={series} />
}