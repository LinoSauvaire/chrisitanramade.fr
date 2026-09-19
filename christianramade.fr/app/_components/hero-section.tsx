import Image from 'next/image'

export function HeroSection({
  name,
  tagline,
  bio,
  avatarUrl,
}: {
  name: string
  tagline: string
  bio: string
  avatarUrl: string | null
}) {
  // Sépare la bio en paragraphes
  const bioParagraphs = bio.split('\n').filter((p) => p.trim().length > 0)

  return (
    <section id="bio" className="mx-auto max-w-6xl px-6 py-20 lg:px-12 lg:py-32">
      <div className="flex flex-col gap-12">
        {/* Portrait */}
        <div className="mx-auto w-full max-w-md">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-gray-100">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-gray-200" />
              </div>
            )}
          </div>
        </div>

        {/* Texte */}
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
            Biographie
          </p>

          <h1 className="mt-4 font-serif text-3xl leading-tight text-gray-900 lg:text-4xl">
            {tagline}
          </h1>

          <div className="mt-10 space-y-6">
            {bioParagraphs.length > 0 ? (
              bioParagraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed text-gray-600"
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-base leading-relaxed text-gray-400">
                Biographie à venir.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
