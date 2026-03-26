import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getFormularioBySlug, getPerguntasByFormulario, addResposta, addRespostaItem, addMatrizItem, type Pergunta } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from "lucide-react";
import QuestionRenderer from "@/components/perguntas/QuestionRenderer";
import FormCover from "@/components/FormCover";
import AnimatedStep from "@/components/AnimatedStep";
import { toast } from "sonner";

export default function PublicFormPage() {
  const { slug } = useParams();
  const formulario = getFormularioBySlug(slug || "");

  if (!formulario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground">Formulário não encontrado.</p>
        </div>
      </div>
    );
  }

  if (!formulario.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl mx-auto mb-4">S</div>
          <h1 className="text-xl font-bold mb-2">Pesquisa encerrada</h1>
          <p className="text-muted-foreground">Esta pesquisa está encerrada. Obrigado pela sua participação.</p>
        </div>
      </div>
    );
  }

  return <ActiveForm formulario={formulario} />;
}

function ActiveForm({ formulario }: { formulario: ReturnType<typeof getFormularioBySlug> }) {
  const [showCover, setShowCover] = useState(formulario.mostrar_capa ?? true);
  const perguntas = getPerguntasByFormulario(formulario!.id);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [matrizAnswers, setMatrizAnswers] = useState<Record<number, Record<string, number | 'NA'>>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Group perguntas into steps by secao
  const steps = useMemo(() => {
    const groups: Pergunta[][] = [[]];
    for (const p of perguntas) {
      if (p.tipo === 'secao' && groups[groups.length - 1].length > 0) {
        groups.push([]);
      }
      groups[groups.length - 1].push(p);
    }
    return groups.filter(g => g.length > 0);
  }, [perguntas]);

  const totalSteps = steps.length;
  const currentPerguntas = steps[currentStep] || [];
  const isLastStep = currentStep === totalSteps - 1;

  // Show cover if enabled
  if (showCover) {
    return <FormCover formulario={formulario!} onStart={() => setShowCover(false)} />;
  }

  const validate = () => {
    const newErrors: Record<number, string> = {};
    for (const p of currentPerguntas) {
      if (!p.obrigatorio || p.tipo === 'secao') continue;
      if (p.tipo === 'matriz_nps') {
        const ma = matrizAnswers[p.id];
        if (!ma || Object.keys(ma).length === 0) {
          newErrors[p.id] = "Responda todas as linhas";
        } else {
          // Verificar se todas as linhas foram respondidas
          const unansweredLines = p.config.linhas?.filter((linha: string) => 
            !ma[linha] || ma[linha] === undefined || ma[linha] === null
          );
          if (unansweredLines && unansweredLines.length > 0) {
            newErrors[p.id] = `Responda todas as linhas (${unansweredLines.length} pendente${unansweredLines.length > 1 ? 's' : ''})`;
          }
        }
      } else if (p.tipo === 'checkbox') {
        const val = answers[p.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          newErrors[p.id] = "Selecione ao menos uma opção";
        }
      } else {
        if (!answers[p.id] && answers[p.id] !== 0) {
          newErrors[p.id] = "Campo obrigatório";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Criar nova resposta
      const novaResposta = addResposta({
        formulario_id: formulario!.id,
        criado_em: new Date().toISOString(),
        ip_hash: `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // Salvar respostas simples
      Object.entries(answers).forEach(([perguntaId, valor]) => {
        addRespostaItem({
          resposta_id: novaResposta.id,
          pergunta_id: parseInt(perguntaId),
          valor: String(valor)
        });
      });

      // Salvar respostas da matriz NPS
      Object.entries(matrizAnswers).forEach(([perguntaId, matrizValue]) => {
        const perguntaIdNum = parseInt(perguntaId);
        
        // Para cada linha da matriz
        Object.entries(matrizValue).forEach(([linha, valor]) => {
          if (valor === 'NA') {
            addMatrizItem({
              resposta_id: novaResposta.id,
              pergunta_id: perguntaIdNum,
              linha: linha,
              nota: null,
              is_na: true
            });
          } else if (typeof valor === 'number') {
            addMatrizItem({
              resposta_id: novaResposta.id,
              pergunta_id: perguntaIdNum,
              linha: linha,
              nota: valor,
              is_na: false
            });
          }
        });
      });

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      toast.success("Respostas enviadas com sucesso!");
      setSubmitted(true);
      
    } catch (error) {
      console.error("Erro ao salvar respostas:", error);
      toast.error("Ocorreu um erro ao enviar suas respostas. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 px-4 py-6 flex items-center justify-center">
          <div className="text-center max-w-md animate-scale-in">
            <div className="relative inline-block">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4 animate-scale-in" />
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-success/20 scale-150 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold mb-2 animate-slide-up">Obrigado!</h1>
            <p className="text-muted-foreground animate-slide-up" style={{ animationDelay: '200ms' }}>
              {formulario?.mensagem_fim || "Obrigado pela sua participação! Suas respostas foram registradas com sucesso."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progress = totalSteps > 1 ? ((currentStep + 1) / totalSteps) * 100 : 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-5">
        <div className="max-w-[820px] mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground font-bold text-sm">S</div>
            <h1 className="text-lg font-bold">{formulario?.nome}</h1>
          </div>
          {formulario?.descricao && <p className="text-sm opacity-80 ml-11">{formulario.descricao}</p>}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-400" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-[820px] mx-auto space-y-5">
          <AnimatedStep direction="up" className="space-y-5">
            {currentPerguntas.map((p, index) => (
              <div 
                key={p.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {p.tipo === 'secao' ? (
                  <div className="border-l-4 border-primary pl-4 py-2 mb-4 animate-fade-in">
                    <h2 className="text-base font-bold">{p.texto}</h2>
                    {p.config.descricao && <p className="text-sm text-muted-foreground mt-1">{p.config.descricao}</p>}
                  </div>
                ) : (
                  <div className={`rounded-xl border bg-card p-5 transition-smooth ${errors[p.id] ? 'border-destructive animate-pulse' : ''}`}>
                    <label className="block text-sm font-bold mb-3">
                      {p.texto}
                      {p.obrigatorio && <span className="text-destructive ml-1">*</span>}
                    </label>
                    <QuestionRenderer
                      pergunta={p}
                      value={p.tipo === 'matriz_nps' ? matrizAnswers[p.id] : answers[p.id]}
                      error={errors[p.id]}
                      onChange={(val) => {
                        if (p.tipo === 'matriz_nps') {
                          setMatrizAnswers(prev => ({ ...prev, [p.id]: val }));
                        } else {
                          setAnswers(prev => ({ ...prev, [p.id]: val }));
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </AnimatedStep>
        </div>
      </div>

      {/* Footer nav */}
      <footer className="sticky bottom-0 border-t bg-card px-4 py-3 animate-slide-up">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm hover:bg-muted transition-all duration-200 transform hover:scale-105 ${currentStep === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" /> Voltar
          </button>
          <span className="text-xs text-muted-foreground animate-fade-in">
            Passo {currentStep + 1} de {totalSteps}
          </span>
          <button
            onClick={handleNext}
            disabled={submitting}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 ${isLastStep ? 'bg-success hover:bg-success/90' : 'bg-primary hover:bg-primary/90'} ${submitting ? 'animate-pulse' : ''}`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : isLastStep ? (
              <>
                <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /> Enviar respostas
              </>
            ) : (
              <>
                Próximo <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
