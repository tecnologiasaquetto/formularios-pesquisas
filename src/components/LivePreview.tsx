import { getPerguntasByFormulario, formularios } from "@/lib/mockData";
import QuestionRenderer from "@/components/perguntas/QuestionRenderer";
import FormCoverPreview from "@/components/FormCoverPreview";
import { useState } from "react";

interface LivePreviewProps {
  formularioId: number;
  showCover?: boolean;
  className?: string;
}

export default function LivePreview({ formularioId, showCover = true, className = "" }: LivePreviewProps) {
  const perguntas = getPerguntasByFormulario(formularioId);
  const formulario = formularios.find(f => f.id === formularioId);
  const [showCoverState, setShowCoverState] = useState(showCover);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});

  // Group perguntas into steps by secao
  const steps = perguntas.reduce((acc: any[][], p) => {
    if (p.tipo === 'secao' && acc[acc.length - 1]?.length > 0) {
      acc.push([]);
    }
    if (!acc[acc.length - 1]) acc.push([]);
    acc[acc.length - 1].push(p);
    return acc;
  }, []);

  const currentPerguntas = steps[currentStep] || [];
  const totalSteps = steps.length;
  const progress = totalSteps > 1 ? ((currentStep + 1) / totalSteps) * 100 : 100;

  // Show cover if enabled
  if (showCoverState) {
    return (
      <div className={`bg-background border rounded-lg overflow-hidden ${className}`}>
        <div className="bg-muted px-3 py-2 border-b">
          <h4 className="text-sm font-medium">Pré-visualização</h4>
        </div>
        <FormCoverPreview 
          formulario={formulario || { 
            id: formularioId, 
            nome: "Formulário de Exemplo", 
            slug: "preview", 
            ativo: true,
            criado_em: new Date().toISOString(),
            mostrar_capa: true,
            logo_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop&crop=center",
            data_inicio: "",
            data_fim: "",
            cor_tema: "#3b82f6"
          }} 
          onStart={() => setShowCoverState(false)} 
        />
      </div>
    );
  }

  return (
    <div className={`bg-background border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-muted px-3 py-2 border-b">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Pré-visualização</h4>
          <div className="flex items-center gap-2">
            {totalSteps > 1 && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="text-xs px-1 py-0.5 rounded hover:bg-muted-foreground/10 disabled:opacity-50"
                >
                  ←
                </button>
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1}/{totalSteps}
                </span>
                <button 
                  onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                  disabled={currentStep === totalSteps - 1}
                  className="text-xs px-1 py-0.5 rounded hover:bg-muted-foreground/10 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
            <button 
              onClick={() => setShowCoverState(true)}
              className="text-xs px-2 py-0.5 rounded hover:bg-muted-foreground/10"
            >
              Capa
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {totalSteps > 1 && (
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {currentPerguntas.map((p, index) => (
            <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              {p.tipo === 'secao' ? (
                <div className="border-l-4 border-primary pl-3 py-2">
                  <h3 className="text-sm font-bold">{p.texto}</h3>
                  {p.config.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">{p.config.descricao}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    {p.texto}
                    {p.obrigatorio && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <QuestionRenderer
                    pergunta={p}
                    value={answers[p.id]}
                    onChange={(val) => setAnswers(prev => ({ ...prev, [p.id]: val }))}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {totalSteps > 1 ? `Etapa ${currentStep + 1} de ${totalSteps}` : 'Visualização em tempo real'}
          </span>
          <div className="flex gap-1">
            {totalSteps > 1 && currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-xs px-2 py-1 rounded border hover:bg-muted"
              >
                Anterior
              </button>
            )}
            {totalSteps > 1 && currentStep < totalSteps - 1 && (
              <button 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="text-xs px-2 py-1 rounded border hover:bg-muted"
              >
                Próxima
              </button>
            )}
            {totalSteps === 1 && (
              <button className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
                Enviar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
