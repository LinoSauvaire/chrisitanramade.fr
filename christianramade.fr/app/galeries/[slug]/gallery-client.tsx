'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Lightbox } from '@/app/_components/lightbox'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

type Photo = {
  id: string
  url: string
  caption: string | null
  year: string | null
}

export function GalleryClient({ photos, seriesName }: { photos: Photo[]; seriesName: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const open = useCallback((index: number) => setLightboxIndex(index), [])
  const close = useCallback(() => setLightboxIndex(null), [])

  const prev = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)),
    [photos.length],
  )
  const next = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null)),
    [photos.length],
  )

  const lightboxPhotos = photos.map((p) => ({
    id: p.id,
    url: s3UrlToProxy(p.url) ?? p.url,
    alt: seriesName,
    caption: p.caption,
    year: p.year,
  }))

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => open(index)}
            className="group relative flex flex-col text-left"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 transition-opacity group-hover:opacity-90">
              <Image
                src={s3UrlToProxy(photo.url) ?? photo.url}
                alt={seriesName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            {(photo.caption || photo.year) && (
              <div className="mt-2 flex items-baseline gap-2">
                {photo.caption && (
                  <span className="text-sm text-gray-900">{photo.caption}</span>
                )}
                {photo.year && (
                  <span className="text-xs text-gray-400">{photo.year}</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  )
}