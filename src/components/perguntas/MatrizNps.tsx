interface Props {
  config: Record<string, any>;
  value: Record<string, number | 'NA'>;
  onChange: (val: Record<string, number | 'NA'>) => void;
}

export default function MatrizNps({ config, value, onChange }: Props) {
  const linhas: string[] = config.linhas || [];
  const min = config.escala_min || 1;
  const max = config.escala_max || 10;
  const mostrarNa = config.mostrar_na !== false;
  const notas = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const handleSelect = (linha: string, nota: number | 'NA') => {
    onChange({ ...value, [linha]: nota });
  };

  return (
    <div className="overflow-x-auto -mx-5 px-5">
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
          {linhas.map((linha, i) => (
            <tr key={linha} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2 px-2 font-medium text-xs">{linha}</td>
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
          ))}
        </tbody>
      </table>
      <div className="flex justify-between text-[11px] text-muted-foreground mt-2 min-w-[700px]">
        <span>◀ Muito ruim</span>
        <span>Excelente ▶</span>
      </div>
    </div>
  );
}
