import { useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login, isAuthenticated } from "@/lib/auth";
import { useEffect } from "react";

export default function LoginPage() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) navigate("/admin/formularios");
  }, [navigate]);

  const handleLogin = () => {
    if (login(senha)) {
      navigate("/admin/formularios");
    } else {
      setErro("Senha incorreta");
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
              S
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Sistema de Pesquisas Saquetto</p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Senha de acesso"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(""); }}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border-[1.5px] border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Entrar
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">Dica: a senha é <strong>admin123</strong></p>
      </div>
    </div>
  );
}
