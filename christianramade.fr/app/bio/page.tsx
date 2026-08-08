import { prisma } from '@/app/_lib/prisma'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
import Image from 'next/image'
import { Navbar } from '@/app/_components/navbar'
import { HeroSection } from '@/app/_components/hero-section'
import { ExhibitionsSection } from '@/app/_components/exhibitions-section'
import { Footer } from '@/app/_components/footer'

export const dynamic = 'force-dynamic'

export default async function BioPage() {
  // Récupère le profil (auto-créé si inexistant)
  let profile = await prisma.profile.findFirst({
    include: {
      timeline: { orderBy: { year: 'desc' } },
      books: { orderBy: { order: 'asc' } },
    },
  })

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        name: 'Christian Ramade',
        tagline: 'Observing the Unseen.',
        bio: "Spécialisé dans la photographie documentaire au long cours, mon travail s'attache à explorer les mutations sociales et environnementales contemporaines. Privilégiant l'immersion et le temps long, je cherche à construire des récits visuels qui interrogent notre rapport au territoire et aux identités locales.",
      },
      include: {
        timeline: { orderBy: { year: 'desc' } },
        books: { orderBy: { order: 'asc' } },
      },
    })
  }

  const avatarProxy = s3UrlToProxy(profile.avatarUrl)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar name={profile.name} active="bio" />
      <main className="flex-1">
        <HeroSection
          name={profile.name}
          tagline={profile.tagline}
          bio={profile.bio}
          avatarUrl={avatarProxy}
        />

        <ExhibitionsSection items={profile.timeline} />

        {/* ── Bloc Livres avec trait de séparation ── */}
        {profile.books.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-12">
            <div className="border-t border-gray-200 pt-16">
              <h2 className="mb-8 font-serif text-2xl text-gray-900 lg:text-3xl">
                Monographies
              </h2>
              <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                {profile.books.map((book) => (
                  <div key={book.id} className="group">
                    {/* Couverture */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-100">
                      {book.coverUrl ? (
                        <Image
                          src={s3UrlToProxy(book.coverUrl) ?? book.coverUrl}
                          alt={book.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100">
                          <span className="text-sm text-gray-300">Pas de couverture</span>
                        </div>
                      )}
                    </div>

                    {/* Métadonnées */}
                    <div className="mt-4 flex items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {book.title}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {book.year}
                      </span>
                    </div>
                    {book.publisher && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {book.publisher}
                      </p>
                    )}
                    {book.description && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">
                        {book.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer name={profile.name} />
    </div>
  )
}
