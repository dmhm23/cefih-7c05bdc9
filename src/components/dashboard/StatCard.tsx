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

const borderColors: Record<ColorScheme, string> = {
  green: "border-l-[hsl(var(--success))]",
  red: "border-l-[hsl(var(--destructive))]",
  orange: "border-l-[hsl(var(--warning))]",
  neutral: "border-l-[hsl(var(--primary))]",
};

const iconColors: Record<ColorScheme, string> = {
  green: "text-[hsl(var(--success))]",
  red: "text-[hsl(var(--destructive))]",
  orange: "text-[hsl(var(--warning))]",
  neutral: "text-[hsl(var(--primary))]",
};

const StatCard = ({ title, value, description, icon: Icon, href, colorScheme = "neutral", loading }: StatCardProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="border-l-4 border-l-muted">
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-l-4 cursor-pointer hover:shadow-lg transition-shadow",
        borderColors[colorScheme]
      )}
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <Icon className={cn("h-4 w-4", iconColors[colorScheme])} />
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
