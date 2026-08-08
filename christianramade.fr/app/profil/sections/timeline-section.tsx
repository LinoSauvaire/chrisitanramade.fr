'use client'

import { useActionState, useState, useTransition } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { addTimelineItem, deleteTimelineItem } from '../actions'
import { ConfirmDialog } from '@/app/_components/confirm-dialog'

type TimelineItem = {
    id: string
    title: string
    year: string
    description: string | null
    location: string | null
    order: number
}

export function TimelineSection({ items }: { items: TimelineItem[] }) {
    const [state, formAction, isPending] = useActionState(addTimelineItem, undefined)
    const [showForm, setShowForm] = useState(false)
    const [isDeleting, startTransition] = useTransition()
    const [deleteTarget, setDeleteTarget] = useState<TimelineItem | null>(null)

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteTimelineItem(id)
            setDeleteTarget(null)
        })
    }

    return (
        <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Mon Parcours
            </h2>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="relative">
                    {/* Ligne verticale */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-indigo-100" />

                    <div className="space-y-6">
                        {items.map((item, index) => (
                            <div key={item.id} className="relative flex gap-4 pl-6">
                                {/* Nœud */}
                                <div
                                    className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                                        index === 0
                                            ? 'bg-indigo-600 ring-4 ring-indigo-100'
                                            : 'bg-gray-300'
                                    }`}
                                />

                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                {item.title}
                                            </h3>
                                            <span className="text-xs font-medium text-indigo-600">
                                                {item.year}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setDeleteTarget(item)}
                                            disabled={isDeleting}
                                            className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {item.description && (
                                        <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bouton Ajouter / Formulaire */}
                {showForm ? (
                    <form
                        action={formAction}
                        className="mt-6 ml-6 rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    name="title"
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Titre"
                                    className="col-span-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                                <input
                                    name="year"
                                    type="text"
                                    placeholder="Année"
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                            <textarea
                                name="description"
                                rows={2}
                                placeholder="Description (optionnel)"
                                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <input
                                name="location"
                                type="text"
                                placeholder="Lieu (ex: Galerie Focale, Nyon)"
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            {state?.error && (
                                <p className="text-sm text-red-500">{state.error}</p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-600"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-6 ml-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter
                    </button>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Supprimer cet élément ?"
                message={
                    deleteTarget
                        ? `« ${deleteTarget.title} » sera définitivement supprimé du parcours. Cette action est irréversible.`
                        : ''
                }
                isPending={isDeleting}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
            />
        </section>
    )
}
