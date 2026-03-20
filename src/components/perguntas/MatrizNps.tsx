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

  // Mobile card view
  if (isMobileView) {
    return (
      <div className={`space-y-4 ${error ? 'border border-destructive rounded-lg p-1' : ''}`}>
        <div className="text-xs text-muted-foreground mb-2">
          <span>◀ Muito ruim</span>
          <span className="float-right">Excelente ▶</span>
        </div>
        
        {linhas.map((linha) => {
          const hasError = error && (!value[linha] || value[linha] === undefined || value[linha] === null);
          return (
            <div key={linha} className={`border rounded-lg p-3 space-y-3 ${hasError ? 'border-destructive bg-destructive/5' : ''}`}>
              <div className="font-medium text-sm text-foreground flex items-center justify-between">
                <span>{linha}</span>
                {hasError && <span className="text-xs text-destructive font-medium">Obrigatório</span>}
              </div>
              
              {/* Compact scale for mobile */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Nota:</span>
                  <div className="flex gap-1 flex-wrap">
                    {notas.map(n => (
                      <button
                        key={n}
                        onClick={() => handleSelect(linha, n)}
                        className={`w-6 h-6 rounded text-[10px] font-medium transition-colors ${
                          value[linha] === n
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-input hover:bg-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    {mostrarNa && (
                      <button
                        onClick={() => handleSelect(linha, 'NA')}
                        className={`w-6 h-6 rounded text-[9px] font-medium transition-colors ${
                          value[linha] === 'NA'
                            ? 'bg-muted-foreground text-card'
                            : 'border border-input hover:bg-muted'
                        }`}
                      >
                        NA
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Selected value display */}
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">Selecionado: </span>
                  <span className="text-sm font-bold text-primary">
                    {value[linha] || '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
