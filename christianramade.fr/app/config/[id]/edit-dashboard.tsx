'use client'

import Link from 'next/link'
import {
    LayoutGrid,
    Ticket,
    User,
    Home as HomeIcon,
    ChevronRight,
    LogOut,
    BookOpen,
} from 'lucide-react'
import { logout } from '../actions'
import { PhotoGrid } from './photo-grid'
import { SettingsPanel } from './settings-panel'

type Photo = {
    id: string
    url: string
    key: string
    caption: string | null
    year: string | null
    order: number
    seriesId: string
}

type Series = {
    id: string
    name: string
    slug: string
    coverUrl: string | null
    description: string | null
    shootDate: Date | null
    shootDateLabel: string | null
    referenceUrl: string | null
    linkedTicketId: string | null
    visibility: string
    tags: string[]
    order: number
    createdAt: Date
    updatedAt: Date
    photos: Photo[]
}

type TicketOption = {
    id: string
    title: string
}

const navItems = [
    { label: 'Galeries', icon: LayoutGrid, href: '/config', active: true },
    { label: 'Tickets', icon: Ticket, href: '/ticket', active: false },
    { label: 'Profil', icon: User, href: '/profil', active: false },
    { label: 'Livres', icon: BookOpen, href: '/config/livres', active: false },
    { label: 'Accueil', icon: HomeIcon, href: '/config/accueil', active: false },
]

export function EditSeriesDashboard({ series, tickets }: { series: Series; tickets: TicketOption[] }) {
    return (
        <div className="flex min-h-screen bg-[#FAFAFB]">
            {/* ─────────────────────────── Sidebar gauche ─────────────────────────── */}
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

            {/* ─────────────────────────── Contenu central ─────────────────────────── */}
            <div className="flex-1 ml-60 mr-80">
                <main className="p-10">
                    {/* Fil d'ariane + titre */}
                    <div className="mb-8">
                        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                            <Link href="/config" className="hover:text-gray-600">
                                Mes galeries
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span className="text-gray-700">{series.name}</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Éditer la Série : {series.name}
                        </h1>
                    </div>

                    {/* Grid de photos */}
                    <PhotoGrid seriesId={series.id} photos={series.photos} />
                </main>
            </div>

            {/* ─────────────────────────── Panel droite ─────────────────────────── */}
            <SettingsPanel series={series} tickets={tickets} />
        </div>
    )
}
