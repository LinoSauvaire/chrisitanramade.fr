'use client'

import { useActionState, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { updateProfile } from '../actions'

export function PresentationSection({
    profileId,
    name,
    bio,
}: {
    profileId: string
    name: string
    bio: string
}) {
    const [state, formAction, isPending] = useActionState(updateProfile, undefined)
    const [bioValue, setBioValue] = useState(bio)

    return (
        <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Présentation
            </h2>

            <form
                id="profile-form"
                action={formAction}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
                <input type="hidden" name="name" value={name} />

                <textarea
                    name="bio"
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    rows={6}
                    className="w-full resize-none border-none text-sm leading-relaxed text-gray-700 placeholder:text-gray-300 focus:outline-none"
                    placeholder="Décrivez votre parcours artistique…"
                />

                {state?.error && (
                    <p className="mt-2 text-sm text-red-500">{state.error}</p>
                )}

                <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-50 pt-4">
                    <button
                        type="button"
                        onClick={() => setBioValue(bio)}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 disabled:opacity-50"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save
                    </button>
                </div>
            </form>
        </section>
    )
}
