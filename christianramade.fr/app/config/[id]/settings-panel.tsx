'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { Upload, Loader2, X, Check } from 'lucide-react'
import { updateSeries } from '../actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

type Series = {
    id: string
    name: string
    slug: string
    coverUrl: string | null
    description: string | null
    shootDate: Date | null
    visibility: string
    tags: string[]
    order: number
    createdAt: Date
    updatedAt: Date
}

function toDateInput(date: Date | null): string {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function SettingsPanel({ series }: { series: Series }) {
    const [state, formAction, isPending] = useActionState(updateSeries, undefined)
    const [coverPreview, setCoverPreview] = useState<string | null>(
        s3UrlToProxy(series.coverUrl),
    )
    const [tags, setTags] = useState<string[]>(series.tags ?? [])
    const [tagInput, setTagInput] = useState('')
    const [saved, setSaved] = useState(false)

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setCoverPreview(URL.createObjectURL(file))
        }
    }

    function addTag() {
        const trimmed = tagInput.trim()
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed])
            setTagInput('')
        }
    }

    function removeTag(tag: string) {
        setTags(tags.filter((t) => t !== tag))
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
        }
    }

    return (
        <aside className="fixed inset-y-0 right-0 w-80 overflow-y-auto border-l border-gray-100 bg-white">
            <div className="p-6">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">
                    Paramètres de la Série
                </h2>

                <form
                    action={(formData) => {
                        // Injecte les tags comme champ caché
                        formData.set('tags', tags.join(','))
                        setSaved(false)
                        formAction(formData)
                    }}
                    className="space-y-5"
                >
                    <input type="hidden" name="id" value={series.id} />

                    {/* Image de couverture */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Image de Couverture
                        </label>
                        <label className="relative flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50">
                            {coverPreview ? (
                                <Image
                                    src={coverPreview}
                                    alt="Couverture"
                                    fill
                                    className="object-cover"
                                    sizes="320px"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="h-6 w-6 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                        Cliquez pour sélectionner
                                    </span>
                                </div>
                            )}
                            <input
                                name="cover"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCoverChange}
                            />
                        </label>
                    </div>

                    {/* Titre */}
                    <div>
                        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Titre de la Série
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            defaultValue={series.name}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Description / Histoire
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            defaultValue={series.description ?? ''}
                            placeholder="Décrivez la série…"
                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    {/* Date de réalisation */}
                    <div>
                        <label htmlFor="shootDate" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Date de Réalisation
                        </label>
                        <input
                            id="shootDate"
                            name="shootDate"
                            type="date"
                            defaultValue={toDateInput(series.shootDate)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    {/* Visibilité */}
                    <div>
                        <label htmlFor="visibility" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Visibilité
                        </label>
                        <select
                            id="visibility"
                            name="visibility"
                            defaultValue={series.visibility}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="public">Publique</option>
                            <option value="private">Privée</option>
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-white p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-indigo-900"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Ajouter un tag…"
                                className="flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <p className="text-sm text-red-500">{state.error}</p>
                    )}

                    {/* Bouton Enregistrer */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                            <Check className="h-4 w-4" />
                        ) : null}
                        {isPending ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
                    </button>
                </form>
            </div>
        </aside>
    )
}
