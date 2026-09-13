'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    LayoutGrid,
    Ticket as TicketIcon,
    User,
    Home as HomeIcon,
    LogOut,
    Upload,
    Loader2,
    Trash2,
    X,
    BookOpen,
} from 'lucide-react'
import {
    logout,
    updateHero,
    deleteHeroImage,
    updatePresentation,
    addFeaturedSeries,
    deleteFeaturedWork,
} from './actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import { ConfirmDialog } from '@/app/_components/confirm-dialog'

type FeaturedWork = {
    id: string
    url: string
    key: string
    order: number
    seriesId: string | null
    series: {
        id: string
        name: string
        slug: string
        coverUrl: string | null
    } | null
}

type SeriesOption = {
    id: string
    name: string
    slug: string
    coverUrl: string | null
}

type Homepage = {
    id: string
    heroImageUrl: string | null
    heroImageKey: string | null
    heroText: string
    heroSubtitle: string
    presentation: string
    manifestoTitle: string
    featuredWorks: FeaturedWork[]
}

const MAX_FEATURED_WORKS = 6

const navItems = [
    { label: 'Galeries', icon: LayoutGrid, href: '/config', active: false },
    { label: 'Tickets', icon: TicketIcon, href: '/ticket', active: false },
    { label: 'Profil', icon: User, href: '/profil', active: false },
    { label: 'Livres', icon: BookOpen, href: '/config/livres', active: false },
    { label: 'Accueil', icon: HomeIcon, href: '/config/accueil', active: true },
]

