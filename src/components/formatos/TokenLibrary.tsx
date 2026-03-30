import { useState } from 'react';
import { getTokenCategories, TokenDefinition } from '@/data/tokenSources';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenLibraryProps {
  onInsertToken: (tokenKey: string) => void;
  className?: string;
}

export default function TokenLibrary({ onInsertToken, className }: TokenLibraryProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Persona', 'Curso']));

  const categories = getTokenCategories();

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    tokens: cat.tokens.filter(t =>
      !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.key.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.tokens.length > 0);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="px-1 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar token..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-1">
          {filteredCategories.map(cat => (
            <div key={cat.name}>
              <button
                type="button"
                onClick={() => toggleCategory(cat.name)}
                className="flex items-center gap-1.5 w-full text-left py-1.5 px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                {expandedCategories.has(cat.name) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {cat.name}
                <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                  {cat.tokens.length}
                </Badge>
              </button>

              {expandedCategories.has(cat.name) && (
                <div className="space-y-0.5 ml-1 mb-2">
                  {cat.tokens.map(token => (
                    <TokenItem key={token.key} token={token} onInsert={() => onInsertToken(`{{${token.key}}}`)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function TokenItem({ token, onInsert }: { token: TokenDefinition; onInsert: () => void }) {
  return (
    <button
      type="button"
      onClick={onInsert}
      className="w-full flex flex-col gap-0.5 px-2 py-1.5 rounded text-left hover:bg-muted/60 transition-colors group"
      title={`Insertar {{${token.key}}}`}
    >
      <span className="text-sm font-medium group-hover:text-primary transition-colors">
        {token.label}
      </span>
      <code className="text-xs text-muted-foreground font-mono">
        {`{{${token.key}}}`}
      </code>
    </button>
  );
}
