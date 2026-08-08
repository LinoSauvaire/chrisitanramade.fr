'use client'

import { useEffect } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

type ConfirmDialogProps = {
    open: boolean
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    isPending?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    open,
    title = 'Confirmer la suppression',
    message = 'Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?',
    confirmLabel = 'Supprimer',
    cancelLabel = 'Annuler',
    isPending = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    // Ferme avec Échap
    useEffect(() => {
        if (!open) return
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !isPending) onCancel()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, isPending, onCancel])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && onCancel()}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isPending}
                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <p className="mb-6 text-sm leading-relaxed text-gray-500">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isPending}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
