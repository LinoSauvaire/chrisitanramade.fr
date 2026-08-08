'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, Check, MessageCircle } from 'lucide-react'
import { sendContactMessage } from '@/app/_lib/newsletter-actions'

export function ContactForm({
  articleSlug,
  articleTitle,
}: {
  articleSlug: string
  articleTitle: string
}) {
  const [state, formAction, isPending] = useActionState(sendContactMessage, undefined)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setDone(true)
    }
  }, [state])

  if (done) {
    return (
      <div className="mt-12 border-t border-gray-100 pt-8">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 px-6 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Check className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-800">
                Merci pour votre message !
            </p>
            <p className="text-xs text-green-600">
                Votre réaction a bien été envoyée.
            </p>
            <button
                onClick={() => setDone(false)}
                className="mt-2 text-xs text-green-600 underline underline-offset-2 hover:text-green-800"
            >
                Envoyer un autre message
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <div className="mb-5 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">
          Réagir à cet article
        </h3>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="articleSlug" value={articleSlug} />
        <input type="hidden" name="articleTitle" value={articleTitle} />

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
          placeholder="Votre message, votre avis, votre réaction…"
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
            className="flex items-center gap-2  bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  )
}
