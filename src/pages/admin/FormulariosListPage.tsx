import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formularios, getRespostasByFormulario, toggleFormularioAtivo, deleteFormulario } from "@/lib/mockData";
import { Plus, Pencil, BarChart3, Copy, Trash2, Power } from "lucide-react";
import { toast } from "sonner";

export default function FormulariosListPage() {
  const [, setRefresh] = useState(0);
  const navigate = useNavigate();

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`);
    toast.success("Link copiado!");
  };

  const handleToggle = (id: number) => {
    toggleFormularioAtivo(id);
    setRefresh(n => n + 1);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este formulário? Todos os dados serão perdidos.")) {
      deleteFormulario(id);
      setRefresh(n => n + 1);
      toast.success("Formulário excluído");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Formulários</h1>
        <Link
          to="/admin/formularios/novo"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Novo formulário
        </Link>
      </div>

      {formularios.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum formulário criado ainda</p>
          <Link
            to="/admin/formularios/novo"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Criar primeiro formulário
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {formularios.map(f => {
            const totalRespostas = getRespostasByFormulario(f.id).length;
            return (
              <div key={f.id} className="rounded-xl border bg-card p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[15px]">{f.nome}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${f.ativo ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {f.ativo ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">/f/{f.slug}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{totalRespostas} respostas</span>
                  <span>{new Date(f.criado_em).toLocaleDateString("pt-BR")}</span>
                </div>

                <div className="flex items-center gap-1.5 border-t pt-3">
                  <button onClick={() => navigate(`/admin/formularios/${f.id}/construtor`)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors" title="Construtor">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button onClick={() => navigate(`/admin/formularios/${f.id}/respostas`)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors" title="Respostas">
                    <BarChart3 className="h-3.5 w-3.5" /> Respostas
                  </button>
                  <button onClick={() => handleCopyLink(f.slug)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors" title="Copiar link">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleToggle(f.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors" title={f.ativo ? "Pausar" : "Ativar"}>
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors ml-auto" title="Excluir">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
