import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Activity } from "lucide-react";
import { fetchUserActivitySummaries, UserActivitySummary } from "@/services/activityLogService";

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<UserActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUserActivitySummaries().then((data) => {
      setSummaries(data);
      setLoading(false);
    });
  }, []);

  const filtered = summaries.filter(
    (s) =>
      (s.user_email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.user_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", { timeZone: "America/Bogota" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Logs de Actividad</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Usuarios con actividad</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron registros</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                  <TableHead>Última actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow
                    key={s.user_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/logs/${s.user_id}`)}
                  >
                    <TableCell className="font-medium">{s.user_name || "—"}</TableCell>
                    <TableCell>{s.user_email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{s.total_actions}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(s.last_activity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
