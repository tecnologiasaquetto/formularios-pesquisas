import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage.tsx";
import AdminLayout from "./components/AdminLayout";
import FormulariosListPage from "./pages/admin/FormulariosListPage.tsx";
import NovoFormularioPage from "./pages/admin/NovoFormularioPage.tsx";
import ConstrutorPage from "./pages/admin/ConstrutorPage.tsx";
import FormSettingsPage from "./pages/admin/FormSettingsPage.tsx";
import RespostasPage from "./pages/admin/RespostasPage.tsx";
import UsersPage from "./pages/admin/UsersPage.tsx";
import PublicFormPage from "./pages/PublicFormPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/admin/formularios" replace />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
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
