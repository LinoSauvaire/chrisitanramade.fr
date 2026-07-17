import { cookies } from 'next/headers'
import { getTickets } from './actions'
import { TicketDashboard } from './ticket-dashboard'

export default async function TicketPage() {
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

    const tickets = await getTickets()

    return <TicketDashboard tickets={tickets} />
}
