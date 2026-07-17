'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { Upload, Loader2, X } from 'lucide-react'
import { updateTicket } from '../actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

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

export function TicketSettingsPanel({
    ticket,
    title,
    content,
}: {
    ticket: Ticket
    title: string
    content: string
}) {
    const [state, formAction, isPending] = useActionState(updateTicket, undefined)
    const [coverPreview, setCoverPreview] = useState<string | null>(
        s3UrlToProxy(ticket.coverUrl),
    )
    const [tags, setTags] = useState<string[]>(ticket.tags ?? [])
    const [tagInput, setTagInput] = useState('')

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
                    Paramètres de l'article
                </h2>

                <form
                    action={(formData) => {
                        // Injecte les valeurs live de l'éditeur
                        formData.set('title', title)
                        formData.set('content', content)
                        formData.set('tags', tags.join(','))
                        formAction(formData)
                    }}
                    className="space-y-5"
                >
                    <input type="hidden" name="id" value={ticket.id} />

                    {/* Statut */}
                    <div>
                        <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Statut
                        </label>
                        <select
                            id="status"
                            name="status"
                            defaultValue={ticket.status}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="draft">Brouillon</option>
                            <option value="published">Publié</option>
                        </select>
                    </div>

                    {/* Image de couverture */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Image de couverture
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
                                    <span className="text-center text-xs text-gray-500">
                                        Cliquez pour uploader<br />ou glissez une image ici
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

                    {/* Tags */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Ex: Technique, Exposition..."
                            className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <div className="flex flex-wrap gap-1.5">
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
                        </div>
                    </div>

                    {state?.error && (
                        <p className="text-sm text-red-500">{state.error}</p>
                    )}

                    {/* Boutons d'action */}
                    <div className="space-y-2.5 pt-2">
                        <button
                            type="submit"
                            name="status"
                            value="draft"
                            disabled={isPending}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Enregistrer le brouillon
                        </button>
                        <button
                            type="submit"
                            name="status"
                            value="published"
                            disabled={isPending}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Publier l'article
                        </button>
                    </div>
                </form>
            </div>
        </aside>
    )
}
