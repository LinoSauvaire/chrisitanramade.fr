'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

type LightboxPhoto = {
  id: string
  url: string
  alt: string
  caption?: string | null
  year?: string | null
}

export function Lightbox({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  photos: LightboxPhoto[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    },
    [onClose, onPrev, onNext],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const photo = photos[currentIndex]
  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={onClose}
    >
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
        aria-label="Fermer"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Flèche gauche */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
          aria-label="Photo précédente"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative h-full w-full max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          className="object-contain"
          sizes="90vw"
          priority
        />
      </div>

      {/* Flèche droite */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
          aria-label="Photo suivante"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Légende + compteur */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
        {(photo.caption || photo.year) && (
          <div className="rounded-full bg-black/60 px-5 py-2 text-center">
            {photo.caption && (
              <span className="text-sm text-white/90">{photo.caption}</span>
            )}
            {photo.caption && photo.year && (
              <span className="mx-1.5 text-white/40">·</span>
            )}
            {photo.year && (
              <span className="text-sm text-white/60">{photo.year}</span>
            )}
          </div>
        )}
        <div className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  )
}