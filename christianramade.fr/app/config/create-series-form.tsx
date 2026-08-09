'use client'

import { useActionState, useState, useEffect } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSeries } from './actions'

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

export function CreateSeriesForm({ onClose }: { onClose: () => void }) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createSeries, undefined)
    const [preview, setPreview] = useState<string | null>(null)

    // Ferme la modal et rafraîchit quand la création réussit
    useEffect(() => {
        if (!isPending && state && !state.error) {
            onClose()
            router.refresh()
        }
    }, [isPending, state, onClose, router])

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setPreview(URL.createObjectURL(file))
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Créer une série</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form action={formAction} className="space-y-4">
                    {/* Nom */}
                    <div>
                        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Nom de la série
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            autoFocus
                            placeholder="Ex : Mariage 2026"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    {/* Photo de couverture */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Photo de couverture (optionnel)
                        </label>
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Aperçu"
                                    className="max-h-40 rounded-lg object-cover"
                                />
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 text-gray-400" />
                                    <span className="text-sm text-gray-500">
                                        Cliquez pour sélectionner une image
                                    </span>
                                </>
                            )}
                            <input
                                name="cover"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {state?.error && (
                        <p className="text-sm text-red-500">{state.error}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 rounded-xl bg-[#1F2937] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isPending ? 'Création…' : 'Créer la série'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Type exporté pour réutilisation
export type { SeriesItem }
