'use client'

import { useActionState, useEffect, useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'
import { subscribeToNewsletter } from '@/app/_lib/newsletter-actions'

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, undefined)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setDone(true)
      const timer = setTimeout(() => setDone(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [state])

  if (done) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Check className="h-3.5 w-3.5" />
        Inscription confirmée !
      </div>
    )
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <div className="relative">
        <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
        <input
          name="email"
          type="email"
          required
          placeholder="Votre email"
          className="w-40 rounded-full border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        S'abonner
      </button>
      {state?.error && (
        <span className="text-xs text-red-500">{state.error}</span>
      )}
    </form>
  )
}
