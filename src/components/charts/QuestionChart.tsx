import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import type { QuestionChartProps, Pergunta, RespostaItem, MatrizItem } from "@/types";

export default function QuestionChart({ pergunta, respostaItens, matrizItens = [] }: QuestionChartProps) {
  const renderChart = () => {
    switch (pergunta.tipo) {
      case 'nps_simples':
        return <NPSChart pergunta={pergunta} respostaItens={respostaItens} />;
      case 'matriz_nps':
        return <MatrizNPSChart pergunta={pergunta} matrizItens={matrizItens} />;
      case 'radio':
      case 'checkbox':
        return <MultipleChoiceChart pergunta={pergunta} respostaItens={respostaItens} />;
      case 'likert':
        return <LikertChart pergunta={pergunta} respostaItens={respostaItens} />;
      default:
        return <TextResponseChart pergunta={pergunta} respostaItens={respostaItens} />;
    }
  };

  return (
    <div className="bg-card border rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h4 className="font-medium text-sm truncate">{pergunta.texto}</h4>
      </div>
      {renderChart()}
    </div>
  );
}

function NPSChart({ pergunta, respostaItens }: { pergunta: Pergunta; respostaItens: RespostaItem[] }) {
  const items = respostaItens.filter(ri => ri.pergunta_id === pergunta.id);
  const scores = items.map(ri => parseInt(ri.valor)).filter(s => !isNaN(s));
  
  if (scores.length === 0) {
    return <p className="text-muted-foreground text-sm">Sem respostas</p>;
  }

  const promotores = scores.filter(s => s >= 9).length;
  const passivos = scores.filter(s => s >= 7 && s <= 8).length;
  const detratores = scores.filter(s => s <= 6).length;
  const score = Math.round((promotores / scores.length - detratores / scores.length) * 100);

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className={`text-xl sm:text-2xl font-bold ${score >= 50 ? 'text-success' : score >= 0 ? 'text-warning' : 'text-destructive'}`}>
          {score}
        </div>
        <p className="text-xs text-muted-foreground">Score NPS</p>
      </div>
      
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-success truncate flex-shrink-0">Promotores (9-10)</span>
          <span className="font-medium ml-2 flex-shrink-0">{promotores}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 sm:h-3">
          <div className="bg-success h-2 sm:h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${(promotores / scores.length) * 100}%` }} />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-warning truncate flex-shrink-0">Passivos (7-8)</span>
          <span className="font-medium ml-2 flex-shrink-0">{passivos}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 sm:h-3">
          <div className="bg-warning h-2 sm:h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${(passivos / scores.length) * 100}%` }} />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-destructive truncate flex-shrink-0">Detratores (0-6)</span>
          <span className="font-medium ml-2 flex-shrink-0">{detratores}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 sm:h-3">
          <div className="bg-destructive h-2 sm:h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${(detratores / scores.length) * 100}%` }} />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">{scores.length} respostas</p>
    </div>
  );
}