export function AccueilDashboard({
    homepage,
    series,
}: {
    homepage: Homepage
    series: SeriesOption[]
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // ── Photo principale ──
    const [heroText, setHeroText] = useState(homepage.heroText)
    const [heroSubtitle, setHeroSubtitle] = useState(homepage.heroSubtitle)
    const [heroPreview, setHeroPreview] = useState<string | null>(
        s3UrlToProxy(homepage.heroImageUrl),
    )
    const [heroError, setHeroError] = useState<string | null>(null)
    const [heroSaving, setHeroSaving] = useState(false)
    const [heroImageChanged, setHeroImageChanged] = useState(false)
    const heroTextChanged = heroText !== homepage.heroText
    const heroSubtitleChanged = heroSubtitle !== homepage.heroSubtitle

    // ── Présentation ──
    const [presentation, setPresentation] = useState(homepage.presentation)
    const [manifestoTitle, setManifestoTitle] = useState(homepage.manifestoTitle)
    const [presentationError, setPresentationError] = useState<string | null>(null)
    const [presentationSaving, setPresentationSaving] = useState(false)
    const presentationChanged =
        presentation !== homepage.presentation || manifestoTitle !== homepage.manifestoTitle

    // ── Œuvres majeures ──
    const [localWorks, setLocalWorks] = useState<FeaturedWork[]>(homepage.featuredWorks)
    const [worksError, setWorksError] = useState<string | null>(null)
    const [worksSaving, setWorksSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<FeaturedWork | null>(null)
    const [selectedSeriesId, setSelectedSeriesId] = useState('')

    useEffect(() => {
        setLocalWorks(homepage.featuredWorks)
    }, [homepage.featuredWorks])

    // Galeries déjà ajoutées (pour filtrer le sélecteur)
    const addedSeriesIds = new Set(
        localWorks.map((w) => w.seriesId).filter(Boolean) as string[],
    )
    const availableSeries = series.filter((s) => !addedSeriesIds.has(s.id))

    // ── Photo principale : upload ──
    function handleHeroChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setHeroPreview(URL.createObjectURL(file))
            setHeroImageChanged(true)
        }
    }

    function handleHeroSave() {
        setHeroSaving(true)
        setHeroError(null)
        const formData = new FormData()
        formData.set('heroText', heroText)
        formData.set('heroSubtitle', heroSubtitle)
        const fileInput = document.getElementById('hero-image-input') as HTMLInputElement | null
        const file = fileInput?.files?.[0]
        if (file) formData.set('heroImage', file)

        startTransition(async () => {
            try {
                const result = await updateHero(undefined, formData)
                if (result?.error) setHeroError(result.error)
                else setHeroError(null)
                router.refresh()
            } catch {
                setHeroError('Erreur lors de la sauvegarde.')
            } finally {
                setHeroSaving(false)
            }
        })
    }

    function handleHeroCancel() {
        setHeroText(homepage.heroText)
        setHeroSubtitle(homepage.heroSubtitle)
        setHeroPreview(s3UrlToProxy(homepage.heroImageUrl))
        setHeroImageChanged(false)
        setHeroError(null)
        const input = document.querySelector('#hero-image-input') as HTMLInputElement | null
        if (input) input.value = ''
    }

    function handleHeroDelete() {
        startTransition(async () => {
            await deleteHeroImage()
            setHeroPreview(null)
            setHeroImageChanged(false)
            router.refresh()
        })
    }

    // ── Présentation : save / cancel ──
    function handlePresentationSave() {
        setPresentationSaving(true)
        setPresentationError(null)
        const formData = new FormData()
        formData.set('presentation', presentation)
        formData.set('manifestoTitle', manifestoTitle)

        startTransition(async () => {
            try {
                const result = await updatePresentation(undefined, formData)
                if (result?.error) setPresentationError(result.error)
                else setPresentationError(null)
                router.refresh()
            } catch {
                setPresentationError('Erreur lors de la sauvegarde.')
            } finally {
                setPresentationSaving(false)
            }
        })
    }

    function handlePresentationCancel() {
        setPresentation(homepage.presentation)
        setManifestoTitle(homepage.manifestoTitle)
        setPresentationError(null)
    }

    // ── Œuvres majeures : ajout d'une galerie existante ──
    function handleAddSeries() {
        if (!selectedSeriesId) return
        setWorksSaving(true)
        setWorksError(null)
        const formData = new FormData()
        formData.set('seriesId', selectedSeriesId)

        startTransition(async () => {
            try {
                const result = await addFeaturedSeries(undefined, formData)
                if (result?.error) setWorksError(result.error)
                else {
                    setWorksError(null)
                    setSelectedSeriesId('')
                }
                router.refresh()
            } catch {
                setWorksError('Erreur lors de l\'ajout de la galerie.')
            } finally {
                setWorksSaving(false)
            }
        })
    }

    function handleWorksDelete(id: string) {
        setWorksSaving(true)
        startTransition(async () => {
            await deleteFeaturedWork(id)
            setLocalWorks((prev) => prev.filter((w) => w.id !== id))
            setDeleteTarget(null)
            setWorksSaving(false)
            router.refresh()
        })
    }

    const worksCount = localWorks.length
    const worksFull = worksCount >= MAX_FEATURED_WORKS
    const heroChanged = heroTextChanged || heroSubtitleChanged || heroImageChanged

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
                        Accueil
                    </h1>

                    <div className="space-y-10">
                        {/* ── Photo principale ── */}
                        <section>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                Photo principale
                            </h2>

                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                {/* Zone d'upload */}
                                <label
                                    className="relative flex aspect-[16/10] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
                                >
                                    {heroPreview ? (
                                        <Image
                                            src={heroPreview}
                                            alt="Photo principale"
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 640px"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                Ajouter des photos
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        id="hero-image-input"
                                        name="heroImage"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleHeroChange}
                                    />
                                </label>

                                {/* Texte associé + actions inline */}
                                <div className="mt-4">
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Texte associé
                                    </label>
                                    <input
                                        type="text"
                                        value={heroText}
                                        onChange={(e) => setHeroText(e.target.value)}
                                        placeholder="Ex: Capturer les moments de calme"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Sous-titre (texte sous le titre)
                                    </label>
                                    <textarea
                                        value={heroSubtitle}
                                        onChange={(e) => setHeroSubtitle(e.target.value)}
                                        rows={3}
                                        placeholder="Ex: Une approche photographique explorant la relation entre la lumière, l'espace et l'expérience humaine…"
                                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                {heroError && (
                                    <p className="mt-2 text-sm text-red-500">{heroError}</p>
                                )}

                                <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-50 pt-4">
                                    {heroPreview && (
                                        <button
                                            type="button"
                                            onClick={handleHeroDelete}
                                            disabled={isPending}
                                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Supprimer
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleHeroCancel}
                                        disabled={isPending}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleHeroSave}
                                        disabled={isPending || !heroChanged}
                                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 disabled:opacity-50"
                                    >
                                        {heroSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Save
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* ── Présentation ── */}
                        <section>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                Présentation
                            </h2>

                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Titre de la section (slogan)
                                </label>
                                <input
                                    type="text"
                                    value={manifestoTitle}
                                    onChange={(e) => setManifestoTitle(e.target.value)}
                                    placeholder="Ex : La Démarche"
                                    className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />

                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Texte de présentation
                                </label>
                                <textarea
                                    value={presentation}
                                    onChange={(e) => setPresentation(e.target.value)}
                                    rows={6}
                                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    placeholder="Décrivez votre démarche artistique…"
                                />

                                {presentationError && (
                                    <p className="mt-2 text-sm text-red-500">{presentationError}</p>
                                )}

                                <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-50 pt-4">
                                    <button
                                        type="button"
                                        onClick={handlePresentationCancel}
                                        disabled={isPending}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePresentationSave}
                                        disabled={isPending || !presentationChanged}
                                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 disabled:opacity-50"
                                    >
                                        {presentationSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Save
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* ── Œuvres majeures ── */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Œuvres majeures
                                </h2>
                                <span className="text-sm font-medium text-gray-400">
                                    {worksCount}/{MAX_FEATURED_WORKS}
                                </span>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                {worksError && (
                                    <p className="mb-4 text-sm text-red-500">{worksError}</p>
                                )}

                                {/* Grille des œuvres */}
                                {localWorks.length > 0 && (
                                    <div className="mb-5 grid grid-cols-3 gap-3">
                                        {localWorks.map((work) => (
                                            <div
                                                key={work.id}
                                                className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
                                            >
                                                <Image
                                                    src={s3UrlToProxy(work.url) ?? work.url}
                                                    alt={work.series?.name ?? 'Œuvre majeure'}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 33vw, 200px"
                                                />
                                                {work.series && (
                                                    <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                                                        {work.series.name}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(work)}
                                                    disabled={worksSaving}
                                                    className="absolute right-1.5 top-1.5 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Sélection d'une galerie existante */}
                                {!worksFull && availableSeries.length > 0 && (
                                    <div className="mb-4">
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Ajouter une galerie existante
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedSeriesId}
                                                onChange={(e) => setSelectedSeriesId(e.target.value)}
                                                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                            >
                                                <option value="">Choisir une galerie…</option>
                                                {availableSeries.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleAddSeries}
                                                disabled={!selectedSeriesId || worksSaving}
                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                Ajouter
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {worksFull && (
                                    <p className="py-4 text-center text-sm text-gray-400">
                                        Limite de {MAX_FEATURED_WORKS} œuvres majeures atteinte.
                                    </p>
                                )}
                            </div>
                        </section>
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
                        type="button"
                        onClick={() => router.push('/profil')}
                        className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        Mettre à jour
                    </button>
                </div>
            </aside>

            {/* ── Confirmation de suppression d'œuvre ── */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Supprimer cette œuvre ?"
                message="Cette action est irréversible. L'image sera supprimée du stockage et de la page d'accueil."
                isPending={worksSaving}
                onConfirm={() => deleteTarget && handleWorksDelete(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}