import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { LoginCredentials } from "@/types/auth";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    senha: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!credentials.email || !credentials.senha) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    try {
      const success = await login(credentials);
      
      if (success) {
        toast.success("Login realizado com sucesso!");
        
        // Redirect to intended page or admin dashboard
        const redirectTo = searchParams.get('redirect') || '/admin';
        navigate(redirectTo);
      } else {
        setError("Email ou senha incorretos");
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.");
    }
  };

  const handleDemoLogin = (role: 'admin' | 'viewer') => {
    const demoCredentials = {
      admin: {
        email: "admin@saquetto.com.br",
        senha: "admin123"
      },
      viewer: {
        email: "joao.silva@saquetto.com.br", 
        senha: "joao123"
      }
    };

    setCredentials(demoCredentials[role]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Saquetto Forms</h1>
          <p className="text-gray-600">Sistema de Formulários e Pesquisas</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Use suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={credentials.senha}
                    onChange={(e) => setCredentials({ ...credentials, senha: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm">
                  Lembrar de mim
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3 text-center">
                Contas de demonstração:
              </p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDemoLogin('admin')}
                >
                  <div className="text-left">
                    <div className="font-medium">Administrador</div>
                    <div className="text-xs text-gray-500">admin@saquetto.com.br</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDemoLogin('viewer')}
                >
                  <div className="text-left">
                    <div className="font-medium">Visualizador</div>
                    <div className="text-xs text-gray-500">joao.silva@saquetto.com.br</div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Precisa de ajuda?{" "}
            <Link to="/suporte" className="text-blue-600 hover:underline">
              Contate o suporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
