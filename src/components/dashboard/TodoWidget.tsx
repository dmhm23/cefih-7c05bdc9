import { useState, useEffect, KeyboardEvent, useRef } from "react";
import { Plus, Trash2, Square, CheckCircle2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TodoItem, loadTodos, saveTodos, loadHistory, saveHistory } from "@/data/dashboardData";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });

interface SortableTodoProps {
  todo: TodoItem;
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
  editingId: string | null;
  editText: string;
  onStartEdit: (todo: TodoItem) => void;
  onEditChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const SortableTodoItem = ({
  todo, onComplete, onRemove, editingId, editText,
  onStartEdit, onEditChange, onSaveEdit, onCancelEdit,
}: SortableTodoProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingId === todo.id;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSaveEdit();
    if (e.key === "Escape") onCancelEdit();
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onComplete(todo.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
        <Square className="h-4 w-4" />
      </button>
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editText}
          onChange={e => onEditChange(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={onSaveEdit}
          className="h-7 text-sm flex-1 py-0"
        />
      ) : (
        <span
          className="text-sm flex-1 text-foreground cursor-pointer select-none"
          onDoubleClick={() => onStartEdit(todo)}
        >
          {todo.text}
        </span>
      )}
      <span className="shrink-0 text-xs text-muted-foreground/60">{formatDate(todo.createdAt)}</span>
      <button
        onClick={() => onRemove(todo.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const TodoWidget = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [history, setHistory] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<'tareas' | 'historial'>('tareas');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    setTodos(loadTodos());
    setHistory(loadHistory());
  }, []);

  const persistTodos = (next: TodoItem[]) => { setTodos(next); saveTodos(next); };
  const persistHistory = (next: TodoItem[]) => { setHistory(next); saveHistory(next); };

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const item: TodoItem = { id: crypto.randomUUID(), text, completed: false, createdAt: new Date().toISOString() };
    persistTodos([item, ...todos]);
    setInput("");
  };

  const completeTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    persistTodos(todos.filter(t => t.id !== id));
    persistHistory([{ ...todo, completed: true, completedAt: new Date().toISOString() }, ...history]);
  };

  const removeTodo = (id: string) => persistTodos(todos.filter(t => t.id !== id));
  const removeFromHistory = (id: string) => persistHistory(history.filter(t => t.id !== id));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") addTodo(); };

  const startEdit = (todo: TodoItem) => { setEditingId(todo.id); setEditText(todo.text); };
  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (trimmed) persistTodos(todos.map(t => t.id === editingId ? { ...t, text: trimmed } : t));
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex(t => t.id === active.id);
      const newIndex = todos.findIndex(t => t.id === over.id);
      persistTodos(arrayMove(todos, oldIndex, newIndex));
    }
  };

  return (
    <Card className="h-[370px] flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Tareas Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        <div className="flex gap-4 mb-0">
          <button onClick={() => setActiveTab('tareas')} className={cn("pb-2 text-sm transition-colors", activeTab === 'tareas' ? "font-medium text-foreground border-b-2 border-primary" : "text-muted-foreground/60")}>
            Tareas
          </button>
          <button onClick={() => setActiveTab('historial')} className={cn("pb-2 text-sm transition-colors", activeTab === 'historial' ? "font-medium text-foreground border-b-2 border-primary" : "text-muted-foreground/60")}>
            Historial
          </button>
        </div>
        <Separator className="mb-3" />

        {activeTab === 'tareas' ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Escribe una nueva tarea…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 text-sm"
              />
              <Button size="sm" variant="outline" onClick={addTodo} className="shrink-0 h-9 w-9 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              {todos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sin tareas pendientes</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {todos.map(todo => (
                        <SortableTodoItem
                          key={todo.id}
                          todo={todo}
                          onComplete={completeTodo}
                          onRemove={removeTodo}
                          editingId={editingId}
                          editText={editText}
                          onStartEdit={startEdit}
                          onEditChange={setEditText}
                          onSaveEdit={saveEdit}
                          onCancelEdit={cancelEdit}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sin tareas finalizadas</p>
              ) : (
                <div className="space-y-1">
                  {history.map(todo => (
                    <div key={todo.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      <span className="text-sm flex-1 line-through text-muted-foreground">{todo.text}</span>
                      <span className="shrink-0 text-xs text-muted-foreground/60">{formatDate(todo.createdAt)}</span>
                      <button onClick={() => removeFromHistory(todo.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodoWidget;
