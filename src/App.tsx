import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./components/AdminLayout";
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext";
import FormulariosListPage from "./pages/admin/FormulariosListPage";
import NovoFormularioPage from "./pages/admin/NovoFormularioPage";
import ConstrutorPage from "./pages/admin/ConstrutorPage";
import FormSettingsPage from "./pages/admin/FormSettingsPage";
import RespostasPage from "./pages/admin/RespostasPage";
import UsersPage from "./pages/admin/UsersPage";
import PublicFormPage from "./pages/PublicFormPage";
import NotFound from "./pages/NotFound";
import TestSupabaseConnection from "./test-supabase-connection";
import TestSimpleConnection from "./test-simple-connection";
import TestCorsFix from "./test-cors-fix";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
      gcTime: 1000 * 60 * 10, // 10 minutos - tempo no cache (antigo cacheTime)
      refetchOnWindowFocus: false, // Não refetch ao focar janela
      refetchOnReconnect: true, // Refetch ao reconectar
      retry: 1, // Tentar 1 vez em caso de erro
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/admin/formularios" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/test-supabase" element={<TestSupabaseConnection />} />
              <Route path="/test-connection" element={<TestSimpleConnection />} />
              <Route path="/test-cors" element={<TestCorsFix />} />
              
              {/* Protected admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <BreadcrumbProvider>
                    <AdminLayout />
                  </BreadcrumbProvider>
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/admin/formularios" replace />} />
                <Route path="formularios" element={<FormulariosListPage />} />
                <Route path="formularios/novo" element={
                  <ProtectedRoute requiredRole="administrador">
                    <NovoFormularioPage />
                  </ProtectedRoute>
                } />
                <Route path="formularios/:id/construtor" element={
                  <ProtectedRoute requiredRole="administrador">
                    <ConstrutorPage />
                  </ProtectedRoute>
                } />
                <Route path="formularios/:id/configuracoes" element={
                  <ProtectedRoute requiredRole="administrador">
                    <FormSettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="formularios/:id/respostas" element={<RespostasPage />} />
                <Route path="usuarios" element={
                  <ProtectedRoute requiredRole="administrador">
                    <UsersPage />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Public form routes */}
              <Route path="/f/:slug" element={<PublicFormPage />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
