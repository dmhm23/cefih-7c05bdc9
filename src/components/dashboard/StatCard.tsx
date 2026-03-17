import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ColorScheme = "green" | "red" | "orange" | "neutral";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  href: string;
  colorScheme?: ColorScheme;
  loading?: boolean;
}

const dotColors: Record<ColorScheme, string> = {
  green: "bg-[hsl(var(--success))]",
  red: "bg-[hsl(var(--destructive))]",
  orange: "bg-[hsl(var(--warning))]",
  neutral: "bg-[hsl(var(--primary))]",
};

const StatCard = ({ title, value, description, icon: Icon, href, colorScheme = "neutral", loading }: StatCardProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-5">
        <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-3xl font-semibold text-foreground">{value}</span>
          <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[colorScheme])} />
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
