import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, Unlink } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-primary underline',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2 text-sm',
      },
    },
  });

  // Sync external value changes
  if (editor && value !== editor.getHTML() && !editor.isFocused) {
    editor.commands.setContent(value || '', { emitUpdate: false });
  }

  if (!editor) return null;

  const handleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('URL del enlace:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const ToolBtn = ({ active, onPress, children, title }: { active?: boolean; onPress: () => void; children: React.ReactNode; title: string }) => (
    <Toggle
      size="sm"
      pressed={active}
      onPressedChange={() => onPress()}
      aria-label={title}
      className="h-7 w-7 p-0 data-[state=on]:bg-accent"
    >
      {children}
    </Toggle>
  );

  return (
    <div className={cn('border rounded-md overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b bg-muted/30">
        <ToolBtn active={editor.isActive('bold')} onPress={() => editor.chain().focus().toggleBold().run()} title="Negrita">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onPress={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('underline')} onPress={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolBtn active={editor.isActive('bulletList')} onPress={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onPress={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolBtn active={editor.isActive('link')} onPress={handleLink} title={editor.isActive('link') ? 'Quitar enlace' : 'Insertar enlace'}>
          {editor.isActive('link') ? <Unlink className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        </ToolBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolBtn active={editor.isActive({ textAlign: 'left' })} onPress={() => editor.chain().focus().setTextAlign('left').run()} title="Izquierda">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'center' })} onPress={() => editor.chain().focus().setTextAlign('center').run()} title="Centro">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'right' })} onPress={() => editor.chain().focus().setTextAlign('right').run()} title="Derecha">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'justify' })} onPress={() => editor.chain().focus().setTextAlign('justify').run()} title="Justificar">
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
