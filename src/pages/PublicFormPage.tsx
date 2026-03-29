import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabasePublic } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from "lucide-react";
import QuestionRenderer from "@/components/perguntas/QuestionRenderer";
import FormCover from "@/components/FormCover";
import AnimatedStep from "@/components/AnimatedStep";
import { toast } from "sonner";
import { supabasePerguntaToMock, numberToUuid, type PerguntaMock } from "@/lib/supabaseAdapters";

export default function PublicFormPage() {
  const { slug } = useParams();
  const [formulario, setFormulario] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const loadFormulario = async () => {
      if (!slug) return;
      try {
        const { data: form, error } = await supabasePublic
          .from('formularios')
          .select('*')
          .eq('slug', slug)
          .eq('ativo', true)
          .single();

        if (error) throw error;
        setFormulario(form);
      } catch (error: any) {
        console.error('Erro ao carregar formulário:', error);
        setErrorDetails(error?.message || JSON.stringify(error) || "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    };
    loadFormulario();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground mb-4">Formulário não encontrado.</p>
          {errorDetails && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded text-left overflow-auto">
              <strong>Detalhes do erro:</strong><br />
              {errorDetails}
            </div>
          )}
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

function ActiveForm({ formulario }: { formulario: any }) {
  const [showCover, setShowCover] = useState(formulario.mostrar_capa ?? true);
  const [perguntas, setPerguntas] = useState<PerguntaMock[]>([]);
  const [isLoadingPerguntas, setIsLoadingPerguntas] = useState(true);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [matrizAnswers, setMatrizAnswers] = useState<Record<number, Record<string, number | 'NA'>>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    // Check if this form was already submitted by this browser
    if (formulario?.id) {
      const storageKey = `form_submitted_${formulario.id}`;
      if (localStorage.getItem(storageKey)) {
        setAlreadySubmitted(true);
      }
    }
  }, [formulario?.id]);

  useEffect(() => {
    const loadPerguntas = async () => {
      try {
        const { data, error } = await supabasePublic
          .from('perguntas')
          .select('*')
          .eq('formulario_id', formulario.id);

        if (error) throw error;

        const mapped = (data || []).map(p => supabasePerguntaToMock(p))
                          .sort((a, b) => a.ordem - b.ordem);
        setPerguntas(mapped);
      } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        toast.error('Erro ao carregar perguntas');
      } finally {
        setIsLoadingPerguntas(false);
      }
    };
    if (formulario?.id && formulario?.id !== undefined) {
      loadPerguntas();
    }
  }, [formulario.id]);

  // Group perguntas into steps by secao
  const steps = useMemo(() => {
    const groups: PerguntaMock[][] = [[]];
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
    return <FormCover formulario={formulario} onStart={() => setShowCover(false)} />;
  }

  if (isLoadingPerguntas) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Carregando perguntas...</p>
      </div>
    );
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
    if (!validate()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      // Criar resposta
      const { data: resposta, error: respostaError } = await supabasePublic
        .from('respostas')
        .insert({
          formulario_id: formulario.id,
          respondente_nome: null,
          respondente_email: null,
          respondente_departamento: null,
          ip_address: null,
          user_agent: null,
          finalizado: false
        })
        .select()
        .single();
      
      if (respostaError) throw respostaError;

      // Usar transação (via loop para simplicidade, um helper de insert array seria ideal)
      const respostaItensToInsert = [];

      // Salvar respostas normais
      for (const [perguntaId, valor] of Object.entries(answers)) {
        const pid = Number(perguntaId);
        const pergunta = perguntas.find(p => p.id === pid);
        if (!pergunta) continue;

        const perguntaUuid = numberToUuid(pid);
        if (!perguntaUuid) continue;

        let valorFinal = valor;
        if (pergunta.tipo === 'checkbox' && Array.isArray(valor)) {
          valorFinal = valor.join(', ');
        }

        respostaItensToInsert.push({
          resposta_id: resposta.id,
          pergunta_id: perguntaUuid,
          matriz_item_id: null,
          valor: String(valorFinal),
          arquivo_url: null
        });
      }

      // Salvar respostas de matriz
      for (const [perguntaId, linhas] of Object.entries(matrizAnswers)) {
        const pid = Number(perguntaId);
        const perguntaUuid = numberToUuid(pid);
        if (!perguntaUuid) continue;

        for (const [linha, nota] of Object.entries(linhas)) {
          respostaItensToInsert.push({
            resposta_id: resposta.id,
            pergunta_id: perguntaUuid,
            matriz_item_id: null,
            valor: JSON.stringify({
              linha,
              nota: nota === 'NA' ? null : Number(nota),
              is_na: nota === 'NA'
            }),
            arquivo_url: null
          });
        }
      }

      if (respostaItensToInsert.length > 0) {
        const { error: itemsError } = await supabasePublic.from('resposta_itens').insert(respostaItensToInsert);
        if (itemsError) throw itemsError;
      }

      // Finalizar resposta
      const { error: finalizeError } = await supabasePublic
        .from('respostas')
        .update({ finalizado: true })
        .eq('id', resposta.id);
        
      if (finalizeError) throw finalizeError;

      // Mark as submitted in localStorage to prevent duplicates
      localStorage.setItem(`form_submitted_${formulario.id}`, 'true');

      setSubmitted(true);
      toast.success("Resposta enviada com sucesso!");
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error("Erro ao enviar resposta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted || alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-success/10 p-4">
              <CheckCircle2 className="h-16 w-16 text-success" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{alreadySubmitted ? "Você já participou" : "Obrigado!"}</h1>
            <p className="text-muted-foreground">
              {alreadySubmitted 
                ? "Identificamos que você já enviou suas respostas para este formulário. Agradecemos sua participação!" 
                : (formulario.mensagem_fim || "Suas respostas foram registradas com sucesso.")
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          {formulario.logo_url && (
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-lg shadow-md p-3 max-w-[200px]">
                <img 
                  src={formulario.logo_url} 
                  alt="Logo" 
                  className="max-h-16 w-auto mx-auto object-contain" 
                />
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-3">{formulario.nome}</h1>
          {formulario.descricao && (
            <p className="text-muted-foreground text-lg">{formulario.descricao}</p>
          )}
        </div>

        {/* Progress */}
        {totalSteps > 1 && (
          <div className="mb-8 bg-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span className="font-medium">Etapa {currentStep + 1} de {totalSteps}</span>
              <span className="font-bold text-primary">{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Questions */}
        <AnimatedStep key={currentStep}>
          <div className="space-y-8">
            {currentPerguntas.map(p => {
              if (p.tipo === 'secao') {
                return (
                  <div key={p.id} className="pt-4">
                    <h2 className="text-xl font-bold text-foreground border-b-2 border-primary/30 pb-3">{p.texto}</h2>
                    {p.config?.descricao && (
                      <p className="text-muted-foreground text-sm mt-2">{p.config.descricao}</p>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={p.id}
                  className={`bg-card rounded-xl shadow-sm border border-border/50 ${p.tipo === 'matriz_nps' ? 'p-0' : ''}`}
                >
                  {/* Question title - Sticky no mobile */}
                  <div className={`${p.tipo === 'matriz_nps' ? 'px-6 pt-6 pb-4 border-b border-border/50 bg-muted/30' : 'px-6 pt-6 pb-4'} md:static sticky top-0 z-20 bg-card shadow-lg md:shadow-none rounded-t-xl backdrop-blur-sm`}>
                    <p className="font-semibold text-base text-foreground">
                      {p.texto}
                      {p.obrigatorio && <span className="text-destructive ml-1">*</span>}
                    </p>
                    {p.config?.descricao && (
                      <p className="text-muted-foreground text-sm mt-1">{p.config.descricao}</p>
                    )}
                  </div>

                  {/* Question body */}
                  <div className={p.tipo === 'matriz_nps' ? 'px-6 pb-6 pt-2' : 'px-6 pb-6'}>
                    <QuestionRenderer
                      pergunta={p}
                      value={p.tipo === 'matriz_nps' ? matrizAnswers[p.id] : answers[p.id]}
                      onChange={(val) => {
                        if (p.tipo === 'matriz_nps') {
                          setMatrizAnswers(prev => ({ ...prev, [p.id]: val }));
                        } else {
                          setAnswers(prev => ({ ...prev, [p.id]: val }));
                        }
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[p.id];
                          return newErrors;
                        });
                      }}
                      error={errors[p.id]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedStep>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 bg-card rounded-xl p-6 shadow-sm">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            <ChevronLeft className="h-5 w-5" />
            Anterior
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all font-medium shadow-lg shadow-primary/20"
            >
              {submitting ? 'Enviando...' : 'Enviar Respostas'}
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium shadow-lg shadow-primary/20"
            >
              Próxima Etapa
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
