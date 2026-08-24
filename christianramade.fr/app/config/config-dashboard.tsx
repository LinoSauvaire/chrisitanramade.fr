'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    LayoutGrid,
    Ticket,
    User,
    Home as HomeIcon,
    Plus,
    Search,
    MoreHorizontal,
    ImageIcon,
    GripVertical,
    Check,
    Pencil,
    LogOut,
    Loader2,
    Trash2,
    BookOpen,
} from 'lucide-react'
import { logout, deleteSeries, reorderSeries } from './actions'
import { CreateSeriesForm } from './create-series-form'
import { ConfirmDialog } from '@/app/_components/confirm-dialog'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

type SeriesItem = {
    id: string
    name: string
    slug: string
    coverUrl: string | null
    order: number
    createdAt: Date
    updatedAt: Date
    _count: { photos: number }
}

const navItems = [
    { label: 'Galeries', icon: LayoutGrid, href: '/config', active: true },
    { label: 'Tickets', icon: Ticket, href: '/ticket', active: false },
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

export function ConfigDashboard({ series }: { series: SeriesItem[] }) {
    const [search, setSearch] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [localSeries, setLocalSeries] = useState<SeriesItem[]>(series)
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<SeriesItem | null>(null)

    const filteredSeries = localSeries.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
    )

    const orderChanged = localSeries.some((s, i) => s.id !== series[i]?.id)

    function handleDragStart(e: React.DragEvent, seriesId: string) {
        setDraggedId(seriesId)
        e.dataTransfer.effectAllowed = 'move'
    }

    function handleDragOver(e: React.DragEvent, seriesId: string) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (seriesId !== draggedId) {
            setDragOverId(seriesId)
        }
    }

    function handleDragLeave() {
        setDragOverId(null)
    }

    function handleDrop(e: React.DragEvent, targetId: string) {
        e.preventDefault()
        if (!draggedId || draggedId === targetId) {
            setDraggedId(null)
            setDragOverId(null)
            return
        }

        setLocalSeries((prev) => {
            const draggedIndex = prev.findIndex((s) => s.id === draggedId)
            const targetIndex = prev.findIndex((s) => s.id === targetId)
            if (draggedIndex === -1 || targetIndex === -1) return prev

            const updated = [...prev]
            const [moved] = updated.splice(draggedIndex, 1)
            updated.splice(targetIndex, 0, moved)
            return updated
        })

        setDraggedId(null)
        setDragOverId(null)
    }

    function handleDragEnd() {
        setDraggedId(null)
        setDragOverId(null)
    }

    function handleDelete() {
        if (!deleteTarget) return
        startTransition(async () => {
            const res = await deleteSeries(deleteTarget.id)
            if (!res.error) {
                setLocalSeries((prev) => prev.filter((s) => s.id !== deleteTarget.id))
            }
            setDeleteTarget(null)
        })
    }

    function handleSaveOrder() {
        const orderedIds = localSeries.map((s) => s.id)
        startTransition(async () => {
            await reorderSeries(orderedIds)
        })
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* ─────────────────────────── Sidebar ─────────────────────────── */}
            <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-[#F8F9FC] border-r border-gray-100">
                {/* Profil */}
                <div className="flex items-center gap-3 px-6 py-6">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200" />
                    <span className="text-sm font-semibold text-[#1A1D1F]">
                        Christian
                    </span>
                </div>

                {/* Navigation */}
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

                {/* Déconnexion */}
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
                                Mes series
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérer et organiser vos collections
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 rounded-xl bg-[#1F2937] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                            <Plus className="h-4 w-4" />
                            Créer une série
                        </button>
                    </div>

                    {/* Barre de recherche */}
                    <div className="relative mb-8 max-w-md">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher series de photo..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>

                    {/* Grille de cartes */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredSeries.map((series) => (
                            <div
                                key={series.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, series.id)}
                                onDragOver={(e) => handleDragOver(e, series.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, series.id)}
                                onDragEnd={handleDragEnd}
                                className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                                    draggedId === series.id
                                        ? 'opacity-40 ring-2 ring-indigo-400'
                                        : dragOverId === series.id
                                          ? 'ring-2 ring-indigo-300 border-indigo-200'
                                          : 'border-gray-100 hover:shadow-sm'
                                }`}
                            >
                                {/* Image de couverture */}
                                <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200">
                                    {series.coverUrl ? (
                                        <Image
                                            src={s3UrlToProxy(series.coverUrl) ?? series.coverUrl}
                                            alt={series.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageIcon className="h-10 w-10 text-gray-300" />
                                        </div>
                                    )}
                                    {/* Trois points en haut à droite */}
                                    <div className="absolute right-3 top-3">
                                        <button
                                            onClick={() =>
                                                setOpenMenuId(openMenuId === series.id ? null : series.id)
                                            }
                                            className="flex items-center gap-0.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm"
                                        >
                                            <MoreHorizontal className="h-4 w-4 text-white" />
                                        </button>
                                        {openMenuId === series.id && (
                                            <div className="absolute right-0 top-9 z-20 min-w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                                                <button
                                                    onClick={() => {
                                                        setOpenMenuId(null)
                                                        setDeleteTarget(series)
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Supprimer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Métadonnées */}
                                <div className="px-4 pt-4 pb-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {series.name}
                                    </h3>
                                    <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            {series._count.photos} Photos
                                        </span>
                                        <span>
                                            Modifié le {formatDate(series.updatedAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 px-4 pb-4">
                                    <Link
                                        href={`/config/${series.id}`}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#F3F4F6] py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Modifier
                                    </Link>
                                    <button
                                        className="flex w-11 shrink-0 cursor-grab items-center justify-center rounded-lg bg-[#F3F4F6] text-gray-700 transition-colors hover:bg-gray-200 active:cursor-grabbing"
                                        title="Glisser pour réordonner"
                                    >
                                        <GripVertical className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* ─────────────────────────── Toast flottant ─────────────────────────── */}
            {orderChanged && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-4 rounded-full border border-gray-200 bg-white py-2.5 pl-5 pr-2.5 shadow-lg">
                        <span className="text-sm font-medium text-gray-900">
                            Ordre modifié
                        </span>
                        <button
                            onClick={handleSaveOrder}
                            disabled={isPending}
                            className="flex items-center gap-2 rounded-full bg-[#1F2937] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Check className="h-3.5 w-3.5" />
                            )}
                            Enregistrer l'ordre
                        </button>
                    </div>
                </div>
            )}

            {/* ─────────────────────────── Modal création série ─────────────────────────── */}
            {showCreateForm && (
                <CreateSeriesForm onClose={() => setShowCreateForm(false)} />
            )}

            {/* ─────────────────────────── Confirmation de suppression ─────────────────────────── */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Supprimer cette série ?"
                message={`La série « ${deleteTarget?.name} » et toutes ses photos seront définitivement supprimées.`}
                isPending={isPending}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
