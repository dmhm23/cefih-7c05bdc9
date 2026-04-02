import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/personas": "Personas",
  "/matriculas": "Matrículas",
  "/cursos": "Cursos",
  "/niveles": "Niveles de Formación",
};

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  const getCurrentPageName = () => {
    const basePath = `/${pathSegments[0]}`;
    return routeNames[basePath] || pathSegments[0] || "Dashboard";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 h-svh overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">SAFA</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getCurrentPageName()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex-1" />

          <IconButton tooltip="Notificaciones" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          </IconButton>

          <div className="flex items-center gap-2 ml-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
