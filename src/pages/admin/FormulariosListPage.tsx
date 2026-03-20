import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formularios, getRespostasByFormulario, toggleFormularioAtivo, deleteFormulario } from "@/lib/mockData";
import { Plus, Pencil, BarChart3, Copy, Trash2, Power, FileText } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { duplicateFormulario } from "@/lib/mockData";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function FormulariosListPageInner() {
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

  const handleDuplicateForm = (id: number) => {
    const newForm = duplicateFormulario(id);
    if (newForm) {
      setRefresh(n => n + 1);
      toast.success(`Formulário "${newForm.nome}" criado com sucesso!`);
      // Navigate to the new form's constructor
      setTimeout(() => {
        navigate(`/admin/formularios/${newForm.id}/construtor`);
      }, 1000);
    } else {
      toast.error("Erro ao duplicar formulário");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Formulários</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas pesquisas e formulários</p>
        </div>
        <Link
          to="/admin/formularios/novo"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo formulário</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      {formularios.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum formulário encontrado</h3>
          <p className="text-muted-foreground mb-4">Verifique o console para mais informações</p>
          <Link
            to="/admin/formularios/novo"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Criar primeiro formulário
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formularios.map(f => {
            const totalRespostas = getRespostasByFormulario(f.id).length;
            return (
              <div key={f.id} className="rounded-xl border bg-card p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[15px] break-words flex-1">{f.nome}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0 ${f.ativo ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {f.ativo ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">/f/{f.slug}</p>
                  {f.descricao && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{f.descricao}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{totalRespostas} resposta{totalRespostas !== 1 ? 's' : ''}</span>
                  <span>{new Date(f.criado_em).toLocaleDateString("pt-BR")}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 border-t pt-3">
                  <button onClick={() => navigate(`/admin/formularios/${f.id}/construtor`)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors flex-1 justify-center" title="Construtor">
                    <Pencil className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Editar</span>
                  </button>
                  <button onClick={() => navigate(`/admin/formularios/${f.id}/respostas`)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors flex-1 justify-center" title="Respostas">
                    <BarChart3 className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Respostas</span>
                  </button>
                  <button onClick={() => handleDuplicateForm(f.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors" title="Duplicar formulário">
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleCopyLink(f.slug)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors" title="Copiar link">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleToggle(f.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors" title={f.ativo ? "Pausar" : "Ativar"}>
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
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

export default function FormulariosListPage() {
  return (
    <ErrorBoundary>
      <FormulariosListPageInner />
    </ErrorBoundary>
  );
}
