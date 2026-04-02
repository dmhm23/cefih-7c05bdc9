import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface IconButtonProps extends ButtonProps {
  tooltip: string;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tooltip, tooltipSide = "bottom", children, ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button ref={ref} variant="ghost" size="icon" {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
);
IconButton.displayName = "IconButton";
