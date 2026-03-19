import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getFormularioBySlug, getPerguntasByFormulario, type Pergunta } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from "lucide-react";
import QuestionRenderer from "@/components/perguntas/QuestionRenderer";

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

  const validate = () => {
    const newErrors: Record<number, string> = {};
    for (const p of currentPerguntas) {
      if (!p.obrigatorio || p.tipo === 'secao') continue;
      if (p.tipo === 'matriz_nps') {
        const ma = matrizAnswers[p.id];
        if (!ma || Object.keys(ma).length === 0) {
          newErrors[p.id] = "Responda ao menos uma linha";
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
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setCurrentStep(s => Math.max(0, s - 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Obrigado!</h1>
          <p className="text-muted-foreground">
            {formulario?.mensagem_fim || "Obrigado pela sua participação! Suas respostas foram registradas com sucesso."}
          </p>
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
          {currentPerguntas.map(p => (
            <div key={p.id}>
              {p.tipo === 'secao' ? (
                <div className="border-l-4 border-primary pl-4 py-2 mb-4">
                  <h2 className="text-base font-bold">{p.texto}</h2>
                  {p.config.descricao && <p className="text-sm text-muted-foreground mt-1">{p.config.descricao}</p>}
                </div>
              ) : (
                <div className={`rounded-xl border bg-card p-5 ${errors[p.id] ? 'border-destructive' : ''}`}>
                  <label className="block text-sm font-bold mb-3">
                    {p.texto}
                    {p.obrigatorio && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <QuestionRenderer
                    pergunta={p}
                    value={p.tipo === 'matriz_nps' ? matrizAnswers[p.id] : answers[p.id]}
                    onChange={(val) => {
                      if (p.tipo === 'matriz_nps') {
                        setMatrizAnswers(prev => ({ ...prev, [p.id]: val }));
                      } else {
                        setAnswers(prev => ({ ...prev, [p.id]: val }));
                      }
                      setErrors(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                    }}
                  />
                  {errors[p.id] && <p className="text-xs text-destructive mt-2">{errors[p.id]}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer nav */}
      <footer className="sticky bottom-0 border-t bg-card px-4 py-3">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm hover:bg-muted transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          <span className="text-xs text-muted-foreground">
            Passo {currentStep + 1} de {totalSteps}
          </span>
          <button
            onClick={handleNext}
            disabled={submitting}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50 ${isLastStep ? 'bg-success hover:opacity-90' : 'bg-primary hover:opacity-90'}`}
          >
            {submitting ? 'Enviando...' : isLastStep ? (
              <><Send className="h-4 w-4" /> Enviar respostas</>
            ) : (
              <>Próximo <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
