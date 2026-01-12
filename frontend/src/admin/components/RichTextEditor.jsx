import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Don't save empty paragraphs - treat them as empty content
      const cleanedHtml = html === '<p></p>' ? '' : html;
      onChange(cleanedHtml);
    },
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none min-h-[150px]',
        placeholder: placeholder || '',
      },
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    const newValue = value || '';

    // Only update if content actually changed to prevent cursor jumping
    if (currentContent !== newValue) {
      editor.commands.setContent(newValue);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Headers */}
        <select
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level }).run();
            }
            e.target.value = '0';
          }}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue="0"
        >
          <option value="0">Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
          title="Bold"
        >
          B
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
          title="Italic"
        >
          I
        </button>

        {/* Underline is not in StarterKit by default, using Strike instead */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 text-sm line-through border border-gray-300 rounded hover:bg-gray-100 ${
            editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
          title="Strikethrough"
        >
          S
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 ${
            editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
          title="Bullet List"
        >
          •
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 ${
            editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
          title="Numbered List"
        >
          1.
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 ${
            editor.isActive('link') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
          title="Link"
        >
          🔗
        </button>

        {/* Unlink */}
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
            title="Remove Link"
          >
            ⛓️‍💥
          </button>
        )}

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      <style>{`
        .tiptap-editor .ProseMirror {
          min-height: 150px;
          padding: 0.75rem;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #000000;
        }

        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }

        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .tiptap-editor .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }

        .tiptap-editor .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }

        .tiptap-editor .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
        }

        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          color: #000000;
        }

        .tiptap-editor .ProseMirror ul {
          list-style-type: disc;
        }

        .tiptap-editor .ProseMirror ol {
          list-style-type: decimal;
        }

        .tiptap-editor .ProseMirror li {
          margin: 0.25rem 0;
          color: #000000;
        }

        .tiptap-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap-editor .ProseMirror a:hover {
          color: #1d4ed8;
        }

        .tiptap-editor .ProseMirror p {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
