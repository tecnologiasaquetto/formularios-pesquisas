import React, { useMemo } from "react";
import QuestionChart from "@/components/charts/QuestionChart";
import TimelineChart from "@/components/charts/TimelineChart";
import type { Pergunta, NPSStats, Resposta, RespostaItem, MatrizItem } from "@/types";

interface DashboardContentProps {
  npsStats: NPSStats | null;
  perguntas: Pergunta[];
  filteredRespostas: Resposta[];
  respostaItens: RespostaItem[];
  matrizItens: MatrizItem[];
  getPerguntaStats: (perguntaId: number) => { total: number; counts: Record<string, number> };
  npsColor: (score: number) => string;
}

const DashboardContent = React.memo(function DashboardContent({
  npsStats,
  perguntas,
  filteredRespostas,
  respostaItens,
  matrizItens,
  getPerguntaStats,
  npsColor
}: DashboardContentProps) {
  // Memoizar perguntas filtradas para evitar recálculo
  const filteredPerguntas = useMemo(() => 
    perguntas.filter(p => !['secao', 'texto_longo', 'texto_curto'].includes(p.tipo)),
    [perguntas]
  );

  // Memoizar estatísticas calculadas
  const perguntasStats = useMemo(() => 
    filteredPerguntas.map(p => ({
      pergunta: p,
      stats: getPerguntaStats(p.id)
    })).filter(item => item.stats.total > 0),
    [filteredPerguntas, getPerguntaStats]
  );
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* NPS Geral */}
      {npsStats && (
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="text-[15px] font-bold mb-3">NPS Geral</h3>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className={`text-3xl sm:text-4xl font-bold ${npsColor(npsStats.score)}`}>
              {npsStats.score}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex h-3 sm:h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-destructive transition-all duration-500" 
                  style={{ width: `${npsStats.detratores / npsStats.total * 100}%` }} 
                />
                <div 
                  className="bg-warning transition-all duration-500" 
                  style={{ width: `${npsStats.passivos / npsStats.total * 100}%` }} 
                />
                <div 
                  className="bg-success transition-all duration-500" 
                  style={{ width: `${npsStats.promotores / npsStats.total * 100}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1 flex-wrap gap-1">
                <span>Detratores {Math.round(npsStats.detratores / npsStats.total * 100)}%</span>
                <span>Passivos {Math.round(npsStats.passivos / npsStats.total * 100)}%</span>
                <span>Promotores {Math.round(npsStats.promotores / npsStats.total * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline de Respostas */}
      <TimelineChart 
        respostas={filteredRespostas} 
        title="Evolução das Respostas" 
      />

      {/* Gráficos por Pergunta */}
      {perguntas
        .filter(p => !['secao', 'texto_longo', 'texto_curto'].includes(p.tipo))
        .map(p => {
          const stats = getPerguntaStats(p.id);
          if (stats.total === 0) return null;
          
          return (
            <div key={p.id} className="rounded-xl border bg-card p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-3 truncate pr-2">{p.texto}</h3>
              
              {(p.tipo === 'radio' || p.tipo === 'checkbox' || p.tipo === 'likert') && (
                <div className="space-y-1 sm:space-y-2">
                  {Object.entries(stats.counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([val, count]) => (
                      <div key={val} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs w-24 sm:w-40 truncate flex-shrink-0">{val}</span>
                        <div className="flex-1 bg-muted rounded-full h-2 sm:h-2.5 min-w-0">
                          <div 
                            className="bg-primary rounded-full h-2 sm:h-2.5 transition-all duration-500 ease-out" 
                            style={{ width: `${(Number(count) / Number(stats.total)) * 100}%` }} 
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 sm:w-10 text-right flex-shrink-0">
                          {Math.round((Number(count) / Number(stats.total)) * 100)}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
              
              {p.tipo === 'nps_simples' && (
                <div className="space-y-2">
                  {Array.from({ length: 11 }, (_, i) => i).map(n => {
                    const count = stats.counts[String(n)] || 0;
                    if (count === 0) return null;
                    
                    return (
                      <div key={n} className="flex items-center gap-3">
                        <span className="text-xs w-8">{n}</span>
                        <div className="flex-1 bg-muted rounded-full h-2.5">
                          <div 
                            className="bg-primary rounded-full h-2.5 transition-all" 
                            style={{ width: `${(Number(count) / Number(stats.total)) * 100}%` }} 
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
});

export default DashboardContent;
