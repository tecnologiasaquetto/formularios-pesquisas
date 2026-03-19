import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./components/AdminLayout";
import FormulariosListPage from "./pages/admin/FormulariosListPage";
import NovoFormularioPage from "./pages/admin/NovoFormularioPage";
import ConstrutorPage from "./pages/admin/ConstrutorPage";
import RespostasPage from "./pages/admin/RespostasPage";
import PublicFormPage from "./pages/PublicFormPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="formularios" element={<FormulariosListPage />} />
            <Route path="formularios/novo" element={<NovoFormularioPage />} />
            <Route path="formularios/:id/construtor" element={<ConstrutorPage />} />
            <Route path="formularios/:id/respostas" element={<RespostasPage />} />
          </Route>
          <Route path="/f/:slug" element={<PublicFormPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
