import { Users, GraduationCap, BookOpen, LayoutDashboard, Settings, LogOut, Layers, UserCog, FileText, Smartphone, Award, ChevronDown, History, FileImage, Wallet, Building2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Matrículas", url: "/matriculas", icon: GraduationCap },
  { title: "Cursos", url: "/cursos", icon: BookOpen },
  { title: "Cartera", url: "/cartera", icon: Wallet },
  { title: "Gestión de Personal", url: "/gestion-personal", icon: UserCog },
  { title: "Gestión de Formatos", url: "/gestion-formatos", icon: FileText },
  { title: "Niveles de Formación", url: "/niveles", icon: Layers },
  { title: "Portal Estudiante", url: "/portal-estudiante", icon: Smartphone },
];

const directorioItems = [
  { title: "Personas", url: "/personas", icon: Users },
  { title: "Empresas", url: "/empresas", icon: Building2 },
];

const certificacionItems = [
  { title: "Historial", url: "/certificacion/historial", icon: History },
  { title: "Plantillas", url: "/certificacion/plantillas", icon: FileImage },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isDirectorioActive = location.pathname.startsWith("/personas") || location.pathname.startsWith("/empresas");
  const isCertificacionActive = location.pathname.startsWith("/certificacion");

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            S
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">SAFA</span>
              <span className="text-xs text-muted-foreground">Sistema Administrativo</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== "/dashboard" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Certificación - Collapsible */}
              <Collapsible defaultOpen={isCertificacionActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Certificación"
                      isActive={isCertificacionActive}
                    >
                      <Award className="h-4 w-4" />
                      <span>Certificación</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {certificacionItems.map((sub) => {
                        const isSubActive = location.pathname === sub.url;
                        return (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                            >
                              <button onClick={() => navigate(sub.url)} className="w-full">
                                <sub.icon className="h-3.5 w-3.5" />
                                <span>{sub.title}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configuración">
              <button className="w-full">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Cerrar Sesión">
              <button onClick={handleLogout} className="w-full text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
