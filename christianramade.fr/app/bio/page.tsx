import { prisma } from '@/app/_lib/prisma'
import { s3UrlToProxy } from '@/app/_lib/s3-url'
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
      },
    })
  }

  const avatarProxy = s3UrlToProxy(profile.avatarUrl)

  return (
    <div className="flex min-h-screen flex-col bg-white pt-20">
      <Navbar name={profile.name} active="bio" />
      <main className="flex-1">
        <HeroSection
          name={profile.name}
          tagline={profile.tagline}
          bio={profile.bio}
          avatarUrl={avatarProxy}
        />

        <ExhibitionsSection items={profile.timeline} />
      </main>
      <Footer name={profile.name} />
    </div>
  )
}