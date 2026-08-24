'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    LayoutGrid,
    Ticket as TicketIcon,
    User,
    Home as HomeIcon,
    Plus,
    Search,
    MoreHorizontal,
    ImageIcon,
    Layout as LayoutIcon,
    Check,
    Pencil,
    LogOut,
    BookOpen,
} from 'lucide-react'
import { createTicket, deleteTicket, logout } from './actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import { ConfirmDialog } from '@/app/_components/confirm-dialog'

type TicketItem = {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string | null
    coverUrl: string | null
    status: string
    tags: string[]
    order: number
    createdAt: Date
    updatedAt: Date
}

const navItems = [
    { label: 'Galeries', icon: LayoutGrid, href: '/config', active: false },
    { label: 'Tickets', icon: TicketIcon, href: '/ticket', active: true },
    { label: 'Profil', icon: User, href: '/profil', active: false },
    { label: 'Livres', icon: BookOpen, href: '/config/livres', active: false },
    { label: 'Accueil', icon: HomeIcon, href: '/config/accueil', active: false },
]

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date))
}

function statusLabel(status: string) {
    return status === 'published' ? 'Publié' : 'Brouillon'
}

function statusColor(status: string) {
    return status === 'published'
        ? 'bg-emerald-500/90'
        : 'bg-amber-500/90'
}

export function TicketDashboard({ tickets }: { tickets: TicketItem[] }) {
    const [search, setSearch] = useState('')
    const [orderModified, setOrderModified] = useState(false)
    const [isPending, startTransition] = useTransition()

    const filteredTickets = tickets.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()),
    )

    function handleCreate() {
        startTransition(async () => {
            await createTicket()
        })
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteTicket(id)
            setDeleteTarget(null)
        })
    }

    const [deleteTarget, setDeleteTarget] = useState<TicketItem | null>(null)

    return (
        <div className="flex min-h-screen bg-white">
            {/* ─────────────────────────── Sidebar ─────────────────────────── */}
            <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-[#F8F9FC] border-r border-gray-100">
                <div className="flex items-center gap-3 px-6 py-6">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200" />
                    <span className="text-sm font-semibold text-[#1A1D1F]">
                        Christian
                    </span>
                </div>

                <nav className="flex-1 px-3">
                    <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Menu
                    </p>
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            item.active
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                    >
                                        <Icon className="h-[18px] w-[18px]" />
                                        {item.label}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="px-3 pb-6">
                    <form action={logout}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                            <LogOut className="h-[18px] w-[18px]" />
                            Déconnexion
                        </button>
                    </form>
                </div>
            </aside>

            {/* ─────────────────────────── Main Content ─────────────────────────── */}
            <div className="flex-1 ml-60">
                <main className="p-10">
                    {/* En-tête */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Mes Tickets
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérer et organiser vos collections
                            </p>
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={isPending}
                            className="flex items-center gap-2 rounded-xl bg-[#1F2937] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Créer un ticket
                        </button>
                    </div>

                    {/* Barre de recherche */}
                    <div className="relative mb-8 max-w-md">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher séries de photo..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>

                    {/* Grille de cartes */}
                    {filteredTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <ImageIcon className="mb-4 h-12 w-12 text-gray-200" />
                            <p className="text-sm text-gray-400">
                                {search ? 'Aucun ticket trouvé.' : 'Aucun ticket pour le moment.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-sm"
                                >
                                    {/* Image de couverture */}
                                    <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200">
                                        {ticket.coverUrl ? (
                                            <Image
                                                src={s3UrlToProxy(ticket.coverUrl) ?? ticket.coverUrl}
                                                alt={ticket.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <ImageIcon className="h-10 w-10 text-gray-300" />
                                            </div>
                                        )}

                                        {/* Badge de statut */}
                                        <span className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm ${statusColor(ticket.status)}`}>
                                            {statusLabel(ticket.status)}
                                        </span>

                                        {/* Menu contextuel */}
                                        <button className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
                                            <MoreHorizontal className="h-4 w-4 text-white" />
                                        </button>
                                    </div>

                                    {/* Métadonnées */}
                                    <div className="px-4 pt-4 pb-3">
                                        <p className="text-xs text-gray-400">
                                            Modifié le {formatDate(ticket.updatedAt)}
                                        </p>
                                        <h3 className="mt-1 text-sm font-semibold text-gray-900">
                                            {ticket.title}
                                        </h3>
                                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                            {ticket.excerpt || ticket.content.slice(0, 100) || 'Aucun contenu pour le moment.'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 px-4 pb-4">
                                        <Link
                                            href={`/ticket/${ticket.id}`}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#F3F4F6] py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Modifier
                                        </Link>
                                        <button
                                            onClick={() => setDeleteTarget(ticket)}
                                            className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            <LayoutIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* ─────────────────────────── Toast flottant ─────────────────────────── */}
            {orderModified && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-4 rounded-full border border-gray-200 bg-white py-2.5 pl-5 pr-2.5 shadow-lg">
                        <span className="text-sm font-medium text-gray-900">
                            Ordre modifié
                        </span>
                        <button
                            onClick={() => setOrderModified(false)}
                            className="flex items-center gap-2 rounded-full bg-[#1F2937] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            <Check className="h-3.5 w-3.5" />
                            Enregistrer l'ordre
                        </button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                title="Supprimer ce ticket ?"
                message={
                    deleteTarget
                        ? `« ${deleteTarget.title} » sera définitivement supprimé. Cette action est irréversible.`
                        : ''
                }
                isPending={isPending}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
