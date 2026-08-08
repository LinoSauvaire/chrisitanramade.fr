type TimelineItem = {
  id: string
  title: string
  year: string
  description: string | null
  location: string | null
  order: number
}

export function ExhibitionsSection({ items }: { items: TimelineItem[] }) {
  return (
    <section className="border-t border-gray-100 bg-[#FAFAFA]">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-12 lg:py-28">
        {/* Titre */}
        <div className="mb-12">
          <h2 className="font-serif text-3xl text-gray-900 lg:text-4xl">
            Major Exhibitions
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Selected solo and group shows
          </p>
        </div>

        {/* Liste */}
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            Aucune exposition pour le moment.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 py-6 transition-colors hover:bg-white/50"
              >
                {/* Année */}
                <div className="col-span-2 lg:col-span-1">
                  <span className="font-serif text-lg text-gray-900">
                    {item.year}
                  </span>
                </div>

                {/* Titre + description */}
                <div className="col-span-7 lg:col-span-6">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Lieu */}
                <div className="col-span-3 flex items-start justify-end lg:col-span-5">
                  <span className="text-right text-xs uppercase tracking-wider text-gray-400">
                    {item.location ?? ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
