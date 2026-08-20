'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    LayoutGrid,
    Ticket as TicketIcon,
    User,
    Home as HomeIcon,
    ChevronRight,
    LogOut,
} from 'lucide-react'
import { logout } from '../actions'
import { RichTextEditor } from './rich-text-editor'
import { TicketSettingsPanel } from './settings-panel'

type Ticket = {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string | null
    coverUrl: string | null
    coverKey: string | null
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
    { label: 'Accueil', icon: HomeIcon, href: '/config/accueil', active: false },
]

export function TicketEditor({ ticket }: { ticket: Ticket }) {
    const [title, setTitle] = useState(ticket.title)
    const [content, setContent] = useState(ticket.content)

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

            {/* ─────────────────────────── Éditeur central ─────────────────────────── */}
            <div className="flex-1 ml-60 mr-80">
                <main className="p-10">
                    {/* Fil d'ariane */}
                    <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-400">
                        <Link href="/ticket" className="hover:text-gray-600">
                            Mes tickets
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-gray-700">Articles</span>
                    </nav>

                    {/* Éditeur */}
                    <RichTextEditor
                        ticketId={ticket.id}
                        title={title}
                        content={content}
                        onTitleChange={setTitle}
                        onContentChange={setContent}
                    />
                </main>
            </div>

            {/* ─────────────────────────── Panel droite ─────────────────────────── */}
            <TicketSettingsPanel
                ticket={ticket}
                title={title}
                content={content}
            />
        </div>
    )
}
