'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, Layers, Loader2, GripVertical, Check } from 'lucide-react'
import { uploadPhotos, deletePhoto, deleteAllPhotos, setCoverPhoto, reorderPhotos, updatePhotoCaption } from '../actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import { ConfirmDialog } from '@/app/_components/confirm-dialog'

type Photo = {
    id: string
    url: string
    key: string
    caption: string | null
    year: string | null
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
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos)
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const [isFileDragging, setIsFileDragging] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null)
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

    // Resynchronise les photos locales quand la prop change (après router.refresh)
    useEffect(() => {
        setLocalPhotos(photos)
    }, [photos])

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return

        const formData = new FormData()
        formData.append('seriesId', seriesId)
        Array.from(files).forEach((file) => {
            formData.append('photos', file)
        })

        startTransition(async () => {
            try {
                const result = await uploadPhotos(undefined, formData)
                if (result?.error) setError(result.error)
                else setError(null)
                router.refresh()
            } catch {
                setError('Erreur lors de l\'upload. Photos trop lourdes ou problème réseau.')
            }
        })

        // Reset pour permettre de re-sélectionner les mêmes fichiers
        e.target.value = ''
    }

    function handleDelete(photoId: string) {
        startTransition(async () => {
            await deletePhoto(photoId)
            setLocalPhotos((prev) => prev.filter((p) => p.id !== photoId))
            setDeleteTarget(null)
            router.refresh()
        })
    }

    function handleDeleteAll() {
        startTransition(async () => {
            await deleteAllPhotos(seriesId)
            setLocalPhotos([])
            setConfirmDeleteAll(false)
            router.refresh()
        })
    }

    function handleSetCover(photoId: string) {
        startTransition(async () => {
            await setCoverPhoto(photoId)
            router.refresh()
        })
    }

    function handleDragStart(e: React.DragEvent, photoId: string) {
        setDraggedId(photoId)
        e.dataTransfer.effectAllowed = 'move'
    }

    function handleDragOver(e: React.DragEvent, photoId: string) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (photoId !== draggedId) {
            setDragOverId(photoId)
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

        setLocalPhotos((prev) => {
            const draggedIndex = prev.findIndex((p) => p.id === draggedId)
            const targetIndex = prev.findIndex((p) => p.id === targetId)
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

    function handleSaveOrder() {
        const orderedIds = localPhotos.map((p) => p.id)
        startTransition(async () => {
            await reorderPhotos(seriesId, orderedIds)
            router.refresh()
        })
    }

    // ── Drop de fichiers depuis l'ordinateur ──

    function handleFileDragOver(e: React.DragEvent) {
        // Détecte si ce sont des fichiers (pas un drag interne de photo)
        if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            setIsFileDragging(true)
        }
    }

    function handleFileDragLeave(e: React.DragEvent) {
        // Ne retire que si on quitte complètement la zone
        if (e.currentTarget === e.target) {
            setIsFileDragging(false)
        }
    }

    function handleFileDrop(e: React.DragEvent) {
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
        e.preventDefault()
        setIsFileDragging(false)

        const files = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith('image/'),
        )
        if (files.length === 0) return

        const formData = new FormData()
        formData.append('seriesId', seriesId)
        files.forEach((file) => formData.append('photos', file))

        startTransition(async () => {
            try {
                const result = await uploadPhotos(undefined, formData)
                if (result?.error) setError(result.error)
                else setError(null)
                router.refresh()
            } catch {
                setError('Erreur lors de l\'upload. Photos trop lourdes ou problème réseau.')
            }
        })
    }

    const orderChanged = localPhotos.some((p, i) => p.id !== photos[i]?.id)

    return (
        <div>
            {error && (
                <p className="mb-4 text-sm text-red-500">{error}</p>
            )}

            {/* Bouton sauvegarder l'ordre */}
            {orderChanged && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                    <span className="text-sm font-medium text-indigo-700">
                        Ordre des photos modifié
                    </span>
                    <button
                        onClick={handleSaveOrder}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Enregistrer l'ordre
                    </button>
                </div>
            )}

            {/* Barre d'actions : supprimer toutes les photos */}
            {localPhotos.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        {localPhotos.length} photo{localPhotos.length > 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={() => setConfirmDeleteAll(true)}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Tout supprimer
                    </button>
                </div>
            )}

            <div
                onDragOver={handleFileDragOver}
                onDragLeave={handleFileDragLeave}
                onDrop={handleFileDrop}
                className={`relative rounded-xl transition-all ${
                    isFileDragging
                        ? 'ring-2 ring-indigo-400 ring-offset-4 ring-offset-white'
                        : ''
                }`}
            >
                {/* Overlay pendant le drag de fichiers */}
                {isFileDragging && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-indigo-50/90 backdrop-blur-sm">
                        <Upload className="h-10 w-10 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600">
                            Déposez vos photos ici
                        </span>
                    </div>
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
                {localPhotos.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative flex flex-col gap-2"
                    >
                        <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, photo.id)}
                            onDragOver={(e) => handleDragOver(e, photo.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, photo.id)}
                            onDragEnd={handleDragEnd}
                            className={`relative aspect-square cursor-grab overflow-hidden rounded-xl border bg-gray-100 transition-all active:cursor-grabbing ${
                                draggedId === photo.id
                                    ? 'opacity-40 ring-2 ring-indigo-400'
                                    : dragOverId === photo.id
                                      ? 'ring-2 ring-indigo-300 border-indigo-200'
                                      : 'border-gray-100'
                            }`}
                        >
                            <Image
                                src={s3UrlToProxy(photo.url) ?? photo.url}
                                alt=""
                                fill
                                className="pointer-events-none object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />

                            {/* Poignée de glissement */}
                            <div className="absolute left-1.5 top-1.5 flex items-center justify-center rounded-lg bg-black/40 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                <GripVertical className="h-3.5 w-3.5 text-white" />
                            </div>

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
                                    onClick={() => setDeleteTarget(photo)}
                                    title="Supprimer"
                                    className="rounded-lg bg-white/90 p-1.5 text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-red-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <CaptionEditor photo={photo} />
                    </div>
                ))}
            </div>
            </div>

            {localPhotos.length === 0 && !isPending && (
                <p className="mt-6 text-center text-sm text-gray-400">
                    Aucune photo dans cette série pour le moment.
                </p>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                title="Supprimer cette photo ?"
                message="La photo sera définitivement supprimée de la série. Cette action est irréversible."
                isPending={isPending}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmDialog
                open={confirmDeleteAll}
                title="Supprimer toutes les photos ?"
                message={`Les ${localPhotos.length} photos de cette série seront définitivement supprimées. Cette action est irréversible.`}
                confirmLabel="Tout supprimer"
                isPending={isPending}
                onConfirm={handleDeleteAll}
                onCancel={() => setConfirmDeleteAll(false)}
            />
        </div>
    )
}

