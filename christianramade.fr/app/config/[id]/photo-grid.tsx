'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Layers, Loader2, Type } from 'lucide-react'
import { uploadPhotos, deletePhoto, setCoverPhoto } from '../actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

type Photo = {
    id: string
    url: string
    key: string
    order: number
    seriesId: string
}

export function PhotoGrid({
    seriesId,
    photos,
}: {
    seriesId: string
    photos: Photo[]
}) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return

        const formData = new FormData()
        formData.append('seriesId', seriesId)
        Array.from(files).forEach((file) => {
            formData.append('photos', file)
        })

        startTransition(async () => {
            const result = await uploadPhotos(undefined, formData)
            if (result?.error) setError(result.error)
            else setError(null)
        })

        // Reset pour permettre de re-sélectionner les mêmes fichiers
        e.target.value = ''
    }

    function handleDelete(photoId: string) {
        startTransition(async () => {
            await deletePhoto(photoId)
        })
    }

    function handleSetCover(photoId: string) {
        startTransition(async () => {
            await setCoverPhoto(photoId)
        })
    }

    return (
        <div>
            {error && (
                <p className="mb-4 text-sm text-red-500">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {/* Case "Ajouter des photos" */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                    ) : (
                        <>
                            <div className="flex items-center gap-1">
                                <Upload className="h-6 w-6 text-gray-400 group-hover:text-indigo-500" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600">
                                Ajouter des photos
                            </span>
                        </>
                    )}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                />

                {/* Photos existantes */}
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
                    >
                        <Image
                            src={s3UrlToProxy(photo.url) ?? photo.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />

                        {/* Contrôles au survol */}
                        <div className="absolute inset-0 flex items-start justify-end gap-1.5 bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                            <button
                                onClick={() => handleSetCover(photo.id)}
                                title="Définir comme couverture"
                                className="rounded-lg bg-white/90 p-1.5 text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-indigo-600"
                            >
                                <Layers className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => handleDelete(photo.id)}
                                title="Supprimer"
                                className="rounded-lg bg-white/90 p-1.5 text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-red-600"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {photos.length === 0 && !isPending && (
                <p className="mt-6 text-center text-sm text-gray-400">
                    Aucune photo dans cette série pour le moment.
                </p>
            )}
        </div>
    )
}
