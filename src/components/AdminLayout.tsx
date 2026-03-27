import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, ChevronRight, User, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { ROLE_LABELS, ROLE_COLORS } from "@/types/auth";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { itemName } = useBreadcrumb();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Build breadcrumb
  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [
    { label: "Sistema", path: "/admin/formularios" },
  ];

  if (pathParts.includes("formularios")) {
    breadcrumbs.push({ label: "Formulários", path: "/admin/formularios" });
    const idIndex = pathParts.indexOf("formularios") + 1;
    if (pathParts[idIndex] === "novo") {
      breadcrumbs.push({ label: "Novo", path: "/admin/formularios/novo" });
    } else if (pathParts[idIndex]) {
      const id = pathParts[idIndex];
      // Use itemName if available, otherwise use #ID
      const displayLabel = itemName || `#${id.slice(0, 8)}...`;
      breadcrumbs.push({ label: displayLabel, path: `/admin/formularios/${id}/respostas` });
      
      if (pathParts.includes("construtor")) breadcrumbs.push({ label: "Construtor", path: location.pathname });
      if (pathParts.includes("respostas")) breadcrumbs.push({ label: "Respostas", path: location.pathname });
      if (pathParts.includes("configuracoes")) breadcrumbs.push({ label: "Configurações", path: location.pathname });
    }
  }

  if (pathParts.includes("usuarios")) {
    breadcrumbs.push({ label: "Usuários", path: "/admin/usuarios" });
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              S
            </div>
            <span className="font-semibold text-[15px] hidden sm:inline">Sistema de Pesquisas</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.nome}</span>
                  <Badge className={ROLE_COLORS[user.perfil]} variant="secondary">
                    {ROLE_LABELS[user.perfil]}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.nome}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <div className="mt-1">
                    <Badge className={ROLE_COLORS[user.perfil]} variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[user.perfil]}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/usuarios")} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Usuários
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-card px-4 md:px-6 py-2">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium">{bc.label}</span>
              ) : (
                <Link to={bc.path} className="hover:text-foreground transition-colors">{bc.label}</Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
