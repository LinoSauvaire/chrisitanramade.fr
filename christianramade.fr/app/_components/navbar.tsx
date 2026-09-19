'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContactModal } from './contact-modal'

export function Navbar({ name, active }: { name: string; active?: string }) {
  const [contactOpen, setContactOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Accueil', href: '/', key: 'accueil' },
    { label: 'Bio', href: '/bio', key: 'bio' },
    { label: 'Galeries', href: '/archives', key: 'archives' },
    { label: 'Livres', href: '/livres', key: 'livres' },
    { label: 'Blog', href: '/journal', key: 'journal' },
  ]

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-12">
          {/* Logo / Nom */}
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-wide text-gray-900"
          >
            {name.toUpperCase()}
          </Link>

          {/* Menu */}
          <ul className="hidden items-center gap-8 sm:flex">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`text-xs uppercase tracking-widest transition-colors ${
                    active === link.key
                      ? 'text-gray-900 underline underline-offset-4 decoration-1'
                      : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => setContactOpen(true)}
                className="text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
              >
                Contact
              </button>
            </li>
          </ul>

          {/* Menu mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            className="sm:hidden"
          >
            <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {/* Panneau mobile */}
        {menuOpen && (
          <div className="border-b border-gray-100 bg-white sm:hidden">
            <ul className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2.5 text-sm uppercase tracking-widest transition-colors ${
                      active === link.key
                        ? 'text-gray-900'
                        : 'text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setContactOpen(true)
                  }}
                  className="block w-full px-3 py-2.5 text-left text-sm uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
