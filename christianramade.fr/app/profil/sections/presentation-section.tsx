'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { Loader2, Upload } from 'lucide-react'
import { updateProfile } from '../actions'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

export function PresentationSection({
    profileId,
    name,
    tagline,
    bio,
    avatarUrl,
}: {
    profileId: string
    name: string
    tagline: string
    bio: string
    avatarUrl: string | null
}) {
    const [state, formAction, isPending] = useActionState(updateProfile, undefined)
    const [bioValue, setBioValue] = useState(bio)
    const [taglineValue, setTaglineValue] = useState(tagline)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        s3UrlToProxy(avatarUrl),
    )

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

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

                {/* Photo de profil */}
                <div className="mb-5">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Photo de profil
                    </label>
                    <label className="relative flex aspect-[4/5] w-40 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50">
                        {avatarPreview ? (
                            <Image
                                src={avatarPreview}
                                alt="Photo de profil"
                                fill
                                className="object-cover"
                                sizes="160px"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-5 w-5 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                    Cliquez pour uploader
                                </span>
                            </div>
                        )}
                        <input
                            name="avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </label>
                </div>

                {/* Tagline */}
                <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Slogan / Accroche
                    </label>
                    <input
                        name="tagline"
                        type="text"
                        value={taglineValue}
                        onChange={(e) => setTaglineValue(e.target.value)}
                        placeholder="Ex: Observing the Unseen."
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                </div>

                {/* Bio */}
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Biographie
                </label>
                <textarea
                    name="bio"
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
