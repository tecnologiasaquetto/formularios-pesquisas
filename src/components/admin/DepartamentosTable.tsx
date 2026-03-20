import React, { useMemo } from "react";
import type { MatrizStats } from "@/types";

interface DepartamentosTableProps {
  matrizStats: MatrizStats[];
}

const DepartamentosTable = React.memo(function DepartamentosTable({ matrizStats }: DepartamentosTableProps) {
  // Memoizar funções de cor para evitar recriação
  const colorHelpers = useMemo(() => ({
    getNpsColor: (score: number | null): string => {
      if (score === null) return 'text-muted-foreground';
      if (score >= 50) return 'text-success';
      if (score >= 0) return 'text-warning';
      return 'text-destructive';
    },

    getNpsBgColor: (score: number | null): string => {
      if (score === null) return 'bg-muted';
      if (score >= 50) return 'bg-success';
      if (score >= 0) return 'bg-warning';
      return 'bg-destructive';
    }
  }), []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium">Departamento</th>
            <th className="text-left px-4 py-3 font-medium">Score NPS</th>
            <th className="text-left px-4 py-3 font-medium">Média</th>
            <th className="text-right px-4 py-3 font-medium">Avaliações (total válido)</th>
            <th className="text-right px-4 py-3 font-medium">N/A (contagem)</th>
          </tr>
        </thead>
        <tbody>
          {matrizStats.map(m => (
            <tr key={m.linha} className="border-b hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 text-xs font-medium">{m.linha}</td>
              <td className="px-4 py-2.5 font-bold">
                {m.scoreNps !== null ? (
                  <span className={colorHelpers.getNpsColor(m.scoreNps)}>
                    {m.scoreNps > 0 ? '+' : ''}{m.scoreNps}
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className={`${colorHelpers.getNpsBgColor(m.scoreNps)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${(m.media / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium min-w-8 text-right">
                    {m.media.toFixed(1)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="font-medium">{m.avaliacoes}</span>
                  <span className="text-xs text-muted-foreground">
                    ({m.promotores}P · {m.passivos}L · {m.detratores}D)
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">
                {m.na}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default DepartamentosTable;
