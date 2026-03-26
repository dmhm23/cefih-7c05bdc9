import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Table as TableIcon, Minus,
  AlignLeft, AlignCenter, AlignRight, Code2, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateEditorProps {
  content: string;
  onChange: (html: string) => void;
  onInsertToken?: (callback: (token: string) => void) => void;
  className?: string;
}

export default function TemplateEditor({ content, onChange, onInsertToken, className }: TemplateEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [rawHtml, setRawHtml] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html);
      setRawHtml(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Expose insert callback
  useEffect(() => {
    if (onInsertToken && editor) {
      onInsertToken((token: string) => {
        if (mode === 'visual') {
          editor.chain().focus().insertContent(token).run();
        } else {
          setRawHtml(prev => prev + token);
          onChange(rawHtml + token);
        }
      });
    }
  }, [onInsertToken, editor, mode, rawHtml, onChange]);

  const handleModeSwitch = useCallback((newMode: string) => {
    if (newMode === 'html' && editor) {
      setRawHtml(editor.getHTML());
    } else if (newMode === 'visual' && editor) {
      editor.commands.setContent(rawHtml);
    }
    setMode(newMode as 'visual' | 'html');
  }, [editor, rawHtml]);

  const handleRawChange = useCallback((value: string) => {
    setRawHtml(value);
    onChange(value);
  }, [onChange]);

  if (!editor) return null;

  const ToolbarButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', active && 'bg-muted')}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn('border rounded-lg bg-background overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 flex-wrap">
        <Tabs value={mode} onValueChange={handleModeSwitch}>
          <TabsList className="h-8">
            <TabsTrigger value="visual" className="text-xs h-7 px-2">
              <Eye className="h-3.5 w-3.5 mr-1" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="html" className="text-xs h-7 px-2">
              <Code2 className="h-3.5 w-3.5 mr-1" />
              HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'visual' && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
              <Italic className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />
            <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />
            <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />
            <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinear izquierda">
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrar">
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinear derecha">
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />
            <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insertar tabla">
              <TableIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">
              <Minus className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor content */}
      {mode === 'visual' ? (
        <div className="min-h-[400px]">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <Textarea
          value={rawHtml}
          onChange={(e) => handleRawChange(e.target.value)}
          className="min-h-[400px] font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0"
          placeholder="<h2>Título del documento</h2>\n<p>Contenido con {{persona.nombreCompleto}}...</p>"
        />
      )}
    </div>
  );
}