/**
 * Éditeur de légende : titre + année, sauvegardés automatiquement à la sortie du champ.
 */
function CaptionEditor({ photo }: { photo: Photo }) {
    const router = useRouter()
    const [caption, setCaption] = useState(photo.caption ?? '')
    const [year, setYear] = useState(photo.year ?? '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Resynchronise quand la prop change (après router.refresh)
    useEffect(() => {
        setCaption(photo.caption ?? '')
        setYear(photo.year ?? '')
    }, [photo.caption, photo.year])

    const changed =
        caption.trim() !== (photo.caption ?? '') ||
        year.trim() !== (photo.year ?? '')

    async function handleSave() {
        if (!changed) return
        setSaving(true)
        setSaved(false)
        try {
            const result = await updatePhotoCaption(photo.id, caption, year)
            if (result?.error) {
                console.error(result.error)
            } else {
                setSaved(true)
                setTimeout(() => setSaved(false), 1500)
            }
            router.refresh()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur()
                        }
                    }}
                    placeholder="Titre de la photo"
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-300 focus:border-indigo-300 focus:outline-none"
                />
                <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur()
                        }
                    }}
                    placeholder="Année"
                    className="w-16 shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs text-gray-900 placeholder:text-gray-300 focus:border-indigo-300 focus:outline-none"
                />
            </div>
            <div className="flex h-4 items-center justify-end">
                {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                ) : saved ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-600">
                        <Check className="h-3 w-3" /> Enregistré
                    </span>
                ) : null}
            </div>
        </div>
    )
}
