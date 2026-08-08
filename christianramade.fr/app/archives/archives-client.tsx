'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import { formatShootDate } from '@/app/_lib/format-shoot-date'

type SeriesItem = {
    id: string
    name: string
    slug: string
    coverUrl: string | null
    description: string | null
    shootDate: Date | null
    shootDateLabel: string | null
    visibility: string
    tags: string[]
    order: number
    createdAt: Date
    updatedAt: Date
    _count: { photos: number }
}

export function ArchivesClient({ series }: { series: SeriesItem[] }) {
    const [search, setSearch] = useState('')
    const [activeFilter, setActiveFilter] = useState('Tous les travaux')

    // Récupère 1 tag par série (max 3 séries)
    const filters = useMemo(() => {
        const selectedTags: string[] = []
        for (const s of series) {
            const tag = s.tags[0]
            if (tag && !selectedTags.includes(tag)) {
                selectedTags.push(tag)
            }
            if (selectedTags.length >= 3) break
        }
        return ['Tous les travaux', ...selectedTags]
    }, [series])

    const filtered = useMemo(() => {
        return series.filter((s) => {
            const matchesSearch =
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                (s.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (formatShootDate(s.shootDate, s.shootDateLabel) ?? '')
                    .toLowerCase()
                    .includes(search.toLowerCase())

            const tagMatch = s.tags.some((t) =>
                t.toLowerCase().includes(activeFilter.toLowerCase()),
            )
            const filterMatch =
                activeFilter === 'Tous les travaux' || tagMatch

            return matchesSearch && filterMatch
        })
    }, [series, search, activeFilter])

    return (
        <>
            {/* Recherche */}
            <div className="mx-auto max-w-6xl px-6 lg:px-12">
                <div className="relative mx-auto max-w-xl">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par séries, lieux ou années..."
                        className="w-full border-b border-gray-200 bg-transparent py-3 pl-0 pr-10 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                    />
                    <Search className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                </div>

                {/* Filtres */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                                activeFilter === filter
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grille */}
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-12">
                {filtered.length === 0 ? (
                    <p className="py-20 text-center text-sm text-gray-400">
                        Aucune série ne correspond à votre recherche.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((s) => (
                            <Link key={s.id} href={`/galeries/${s.slug}`} className="group">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-gray-100">
                                    {s.coverUrl ? (
                                        <Image
                                            src={s3UrlToProxy(s.coverUrl) ?? s.coverUrl}
                                            alt={s.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <span className="text-sm text-gray-300">Pas de couverture</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-gray-600">
                                    {s.name}
                                </h3>
                                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                                    <span className="uppercase tracking-wider">
                                        {s.tags[0] ?? 'Photographie'}
                                    </span>
                                    <span>
                                        {formatShootDate(s.shootDate, s.shootDateLabel) ?? ''}
                                    </span>
                                </div>
                                
                            </Link>
                        ))}
                    </div>
                )}

                {/* Bouton pagination */}
                <div className="mt-16 text-center">
                    <button className="inline-block border border-gray-300 px-10 py-3.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white">
                        Charger plus de travaux
                    </button>
                </div>
            </div>
        </>
    )
}
