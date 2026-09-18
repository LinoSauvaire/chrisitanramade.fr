'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

type Book = {
    id: string
    title: string
    publisher: string | null
    year: string | null
    description: string | null
    coverUrl: string | null
}

export function BooksGrid({ books }: { books: Book[] }) {
    const [currentIndex, setCurrentIndex] = useState<number | null>(null)

    const close = useCallback(() => setCurrentIndex(null), [])
    const prev = useCallback(
        () => setCurrentIndex((i) => (i === null ? null : (i - 1 + books.length) % books.length)),
        [books.length],
    )
    const next = useCallback(
        () => setCurrentIndex((i) => (i === null ? null : (i + 1) % books.length)),
        [books.length],
    )

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') close()
            if (e.key === 'ArrowLeft') prev()
            if (e.key === 'ArrowRight') next()
        },
        [close, prev, next],
    )

    useEffect(() => {
        if (currentIndex === null) return
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [currentIndex, handleKeyDown])

    const currentBook = currentIndex !== null ? books[currentIndex] : null

    return (
        <>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book, index) => (
                    <div key={book.id} className="group">
                        {/* Couverture */}
                        <button
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            className="relative block aspect-[3/4] w-full overflow-hidden rounded-sm bg-gray-100"
                        >
                            {book.coverUrl ? (
                                <Image
                                    src={s3UrlToProxy(book.coverUrl) ?? book.coverUrl}
                                    alt={book.title}
                                    fill
                                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-gray-100">
                                    <span className="text-sm text-gray-300">Pas de couverture</span>
                                </div>
                            )}
                        </button>

                        {/* Métadonnées */}
                        <div className="mt-4 flex items-baseline justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {book.title}
                            </h3>
                            <span className="text-xs text-gray-400">
                                {book.year}
                            </span>
                        </div>
                        {book.publisher && (
                            <p className="mt-0.5 text-xs text-gray-400">
                                {book.publisher}
                            </p>
                        )}
                        {book.description && (
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                {book.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* ─────────────────────────── Lightbox plein écran ─────────────────────────── */}
            {currentBook && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black"
                    onClick={close}
                >
                    {/* Bouton fermer */}
                    <button
                        onClick={close}
                        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
                        aria-label="Fermer"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Flèche gauche */}
                    {books.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); prev() }}
                            className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
                            aria-label="Livre précédent"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}

                    {/* Couverture */}
                    <div
                        className="relative h-full w-full max-h-[80vh] max-w-[80vw]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {currentBook.coverUrl ? (
                            <Image
                                src={s3UrlToProxy(currentBook.coverUrl) ?? currentBook.coverUrl}
                                alt={currentBook.title}
                                fill
                                className="object-contain"
                                sizes="80vw"
                                priority
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <span className="text-sm text-gray-500">Pas de couverture</span>
                            </div>
                        )}
                    </div>

                    {/* Flèche droite */}
                    {books.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); next() }}
                            className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
                            aria-label="Livre suivant"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}

                    {/* Titre + compteur */}
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
                        <div className="rounded-full bg-black/60 px-5 py-2 text-center">
                            <span className="text-sm text-white/90">{currentBook.title}</span>
                            {currentBook.year && (
                                <>
                                    <span className="mx-1.5 text-white/40">·</span>
                                    <span className="text-sm text-white/60">{currentBook.year}</span>
                                </>
                            )}
                        </div>
                        <div className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
                            {currentIndex! + 1} / {books.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}