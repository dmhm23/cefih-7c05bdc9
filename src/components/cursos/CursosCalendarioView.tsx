import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays,
  isSameMonth, isSameDay, isWithinInterval, isToday,
  startOfDay, endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useCursos } from "@/hooks/useCursos";
import { Curso } from "@/types";

// Trainer colors
const TRAINER_COLORS = [
  { bg: "hsl(220 70% 55%)", bgLight: "hsl(220 70% 93%)", text: "hsl(220 70% 30%)", border: "hsl(220 70% 75%)" },
  { bg: "hsl(150 60% 42%)", bgLight: "hsl(150 60% 92%)", text: "hsl(150 60% 22%)", border: "hsl(150 60% 70%)" },
  { bg: "hsl(30 85% 55%)",  bgLight: "hsl(30 85% 93%)",  text: "hsl(30 85% 30%)",  border: "hsl(30 85% 75%)" },
  { bg: "hsl(270 60% 55%)", bgLight: "hsl(270 60% 93%)", text: "hsl(270 60% 30%)", border: "hsl(270 60% 75%)" },
  { bg: "hsl(340 70% 55%)", bgLight: "hsl(340 70% 93%)", text: "hsl(340 70% 30%)", border: "hsl(340 70% 75%)" },
  { bg: "hsl(180 55% 42%)", bgLight: "hsl(180 55% 92%)", text: "hsl(180 55% 22%)", border: "hsl(180 55% 70%)" },
  { bg: "hsl(0 70% 55%)",   bgLight: "hsl(0 70% 93%)",   text: "hsl(0 70% 30%)",   border: "hsl(0 70% 75%)" },
  { bg: "hsl(45 85% 50%)",  bgLight: "hsl(45 85% 92%)",  text: "hsl(45 85% 28%)",  border: "hsl(45 85% 70%)" },
];

type ViewMode = "month" | "week" | "day";

function getTrainerColorMap(cursos: Curso[]) {
  const trainers = [...new Set(cursos.map((c) => c.entrenadorId))];
  const map: Record<string, typeof TRAINER_COLORS[0]> = {};
  trainers.forEach((id, i) => {
    map[id] = TRAINER_COLORS[i % TRAINER_COLORS.length];
  });
  return map;
}

