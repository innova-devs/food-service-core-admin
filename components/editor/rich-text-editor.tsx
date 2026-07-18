"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import { useEffect, useCallback, useRef } from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Code,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escribí el contenido del anuncio...",
  minHeight = "200px",
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate({ editor: e }) {
      const html = e.isEmpty ? "" : e.getHTML()
      onChange(html)
    },
    editorProps: {
      /**
       * Si se pega código HTML como texto plano (ej. desde el chat),
       * lo interpretamos como markup en vez de mostrarlo literal.
       */
      handlePaste(_view, event) {
        const clipboard = event.clipboardData
        if (!clipboard) return false

        const plain = clipboard.getData("text/plain")?.trim() ?? ""
        const looksLikeHtml =
          /^<[a-z!][\s\S]*>/i.test(plain) && /<\/[a-z]+>/i.test(plain)
        if (!looksLikeHtml) return false

        event.preventDefault()
        const ed = editorRef.current
        if (!ed) return true
        if (ed.isEmpty) {
          ed.commands.setContent(plain)
        } else {
          ed.commands.insertContent(plain)
        }
        return true
      },
    },
  })

  const editorRef = useRef(editor)
  editorRef.current = editor

  // Sync value desde fuera (reset del form)
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? "" : editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [value, editor])

  // Sync disabled
  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  const addLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("URL del enlace:", prev ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt("URL de la imagen:")
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={cn(
          "rounded-md border bg-background",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
          {/* Historia */}
          <ToolbarButton
            label="Deshacer"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Rehacer"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="size-4" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Formato inline */}
          <ToolbarToggle
            label="Negrita"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Cursiva"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Subrayado"
            pressed={editor.isActive("underline")}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Tachado"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Código inline"
            pressed={editor.isActive("code")}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="size-4" />
          </ToolbarToggle>

          <ToolbarSeparator />

          {/* Headings */}
          <ToolbarToggle
            label="Título 1"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Título 2"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Título 3"
            pressed={editor.isActive("heading", { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="size-4" />
          </ToolbarToggle>

          <ToolbarSeparator />

          {/* Listas */}
          <ToolbarToggle
            label="Lista con viñetas"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Lista numerada"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Cita"
            pressed={editor.isActive("blockquote")}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-4" />
          </ToolbarToggle>
          <ToolbarButton
            label="Línea separadora"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="size-4" />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Alineación */}
          <ToolbarToggle
            label="Alinear izquierda"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
          >
            <AlignLeft className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Centrar"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
          >
            <AlignCenter className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            label="Alinear derecha"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
          >
            <AlignRight className="size-4" />
          </ToolbarToggle>

          <ToolbarSeparator />

          {/* Link e imagen */}
          <ToolbarToggle
            label="Enlace"
            pressed={editor.isActive("link")}
            onPressedChange={addLink}
          >
            <LinkIcon className="size-4" />
          </ToolbarToggle>
          <ToolbarButton label="Imagen (URL)" onClick={addImage}>
            <ImageIcon className="size-4" />
          </ToolbarButton>
        </div>

        {/* Área editable */}
        <EditorContent
          editor={editor}
          className="tiptap-content px-4 py-3 focus-within:outline-none"
          style={{ minHeight }}
        />
      </div>
    </TooltipProvider>
  )
}

// ---------------------------------------------------------------------------
// Subcomponentes de toolbar
// ---------------------------------------------------------------------------

function ToolbarToggle({
  label,
  pressed,
  onPressedChange,
  children,
}: {
  label: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onPressedChange}
          aria-label={label}
          className="size-8 p-0"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-6" />
}
