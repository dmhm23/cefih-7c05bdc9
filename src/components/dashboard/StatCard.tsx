import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ColorScheme = "green" | "red" | "orange" | "neutral";

interface StatCardProps {
  title: string;
  value: string;
  fullValue?: string;
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

const StatCard = ({ title, value, fullValue, description, icon: Icon, href, colorScheme = "neutral", loading }: StatCardProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    );
  }

  const valueContent = (
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="text-xl font-semibold text-foreground leading-none">{value}</span>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[colorScheme])} />
    </div>
  );

  return (
    <Card
      className="cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none whitespace-nowrap">
            {title}
          </span>
          <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        {fullValue ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>{valueContent}</TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg"
              >
                {fullValue}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          valueContent
        )}
        {description && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
