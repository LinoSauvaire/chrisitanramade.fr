'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, Check, X, MessageCircle } from 'lucide-react'
import { sendContactMessage } from '@/app/_lib/newsletter-actions'

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [state, formAction, isPending] = useActionState(sendContactMessage, undefined)
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (state?.success) setDone(true)
    }, [state])

    useEffect(() => {
        if (!open) {
            setDone(false)
        }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && onClose()}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {done ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 px-6 py-8 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-green-800">
                            Merci pour votre message !
                        </p>
                        <p className="text-xs text-green-600">
                            Votre message a bien été envoyé.
                        </p>
                        <button
                            onClick={() => {
                                setDone(false)
                                onClose()
                            }}
                            className="mt-2 text-xs text-green-600 underline underline-offset-2 hover:text-green-800"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    <form action={formAction} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Votre nom"
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Votre email"
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        <textarea
                            name="message"
                            rows={4}
                            required
                            placeholder="Votre message…"
                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                        />

                        {state?.error && (
                            <p className="text-sm text-red-500">{state.error}</p>
                        )}

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                Votre message sera envoyé directement à Christian.
                            </p>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex items-center gap-2 bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                            >
                                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isPending ? 'Envoi…' : 'Envoyer'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}