import Link from 'next/link'
import { NewsletterForm } from './newsletter-form'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function Footer({ name }: { name: string }) {
  const year = new Date().getFullYear()

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Bio', href: '/bio' },
    { label: 'Galeries', href: '/archives' },
    { label: 'Livres', href: '/livres' },
    { label: 'Blog', href: '/journal' },
    { label: 'Contact', href: 'mailto:ramade.c@wanadoo.fr' },
  ]

  const socialLinks = [
    { label: 'Instagram', href: 'https://www.instagram.com/christianramadephoto/', Icon: InstagramIcon },
    { label: 'Facebook', href: 'https://www.facebook.com/christian.ramade.1', Icon: FacebookIcon },
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

        {/* Coordonnées */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <a
            href="mailto:ramade.c@wanadoo.fr"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            ramade.c@wanadoo.fr
          </a>
          <a
            href="tel:+33614490128"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            06 14 49 01 28
          </a>
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
            {navLinks.map((link) => (
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

          {/* Réseaux sociaux */}
          <ul className="flex items-center gap-5">
            {socialLinks.map((link) => {
              const Icon = link.Icon
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                </li>
              )
            })}
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
