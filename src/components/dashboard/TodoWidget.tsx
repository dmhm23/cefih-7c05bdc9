import { useState, useEffect, KeyboardEvent } from "react";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TodoItem, loadTodos, saveTodos } from "@/data/mockDashboard";

const TodoWidget = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  const persist = (next: TodoItem[]) => {
    setTodos(next);
    saveTodos(next);
  };

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    persist([item, ...todos]);
    setInput("");
  };

  const toggle = (id: string) => {
    persist(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const remove = (id: string) => {
    persist(todos.filter(t => t.id !== id));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addTodo();
  };

  const sorted = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Tareas Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 space-y-3">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Nueva tarea..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 text-sm"
          />
          <Button size="sm" variant="outline" onClick={addTodo} className="shrink-0 h-9 w-9 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* List */}
        <ScrollArea className="flex-1 min-h-0">
          {sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Sin tareas pendientes</p>
          ) : (
            <div className="space-y-1">
              {sorted.map(todo => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                >
                  <button onClick={() => toggle(todo.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
                    {todo.completed
                      ? <CheckSquare className="h-4 w-4 text-[hsl(var(--success))]" />
                      : <Square className="h-4 w-4" />
                    }
                  </button>
                  <span className={cn(
                    "text-sm flex-1 text-foreground",
                    todo.completed && "line-through text-muted-foreground"
                  )}>
                    {todo.text}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground/60">
                    {formatDate(todo.createdAt)}
                  </span>
                  <button
                    onClick={() => remove(todo.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TodoWidget;
