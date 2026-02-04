import { cn } from "@/lib/utils";

type StatusType = 
  | "creada" | "pendiente" | "completa" | "certificada" | "cerrada"
  | "abierto" | "en_progreso" | "cerrado"
  | "verde" | "amarillo" | "rojo";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Estados de matrícula
  creada: { label: "Creada", className: "bg-slate-100 text-slate-700 border-slate-200" },
  pendiente: { label: "Pendiente", className: "bg-amber-100 text-amber-700 border-amber-200" },
  completa: { label: "Completa", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  certificada: { label: "Certificada", className: "bg-blue-100 text-blue-700 border-blue-200" },
  cerrada: { label: "Cerrada", className: "bg-gray-100 text-gray-700 border-gray-200" },
  // Estados de curso
  abierto: { label: "Abierto", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  en_progreso: { label: "En Progreso", className: "bg-blue-100 text-blue-700 border-blue-200" },
  cerrado: { label: "Cerrado", className: "bg-gray-100 text-gray-700 border-gray-200" },
  // Semáforo
  verde: { label: "Listo", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  amarillo: { label: "En Proceso", className: "bg-amber-100 text-amber-700 border-amber-200" },
  rojo: { label: "Bloqueado", className: "bg-red-100 text-red-700 border-red-200" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
