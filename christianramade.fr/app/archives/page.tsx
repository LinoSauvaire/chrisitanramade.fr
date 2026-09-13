import { prisma } from '@/app/_lib/prisma'
import { Navbar } from '@/app/_components/navbar'
import { Footer } from '@/app/_components/footer'
import { ArchivesClient } from './archives-client'

export const dynamic = 'force-dynamic'

export default async function ArchivesPage() {
    const [profile, series] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.series.findMany({
            where: { visibility: 'public' },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            include: { _count: { select: { photos: true } } },
        }),
    ])

    const name = profile?.name ?? 'Christian Ramade'

    return (
        <div className="flex min-h-screen flex-col bg-white pt-20">
            <Navbar name={name} active="archives" />

            <main className="flex-1">
                {/* En-tête */}
                <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:py-28">
                    <h1 className="font-serif text-4xl text-gray-900 lg:text-5xl">
                        Galeriesdr
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-gray-500">
                        Explorez une collection complète d'études structurelles et de séries d'observation couvrant deux décennies de pratique.
                    </p>
                </div>

                <ArchivesClient series={series} />
            </main>

            <Footer name={name} />
        </div>
    )
}
