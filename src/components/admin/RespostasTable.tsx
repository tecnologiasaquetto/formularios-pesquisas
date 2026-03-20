import React, { useMemo } from "react";
import type { Resposta, Pergunta, RespostaItem, MatrizItem } from "@/types";

interface RespostasTableProps {
  respostas: Resposta[];
  perguntas: Pergunta[];
  respostaItens: RespostaItem[];
  matrizItens: MatrizItem[];
}

const RespostasTable = React.memo(function RespostasTable({ 
  respostas, 
  perguntas, 
  respostaItens, 
  matrizItens 
}: RespostasTableProps) {
  // Memoizar perguntas filtradas para evitar recálculo
  const filteredPerguntas = useMemo(() => 
    perguntas.filter(p => !['secao', 'texto_longo', 'texto_curto'].includes(p.tipo)),
    [perguntas]
  );

  // Memoizar headers para evitar recriação
  const headers = useMemo(() => [
    'ID', 'Data', 'IP Hash', ...filteredPerguntas.map(p => 
      p.tipo === 'matriz_nps' ? p.texto : p.texto
    )
  ], [filteredPerguntas]);
  const getRespostaValue = (respostaId: number, perguntaId: number): string => {
    const item = respostaItens.find(ri => ri.resposta_id === respostaId && ri.pergunta_id === perguntaId);
    return item?.valor || '';
  };

  const getMatrizValue = (respostaId: number, perguntaId: number, linha: string): string => {
    const item = matrizItens.find(mi => 
      mi.resposta_id === respostaId && 
      mi.pergunta_id === perguntaId && 
      mi.linha === linha
    );
    if (item?.is_na) return 'N/A';
    return item?.nota?.toString() || '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">ID</th>
            <th className="text-left p-3 font-medium">Data</th>
            <th className="text-left p-3 font-medium">IP Hash</th>
            {perguntas
              .filter(p => !['secao', 'texto_longo', 'texto_curto'].includes(p.tipo))
              .map(pergunta => (
                <th key={pergunta.id} className="text-left p-3 font-medium min-w-32">
                  {pergunta.tipo === 'matriz_nps' 
                    ? pergunta.texto 
                    : pergunta.texto
                  }
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {respostas.map(resposta => (
            <tr key={resposta.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-3 font-mono text-xs">{resposta.id}</td>
              <td className="p-3 text-xs">
                {new Date(resposta.criado_em).toLocaleString('pt-BR')}
              </td>
              <td className="p-3 font-mono text-xs text-muted-foreground">
                {resposta.ip_hash?.substring(0, 8)}...
              </td>
              {perguntas
                .filter(p => !['secao', 'texto_longo', 'texto_curto'].includes(p.tipo))
                .map(pergunta => (
                  <td key={pergunta.id} className="p-3">
                    {pergunta.tipo === 'matriz_nps' ? (
                      <div className="space-y-1">
                        {pergunta.config.linhas?.slice(0, 3).map(linha => (
                          <div key={linha} className="text-xs">
                            <span className="font-medium">{linha}:</span>{' '}
                            <span>{getMatrizValue(resposta.id, pergunta.id, linha)}</span>
                          </div>
                        ))}
                        {pergunta.config.linhas && pergunta.config.linhas.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{pergunta.config.linhas.length - 3} mais
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs truncate max-w-48">
                        {getRespostaValue(resposta.id, pergunta.id)}
                      </div>
                    )}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default RespostasTable;
