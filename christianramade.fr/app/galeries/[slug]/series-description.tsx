'use client'

import { useState, useMemo } from 'react'

const TRUNCATE_CHARS = 300

export function SeriesDescription({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false)
    const needsTruncation = text.length > TRUNCATE_CHARS

    // Coupe au dernier espace ≤ TRUNCATE_CHARS pour ne pas tronquer au milieu d'un mot
    const truncated = useMemo(() => {
        if (text.length <= TRUNCATE_CHARS) return text
        let cut = text.slice(0, TRUNCATE_CHARS)
        const lastSpace = cut.lastIndexOf(' ')
        if (lastSpace > TRUNCATE_CHARS * 0.6) cut = cut.slice(0, lastSpace)
        return cut
    }, [text])

    const visible = needsTruncation && !expanded ? truncated : text

    return (
        <div>
            <p className="mt-3 max-w-2xl whitespace-pre-line break-words text-lg leading-relaxed text-gray-500">
                {visible}
                {needsTruncation && !expanded && (
                    <span className="text-gray-400">…</span>
                )}
            </p>
            {needsTruncation && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 text-sm font-medium uppercase tracking-widest text-gray-900 transition-colors hover:text-gray-600"
                >
                    {expanded ? 'Voir moins ↑' : 'Voir plus ↓'}
                </button>
            )}
        </div>
    )
}