export default function CursosCalendarioView() {
  const navigate = useNavigate();
  const { data: cursos = [] } = useCursos();

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);

  const trainerColorMap = useMemo(() => getTrainerColorMap(cursos), [cursos]);

  const trainers = useMemo(() => {
    const map = new Map<string, string>();
    cursos.forEach((c) => map.set(c.entrenadorId, c.entrenadorNombre));
    return Array.from(map, ([id, nombre]) => ({ id, nombre }));
  }, [cursos]);

  // All trainers selected if none explicitly selected
  const activeTrainers = selectedTrainers.length === 0
    ? trainers.map((t) => t.id)
    : selectedTrainers;

  const filteredCursos = useMemo(
    () => cursos.filter((c) => activeTrainers.includes(c.entrenadorId)),
    [cursos, activeTrainers]
  );

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };
  const goNext = () => {
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const periodLabel = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: es });
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`;
    }
    return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });
  }, [currentDate, viewMode]);

  // Calendar grid days
  const gridDays = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: gridStart, end: gridEnd });
    }
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    return [startOfDay(currentDate)];
  }, [currentDate, viewMode]);

  // Get cursos for a specific day
  const getCursosForDay = (day: Date) => {
    return filteredCursos.filter((c) => {
      const start = new Date(c.fechaInicio);
      const end = new Date(c.fechaFin);
      return isWithinInterval(day, { start: startOfDay(start), end: endOfDay(end) });
    });
  };

  // Hours summary per trainer for current month
  const trainerSummary = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return trainers.map((t) => {
      const trainerCursos = cursos.filter(
        (c) =>
          c.entrenadorId === t.id &&
          isWithinInterval(new Date(c.fechaInicio), { start: monthStart, end: monthEnd })
      );
      return {
        ...t,
        cursoCount: trainerCursos.length,
        horasTotal: trainerCursos.reduce((sum, c) => sum + c.horasTotales, 0),
        color: trainerColorMap[t.id],
      };
    });
  }, [cursos, trainers, currentDate, trainerColorMap]);

  const toggleTrainer = (id: string) => {
    setSelectedTrainers((prev) => {
      if (prev.length === 0) {
        // First click: select only this one
        return [id];
      }
      if (prev.includes(id)) {
        const next = prev.filter((t) => t !== id);
        return next.length === 0 ? [] : next; // empty = all
      }
      return [...prev, id];
    });
  };

  const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="flex gap-4">
      {/* Main calendar area */}
      <div className="flex-1 space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoy
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold capitalize">{periodLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Trainer filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Entrenadores
                  {selectedTrainers.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                      {selectedTrainers.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => setSelectedTrainers([])}
                  >
                    <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                    <span className={selectedTrainers.length === 0 ? "font-semibold" : ""}>
                      Todos
                    </span>
                  </button>
                  {trainers.map((t) => {
                    const color = trainerColorMap[t.id];
                    const isActive = activeTrainers.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => toggleTrainer(t.id)}
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: isActive ? color.bg : "hsl(var(--muted))" }}
                        />
                        <span className={isActive && selectedTrainers.length > 0 ? "font-semibold" : ""}>
                          {t.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Supervisor filter (placeholder) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  Supervisor
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3">
                <p className="text-sm text-muted-foreground">Sin datos de supervisores aún.</p>
              </PopoverContent>
            </Popover>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              size="sm"
            >
              <ToggleGroupItem value="month" className="text-xs px-3">Mes</ToggleGroupItem>
              <ToggleGroupItem value="week" className="text-xs px-3">Semana</ToggleGroupItem>
              <ToggleGroupItem value="day" className="text-xs px-3">Día</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Calendar grid */}
        {viewMode === "month" && (
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-7 bg-muted">
              {DAY_NAMES.map((d) => (
                <div key={d} className="px-2 py-1.5 text-xs font-medium text-muted-foreground text-center border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7">
              {gridDays.map((day, i) => {
                const dayCursos = getCursosForDay(day);
                const inMonth = isSameMonth(day, currentDate);
                const today = isToday(day);
                return (
                  <div
                    key={i}
                    className={`min-h-[100px] border-r border-b last:border-r-0 p-1 ${
                      !inMonth ? "bg-muted/40" : ""
                    }`}
                  >
                    <div className={`text-xs mb-1 font-medium text-right ${
                      today
                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center ml-auto"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayCursos.slice(0, 3).map((c) => {
                        const color = trainerColorMap[c.entrenadorId];
                        return (
                          <button
                            key={c.id}
                            onClick={() => navigate(`/cursos/${c.id}`)}
                            className="w-full text-left rounded px-1.5 py-0.5 text-[11px] leading-tight truncate transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: color?.bgLight,
                              color: color?.text,
                              borderLeft: `3px solid ${color?.bg}`,
                            }}
                            title={`${c.nombre} - ${c.entrenadorNombre}`}
                          >
                            {c.nombre}
                          </button>
                        );
                      })}
                      {dayCursos.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">
                          +{dayCursos.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "week" && (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-muted">
              {gridDays.map((day, i) => (
                <div key={i} className="px-2 py-1.5 text-center border-r last:border-r-0">
                  <div className="text-xs text-muted-foreground">{DAY_NAMES[i]}</div>
                  <div className={`text-sm font-medium ${
                    isToday(day)
                      ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                      : ""
                  }`}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 min-h-[400px]">
              {gridDays.map((day, i) => {
                const dayCursos = getCursosForDay(day);
                return (
                  <div key={i} className="border-r last:border-r-0 p-1 space-y-1">
                    {dayCursos.map((c) => {
                      const color = trainerColorMap[c.entrenadorId];
                      return (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/cursos/${c.id}`)}
                          className="w-full text-left rounded-md p-2 text-xs transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: color?.bgLight,
                            color: color?.text,
                            borderLeft: `3px solid ${color?.bg}`,
                          }}
                        >
                          <div className="font-medium truncate">{c.nombre}</div>
                          <div className="text-[10px] opacity-70 mt-0.5">{c.entrenadorNombre}</div>
                          <div className="text-[10px] opacity-70">{c.horasTotales}h</div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "day" && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 text-center">
              <div className="text-xs text-muted-foreground">{DAY_NAMES[((currentDate.getDay() + 6) % 7)]}</div>
              <div className={`text-lg font-semibold ${
                isToday(currentDate)
                  ? "bg-primary text-primary-foreground rounded-full w-9 h-9 flex items-center justify-center mx-auto"
                  : ""
              }`}>
                {format(currentDate, "d")}
              </div>
            </div>
            <div className="min-h-[400px] p-3 space-y-2">
              {getCursosForDay(currentDate).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">Sin cursos para este día</p>
              )}
              {getCursosForDay(currentDate).map((c) => {
                const color = trainerColorMap[c.entrenadorId];
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/cursos/${c.id}`)}
                    className="w-full text-left rounded-lg p-3 transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: color?.bgLight,
                      color: color?.text,
                      borderLeft: `4px solid ${color?.bg}`,
                    }}
                  >
                    <div className="font-medium">{c.nombre}</div>
                    <div className="text-sm opacity-70 mt-1 flex items-center gap-3">
                      <span>{c.entrenadorNombre}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.horasTotales}h
                      </span>
                      <span>{c.duracionDias} días</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: hours summary */}
      <div className="w-64 shrink-0 space-y-3">
        <div className="border rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Horas por Entrenador
          </h3>
          <p className="text-xs text-muted-foreground mb-3 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </p>
          <div className="space-y-4">
            {trainerSummary.map((t) => (
              <div key={t.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: t.color?.bg }}
                    />
                    <span className="text-sm font-medium truncate max-w-[140px]">{t.nombre}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.cursoCount} curso{t.cursoCount !== 1 ? "s" : ""}</span>
                  <span className="font-semibold text-foreground">{t.horasTotal}h</span>
                </div>
                <Progress
                  value={Math.min((t.horasTotal / 160) * 100, 100)}
                  className="h-1.5"
                />
              </div>
            ))}
            {trainerSummary.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin cursos en este periodo</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
