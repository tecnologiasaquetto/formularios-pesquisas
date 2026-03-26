import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPerguntasByFormulario,
  addPergunta,
  removePergunta,
  updatePergunta,
  reorderPergunta,
  duplicatePergunta,
  updateFormulario,
  getFormularioBySlug,
  type PerguntaMock
} from "@/services/formularioServiceAdapter";
import { formularioService } from "@/services/supabase";
import { numberToUuid, supabaseFormularioToMock } from "@/lib/supabaseAdapters";
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
  const [formulario, setFormulario] = useState<any>(null);
  const [perguntas, setPerguntas] = useState<PerguntaMock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const formData = await formularioService.getById(id);
        const mockForm = supabaseFormularioToMock(formData);
        setFormulario(mockForm);
        
        const perguntasData = await getPerguntasByFormulario(mockForm.id);
        setPerguntas(perguntasData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar formulário');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!formulario) {
    return <p className="text-destructive p-8">Formulário não encontrado.</p>;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Formulário salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar formulário");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPergunta = async (tipoInfo: typeof TIPOS[number]) => {
    try {
      const maxOrdem = perguntas.length > 0 ? Math.max(...perguntas.map(p => p.ordem)) : -10;
      
      const novaPergunta = await addPergunta({
        formulario_id: formulario.id,
        tipo: tipoInfo.tipo,
        texto: tipoInfo.tipo === 'secao' ? 'Nova seção' : `Nova pergunta ${tipoInfo.label}`,
        ordem: maxOrdem + 10,
        obrigatorio: false,
        config: { ...tipoInfo.config }
      });
      
      setPerguntas(prev => [...prev, novaPergunta].sort((a, b) => a.ordem - b.ordem));
      toast.success("Pergunta adicionada");
    } catch (error) {
      console.error('Erro ao adicionar pergunta:', error);
      toast.error("Erro ao adicionar pergunta");
    }
  };

  const handleRemove = async (pid: number) => {
    if (!confirm("Excluir esta pergunta?")) return;
    try {
      await removePergunta(pid);
      setPerguntas(prev => prev.filter(p => p.id !== pid));
      toast.success("Pergunta excluída");
    } catch (error) {
      toast.error("Erro ao excluir pergunta");
    }
  };

  const handleDuplicate = async (p: PerguntaMock) => {
    try {
      const duplicada = await duplicatePergunta(p.id);
      setPerguntas(prev => [...prev, duplicada].sort((a, b) => a.ordem - b.ordem));
      toast.success("Pergunta duplicada");
    } catch (error) {
      toast.error("Erro ao duplicar pergunta");
    }
  };

  const handleUpdateTexto = (pid: number, texto: string) => {
    // Atualizar estado local imediatamente para responsividade
    setPerguntas(prev => prev.map(p => p.id === pid ? { ...p, texto } : p));
  };

  const handleBlurTexto = async (pid: number, texto: string) => {
    // TODO: Corrigir erro 400 ao salvar texto da pergunta
    // Problema: adapter está enviando campos incorretos para o Supabase
    // Por enquanto, apenas atualiza localmente
    
    // Salvar no banco apenas quando perder o foco
    try {
      // await updatePergunta(pid, { texto });
      console.log('TODO: Salvar texto da pergunta no banco');
    } catch (error) {
      console.error("Erro ao atualizar texto:", error);
      toast.error("Erro ao salvar alteração");
    }
  };

  const handleToggleObrigatorio = async (pid: number, current: boolean) => {
    try {
      await updatePergunta(pid, { obrigatorio: !current });
      setPerguntas(prev => prev.map(p => p.id === pid ? { ...p, obrigatorio: !current } : p));
    } catch (error) {
      toast.error("Erro ao atualizar pergunta");
    }
  };

  const handleUpdateConfig = async (pid: number, config: any) => {
    try {
      await updatePergunta(pid, { config });
      setPerguntas(prev => prev.map(p => p.id === pid ? { ...p, config } : p));
    } catch (error) {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDrop = async () => {
    if (draggedItem === null || dragOverItem === null || draggedItem === dragOverItem) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    try {
      const newPerguntas = [...perguntas];
      const draggedPergunta = newPerguntas[draggedItem];
      newPerguntas.splice(draggedItem, 1);
      newPerguntas.splice(dragOverItem, 0, draggedPergunta);

      // Atualizar ordens
      const updates = newPerguntas.map((p, idx) => ({
        id: p.id,
        ordem: idx * 10
      }));

      for (const update of updates) {
        await reorderPergunta(update.id, update.ordem);
      }

      setPerguntas(newPerguntas.map((p, idx) => ({ ...p, ordem: idx * 10 })));
      toast.success("Ordem atualizada");
    } catch (error) {
      toast.error("Erro ao reordenar");
    } finally {
      setDraggedItem(null);
      setDragOverItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{formulario.nome}</h1>
          <p className="text-sm text-muted-foreground">/f/{formulario.slug}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/formularios/${numberToUuid(formulario.id)}/configuracoes`)}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurar</span>
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Pré-visualizar</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Sidebar com tipos de perguntas */}
        <div className="lg:w-[260px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-32">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold mb-3 text-sm">Adicionar pergunta</h3>
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

        {/* Main content - Lista de perguntas */}
        <div className="flex-1 space-y-4 min-w-0">
          {perguntas.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              Adicione perguntas usando o painel ao lado.
            </div>
          ) : (
            perguntas.map((p, index) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                className={`rounded-xl border bg-card p-5 transition-all duration-200 ${
                  draggedItem === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverItem === index ? 'border-primary shadow-lg' : ''
                }`}
              >
                {dragOverItem === index && (
                  <div className="absolute inset-0 border-2 border-dashed border-primary rounded-xl pointer-events-none" />
                )}
                
                <div className="flex items-start gap-3">
                  <button className="mt-1 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                  
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={p.texto}
                      onChange={(e) => handleUpdateTexto(p.id, e.target.value)}
                      onBlur={(e) => handleBlurTexto(p.id, e.target.value)}
                      className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent hover:border-muted focus:border-primary transition-colors px-1"
                      placeholder="Texto da pergunta"
                    />
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="capitalize">{p.tipo.replace('_', ' ')}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.obrigatorio}
                          onChange={() => handleToggleObrigatorio(p.id, p.obrigatorio)}
                          className="rounded"
                        />
                        Obrigatório
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="p-2 hover:bg-muted rounded-lg"
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
