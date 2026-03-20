import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import type { TimelineChartProps, Resposta } from "@/types";

export default function TimelineChart({ respostas, title = "Evolução das Respostas" }: TimelineChartProps) {
  if (!respostas || respostas.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        <p className="text-muted-foreground text-sm">Sem respostas para analisar</p>
      </div>
    );
  }

  // Agrupar respostas por dia
  const respostasPorDia = respostas.reduce((acc, resposta) => {
    const data = new Date(resposta.criado_em).toLocaleDateString('pt-BR');
    acc[data] = (acc[data] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Ordenar datas
  const datasOrdenadas = Object.keys(respostasPorDia).sort((a, b) => {
    return new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime();
  });

  const maxRespostas = Math.max(...Object.values(respostasPorDia) as number[]);

  return (
    <div className="bg-card border rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h4 className="font-medium text-sm truncate">{title}</h4>
      </div>
      
      <div className="space-y-3">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold text-primary truncate">{respostas.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold text-success truncate">{datasOrdenadas.length}</div>
            <div className="text-xs text-muted-foreground">Dias</div>
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold text-warning truncate">
              {Math.round(respostas.length / datasOrdenadas.length)}
            </div>
            <div className="text-xs text-muted-foreground">Média/dia</div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="space-y-1 sm:space-y-2">
          {datasOrdenadas.map((data, index) => {
            const quantidade = respostasPorDia[data];
            const percentual = (quantidade / maxRespostas) * 100;
            
            return (
              <div key={data} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate flex-shrink-0">{data}</span>
                  <span className="font-medium ml-2 flex-shrink-0">{quantidade} resp.</span>
                </div>
                <div className="relative w-full min-w-0">
                  <div className="w-full bg-muted rounded-full h-2 sm:h-3">
                    <div 
                      className="bg-primary h-2 sm:h-3 rounded-full transition-all duration-500 ease-out hover:opacity-80"
                      style={{ 
                        width: `${percentual}%`,
                        animationDelay: `${index * 50}ms`
                      }}
                    />
                  </div>
                  {quantidade > 0 && (
                    <div className="absolute -top-1 right-0 bg-primary text-primary-foreground text-xs px-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                      {quantidade}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicador de tendência */}
        {datasOrdenadas.length > 1 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                Período: {datasOrdenadas[0]} até {datasOrdenadas[datasOrdenadas.length - 1]}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
