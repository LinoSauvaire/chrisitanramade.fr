'use client'

import { useRef } from 'react'
import {
    Bold,
    Italic,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
} from 'lucide-react'

const toolbarButtons = [
    { icon: Bold, action: 'bold', label: 'Gras' },
    { icon: Italic, action: 'italic', label: 'Italique' },
    { icon: LinkIcon, action: 'link', label: 'Lien' },
    { icon: ImageIcon, action: 'image', label: 'Image' },
    { icon: AlignLeft, action: 'alignLeft', label: 'Aligner à gauche' },
    { icon: AlignCenter, action: 'alignCenter', label: 'Centrer' },
    { icon: AlignRight, action: 'alignRight', label: 'Aligner à droite' },
    { icon: List, action: 'insertUnorderedList', label: 'Liste à puces' },
    { icon: ListOrdered, action: 'insertOrderedList', label: 'Liste numérotée' },
]

export function RichTextEditor({
    ticketId,
    title,
    content,
    onTitleChange,
    onContentChange,
}: {
    ticketId: string
    title: string
    content: string
    onTitleChange: (value: string) => void
    onContentChange: (value: string) => void
}) {
    const editorRef = useRef<HTMLDivElement>(null)

    function execCommand(command: string) {
        // Les commandes document.execCommand sont dépréciées mais restent
        // le moyen le plus simple d'implémenter un éditeur WYSIWYG basique.
        switch (command) {
            case 'bold':
            case 'italic':
            case 'insertUnorderedList':
            case 'insertOrderedList':
                document.execCommand(command, false)
                break
            case 'link': {
                const url = window.prompt('Entrez l\'URL du lien :')
                if (url) document.execCommand('createLink', false, url)
                break
            }
            case 'image': {
                const url = window.prompt('Entrez l\'URL de l\'image :')
                if (url) document.execCommand('insertImage', false, url)
                break
            }
            case 'alignLeft':
                document.execCommand('justifyLeft', false)
                break
            case 'alignCenter':
                document.execCommand('justifyCenter', false)
                break
            case 'alignRight':
                document.execCommand('justifyRight', false)
                break
        }
        // Synchronise le contenu
        if (editorRef.current) {
            onContentChange(editorRef.current.innerHTML)
        }
    }

    function handleInput() {
        if (editorRef.current) {
            onContentChange(editorRef.current.innerHTML)
        }
    }

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* Titre */}
            <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Titre de votre article..."
                className="w-full border-none px-8 pt-8 text-3xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none"
            />

            {/* Barre d'outils */}
            <div className="flex items-center gap-1 border-y border-gray-100 px-6 py-2.5">
                {toolbarButtons.map((btn) => {
                    const Icon = btn.icon
                    return (
                        <button
                            key={btn.action}
                            type="button"
                            title={btn.label}
                            onClick={() => execCommand(btn.action)}
                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    )
                })}
            </div>

            {/* Zone de corps */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="min-h-[400px] px-8 py-6 text-base leading-relaxed text-gray-700 focus:outline-none [&_a]:text-indigo-600 [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                data-placeholder="Commencez d'écrire votre histoire..."
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    )
}
