import { useState, useMemo } from "react";
import { getPerguntasByFormulario, formularios, type Pergunta } from "@/lib/mockData";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import QuestionRenderer from "./perguntas/QuestionRenderer";

interface Props {
  formularioId: number;
  onClose: () => void;
}

export default function FormularioPreviewModal({ formularioId, onClose }: Props) {
  const formulario = formularios.find(f => f.id === formularioId);
  const perguntas = getPerguntasByFormulario(formularioId);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});

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

  const currentPerguntas = steps[currentStep] || [];

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-3xl my-8 mx-4">
        <div className="bg-card rounded-xl overflow-hidden shadow-lg">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold">{formulario?.nome}</h2>
              {formulario?.descricao && <p className="text-sm opacity-80">{formulario.descricao}</p>}
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/20">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="h-1 bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {currentPerguntas.map(p => (
              <div key={p.id}>
                {p.tipo === 'secao' ? (
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <h3 className="font-bold">{p.texto}</h3>
                    {p.config.descricao && <p className="text-sm text-muted-foreground">{p.config.descricao}</p>}
                  </div>
                ) : (
                  <div className="rounded-xl border p-4">
                    <label className="block text-sm font-bold mb-3">
                      {p.texto} {p.obrigatorio && <span className="text-destructive">*</span>}
                    </label>
                    <QuestionRenderer
                      pergunta={p}
                      value={answers[p.id]}
                      onChange={val => setAnswers(prev => ({ ...prev, [p.id]: val }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-3 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted ${currentStep === 0 ? 'invisible' : ''}`}
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <span className="text-xs text-muted-foreground">Passo {currentStep + 1} de {steps.length}</span>
            <button
              onClick={() => currentStep < steps.length - 1 ? setCurrentStep(s => s + 1) : onClose()}
              className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm"
            >
              {currentStep === steps.length - 1 ? 'Fechar' : <>Próximo <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
