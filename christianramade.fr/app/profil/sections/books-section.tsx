'use client'

import { useActionState, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, X, Upload, Loader2, BookOpen } from 'lucide-react'
import { addBook, deleteBook } from '../actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

type Book = {
    id: string
    title: string
    publisher: string | null
    year: string | null
    description: string | null
    coverUrl: string | null
    coverKey: string | null
    order: number
}

export function BooksSection({ books }: { books: Book[] }) {
    const [state, formAction, isPending] = useActionState(addBook, undefined)
    const [showModal, setShowModal] = useState(false)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [isDeleting, startTransition] = useTransition()

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setCoverPreview(URL.createObjectURL(file))
        }
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteBook(id)
        })
    }

    function handleClose() {
        setShowModal(false)
        setCoverPreview(null)
    }

    return (
        <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Livres Édités
            </h2>

            <div className="space-y-3">
                {books.map((book) => (
                    <div
                        key={book.id}
                        className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                        {/* Couverture */}
                        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {book.coverUrl ? (
                                <Image
                                    src={s3UrlToProxy(book.coverUrl) ?? book.coverUrl}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <BookOpen className="h-6 w-6 text-gray-300" />
                                </div>
                            )}
                        </div>

                        {/* Métadonnées */}
                        <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {book.title}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {book.publisher}
                                        {book.publisher && book.year ? ', ' : ''}
                                        {book.year}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(book.id)}
                                    disabled={isDeleting}
                                    className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {book.description && (
                                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                                    {book.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {/* Bouton Ajouter (dotted card) */}
                <button
                    onClick={() => setShowModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-transparent py-6 text-sm font-medium text-gray-400 transition-colors hover:border-indigo-300 hover:text-indigo-500"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un livre
                </button>
            </div>

            {/* ─────────────────────────── Modal d'ajout ─────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Ajouter un livre
                            </h3>
                            <button
                                onClick={handleClose}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={formAction} className="space-y-4">
                            {/* Couverture */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Couverture
                                </label>
                                <label className="relative flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50">
                                    {coverPreview ? (
                                        <Image
                                            src={coverPreview}
                                            alt="Couverture"
                                            fill
                                            className="object-cover"
                                            sizes="480px"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                Cliquez pour sélectionner une image
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
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Titre
                                </label>
                                <input
                                    name="title"
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ex: Terres de Sienne"
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            {/* Éditeur + Année */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Éditeur
                                    </label>
                                    <input
                                        name="publisher"
                                        type="text"
                                        placeholder="Ex: Éditions Loco"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Année
                                    </label>
                                    <input
                                        name="year"
                                        type="text"
                                        placeholder="Ex: 2024"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Court résumé du livre…"
                                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            {state?.error && (
                                <p className="text-sm text-red-500">{state.error}</p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isPending ? 'Ajout…' : 'Ajouter le livre'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
