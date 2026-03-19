import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  formularios, getPerguntasByFormulario, addPergunta, removePergunta, updatePergunta,
  type Pergunta
} from "@/lib/mockData";
import {
  Grid3X3, Gauge, CircleDot, CheckSquare, SlidersHorizontal,
  AlignLeft, Type, Bookmark, GripVertical, Trash2, Copy, Eye
} from "lucide-react";
import { toast } from "sonner";
import FormularioPreviewModal from "@/components/FormularioPreviewModal";

const TIPOS = [
  { tipo: 'matriz_nps' as const, label: 'Matriz NPS', icon: Grid3X3, config: { linhas: ["ADMINISTRATIVO", "AJUSTAGEM", "ALMOXARIFADO", "CALDERARIA", "COMERCIAL", "COMPRAS", "CONTROLE DE QUALIDADE", "CUSTOS", "DEPARTAMENTO PESSOAL", "EXPEDIÇÃO/LOGISTICA", "FINANCEIRO", "FISCAL/FATURAMENTO", "MANUTENÇÃO", "PCP", "PINTURA", "RH", "SEGURANÇA DO TRABALHO", "SGI", "TECNOLOGIA DA INFORMAÇÃO", "USINAGEM"], escala_min: 1, escala_max: 10, mostrar_na: true } },
  { tipo: 'nps_simples' as const, label: 'NPS Simples', icon: Gauge, config: { escala_min: 0, escala_max: 10, label_min: 'De jeito nenhum', label_max: 'Com certeza!' } },
  { tipo: 'radio' as const, label: 'Múltipla escolha', icon: CircleDot, config: { opcoes: ['Opção 1', 'Opção 2', 'Opção 3'] } },
  { tipo: 'checkbox' as const, label: 'Caixas de seleção', icon: CheckSquare, config: { opcoes: ['Opção 1', 'Opção 2', 'Opção 3'] } },
  { tipo: 'likert' as const, label: 'Escala Likert', icon: SlidersHorizontal, config: { escala: 5, labels: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'] } },
  { tipo: 'texto_longo' as const, label: 'Texto longo', icon: AlignLeft, config: { placeholder: 'Escreva aqui...' } },
  { tipo: 'texto_curto' as const, label: 'Texto curto', icon: Type, config: { placeholder: 'Escreva aqui...' } },
  { tipo: 'secao' as const, label: 'Seção / título', icon: Bookmark, config: { descricao: '' } },
];

export default function ConstrutorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formularioId = Number(id);
  const formulario = formularios.find(f => f.id === formularioId);
  const [, setRefresh] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  if (!formulario) {
    return <p className="text-destructive">Formulário não encontrado.</p>;
  }

  const perguntas = getPerguntasByFormulario(formularioId);

  const handleAddPergunta = (tipoInfo: typeof TIPOS[number]) => {
    const maxOrdem = perguntas.length > 0 ? Math.max(...perguntas.map(p => p.ordem)) : -10;
    addPergunta({
      formulario_id: formularioId,
      tipo: tipoInfo.tipo,
      texto: tipoInfo.tipo === 'secao' ? 'Nova seção' : `Nova pergunta ${tipoInfo.label}`,
      ordem: maxOrdem + 10,
      obrigatorio: false,
      config: { ...tipoInfo.config }
    });
    setRefresh(n => n + 1);
  };

  const handleRemove = (pid: number) => {
    if (confirm("Excluir esta pergunta?")) {
      removePergunta(pid);
      setRefresh(n => n + 1);
      toast.success("Pergunta excluída");
    }
  };

  const handleDuplicate = (p: Pergunta) => {
    addPergunta({
      formulario_id: formularioId,
      tipo: p.tipo,
      texto: p.texto,
      ordem: p.ordem + 5,
      obrigatorio: p.obrigatorio,
      config: { ...p.config }
    });
    setRefresh(n => n + 1);
    toast.success("Pergunta duplicada");
  };

  const handleUpdateTexto = (pid: number, texto: string) => {
    updatePergunta(pid, { texto });
    setRefresh(n => n + 1);
  };

  const handleToggleObrigatorio = (pid: number, current: boolean) => {
    updatePergunta(pid, { obrigatorio: !current });
    setRefresh(n => n + 1);
  };

  const handleUpdateConfig = (pid: number, config: Record<string, any>) => {
    updatePergunta(pid, { config });
    setRefresh(n => n + 1);
  };

  const tipoLabel = (tipo: string) => TIPOS.find(t => t.tipo === tipo)?.label || tipo;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{formulario.nome} — Construtor</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
            <Eye className="h-4 w-4" /> Pré-visualizar
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left panel */}
        <div className="hidden md:block w-[260px] flex-shrink-0">
          <div className="rounded-xl border bg-card p-4 sticky top-32">
            <h2 className="text-sm font-bold mb-3">Adicionar pergunta</h2>
            <div className="space-y-1.5">
              {TIPOS.map(t => (
                <button
                  key={t.tipo}
                  onClick={() => handleAddPergunta(t)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <t.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">{perguntas.length} pergunta(s)</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 space-y-4 min-w-0">
          {perguntas.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              Adicione perguntas usando o painel ao lado.
            </div>
          ) : (
            perguntas.map(p => (
              <div key={p.id} className="rounded-xl border bg-card p-5">
                {/* Card header */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="inline-flex items-center rounded-lg bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {tipoLabel(p.tipo)}
                  </span>
                  {p.tipo !== 'secao' && (
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={p.obrigatorio}
                        onChange={() => handleToggleObrigatorio(p.id, p.obrigatorio)}
                        className="rounded"
                      />
                      Obrigatório
                    </label>
                  )}
                  <button onClick={() => handleDuplicate(p)} className="p-1.5 rounded hover:bg-muted" title="Duplicar">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleRemove(p.id)} className="p-1.5 rounded hover:bg-destructive/10" title="Excluir">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>

                {/* Question text */}
                {p.tipo === 'secao' ? (
                  <input
                    value={p.texto}
                    onChange={e => handleUpdateTexto(p.id, e.target.value)}
                    className="w-full text-base font-bold border-b border-transparent hover:border-input focus:border-primary focus:outline-none pb-1 bg-transparent"
                  />
                ) : (
                  <input
                    value={p.texto}
                    onChange={e => handleUpdateTexto(p.id, e.target.value)}
                    className="w-full text-sm font-bold border-b border-transparent hover:border-input focus:border-primary focus:outline-none pb-1 bg-transparent"
                  />
                )}

                {/* Config preview */}
                <div className="mt-3 text-xs text-muted-foreground">
                  {p.tipo === 'secao' && p.config.descricao !== undefined && (
                    <input
                      value={p.config.descricao}
                      onChange={e => handleUpdateConfig(p.id, { ...p.config, descricao: e.target.value })}
                      placeholder="Descrição da seção (opcional)"
                      className="w-full border-b border-transparent hover:border-input focus:border-primary focus:outline-none pb-1 bg-transparent text-sm"
                    />
                  )}
                  {p.tipo === 'matriz_nps' && (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-xs">Departamentos ({p.config.linhas?.length || 0}):</p>
                      <div className="flex flex-wrap gap-1">
                        {(p.config.linhas || []).map((l: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-0.5 text-[11px]">
                            {l}
                            <button onClick={() => {
                              const newLinhas = [...p.config.linhas];
                              newLinhas.splice(i, 1);
                              handleUpdateConfig(p.id, { ...p.config, linhas: newLinhas });
                            }} className="hover:text-destructive">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(p.tipo === 'radio' || p.tipo === 'checkbox') && (
                    <div className="space-y-1">
                      {(p.config.opcoes || []).map((op: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border border-input flex-shrink-0" />
                          <input
                            value={op}
                            onChange={e => {
                              const newOpcoes = [...p.config.opcoes];
                              newOpcoes[i] = e.target.value;
                              handleUpdateConfig(p.id, { ...p.config, opcoes: newOpcoes });
                            }}
                            className="flex-1 border-b border-transparent hover:border-input focus:border-primary focus:outline-none pb-0.5 bg-transparent text-sm text-foreground"
                          />
                          <button onClick={() => {
                            const newOpcoes = [...p.config.opcoes];
                            newOpcoes.splice(i, 1);
                            handleUpdateConfig(p.id, { ...p.config, opcoes: newOpcoes });
                          }} className="text-muted-foreground hover:text-destructive">×</button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleUpdateConfig(p.id, { ...p.config, opcoes: [...(p.config.opcoes || []), `Opção ${(p.config.opcoes?.length || 0) + 1}`] })}
                        className="text-primary text-xs hover:underline"
                      >
                        + Adicionar opção
                      </button>
                    </div>
                  )}
                  {p.tipo === 'likert' && (
                    <div className="flex gap-2 flex-wrap">
                      {(p.config.labels || []).map((l: string, i: number) => (
                        <span key={i} className="rounded-lg bg-accent px-2 py-0.5 text-[11px]">{l}</span>
                      ))}
                    </div>
                  )}
                  {p.tipo === 'nps_simples' && (
                    <p>Escala {p.config.escala_min} a {p.config.escala_max}: {p.config.label_min} → {p.config.label_max}</p>
                  )}
                  {(p.tipo === 'texto_longo' || p.tipo === 'texto_curto') && (
                    <p>Placeholder: {p.config.placeholder}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile warning */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-warning/10 border-t p-3 text-center text-sm text-warning">
        Use um computador para editar formulários.
      </div>

      {showPreview && (
        <FormularioPreviewModal
          formularioId={formularioId}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
