import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  formularios, getPerguntasByFormulario, getRespostasByFormulario,
  respostaItens, matrizItens, calcNpsStats, calcMatrizMedias
} from "@/lib/mockData";
import { RefreshCw, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function RespostasPage() {
  const { id } = useParams();
  const formularioId = Number(id);
  const formulario = formularios.find(f => f.id === formularioId);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'respostas' | 'departamentos'>('dashboard');

  if (!formulario) return <p className="text-destructive">Formulário não encontrado.</p>;

  const perguntas = getPerguntasByFormulario(formularioId);
  const respostas = getRespostasByFormulario(formularioId);
  const npsStats = calcNpsStats(formularioId);
  const matrizMedias = calcMatrizMedias(formularioId);
  const hasMatriz = perguntas.some(p => p.tipo === 'matriz_nps');

  const handleExportCSV = () => {
    toast.success("CSV exportado! (protótipo)");
  };

  const npsColor = (score: number) => score >= 50 ? 'text-success' : score >= 0 ? 'text-warning' : 'text-destructive';

  // Stats per pergunta
  const getPerguntaStats = (perguntaId: number) => {
    const items = respostaItens.filter(ri => ri.pergunta_id === perguntaId);
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.valor] = (counts[i.valor] || 0) + 1; });
    return { counts, total: items.length };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{formulario.nome}</h1>
          <Link to={`/f/${formulario.slug}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
            /f/{formulario.slug} <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de respostas" value={String(respostas.length)} />
        {npsStats && (
          <>
            <MetricCard label="Score NPS" value={String(npsStats.score)} valueClass={npsColor(npsStats.score)} />
            <MetricCard label="Promotores" value={String(npsStats.promotores)} subtitle={`${Math.round(npsStats.promotores / npsStats.total * 100)}%`} valueClass="text-success" />
            <MetricCard label="Detratores" value={String(npsStats.detratores)} subtitle={`${Math.round(npsStats.detratores / npsStats.total * 100)}%`} valueClass="text-destructive" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>Dashboard</TabButton>
        <TabButton active={activeTab === 'respostas'} onClick={() => setActiveTab('respostas')}>Respostas</TabButton>
        {hasMatriz && <TabButton active={activeTab === 'departamentos'} onClick={() => setActiveTab('departamentos')}>Departamentos</TabButton>}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {npsStats && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-[15px] font-bold mb-3">NPS Geral</h3>
              <div className="flex items-center gap-4">
                <span className={`text-4xl font-bold ${npsColor(npsStats.score)}`}>{npsStats.score}</span>
                <div className="flex-1">
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <div className="bg-destructive" style={{ width: `${npsStats.detratores / npsStats.total * 100}%` }} />
                    <div className="bg-warning" style={{ width: `${npsStats.passivos / npsStats.total * 100}%` }} />
                    <div className="bg-success" style={{ width: `${npsStats.promotores / npsStats.total * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Detratores {Math.round(npsStats.detratores / npsStats.total * 100)}%</span>
                    <span>Passivos {Math.round(npsStats.passivos / npsStats.total * 100)}%</span>
                    <span>Promotores {Math.round(npsStats.promotores / npsStats.total * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {perguntas.filter(p => !['secao', 'texto_longo', 'texto_curto'].includes(p.tipo)).map(p => {
            const stats = getPerguntaStats(p.id);
            if (stats.total === 0) return null;
            return (
              <div key={p.id} className="rounded-xl border bg-card p-5">
                <h3 className="text-sm font-bold mb-3">{p.texto}</h3>
                {(p.tipo === 'radio' || p.tipo === 'checkbox' || p.tipo === 'likert') && (
                  <div className="space-y-2">
                    {Object.entries(stats.counts).sort((a, b) => b[1] - a[1]).map(([val, count]) => (
                      <div key={val} className="flex items-center gap-3">
                        <span className="text-xs w-40 truncate">{val}</span>
                        <div className="flex-1 bg-muted rounded-full h-2.5">
                          <div className="bg-primary rounded-full h-2.5 transition-all" style={{ width: `${count / stats.total * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(count / stats.total * 100)}%</span>
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
                          <span className="text-xs w-8 text-center font-medium">{n}</span>
                          <div className="flex-1 bg-muted rounded-full h-2.5">
                            <div className={`rounded-full h-2.5 transition-all ${n >= 9 ? 'bg-success' : n >= 7 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${count / stats.total * 100}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'respostas' && (
        <div className="rounded-xl border bg-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                {perguntas.filter(p => p.tipo !== 'secao').slice(0, 5).map(p => (
                  <th key={p.id} className="text-left px-4 py-3 font-medium max-w-[150px] truncate">{p.texto}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {respostas.slice(0, 20).map((r, i) => (
                <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 text-xs">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</td>
                  {perguntas.filter(p => p.tipo !== 'secao').slice(0, 5).map(p => {
                    const item = respostaItens.find(ri => ri.resposta_id === r.id && ri.pergunta_id === p.id);
                    return <td key={p.id} className="px-4 py-2.5 text-xs max-w-[150px] truncate">{item?.valor || '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-muted-foreground border-t">
            Mostrando {Math.min(20, respostas.length)} de {respostas.length} respostas
          </div>
        </div>
      )}

      {activeTab === 'departamentos' && (
        <div className="rounded-xl border bg-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Departamento</th>
                <th className="text-left px-4 py-3 font-medium">Média</th>
                <th className="text-left px-4 py-3 font-medium w-48">Progresso</th>
                <th className="text-right px-4 py-3 font-medium">Avaliações</th>
                <th className="text-right px-4 py-3 font-medium">N/A</th>
              </tr>
            </thead>
            <tbody>
              {matrizMedias.map(m => (
                <tr key={m.linha} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-medium">{m.linha}</td>
                  <td className="px-4 py-2.5 font-bold">{m.media}</td>
                  <td className="px-4 py-2.5">
                    <div className="bg-muted rounded-full h-2.5">
                      <div
                        className={`rounded-full h-2.5 transition-all ${m.media >= 7 ? 'bg-success' : m.media >= 5 ? 'bg-warning' : 'bg-destructive'}`}
                        style={{ width: `${m.media * 10}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs">{m.avaliacoes}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{m.na}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, subtitle, valueClass }: { label: string; value: string; subtitle?: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-[28px] font-bold leading-tight ${valueClass || ''}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}
