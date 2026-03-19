import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { isAuthenticated, logout } from "@/lib/auth";
import { LogOut, ChevronRight } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin");
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
      breadcrumbs.push({ label: `#${id}`, path: `/admin/formularios/${id}/construtor` });
      if (pathParts.includes("construtor")) breadcrumbs.push({ label: "Construtor", path: location.pathname });
      if (pathParts.includes("respostas")) breadcrumbs.push({ label: "Respostas", path: location.pathname });
      if (pathParts.includes("configuracoes")) breadcrumbs.push({ label: "Configurações", path: location.pathname });
    }
  }

  if (!isAuthenticated()) return null;

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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
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