function MatrizNPSChart({ pergunta, matrizItens }: { pergunta: Pergunta; matrizItens: MatrizItem[] }) {
  const items = matrizItens.filter(mi => mi.pergunta_id === pergunta.id);
  
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Sem respostas</p>;
  }

  // Group by department and calculate NPS stats
  const deptStats: Record<string, { scores: number[], na: number }> = {};
  
  items.forEach(item => {
    if (!deptStats[item.linha]) {
      deptStats[item.linha] = { scores: [], na: 0 };
    }
    
    if (item.is_na) {
      deptStats[item.linha].na++;
    } else if (item.nota !== null) {
      deptStats[item.linha].scores.push(item.nota);
    }
  });

  const deptNPS = Object.entries(deptStats).map(([dept, stats]) => {
    const totalValido = stats.scores.length;
    if (totalValido === 0) {
      return { 
        dept, 
        scoreNps: null, 
        avg: 0, 
        totalValido: 0, 
        na: stats.na,
        promotores: 0,
        passivos: 0,
        detratores: 0
      };
    }

    // Calcular NPS (escala 0-10)
    const promotores = stats.scores.filter(n => n >= 9).length;
    const passivos = stats.scores.filter(n => n >= 7 && n <= 8).length;
    const detratores = stats.scores.filter(n => n <= 6).length;
    const scoreNps = Math.round((promotores / totalValido - detratores / totalValido) * 100);
    const avg = Number((stats.scores.reduce((a, b) => a + b, 0) / totalValido).toFixed(1));

    return { 
      dept, 
      scoreNps, 
      avg, 
      totalValido, 
      na: stats.na,
      promotores,
      passivos,
      detratores
    };
  }).sort((a, b) => (b.scoreNps ?? -100) - (a.scoreNps ?? -100)); // Ordenar por score NPS

  const getNpsColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 50) return 'text-success';
    if (score >= 0) return 'text-warning';
    return 'text-destructive';
  };

  const getNpsBgColor = (score: number | null) => {
    if (score === null) return 'bg-muted';
    if (score >= 50) return 'bg-success';
    if (score >= 0) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-3">
      {deptNPS.map(({ dept, scoreNps, avg, totalValido, na, promotores, passivos, detratores }) => (
        <div key={dept} className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium truncate flex-1">{dept}</span>
            <div className="flex items-center gap-2">
              {scoreNps !== null && (
                <span className={`font-bold ${getNpsColor(scoreNps)}`}>
                  {scoreNps > 0 ? '+' : ''}{scoreNps}
                </span>
              )}
              <span className="text-muted-foreground">
                {avg.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* NPS Score Bar */}
          {scoreNps !== null && (
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getNpsBgColor(scoreNps)}`} 
                style={{ width: `${Math.max(5, ((scoreNps + 100) / 200) * 100)}%` }} 
              />
            </div>
          )}
          
          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalValido} avaliações</span>
            {na > 0 && <span>{na} N/A</span>}
            {scoreNps !== null && (
              <span className="text-right">
                {promotores}P · {passivos}L · {detratores}D
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MultipleChoiceChart({ pergunta, respostaItens }: { pergunta: Pergunta; respostaItens: RespostaItem[] }) {
  const items = respostaItens.filter(ri => ri.pergunta_id === pergunta.id);
  const opcoes = pergunta.config.opcoes || [];
  
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Sem respostas</p>;
  }

  // Count each option
  const counts: Record<string, number> = {};
  items.forEach(item => {
    if (pergunta.tipo === 'checkbox') {
      // Multiple selections - split by comma
      const values = item.valor.split(',').map(v => v.trim());
      values.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
      });
    } else {
      // Single selection
      counts[item.valor] = (counts[item.valor] || 0) + 1;
    }
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {opcoes.map(opcao => {
        const count = counts[opcao] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={opcao} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium truncate flex-1">{opcao}</span>
              <span className="font-bold">{count}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground text-center pt-2">{total} respostas</p>
    </div>
  );
}

function LikertChart({ pergunta, respostaItens }: { pergunta: Pergunta; respostaItens: RespostaItem[] }) {
  const items = respostaItens.filter(ri => ri.pergunta_id === pergunta.id);
  const labels = pergunta.config.labels || [];
  
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Sem respostas</p>;
  }

  // Count each scale point
  const counts: Record<string, number> = {};
  items.forEach(item => {
    counts[item.valor] = (counts[item.valor] || 0) + 1;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {labels.map((label: string, index: number) => {
        const scaleValue = index + 1;
        const count = counts[scaleValue.toString()] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={scaleValue} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium truncate flex-1">{label}</span>
              <span className="font-bold">{count}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${percentage}%` }} 
              />
            </div>
            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground text-center pt-2">{total} respostas</p>
    </div>
  );
}

function TextResponseChart({ pergunta, respostaItens }: { pergunta: Pergunta; respostaItens: RespostaItem[] }) {
  const items = respostaItens.filter(ri => ri.pergunta_id === pergunta.id);
  const responses = items.map(ri => ri.valor).filter(v => v && v.trim() !== '');
  
  if (responses.length === 0) {
    return <p className="text-muted-foreground text-sm">Sem respostas</p>;
  }

  const avgLength = responses.reduce((acc, r) => acc + r.length, 0) / responses.length;
  const totalChars = responses.reduce((acc, r) => acc + r.length, 0);
  const longest = responses.reduce((a, b) => a.length > b.length ? a : b, '');
  const shortest = responses.reduce((a, b) => a.length < b.length ? a : b, '');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="text-center p-2 bg-muted rounded">
          <div className="font-bold text-lg">{responses.length}</div>
          <div className="text-muted-foreground">Respostas</div>
        </div>
        <div className="text-center p-2 bg-muted rounded">
          <div className="font-bold text-lg">{avgLength.toFixed(0)}</div>
          <div className="text-muted-foreground">Caracteres médios</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs">
          <span className="font-medium">Total caracteres:</span> {totalChars.toLocaleString()}
        </div>
        <div className="text-xs">
          <span className="font-medium">Maior resposta:</span> {longest.length} caracteres
        </div>
        <div className="text-xs">
          <span className="font-medium">Menor resposta:</span> {shortest.length} caracteres
        </div>
      </div>
      
      <div className="border-t pt-2">
        <p className="text-xs font-medium mb-1">Exemplos de respostas:</p>
        <div className="space-y-1">
          {responses.slice(0, 3).map((response, index) => (
            <div key={index} className="text-xs text-muted-foreground italic truncate">
              "{response}"
            </div>
          ))}
          {responses.length > 3 && (
            <div className="text-xs text-muted-foreground">
              ... e mais {responses.length - 3} respostas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
