import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTicketById } from '../actions'
import { TicketEditor } from './ticket-editor'

export default async function EditTicketPage({
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

    const ticket = await getTicketById(id)

    if (!ticket) {
        notFound()
    }

    // Normalise les champs pour éviter les undefined après sérialisation RSC
    const normalizedTicket = {
        ...ticket,
        title: ticket.title ?? '',
        content: ticket.content ?? '',
        excerpt: ticket.excerpt ?? null,
        coverUrl: ticket.coverUrl ?? null,
        coverKey: ticket.coverKey ?? null,
        status: ticket.status ?? 'draft',
        tags: ticket.tags ?? [],
    }

    return <TicketEditor ticket={normalizedTicket} />
}
