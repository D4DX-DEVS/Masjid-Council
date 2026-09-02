import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Link2Off,
  ImagePlus,
  Undo2,
  Redo2,
  Loader2,
} from 'lucide-react';
import { uploadPublicationImage } from '../lib/publications';

/**
 * Chapter body editor.
 *
 * Only exposes the marks the server's allowlist keeps (lib/sanitizeRichText.js) — adding a
 * button here without widening that allowlist would silently drop the formatting on save.
 *
 * Imported lazily by the publication editor so TipTap never reaches the public bundle.
 */

const ToolbarButton = ({ onClick, active, disabled, label, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()} // keep the selection while clicking
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    aria-pressed={active}
    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
      active ? 'bg-[#EAF6EF] text-[#1F6B3A]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const Divider = () => <span className="mx-1 h-6 w-px shrink-0 bg-gray-200" />;

const RichTextEditor = ({ value, onChange, onError }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // The allowlist has no h1 (the chapter title owns that) and no code blocks.
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        code: false,
        horizontalRule: {},
        // StarterKit ships Link itself since v3. Registering @tiptap/extension-link
        // alongside it defines the mark twice, which TipTap warns about and which leaves
        // the second definition to win in ways nothing here controls.
        link: { openOnClick: false, autolink: false },
      }),
      Image.configure({ inline: false }),
    ],
    content: value || '',
    onUpdate: ({ editor: instance }) => {
      if (instance.isDestroyed) return;
      onChange(instance.getHTML());
    },
    editorProps: {
      attributes: {
        // Chapters run to thousands of words, so the writing surface scrolls inside itself
        // rather than growing the page — the toolbar stays reachable and the chapter list
        // beside it stays in view. min-h keeps a short chapter from collapsing to a strip.
        class:
          'mc-prose min-h-[320px] max-h-[60vh] overflow-y-auto max-w-none px-4 py-4 focus:outline-none',
      },
    },
  });

  // Switching chapters swaps `value` under the same editor instance. Without this the new
  // chapter opens showing the previous one's text.
  useEffect(() => {
    // isDestroyed matters under StrictMode and Fast Refresh: useEditor tears the instance
    // down on the throwaway first mount, and this effect still fires against it. Reading
    // getHTML() off a destroyed editor hits a null schema and throws.
    if (!editor || editor.isDestroyed) return;
    const incoming = value || '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // Intentionally keyed on `value` only: reacting to editor.getHTML() would fight typing.
     
  }, [value, editor]);

  const addImage = useCallback(
    async (file) => {
      if (!file) return;
      setUploading(true);
      try {
        const { url } = await uploadPublicationImage(file, 'chapterImage');
        editor?.chain().focus().setImage({ src: url, alt: '' }).run();
      } catch (error) {
        onError?.(error.message);
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [editor, onError]
  );

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Link URL (https://…)');
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      onError?.('Only http, https and mailto links are kept when the chapter is saved.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor, onError]);

  // A destroyed instance still comes back from useEditor for a render or two (StrictMode's
  // throwaway mount, Fast Refresh, and the moment the route changes). isActive/can/getHTML
  // all reach through a schema that is null by then, so nothing may read it.
  if (!editor || editor.isDestroyed) {
    return (
      <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-700/15">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50/95 px-2 py-1.5 backdrop-blur">
        <ToolbarButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Heading"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Sub-heading"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bulleted list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label={editor.isActive('link') ? 'Remove link' : 'Add link'}
          active={editor.isActive('link')}
          onClick={toggleLink}
        >
          {editor.isActive('link') ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </ToolbarButton>
        <ToolbarButton
          label="Insert image"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => addImage(e.target.files?.[0])}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
