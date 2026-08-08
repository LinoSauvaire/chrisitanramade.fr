/**
 * Formate la date d'une série pour l'affichage public.
 * Si un label personnalisé existe (ex. "2003-2005", "2025 - en cours"),
 * il est utilisé tel quel ; sinon on dérive l'année de la date de tri.
 */
export function formatShootDate(
    shootDate: Date | string | null | undefined,
    shootDateLabel?: string | null,
): string | null {
    const label = shootDateLabel?.trim()
    if (label) return label
    if (!shootDate) return null
    return new Intl.DateTimeFormat('fr-FR', { year: 'numeric' }).format(
        new Date(shootDate),
    )
}

/**
 * Extrait la première année (4 chiffres) d'une chaîne libre
 * pour alimenter le champ de tri `shootDate`.
 * Retourne null si aucune année n'est trouvée.
 */
export function parseSortDateFromLabel(label: string): Date | null {
    const match = label.match(/\d{4}/)
    if (!match) return null
    const year = Number(match[0])
    if (year < 1000 || year > 3000) return null
    return new Date(Date.UTC(year, 0, 1))
}
