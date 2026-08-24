import Link from 'next/link'
import { NewsletterForm } from './newsletter-form'

export function Footer({ name }: { name: string }) {
  const year = new Date().getFullYear()

  const socialLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Bio', href: '/bio' },
    { label: 'Galeries', href: '/archives' },
    { label: 'Blog', href: '/journal' },
    { label: 'Instagram', href: '#' },
  ]

  return (
    <footer className="border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-12">
        {/* Newsletter */}
        <div className="mb-8 flex flex-col items-center gap-3 border-b border-gray-100 pb-8 text-center">
          <div>
            <p className="font-serif text-sm font-semibold text-gray-900">
              Newsletter
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Un email par semaine, jamais de spam.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-lg font-bold tracking-wide text-gray-900"
          >
            {name.toUpperCase()}
          </Link>

          {/* Liens */}
          <ul className="flex flex-wrap items-center justify-center gap-6">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            © {year} {name} Photography. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
