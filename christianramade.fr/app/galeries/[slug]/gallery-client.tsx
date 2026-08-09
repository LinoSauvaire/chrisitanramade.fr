'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Lightbox } from '@/app/_components/lightbox'
import { s3UrlToProxy } from '@/app/_lib/s3-url'

type Photo = {
  id: string
  url: string
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
  }))

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => open(index)}
            className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 text-left transition-opacity hover:opacity-90"
          >
            <Image
              src={s3UrlToProxy(photo.url) ?? photo.url}
              alt={seriesName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
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