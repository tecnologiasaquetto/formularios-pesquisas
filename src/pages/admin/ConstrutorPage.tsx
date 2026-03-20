import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  formularios, getPerguntasByFormulario, addPergunta, removePergunta, updatePergunta,
  reorderPergunta, duplicatePergunta, updateFormulario,
  type Pergunta
} from "@/lib/mockData";
import {
  Grid3X3, Gauge, CircleDot, CheckSquare, SlidersHorizontal,
  AlignLeft, Type, Bookmark, GripVertical, Trash2, Copy, Eye, Settings, Save
} from "lucide-react";
import { toast } from "sonner";
import FormularioPreviewModal from "@/components/FormularioPreviewModal";
import LivePreview from "@/components/LivePreview";

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
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!formulario) {
    return <p className="text-destructive">Formulário não encontrado.</p>;
  }

  const perguntas = getPerguntasByFormulario(formularioId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Formulário salvo com sucesso!");
      setRefresh(prev => prev + 1);
    } catch (error) {
      toast.error("Erro ao salvar formulário");
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleDragStart = (e: React.DragEvent, perguntaId: number) => {
    setDraggedItem(perguntaId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, perguntaId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(perguntaId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (draggedItem && draggedItem !== targetId) {
      const targetPergunta = perguntas.find(p => p.id === targetId);
      if (targetPergunta) {
        reorderPergunta(draggedItem, targetPergunta.ordem);
        setRefresh(n => n + 1);
        toast.success("Pergunta reordenada");
      }
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDuplicatePergunta = (perguntaId: number) => {
    const newPergunta = duplicatePergunta(perguntaId);
    if (newPergunta) {
      setRefresh(n => n + 1);
      toast.success(`Pergunta "${newPergunta.texto}" duplicada!`);
    } else {
      toast.error("Erro ao duplicar pergunta");
    }
  };

  const tipoLabel = (tipo: string) => TIPOS.find(t => t.tipo === tipo)?.label || tipo;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold break-words">{formulario.nome} — Construtor</h1>
          <p className="text-sm text-muted-foreground mt-1">Arraste as perguntas para reordenar • Clique para editar</p>
          {(!formulario.data_inicio || !formulario.data_fim) && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ Dica: Configure as datas de início e fim em "Configurar" para limitar o período da pesquisa
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={() => navigate(`/admin/formularios/${id}/configuracoes`)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
            <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Configurar</span>
          </button>
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
            <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Pré-visualizar</span>
          </button>
          <button 
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              showLivePreview ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Live</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Mobile: horizontal scroll, Desktop: fixed sidebar */}
        <div className="lg:w-[260px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-32">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold mb-3 text-sm">Adicionar pergunta</h3>
              {/* Mobile: grid horizontal scroll, Desktop: vertical list */}
              <div className="lg:space-y-2">
                <div className="flex gap-2 lg:flex-col overflow-x-auto pb-2 lg:pb-0">
                  {TIPOS.map(tipo => (
                    <button
                      key={tipo.tipo}
                      onClick={() => handleAddPergunta(tipo)}
                      className="flex flex-col items-center gap-2 rounded-lg border p-3 text-xs hover:bg-muted transition-colors flex-shrink-0 lg:flex-row lg:justify-start lg:w-full"
                    >
                      <tipo.icon className="h-5 w-5" />
                      <span className="text-center whitespace-nowrap lg:whitespace-normal">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status do Formulário */}
            <div className="rounded-xl border bg-card p-4 mt-4">
              <h3 className="font-semibold mb-3 text-sm">Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Perguntas:</span>
                  <span className="font-medium">{perguntas.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${formulario.ativo ? 'text-success' : 'text-warning'}`}>
                    {formulario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {formulario.data_inicio && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Início:</span>
                    <span className="font-medium">
                      {new Date(formulario.data_inicio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {formulario.data_fim && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fim:</span>
                    <span className="font-medium">
                      {new Date(formulario.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={`flex-1 space-y-4 min-w-0 ${showLivePreview ? 'lg:pr-[400px]' : ''}`}>
          {perguntas.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              Adicione perguntas usando o painel ao lado.
            </div>
          ) : (
            perguntas.map(p => (
              <div 
                key={p.id} 
                className={`rounded-xl border bg-card p-5 transition-all duration-200 relative ${
                  draggedItem === p.id ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverItem === p.id ? 'border-primary shadow-lg' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, p.id)}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, p.id)}
                onDragEnd={handleDragEnd}
              >
                {dragOverItem === p.id && (
                  <div className="absolute inset-0 border-2 border-dashed border-primary rounded-xl pointer-events-none" />
                )}
                {/* Card header */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <GripVertical className={`h-4 w-4 cursor-grab active:cursor-grabbing ${
                    draggedItem === p.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className="inline-flex items-center rounded-lg bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {tipoLabel(p.tipo)}
                  </span>
                  {draggedItem === p.id && (
                    <span className="text-xs text-primary font-medium">Arrastando...</span>
                  )}
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
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button onClick={() => handleDuplicatePergunta(p.id)} className="p-1.5 rounded hover:bg-muted" title="Duplicar pergunta">
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleRemove(p.id)} className="p-1.5 rounded hover:bg-destructive/10" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
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

        {/* Live Preview Panel - Desktop only */}
        {showLivePreview && (
          <div className="hidden lg:block lg:w-[380px] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-32">
              <LivePreview 
                formularioId={formularioId} 
                showCover={formulario.mostrar_capa}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile tip - Only show on very small screens */}
      <div className="lg:hidden mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 Dica: Em telas maiores, use o painel lateral para adicionar perguntas mais facilmente.
        </p>
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
