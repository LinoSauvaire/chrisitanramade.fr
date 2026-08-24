'use client'

import Link from 'next/link'
import {
    LayoutGrid,
    Ticket as TicketIcon,
    User,
    Home as HomeIcon,
    LogOut,
    BookOpen,
} from 'lucide-react'
import { logout } from './actions'
import { PresentationSection } from './sections/presentation-section'
import { TimelineSection } from './sections/timeline-section'

type TimelineItem = {
    id: string
    title: string
    year: string
    description: string | null
    location: string | null
    order: number
}

type Profile = {
    id: string
    name: string
    tagline: string
    bio: string
    avatarUrl: string | null
    timeline: TimelineItem[]
}

const navItems = [
    { label: 'Galeries', icon: LayoutGrid, href: '/config', active: false },
    { label: 'Tickets', icon: TicketIcon, href: '/ticket', active: false },
    { label: 'Profil', icon: User, href: '/profil', active: true },
    { label: 'Livres', icon: BookOpen, href: '/config/livres', active: false },
    { label: 'Accueil', icon: HomeIcon, href: '/config/accueil', active: false },
]

export function ProfileDashboard({ profile }: { profile: Profile }) {
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
            <div className="flex-1 ml-60 mr-72">
                <main className="max-w-3xl p-10">
                    <h1 className="mb-8 text-2xl font-bold text-gray-900">
                        Profil
                    </h1>

                    <div className="space-y-10">
                        <PresentationSection
                            profileId={profile.id}
                            name={profile.name}
                            tagline={profile.tagline}
                            bio={profile.bio}
                            avatarUrl={profile.avatarUrl}
                        />

                        <TimelineSection items={profile.timeline} />
                    </div>
                </main>
            </div>

            {/* ─────────────────────────── Panneau flottant droite ─────────────────────────── */}
            <aside className="fixed inset-y-0 right-0 flex w-72 items-start justify-center border-l border-gray-100 bg-transparent p-6 pt-10">
                <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-gray-900">
                        Information profile
                    </h3>
                    <p className="mb-5 text-xs leading-relaxed text-gray-400">
                        Vos informations de profil sont visibles publiquement sur la page d'accueil et les galeries.
                    </p>
                    <button
                        type="submit"
                        form="profile-form"
                        className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        Mettre à jour
                    </button>
                </div>
            </aside>
        </div>
    )
}
