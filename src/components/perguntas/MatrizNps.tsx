import { useState, useEffect } from "react";

interface Props {
  config: Record<string, any>;
  value: Record<string, number | 'NA'>;
  onChange: (val: Record<string, number | 'NA'>) => void;
  error?: string;
}

export default function MatrizNps({ config, value, onChange, error }: Props) {
  const linhas: string[] = config.linhas || [];
  const min = config.escala_min ?? 0; // Padrão 0
  const max = config.escala_max ?? 10; // Padrão 10
  const mostrarNa = config.mostrar_na !== false;
  const notas = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelect = (linha: string, nota: number | 'NA') => {
    onChange({ ...value, [linha]: nota });
  };

  // Mobile card view - Optimized for touch and better readability
  if (isMobileView) {
    return (
      <div className={`space-y-6 ${error ? 'border border-destructive rounded-xl p-1' : ''}`}>
        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          <span className="flex items-center gap-1">← Crítico</span>
          <span className="flex items-center gap-1">Excelente →</span>
        </div>
        
        {linhas.map((linha) => {
          const valorAtual = value[linha];
          const hasError = error && (valorAtual === undefined || valorAtual === null);
          
          return (
            <div 
              key={linha} 
              className={`bg-card border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
                hasError ? 'border-destructive ring-1 ring-destructive/20' : 'border-border'
              }`}
            >
              {/* Card Header (Row Title) */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${
                valorAtual !== undefined ? 'bg-primary/5' : 'bg-muted/40'
              }`}>
                <span className="font-bold text-sm text-foreground uppercase tracking-tight">{linha}</span>
                {valorAtual !== undefined && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in duration-300">
                    NOTA: {valorAtual}
                  </span>
                )}
              </div>

              {/* Rating Scale Section */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-6 gap-2">
                  {notas.slice(0, 6).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSelect(linha, n)}
                      className={`h-11 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                        valorAtual === n
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2'
                          : 'bg-muted/50 text-foreground border border-border hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {notas.slice(6).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSelect(linha, n)}
                      className={`h-11 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                        valorAtual === n
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2'
                          : 'bg-muted/50 text-foreground border border-border hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* N/A Option - Separated and distinct */}
                {mostrarNa && (
                  <div className="pt-2 border-t border-border/50">
                    <button
                      key="na-btn"
                      type="button"
                      onClick={() => handleSelect(linha, 'NA')}
                      className={`w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
                        valorAtual === 'NA'
                          ? 'bg-foreground text-background shadow-lg'
                          : 'bg-muted/30 text-muted-foreground border border-dashed border-border'
                      }`}
                    >
                      Não se aplica
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {error && <p className="text-xs text-destructive font-bold text-center animate-bounce">{error}</p>}
      </div>
    );
  }

  // Desktop table view (original)
  return (
    <div className={`overflow-x-auto -mx-5 px-5 ${error ? 'border border-destructive rounded-lg' : ''}`}>
      {error && (
        <div className="bg-destructive/10 border-b border-destructive px-4 py-2 mb-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 font-medium text-muted-foreground w-48">Departamento</th>
            {notas.map(n => (
              <th key={n} className="text-center py-2 px-1 font-medium text-muted-foreground w-8">{n}</th>
            ))}
            {mostrarNa && <th className="text-center py-2 px-1 font-medium text-muted-foreground w-10">N/A</th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => {
            const hasError = error && (!value[linha] || value[linha] === undefined || value[linha] === null);
            return (
              <tr key={linha} className={`${i % 2 === 0 ? 'bg-muted/30' : ''} ${hasError ? 'bg-destructive/5' : ''}`}>
                <td className={`py-2 px-2 font-medium text-xs ${hasError ? 'text-destructive' : ''}`}>{linha}</td>
                {notas.map(n => (
                  <td key={n} className="text-center py-1.5 px-1">
                    <button
                      onClick={() => handleSelect(linha, n)}
                      className={`w-7 h-7 rounded-full text-[11px] font-medium transition-colors ${
                        value[linha] === n
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-input hover:bg-muted'
                      }`}
                    >
                      {n}
                    </button>
                  </td>
                ))}
                {mostrarNa && (
                  <td className="text-center py-1.5 px-1">
                    <button
                      onClick={() => handleSelect(linha, 'NA')}
                      className={`w-7 h-7 rounded-full text-[10px] font-medium transition-colors ${
                        value[linha] === 'NA'
                          ? 'bg-muted-foreground text-card'
                          : 'border border-input hover:bg-muted'
                      }`}
                    >
                      N/A
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex justify-between text-[11px] text-muted-foreground mt-2 min-w-[700px]">
        <span>◀ Muito ruim</span>
        <span>Excelente ▶</span>
      </div>
    </div>
  );
}
