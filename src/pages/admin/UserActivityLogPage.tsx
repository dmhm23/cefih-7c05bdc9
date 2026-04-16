import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Filter } from "lucide-react";
import { fetchUserActivityLogs, ActivityLogEntry } from "@/services/activityLogService";

const ACTION_COLORS: Record<string, string> = {
  crear: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  editar: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  eliminar: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  navegar: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  exportar: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  descargar: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  login: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  logout: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  subir: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  importar: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  completar: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  capturar: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  generar_masivo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  revocar: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  reemitir: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  aprobar: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  rechazar: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  restaurar: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  reabrir: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
};

const MODULES = [
  "todos", "dashboard", "personas", "empresas", "matriculas", "cursos",
  "niveles", "personal", "formatos", "portal_estudiante", "certificacion", "cartera", "admin",
];

const ACTIONS = [
  "todas", "navegar", "crear", "editar", "eliminar", "subir", "importar", "exportar", "descargar",
  "completar", "capturar", "generar_masivo", "revocar", "reemitir", "aprobar", "rechazar",
  "restaurar", "reabrir", "login", "logout",
];

export default function UserActivityLogPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("todos");
  const [actionFilter, setActionFilter] = useState("todas");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const userInfo = logs[0];

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const filters: Record<string, string> = {};
    if (moduleFilter !== "todos") filters.module = moduleFilter;
    if (actionFilter !== "todas") filters.action = actionFilter;
    fetchUserActivityLogs(userId, filters).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [userId, moduleFilter, actionFilter]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota" });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/logs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {userInfo?.user_name || userInfo?.user_email || "Usuario"}
          </h1>
          {userInfo && (
            <p className="text-sm text-muted-foreground">{userInfo.user_email}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </CardTitle>
            <div className="flex gap-2">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m === "todos" ? "Todos los módulos" : m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Acción" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === "todas" ? "Todas las acciones" : a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin registros para los filtros seleccionados</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Fecha/Hora</TableHead>
                    <TableHead className="w-28">Acción</TableHead>
                    <TableHead className="w-32">Módulo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-48">Ruta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpand(log.id)}
                      >
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-muted text-foreground"}`}
                          >
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{log.module ?? "—"}</TableCell>
                        <TableCell className="text-sm">{log.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {log.route ?? "—"}
                        </TableCell>
                      </TableRow>
                      {expanded.has(log.id) && log.metadata && Object.keys(log.metadata).length > 0 && (
                        <TableRow key={`${log.id}-meta`}>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <pre className="text-xs overflow-auto max-h-40 p-2 rounded">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
