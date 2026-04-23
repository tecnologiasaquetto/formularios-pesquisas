// NPS Results Page - Admin Dashboard
import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { useFormulario } from "@/hooks/useFormularios";
import { 
  useRespostas, 
  usePerguntas, 
  useRespostaItens, 
  useMatrizItens, 
  useNpsStats, 
  useMatrizStats 
} from "@/hooks/useRespostas";
import type { MatrizStatItem } from "@/services/supabase";
import { RefreshCw, Download, ExternalLink, Eye, Info, Search, Calendar, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, FileText, QrCode, Printer } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from "recharts";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { utils, writeFile } from "xlsx";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function RespostasPage() {
  const { id } = useParams<{ id: string }>();
  const { setItemName, resetItemName } = useBreadcrumb();

  // React Query hooks
  const { data: formulario, isLoading: isLoadingForm } = useFormulario(id);
  const { data: perguntas = [], isLoading: isLoadingPerguntas } = usePerguntas(id);
  const { data: respostas = [], isLoading: isLoadingRespostas, refetch: refetchRespostas } = useRespostas(id);
  const { data: npsStats, refetch: refetchNps } = useNpsStats(id);
  const { data: matrizMedias = {}, refetch: refetchMatriz } = useMatrizStats(id);
  
  // Derived data
  const matrizPerguntaIds = perguntas
    .filter(p => p.tipo === 'matriz_nps')
    .map(p => p.id);
  const respostaIds = respostas.map(r => r.id);
  
  const { data: matrizItens = [] } = useMatrizItens(matrizPerguntaIds);
  const { data: respostaItens = [] } = useRespostaItens(respostaIds);
  
  // Loading state combinado
  const isLoading = isLoadingForm || isLoadingPerguntas || isLoadingRespostas;
  
  // Função para atualizar todos os dados
  const loadData = () => {
    refetchRespostas();
    refetchNps();
    refetchMatriz();
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'respostas' | 'departamentos' | 'parecer' | 'calculos' | 'divulgacao'>('dashboard');
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // PDF Generation Function
  const handleDownloadPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsGeneratingPDF(true);
    document.body.classList.add('pdf-mode');
    const toastId = toast.loading("Gerando documento de alta fidelidade...");
    
    try {
      // Delay maior para garantir que todas as animações terminaram e os gráficos estão 100% visíveis
      await new Promise(resolve => setTimeout(resolve, 1500));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - (2 * margin);
      
      // Capturamos cabeçalho, seções e blocos identificados
      const blocks = Array.from(element.querySelectorAll('.report-header, section, .is-report-block, .report-footer'));
      
      let currentY = margin;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i] as HTMLElement;
        
        // Verificamos se o bloco está visível antes de capturar
        const style = window.getComputedStyle(block);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const canvas = await html2canvas(block, {
          scale: 2, // 2x é suficiente e evita problemas de memória em relatórios longos
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          onclone: (clonedDoc) => {
            // Garantimos que no clone nada tenha opacidade ou animação
            const clonedElements = clonedDoc.getElementsByClassName('animate-in');
            for (let el of Array.from(clonedElements)) {
              el.classList.remove('animate-in', 'fade-in', 'duration-500');
              (el as HTMLElement).style.opacity = '1';
            }
          }
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

        // Se o bloco for maior que uma página inteira, precisamos tratar (raro para seções, comum para tabelas gigantes)
        if (imgHeight > (pdfHeight - 2 * margin)) {
           // Se for muito grande, adiciona em uma nova página e tenta ocupar o máximo
           if (currentY > margin) {
             pdf.addPage();
             currentY = margin;
           }
           const scaleFactor = (pdfHeight - 2 * margin) / imgHeight;
           pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight * scaleFactor, undefined, 'FAST');
           currentY = pdfHeight; // Força nova página para o próximo bloco
        } else {
          if (currentY + imgHeight > pdfHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight, undefined, 'FAST');
          currentY += imgHeight + 5;
        }
      }
      
      pdf.save(`${filename}.pdf`);
      toast.success("Download concluído!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Houve um erro na geração do PDF.", { id: toastId });
    } finally {
      document.body.classList.remove('pdf-mode');
      setIsGeneratingPDF(false);
    }
  };

  // Filters for Respostas tab
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<'criado_em' | 'respondente_nome'>('criado_em');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Atualizar breadcrumb quando formulário carregar
  useEffect(() => {
    if (formulario?.nome) {
      setItemName(formulario.nome);
    }
    return () => resetItemName();
  }, [formulario?.nome, setItemName, resetItemName]);

  // ─── Computed stats ──────────────────────────────────────────────────────────

  const hasMatriz = perguntas.some(p => p.tipo === 'matriz_nps');
  const matrizPerguntas = perguntas.filter(p => p.tipo === 'matriz_nps');
  const hasMatrizData = Object.keys(matrizMedias).length > 0;

  const npsColor = (score: number) =>
    score >= 75 ? 'text-emerald-600' : 
    score >= 50 ? 'text-emerald-500' : 
    score >= 0 ? 'text-amber-500' : 
    'text-destructive';

  const npsLabel = (score: number) =>
    score >= 75 ? 'Excelência' : 
    score >= 50 ? 'Qualidade' : 
    score >= 0 ? 'Aperfeiçoamento' : 
    'Zona Crítica';

  // Trend: group responses by day
  const trendData = useMemo(() => {
    const byDay: Record<string, number> = {};
    respostas.forEach(r => {
      const day = new Date(r.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      byDay[day] = (byDay[day] || 0) + 1;
    });
    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .slice(-14); // last 14 days
  }, [respostas]);

  // Stats per pergunta (handles both regular and matrix)
  const getPerguntaStats = (perguntaId: string) => {
    const items = respostaItens.filter(ri => ri.pergunta_id === perguntaId);
    const counts: Record<string, number> = {};
    let totalScoreCount = 0;
    let promotores = 0;
    let passivos = 0;
    let detratores = 0;
    let naCount = 0;

    items.forEach(item => {
      if (!item.valor) return;
      
      let val = String(item.valor);
      let nota: number | null = null;

      try {
        const parsed = JSON.parse(item.valor);
        if (parsed && typeof parsed === 'object' && 'linha' in parsed) {
          if (parsed.is_na) {
            naCount++;
            return;
          }
          val = String(parsed.nota);
          nota = Number(parsed.nota);
        }
      } catch {
        if (!isNaN(Number(val))) nota = Number(val);
      }

      counts[val] = (counts[val] || 0) + 1;
      
      if (nota !== null) {
        totalScoreCount++;
        if (nota >= 9) promotores++;
        else if (nota >= 7) passivos++;
        else detratores++;
      }
    });

    const total = items.length;
    const score = totalScoreCount > 0 
      ? Math.round(((promotores / totalScoreCount) - (detratores / totalScoreCount)) * 100)
      : 0;

    return { 
      total, 
      counts, 
      promotores, 
      passivos, 
      detratores, 
      naCount,
      score,
      totalScoreCount 
    };
  };

  // Filtered responses
  const filteredRespostas = useMemo(() => {
    let list = [...respostas];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(r =>
        (r.respondente_nome || '').toLowerCase().includes(q) ||
        (r.respondente_email || '').toLowerCase().includes(q) ||
        (r.respondente_departamento || '').toLowerCase().includes(q)
      );
    }
    if (dateFrom) list = list.filter(r => new Date(r.criado_em) >= new Date(dateFrom));
    if (dateTo) list = list.filter(r => new Date(r.criado_em) <= new Date(dateTo + 'T23:59:59'));

    list.sort((a, b) => {
      const av = sortField === 'criado_em' ? new Date(a.criado_em).getTime() : (a.respondente_nome || '').toLowerCase();
      const bv = sortField === 'criado_em' ? new Date(b.criado_em).getTime() : (b.respondente_nome || '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [respostas, searchText, dateFrom, dateTo, sortField, sortDir]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['#', 'Data', 'Respondente', 'E-mail', 'Departamento',
      ...perguntas.filter(p => p.tipo !== 'secao').map(p => p.texto)];
    const rows = filteredRespostas.map((r, i) => {
      const base = [
        i + 1,
        new Date(r.criado_em).toLocaleString('pt-BR'),
        r.respondente_nome || 'Anônimo',
        r.respondente_email || '',
        r.respondente_departamento || ''
      ];
      const answers = perguntas.filter(p => p.tipo !== 'secao').map(p => {
        const items = respostaItens.filter(ri => ri.resposta_id === r.id && ri.pergunta_id === p.id);
        return items.map(ri => {
          try {
            const parsed = JSON.parse(ri.valor);
            if (parsed && 'linha' in parsed) return `${parsed.linha}: ${parsed.is_na ? 'N/A' : parsed.nota}`;
          } catch {}
          return ri.valor || '';
        }).join(' | ');
      });
      return [...base, ...answers];
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formulario?.slug || 'respostas'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  // Export Excel
  const handleExportExcel = () => {
    try {
      const wb = utils.book_new();

      // 1. Sheet Resumo
      const resumoData = [
        ['Resumo do Relatório - ' + (formulario?.nome || '')],
        [''],
        ['KPI', 'Valor', 'Descrição'],
        ['Total de Respostas', totalRespostas, 'Volume total de participações'],
        ['NPS Geral', npsStats?.score || 0, npsLabel(npsStats?.score || 0)],
        ['Taxa de Conclusão', `${taxaConclusao}%`, 'Percentual de formulários finalizados'],
        [''],
        ['Distribuição NPS', 'Quantidade', 'Percentual'],
        ['Promotores (9-10)', npsStats?.promotores || 0, npsStats?.total ? Math.round((npsStats.promotores / npsStats.total) * 100) + '%' : '0%'],
        ['Passivos (7-8)', npsStats?.passivos || 0, npsStats?.total ? Math.round((npsStats.passivos / npsStats.total) * 100) + '%' : '0%'],
        ['Detratores (0-6)', npsStats?.detratores || 0, npsStats?.total ? Math.round((npsStats.detratores / npsStats.total) * 100) + '%' : '0%'],
      ];
      const wsResumo = utils.aoa_to_sheet(resumoData);
      utils.book_append_sheet(wb, wsResumo, "Resumo");

      // 2. Sheet Ranking por Depto (if matrix exists)
      if (hasMatriz) {
        const rankingData = [['Pergunta', 'Departamento', 'Média', 'Score NPS', 'Avaliações', 'N/A']];
        matrizPerguntas.forEach(p => {
          const stats = matrizMedias[p.id] || [];
          stats.forEach(m => {
            rankingData.push([
              p.texto,
              m.linha,
              m.media,
              m.scoreNps || 0,
              m.avaliacoes,
              m.na
            ]);
          });
        });
        const wsRanking = utils.aoa_to_sheet(rankingData);
        utils.book_append_sheet(wb, wsRanking, "Ranking por Depto");
      }

      // 3. Sheet Dados por Pergunta
      const perguntasData = [['ID', 'Pergunta', 'Tipo', 'Total Respostas', 'Score NPS', 'Promotores', 'Passivos', 'Detratores']];
      perguntas.filter(p => !['secao'].includes(p.tipo)).forEach(p => {
        const stats = getPerguntaStats(p.id);
        perguntasData.push([
          p.id,
          p.texto,
          p.tipo,
          stats.totalScoreCount,
          (p.tipo === 'matriz_nps' || p.tipo === 'nps_simples') ? stats.score : 'N/A',
          stats.promotores,
          stats.passivos,
          stats.detratores
        ]);
      });
      const wsPerguntas = utils.aoa_to_sheet(perguntasData);
      utils.book_append_sheet(wb, wsPerguntas, "Dados por Pergunta");

      // 4. Sheet Respostas Brutas
      const headers = ['#', 'Data', 'Respondente', 'E-mail', 'Departamento',
        ...perguntas.filter(p => p.tipo !== 'secao').map(p => p.texto)];
      const rows = filteredRespostas.map((r, i) => {
        const base = [
          i + 1,
          new Date(r.criado_em).toLocaleString('pt-BR'),
          r.respondente_nome || 'Anônimo',
          r.respondente_email || '',
          r.respondente_departamento || ''
        ];
        const answers = perguntas.filter(p => p.tipo !== 'secao').map(p => {
          const items = respostaItens.filter(ri => ri.resposta_id === r.id && ri.pergunta_id === p.id);
          return items.map(ri => {
            try {
              const parsed = JSON.parse(ri.valor);
              if (parsed && 'linha' in parsed) return `${parsed.linha}: ${parsed.is_na ? 'N/A' : parsed.nota}`;
            } catch {}
            return ri.valor || '';
          }).join(' | ');
        });
        return [...base, ...answers];
      });
      const wsRespostas = utils.aoa_to_sheet([headers, ...rows]);
      utils.book_append_sheet(wb, wsRespostas, "Respostas Brutas");

      // Export
      writeFile(wb, `${formulario?.slug || 'relatorio'}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar Excel');
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground">Formulário não encontrado.</p>
        <Link to="/admin/formularios" className="mt-4 text-sm text-primary underline">Voltar</Link>
      </div>
    );
  }

  const totalRespostas = respostas.length;
  const hoje = respostas.filter(r => new Date(r.criado_em).toDateString() === new Date().toDateString()).length;
  const semana = respostas.filter(r => {
    const d = new Date(r.criado_em);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
    return diff <= 7;
  }).length;
  const taxaConclusao = totalRespostas > 0
    ? Math.round(respostas.filter(r => r.finalizado).length / totalRespostas * 100)
    : 0;

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print, screen {
          .is-report-container {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            background: white !important;
            color: #1e293b !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          .pdf-mode .is-report-container {
            color: #000000 !important;
            animation: none !important;
            transition: none !important;
          }
          .pdf-mode .text-slate-500, .pdf-mode .text-slate-400, .pdf-mode .text-muted-foreground {
            color: #1e293b !important;
            opacity: 1 !important;
          }
          .pdf-mode .bg-slate-50, .pdf-mode .bg-muted/50 {
            background-color: #f1f5f9 !important;
          }
          .pdf-mode h1, .pdf-mode h2, .pdf-mode h3 {
            color: #000000 !important;
            font-weight: 900 !important;
          }
          .pdf-mode * {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            border-color: #cbd5e1 !important;
          }
        }
        @media print {
          @page { margin: 1cm; size: a4; }
          html, body { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important;
          }
          .is-report-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .flex:not(.print-flex), .grid:not(.print-grid) { 
            display: block !important; 
          }
          .print-flex { display: flex !important; }
          .print-grid { display: grid !important; }
          
          .overflow-hidden, .overflow-auto, .overflow-y-auto { 
            overflow: visible !important; 
            max-height: none !important;
          }
          .print\\:break-before-page { 
            page-break-before: always !important; 
            break-before: page !important; 
            display: block !important;
            clear: both !important;
          }
          .print\\:break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
          .print\\:hidden, aside, nav, footer, button, .tabs-container, header:not(.print-header) { display: none !important; }
          
          /* Colors preservation */
          .text-emerald-600 { color: #059669 !important; }
          .text-amber-500 { color: #f59e0b !important; }
          .text-red-600, .text-destructive { color: #dc2626 !important; }
          .bg-primary { background-color: #3b82f6 !important; -webkit-print-color-adjust: exact; }
          .bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; }
          .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
        }
      `}} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/admin/formularios" className="hover:underline">Formulários</Link>
            <span>/</span>
            <span className="truncate">{formulario.nome}</span>
          </div>
          <h1 className="text-xl font-bold truncate">Respostas — {formulario.nome}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
          <Link
            to={`/f/${formulario.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Ver pesquisa
          </Link>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" /> Exportar Relatório Excel
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total de Respostas" value={String(totalRespostas)} subtitle="desde o início" />
        <MetricCard label="Hoje" value={String(hoje)} subtitle={new Date().toLocaleDateString('pt-BR')} />
        <MetricCard label="Últimos 7 dias" value={String(semana)} subtitle="tendência recente" />
        <MetricCard
          label="Taxa de Conclusão"
          value={`${taxaConclusao}%`}
          subtitle="respostas finalizadas"
          valueClass={taxaConclusao >= 70 ? 'text-emerald-500' : taxaConclusao >= 40 ? 'text-amber-500' : 'text-destructive'}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1 print:hidden overflow-x-auto tabs-container">
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>Dashboard</TabButton>
        <TabButton active={activeTab === 'respostas'} onClick={() => setActiveTab('respostas')}>Respostas ({totalRespostas})</TabButton>
        {hasMatriz && (
          <TabButton active={activeTab === 'departamentos'} onClick={() => setActiveTab('departamentos')}>Departamentos</TabButton>
        )}
        <TabButton active={activeTab === 'divulgacao'} onClick={() => setActiveTab('divulgacao')}>
          <QrCode className="h-4 w-4 mr-1" />
          Divulgação
        </TabButton>
        <TabButton active={activeTab === 'parecer'} onClick={() => setActiveTab('parecer')}>Parecer Técnico</TabButton>
        <TabButton active={activeTab === 'calculos'} onClick={() => setActiveTab('calculos')}>Entendendo os Cálculos</TabButton>
      </div>

      {/* ── Dashboard Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {/* NPS Geral + Trend */}
          <div className="grid md:grid-cols-2 gap-5">
            {npsStats && npsStats.total > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-1.5 mb-4 group relative">
                  <h3 className="text-[15px] font-bold">NPS Geral</h3>
                  <Info className="h-3.5 w-3.5 text-primary/60 cursor-help" />
                  
                  {/* Detailed NPS Help Tooltip */}
                  <div className="absolute left-0 bottom-full mb-3 hidden group-hover:block w-80 p-5 bg-popover/95 backdrop-blur-sm border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-bold border-b border-border pb-2 mb-2">O que é o Score NPS?</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          O <strong>Net Promoter Score</strong> é o padrão global para medir satisfação e lealdade. 
                          Ele responde: "Em uma escala de 0 a 10, o quanto você recomendaria este serviço?"
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 py-1">
                        <div className="text-center p-2 rounded-lg bg-emerald-50 text-emerald-700">
                          <p className="text-[10px] font-bold">9-10</p>
                          <p className="text-[8px] font-medium uppercase">Promotores</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-amber-50 text-amber-700">
                          <p className="text-[10px] font-bold">7-8</p>
                          <p className="text-[8px] font-medium uppercase">Passivos</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-red-50 text-red-700">
                          <p className="text-[10px] font-bold">0-6</p>
                          <p className="text-[8px] font-medium uppercase">Detratores</p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                        <p className="text-[10px] font-bold mb-1 underline decoration-primary/40">Zonas de Desempenho:</p>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Excelência</span>
                            <span className="font-bold">75 a 100</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Qualidade</span>
                            <span className="font-bold">50 a 74</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"/> Aperfeiçoamento</span>
                            <span className="font-bold">0 a 49</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Crítica</span>
                            <span className="font-bold">-100 a -1</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] p-2 bg-primary/5 rounded border border-primary/20 text-primary italic text-center">
                        Fórmula: (% Promotores) - (% Detratores)
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Headline Score */}
                  <div className="flex flex-col items-center justify-center py-4 border-b border-border/50">
                    <p className={`text-7xl font-black tracking-tighter ${npsColor(npsStats.score)}`}>{npsStats.score}</p>
                    <p className={`text-sm font-bold mt-1 ${npsColor(npsStats.score)} uppercase tracking-[0.2em]`}>{npsLabel(npsStats.score)}</p>
                  </div>

                  {/* Step-by-Step Memory */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1 h-3 bg-primary rounded-full" />
                       Memória de Cálculo (Passo a Passo)
                    </h4>

                    {/* Step 1: Counts */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">1. Contagem de Votos</span>
                        <span className="text-[10px] font-medium text-slate-400">Total: {npsStats.total}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                          <p className="text-xs font-black text-emerald-600">{npsStats.promotores}</p>
                          <p className="text-[8px] text-emerald-500 uppercase font-bold">Promotores</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-amber-100 text-center">
                          <p className="text-xs font-black text-amber-600">{npsStats.passivos}</p>
                          <p className="text-[8px] text-amber-500 uppercase font-bold">Passivos</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-red-100 text-center">
                          <p className="text-xs font-black text-red-600">{npsStats.detratores}</p>
                          <p className="text-[8px] text-red-500 uppercase font-bold">Detratores</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Percentages */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">2. Conversão em Percentual</p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-emerald-700">Promotores: ({npsStats.promotores} / {npsStats.total}) × 100</span>
                            <span className="text-emerald-600">{Math.round(npsStats.promotores / npsStats.total * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-white border rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${npsStats.promotores / npsStats.total * 100}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-red-700">Detratores: ({npsStats.detratores} / {npsStats.total}) × 100</span>
                            <span className="text-red-600">{Math.round(npsStats.detratores / npsStats.total * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-white border rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${npsStats.detratores / npsStats.total * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Final Formula */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-primary/60 uppercase mb-2">3. Fórmula Final: % Prom. - % Detr.</p>
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                          <p className="text-lg font-black text-emerald-600">{Math.round(npsStats.promotores / npsStats.total * 100)}%</p>
                          <p className="text-[7px] text-slate-400 uppercase font-bold">Promotores</p>
                        </div>
                        <span className="text-slate-300 font-bold">−</span>
                        <div className="text-center">
                          <p className="text-lg font-black text-red-600">{Math.round(npsStats.detratores / npsStats.total * 100)}%</p>
                          <p className="text-[7px] text-slate-400 uppercase font-bold">Detratores</p>
                        </div>
                        <span className="text-slate-300 font-bold">=</span>
                        <div className="text-center px-3 py-1 bg-white rounded-lg border border-primary/20 shadow-sm">
                          <p className={`text-xl font-black ${npsColor(npsStats.score)}`}>{npsStats.score}</p>
                          <p className="text-[7px] text-slate-400 uppercase font-bold">Score NPS</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-3 italic">
                        * Os <strong>Passivos ({npsStats.passivos})</strong> são considerados neutros e não entram na subtração final.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trend Chart */}
            {trendData.length > 1 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="text-[15px] font-bold mb-4">Tendência de Respostas (14 dias)</h3>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" name="Respostas" stroke="#3b82f6" fill="url(#colorCount)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Per-question stats */}
          {perguntas.filter(p => !['secao', 'texto_longo', 'texto_curto'].includes(p.tipo)).map(p => {
            const stats = getPerguntaStats(p.id);
            if (stats.total === 0) return null;
            const entries = Object.entries(stats.counts).sort((a, b) => b[1] - a[1]);

            return (
              <div key={p.id} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="group relative flex items-center gap-1.5">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{p.texto}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground italic">Base: {stats.totalScoreCount} {p.tipo === 'matriz_nps' ? 'avaliações' : 'respostas'}</p>
                        {p.tipo === 'matriz_nps' && (
                          <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded font-medium text-primary">
                            Contagem por linha/setor
                          </span>
                        )}
                        {stats.naCount > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium text-muted-foreground">
                            {stats.naCount} N/A (Não se aplica)
                          </span>
                        )}
                      </div>
                    </div>
                    <Info className="h-3.5 w-3.5 text-primary/60 cursor-help mt-[-14px]" />
                    <div className="absolute left-0 bottom-full mb-3 hidden group-hover:block w-72 p-4 bg-popover border rounded-xl shadow-2xl z-50">
                      <p className="text-xs font-bold border-b pb-2 mb-2">Resumo NPS da Questão</p>
                      <div className="space-y-2.5 text-[10px] leading-tight">
                        <div className="flex gap-2 items-start">
                          <div className="w-2 h-2 rounded bg-emerald-500 mt-0.5 shrink-0" />
                          <p><strong>Promotores (9-10):</strong> Clientes leais e satisfeitos que recomendariam sua marca ativamente.</p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <div className="w-2 h-2 rounded bg-amber-500 mt-0.5 shrink-0" />
                          <p><strong>Passivos (7-8):</strong> Clientes satisfeitos porém neutros. Não indicam, mas também não falam mal.</p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <div className="w-2 h-2 rounded bg-red-500 mt-0.5 shrink-0" />
                          <p><strong>Detratores (0-6):</strong> Clientes insatisfeitos que podem gerar boca-a-boca negativo e cancelamentos.</p>
                        </div>
                        <div className="pt-1 text-center font-black bg-muted/30 py-1.5 rounded text-[11px] text-primary">
                          Score = % Promotores - % Detratores
                        </div>
                      </div>
                    </div>
                  </div>
                  {p.tipo === 'matriz_nps' && (
                    <div className="text-right flex flex-col items-end">
                      <p className={`text-2xl font-black ${npsColor(stats.score)}`}>{stats.score}</p>
                      <div className="flex items-center gap-1 group relative">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground whitespace-nowrap">NPS Questão</p>
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-popover border rounded-lg shadow-xl z-50 text-[10px] leading-tight font-medium text-muted-foreground">
                          <p className="font-bold border-b pb-1 mb-1 text-primary">Memória de Cálculo:</p>
                          <p className="font-black text-foreground mb-1">
                            {Math.round(stats.promotores / Math.max(stats.totalScoreCount, 1) * 100)}% (Prom.) - {Math.round(stats.detratores / Math.max(stats.totalScoreCount, 1) * 100)}% (Detr.) = {stats.score}
                          </p>
                          <p className="opacity-70">
                            Score NPS calculado exclusivamente para os dados desta pergunta.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* NPS Breakdown for Matrix or NPS Simples */}
                {(p.tipo === 'matriz_nps' || p.tipo === 'nps_simples') && (
                  <div className="grid sm:grid-cols-2 gap-8 py-2">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Distribuição NPS</p>
                        <div className="group relative">
                          <span className="text-[10px] font-bold text-primary underline decoration-dotted cursor-help">Como foi calculado?</span>
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-popover border rounded-xl shadow-2xl z-50">
                            <p className="text-[10px] font-bold border-b pb-1 mb-2">Memória de Cálculo (Questão):</p>
                            <div className="space-y-2 text-[9px]">
                              <div className="flex justify-between">
                                <span className="text-emerald-600 font-bold">Promotores:</span>
                                <span>{stats.promotores} ({Math.round(stats.promotores / Math.max(stats.totalScoreCount, 1) * 100)}%)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-red-500 font-bold">Detratores:</span>
                                <span>{stats.detratores} ({Math.round(stats.detratores / Math.max(stats.totalScoreCount, 1) * 100)}%)</span>
                              </div>
                              <div className="pt-1 border-t flex justify-between font-black text-primary">
                                <span>Score Final:</span>
                                <span>{Math.round(stats.promotores / Math.max(stats.totalScoreCount, 1) * 100)}% - {Math.round(stats.detratores / Math.max(stats.totalScoreCount, 1) * 100)}% = {stats.score}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Promotores (9-10)</span>
                            <span className="text-emerald-600 font-bold">{stats.totalScoreCount > 0 ? Math.round(stats.promotores / stats.totalScoreCount * 100) : 0}%</span>
                          </div>
                          <div className="bg-muted rounded-full h-2">
                            <div className="bg-emerald-500 rounded-full h-full" style={{ width: `${stats.totalScoreCount > 0 ? stats.promotores / stats.totalScoreCount * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Passivos (7-8)</span>
                            <span className="text-amber-600 font-bold">{stats.totalScoreCount > 0 ? Math.round(stats.passivos / stats.totalScoreCount * 100) : 0}%</span>
                          </div>
                          <div className="bg-muted rounded-full h-2">
                            <div className="bg-amber-500 rounded-full h-full" style={{ width: `${stats.totalScoreCount > 0 ? stats.passivos / stats.totalScoreCount * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Detratores (0-6)</span>
                            <span className="text-destructive font-bold">{stats.totalScoreCount > 0 ? Math.round(stats.detratores / stats.totalScoreCount * 100) : 0}%</span>
                          </div>
                          <div className="bg-muted rounded-full h-2">
                            <div className="bg-destructive rounded-full h-full" style={{ width: `${stats.totalScoreCount > 0 ? stats.detratores / stats.totalScoreCount * 100 : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Distribuição de Notas</p>
                        {p.tipo === 'matriz_nps' && (
                          <span className="text-[9px] text-muted-foreground italic">*Cada linha conta como 1 voto</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: 11 }, (_, i) => i).map(n => {
                          const count = stats.counts[String(n)] || 0;
                          const percentage = stats.totalScoreCount > 0 ? (count / stats.totalScoreCount * 100) : 0;
                          if (count === 0) return null;
                          return (
                            <div key={n} className="flex flex-col items-center bg-muted/30 rounded p-2 min-w-[45px]">
                              <span className={`text-xs font-bold ${n >= 9 ? 'text-emerald-600' : n >= 7 ? 'text-amber-600' : 'text-destructive'}`}>{n}</span>
                              <span className="text-[10px] font-medium">{count}</span>
                              <div className="w-full bg-muted h-1 mt-1 rounded-full overflow-hidden">
                                <div className={`h-full ${n >= 9 ? 'bg-emerald-500' : n >= 7 ? 'bg-amber-500' : 'bg-destructive'}`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Legenda Explicativa */}
                      <div className="mt-2 p-2.5 bg-muted/20 border rounded-lg text-[10px] text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                        <span className="font-semibold text-foreground">Legenda:</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span><strong className="text-emerald-700 dark:text-emerald-400">Nº Superior:</strong> Nota recebida</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-foreground/60"></span>
                          <span><strong className="text-foreground">Nº Central:</strong> Qtd. de Votos</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5 sm:mt-0">
                          <span className="w-3 h-1 rounded-full bg-muted-foreground/40"></span>
                          <span><strong className="text-foreground">Barra:</strong> Volume % do Total</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Radio / Dropdown → Pie + Bars */}
                {(p.tipo === 'radio' || p.tipo === 'dropdown') && (
                  <div className="grid md:grid-cols-2 gap-4 items-center">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={entries.map(([name, value]) => ({ name, value }))}
                            cx="50%" cy="50%" outerRadius={80} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {entries.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {entries.map(([val, count], idx) => (
                        <div key={val} className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                          <span className="text-xs flex-1 truncate" title={val}>{val}</span>
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div className="rounded-full h-2" style={{ width: `${count / stats.total * 100}%`, background: COLORS[idx % COLORS.length] }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(count / stats.total * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkbox / Likert → Horizontal Bar Chart */}
                {(p.tipo === 'checkbox' || p.tipo === 'likert') && (
                  <div className="space-y-2 pt-2">
                    {entries.map(([val, count]) => (
                      <div key={val} className="flex items-center gap-3">
                        <span className="text-xs w-40 truncate" title={val}>{val}</span>
                        <div className="flex-1 bg-muted rounded-full h-2.5">
                          <div className="bg-primary rounded-full h-2.5 transition-all" style={{ width: `${count / stats.total * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(count / stats.total * 100)}%</span>
                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {totalRespostas === 0 && (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              Nenhuma resposta recebida ainda.
            </div>
          )}
        </div>
      )}

      {/* ── Respostas Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'respostas' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou departamento..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="text-sm rounded-md border bg-background px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-muted-foreground text-xs">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="text-sm rounded-md border bg-background px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {(dateFrom || dateTo || searchText) && (
                <button
                  onClick={() => { setSearchText(''); setDateFrom(''); setDateTo(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th
                    className="text-left px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('criado_em')}
                  >
                    <span className="flex items-center gap-1">
                      Data
                      {sortField === 'criado_em' ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                    </span>
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('respondente_nome')}
                  >
                    <span className="flex items-center gap-1">
                      Respondente
                      {sortField === 'respondente_nome' ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                    </span>
                  </th>
                  {perguntas.filter(p => !['secao', 'matriz_nps'].includes(p.tipo)).slice(0, 3).map(p => (
                    <th key={p.id} className="text-left px-4 py-3 font-medium max-w-[160px] truncate">{p.texto}</th>
                  ))}
                  <th className="text-center px-4 py-3 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRespostas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">
                      Nenhuma resposta encontrada.
                    </td>
                  </tr>
                ) : filteredRespostas.map((r, i) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {new Date(r.criado_em).toLocaleDateString('pt-BR')}<br />
                      <span className="text-muted-foreground">{new Date(r.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium">{r.respondente_nome || 'Anônimo'}</span>
                      {r.respondente_email && <span className="block text-muted-foreground text-[11px]">{r.respondente_email}</span>}
                      {r.respondente_departamento && <span className="block text-muted-foreground text-[11px]">{r.respondente_departamento}</span>}
                    </td>
                    {perguntas.filter(p => !['secao', 'matriz_nps'].includes(p.tipo)).slice(0, 3).map(p => {
                      const item = respostaItens.find(ri => ri.resposta_id === r.id && ri.pergunta_id === p.id);
                      return (
                        <td key={p.id} className="px-4 py-3 text-xs max-w-[160px] truncate" title={item?.valor || ''}>
                          {item?.valor || '—'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedResponse(r)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-muted p-2 transition-colors"
                        title="Ver resposta completa"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs text-muted-foreground border-t flex items-center justify-between">
              <span>Exibindo {filteredRespostas.length} de {totalRespostas} respostas</span>
              {filteredRespostas.length !== totalRespostas && (
                <span className="text-primary">{totalRespostas - filteredRespostas.length} ocultas por filtro</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Departamentos Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'departamentos' && hasMatriz && (
        <div id="report-departamentos" className="space-y-8 print:p-0 bg-white rounded-xl p-8 is-report-container">
          <div className="flex justify-end print:hidden">
            <button 
              onClick={() => handleDownloadPDF('report-departamentos', `Relatorio-Departamentos-${formulario?.nome}`)}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF / Imprimir'}
            </button>
          </div>

          <div className="report-header hidden print:block mb-8">
            <div className="border-b-4 border-primary pb-6">
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Relatório de Desempenho por Departamento</h1>
              <div className="flex justify-between items-center mt-2">
                <p className="text-slate-600 font-bold text-lg">{formulario?.nome}</p>
                <p className="text-slate-500 font-medium text-sm">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {!hasMatrizData ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              Nenhum dado de departamento encontrado ainda.
            </div>
          ) : (
            matrizPerguntas.map((p, pIdx) => {
              const stats = matrizMedias[p.id];
              if (!stats || stats.length === 0) return null;
              return (
                <div key={p.id} className={`space-y-6 ${pIdx > 0 ? 'print:break-before-page print:pt-8' : ''}`}>
                  <div className="report-header">
                    <h2 className="text-base font-bold border-b pb-2 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-primary rounded-full" />
                      {p.texto}
                    </h2>
                  </div>

                  {/* Ranking table */}
                  <div className="is-report-block rounded-xl border bg-card overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium">Departamento</th>
                          <th className="text-center px-4 py-3 font-medium">Média</th>
                          <th className="text-center px-4 py-3 font-medium">Score NPS</th>
                          <th className="text-left px-4 py-3 font-medium w-48">Desempenho</th>
                          <th className="text-right px-4 py-3 font-medium">Avaliações</th>
                          <th className="text-right px-4 py-3 font-medium">N/A</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((m, idx) => {
                          const color = m.media >= 7 ? 'bg-emerald-500' : m.media >= 5 ? 'bg-amber-500' : 'bg-destructive';
                          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
                          return (
                            <tr key={m.linha} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-xs">{medal} {m.linha}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-lg font-black ${m.media >= 7 ? 'text-emerald-500' : m.media >= 5 ? 'text-amber-500' : 'text-destructive'}`}>
                                  {m.media}
                                </span>
                                <span className="text-muted-foreground text-xs">/10</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {m.scoreNps !== null ? (
                                  <div className="flex flex-col items-center group relative cursor-help">
                                    <span className={`font-bold text-sm ${m.scoreNps >= 50 ? 'text-emerald-500' : m.scoreNps >= 0 ? 'text-amber-500' : 'text-destructive'}`}>
                                      {m.scoreNps > 0 ? '+' : ''}{m.scoreNps}
                                    </span>
                                    <span className="text-[8px] text-muted-foreground underline decoration-dotted">Ver cálculo</span>
                                    
                                    {/* Tooltip Memória de Cálculo */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-3 bg-popover border rounded-xl shadow-2xl z-50">
                                      <p className="text-[9px] font-bold border-b pb-1 mb-2">Memória: {m.linha}</p>
                                      <div className="space-y-1.5 text-[9px] text-left">
                                        <div className="flex justify-between">
                                          <span className="text-emerald-600">Promotores:</span>
                                          <span className="font-bold">{m.promotores || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-amber-500">Passivos:</span>
                                          <span className="font-bold">{m.avaliacoes - (m.promotores || 0) - (m.detratores || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-red-500">Detratores:</span>
                                          <span className="font-bold">{m.detratores || 0}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-dashed border-border pt-1 mt-1 mb-1">
                                          <span className="text-muted-foreground">Total Válidos:</span>
                                          <span className="font-bold">{m.avaliacoes}</span>
                                        </div>
                                        <div className="pt-1 border-t flex flex-col font-black text-primary text-center">
                                          <span>{m.percPromotores || 0}% - {m.percDetratores || 0}%</span>
                                          <span className="text-[10px]">= {m.scoreNps}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="bg-muted rounded-full h-2.5">
                                  <div className={`rounded-full h-2.5 transition-all ${color}`} style={{ width: `${m.media * 10}%` }} />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-xs font-medium">{m.avaliacoes}</td>
                              <td className="px-4 py-3 text-right text-xs text-muted-foreground">{m.na}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bar Chart */}
                  <div className="is-report-block rounded-xl border bg-card p-5">
                    <h3 className="text-sm font-bold mb-4">Média por Departamento</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
                          <YAxis dataKey="linha" type="category" width={130} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => [Number(v).toFixed(1), 'Média']} />
                          <Bar dataKey="media" name="Média" radius={[0, 4, 4, 0]}>
                            {stats.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.media >= 7 ? '#10b981' : entry.media >= 5 ? '#f59e0b' : '#ef4444'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Parecer Técnico Tab ────────────────────────────────────────────────── */}
      {activeTab === 'parecer' && (
        <div id="report-parecer" className="space-y-8 animate-in fade-in duration-500 pb-12 is-report-container">
          <div className="flex justify-end print:hidden">
            <button 
              onClick={() => handleDownloadPDF('report-parecer', `Parecer-Tecnico-${formulario?.nome}`)}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF / Imprimir'}
            </button>
          </div>

          <div className="bg-white text-slate-900 p-10 rounded-xl border shadow-sm max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full">
            {/* Report Header */}
            <div className="report-header flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">Parecer Técnico de Pesquisa</h1>
                <p className="text-slate-600 font-bold">{formulario?.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Relatório Executivo</p>
                <p className="text-sm text-slate-600 font-medium">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <section className="flex print-flex gap-4 mb-10 overflow-hidden">
              <div className="flex-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Score NPS Geral</p>
                <div className="space-y-1">
                  <span className={`text-5xl font-black block leading-none ${npsColor(npsStats.score)}`}>{npsStats.score}</span>
                  <span className={`text-[10px] font-black uppercase py-1 px-3 rounded-full bg-white border inline-block mt-2 ${npsColor(npsStats.score)}`}>{npsLabel(npsStats.score)}</span>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total de Respostas</p>
                <div className="space-y-1">
                  <span className="text-5xl font-black block leading-none text-slate-800">{totalRespostas}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase inline-block mt-2">Participantes</span>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Engajamento</p>
                <div className="space-y-1">
                  <span className="text-5xl font-black block leading-none text-slate-800">{taxaConclusao}%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase inline-block mt-2">Taxa de Conclusão</span>
                </div>
              </div>
            </section>

            <div className="space-y-12 font-sans">
              {/* Iteramos sobre cada pergunta de matriz para dar um parecer individualizado se houver mais de uma */}
              {matrizPerguntas.map((p, pIdx) => {
                const stats = matrizMedias[p.id];
                if (!stats || stats.length === 0) return null;

                return (
                  <section key={p.id} className={`print:break-inside-avoid ${pIdx > 0 ? "pt-10 border-t border-slate-100 print:break-before-page print:pt-8" : ""}`}>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">
                      <div className="w-1.5 h-5 bg-primary rounded-full" /> 
                      Análise: {p.texto}
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Top 3 */}
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4" /> Melhores Desempenhos (Top 3)
                        </p>
                        <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100/50 p-4 space-y-4">
                          {stats.slice(0, 3).map((m, i) => (
                            <div key={i} className="bg-white rounded-xl p-3 border border-emerald-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">{i+1}º</span>
                                  <span className="font-semibold text-slate-700 text-xs">{m.linha}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <span className="font-black text-emerald-600 text-sm block">{m.media.toFixed(1)}</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Média</span>
                                  </div>
                                  {m.scoreNps !== null && (
                                    <div className="text-right">
                                      <span className={`font-black text-sm block ${m.scoreNps >= 50 ? 'text-emerald-600' : m.scoreNps >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {m.scoreNps > 0 ? '+' : ''}{m.scoreNps}
                                      </span>
                                      <span className="text-[8px] text-slate-400 uppercase">NPS</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Mini Memória de Cálculo */}
                              {m.scoreNps !== null && (
                                <div className="pt-2 border-t border-slate-100">
                                  <div className="flex gap-1.5 text-[8px] font-bold items-center flex-wrap">
                                    <span className="text-emerald-600">{m.percPromotores || 0}% Prom.</span>
                                    <span className="text-slate-300">−</span>
                                    <span className="text-red-500">{m.percDetratores || 0}% Detr.</span>
                                    <span className="text-slate-300">=</span>
                                    <span className={m.scoreNps >= 50 ? 'text-emerald-600' : m.scoreNps >= 0 ? 'text-amber-500' : 'text-red-500'}>{m.scoreNps}</span>
                                    <span className="text-amber-500/70 ml-1 font-medium bg-amber-50 px-1 rounded">(& {m.avaliacoes > 0 ? Math.round(((m.avaliacoes - (m.promotores||0) - (m.detratores||0)) / m.avaliacoes) * 100) : 0}% Passivos)</span>
                                  </div>
                                  <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${m.percPromotores || 0}%` }} />
                                    <div className="bg-amber-400 h-full" style={{ width: `${m.avaliacoes > 0 ? Math.round(((m.avaliacoes - (m.promotores||0) - (m.detratores||0)) / m.avaliacoes) * 100) : 0}%` }} />
                                    <div className="bg-red-500 h-full" style={{ width: `${m.percDetratores || 0}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom 3 */}
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-red-600 uppercase flex items-center gap-1.5">
                          <TrendingDown className="h-4 w-4" /> Pontos de Atenção (Gargalos)
                        </p>
                        <div className="bg-red-50/40 rounded-2xl border border-red-100/50 p-4 space-y-4">
                          {stats.slice(-3).reverse().map((m, i) => (
                            <div key={i} className="bg-white rounded-xl p-3 border border-red-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-[10px] font-black">{i+1}º</span>
                                  <span className="font-semibold text-slate-700 text-xs">{m.linha}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <span className="font-black text-red-600 text-sm block">{m.media.toFixed(1)}</span>
                                    <span className="text-[8px] text-slate-400 uppercase">Média</span>
                                  </div>
                                  {m.scoreNps !== null && (
                                    <div className="text-right">
                                      <span className={`font-black text-sm block ${m.scoreNps >= 50 ? 'text-emerald-600' : m.scoreNps >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {m.scoreNps > 0 ? '+' : ''}{m.scoreNps}
                                      </span>
                                      <span className="text-[8px] text-slate-400 uppercase">NPS</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Mini Memória de Cálculo */}
                              {m.scoreNps !== null && (
                                <div className="pt-2 border-t border-slate-100">
                                  <div className="flex gap-1.5 text-[8px] font-bold items-center flex-wrap">
                                    <span className="text-emerald-600">{m.percPromotores || 0}% Prom.</span>
                                    <span className="text-slate-300">−</span>
                                    <span className="text-red-500">{m.percDetratores || 0}% Detr.</span>
                                    <span className="text-slate-300">=</span>
                                    <span className={m.scoreNps >= 50 ? 'text-emerald-600' : m.scoreNps >= 0 ? 'text-amber-500' : 'text-red-500'}>{m.scoreNps}</span>
                                    <span className="text-amber-500/70 ml-1 font-medium bg-amber-50 px-1 rounded">(& {m.avaliacoes > 0 ? Math.round(((m.avaliacoes - (m.promotores||0) - (m.detratores||0)) / m.avaliacoes) * 100) : 0}% Passivos)</span>
                                  </div>
                                  <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${m.percPromotores || 0}%` }} />
                                    <div className="bg-amber-400 h-full" style={{ width: `${m.avaliacoes > 0 ? Math.round(((m.avaliacoes - (m.promotores||0) - (m.detratores||0)) / m.avaliacoes) * 100) : 0}%` }} />
                                    <div className="bg-red-500 h-full" style={{ width: `${m.percDetratores || 0}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}

              {!matrizPerguntas.length && (
                <div className="p-12 text-center border-2 border-dashed rounded-2xl text-slate-400 italic text-sm">
                  Dados de matriz não identificados para este formulário.
                </div>
              )}

              {/* Technical Conclusion */}
              <section className="bg-slate-900 text-slate-100 p-8 rounded-2xl shadow-xl relative overflow-hidden report-footer">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FileText className="h-24 w-24" />
                </div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Conclusão e Recomendações
                </h2>
                <div className="space-y-4 text-sm leading-relaxed opacity-90">
                  <p>
                    Com base no Score NPS de <strong className={npsColor(npsStats.score)}>{npsStats.score}</strong> ({npsLabel(npsStats.score)}), 
                    conclui-se que o nível de satisfação geral está em patamar 
                    <strong> {npsLabel(npsStats.score)}</strong>.
                  </p>
                  <p>
                    {npsStats.score >= 50 
                      ? "A organização apresenta uma forte base de promotores. Recomenda-se manter as políticas atuais e focar nos pequenos focos de detração identificados nos departamentos com menor score."
                      : "Identificamos uma necessidade de intervenção nos processos de atendimento/suporte, especialmente nos departamentos listados como 'Pontos de Atenção'. Um plano de ação imediato para ouvir os detratores é sugerido."
                    }
                  </p>
                  <div className="pt-6 mt-6 border-t border-slate-700 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Documento gerado automaticamente pelo Sistema de Pesquisas</span>
                    <span>Assinatura Técnica Digital</span>
                  </div>
                </div>
              </section>

              {/* ── Memória de Cálculo ────────────────────────────────────────────────── */}
              <section className="print:break-before-page mt-12 pt-12 border-t-2 border-slate-100 print:pt-8 is-report-block">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-8 flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-sm" />
                  Memória de Cálculo e Metodologia
                </h2>

                <div className="grid md:grid-cols-2 gap-10">
                  {/* Visual Calculation Logic */}
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Como chegamos à Nota Geral?
                      </h3>
                      <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                        <p className="font-medium">O cálculo do NPS (Net Promoter Score) segue 3 passos simples:</p>
                        
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">1</span>
                            <p><strong>Classificação:</strong> Cada voto de 0 a 10 é separado em 3 grupos (Detratores, Passivos e Promotores).</p>
                          </div>
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">2</span>
                            <p><strong>Percentual:</strong> Calculamos quanto cada grupo representa do total de votos.</p>
                          </div>
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">3</span>
                            <p><strong>Subtração:</strong> Pegamos o % de Promotores e tiramos o % de Detratores. O resultado é o seu Score.</p>
                          </div>
                        </div>

                        <div className="mt-6 bg-white p-5 rounded-xl border-2 border-primary/10 relative shadow-inner">
                          <p className="text-[10px] font-black text-primary uppercase mb-2">Fórmula Aplicada:</p>
                          <div className="flex items-center justify-center gap-4 text-xl font-black text-slate-800">
                            <div className="text-center">
                              <span className="text-emerald-600">{Math.round(npsStats.promotores / Math.max(npsStats.total, 1) * 100)}%</span>
                              <span className="block text-[8px] text-slate-400 font-bold uppercase mt-1">Promotores</span>
                            </div>
                            <span className="text-slate-300 text-2xl">−</span>
                            <div className="text-center">
                              <span className="text-red-500">{Math.round(npsStats.detratores / Math.max(npsStats.total, 1) * 100)}%</span>
                              <span className="block text-[8px] text-slate-400 font-bold uppercase mt-1">Detratores</span>
                            </div>
                            <span className="text-slate-300 text-2xl">=</span>
                            <div className="text-center">
                              <span className={npsColor(npsStats.score)}>{npsStats.score}</span>
                              <span className="block text-[8px] text-slate-400 font-bold uppercase mt-1">Score Final</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-center mt-4 text-slate-400 italic">
                            Cálculo baseado no universo de <strong>{totalRespostas}</strong> respostas coletadas.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="h-20 w-20" />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Entendendo o Resultado</h3>
                      <p className="text-sm leading-relaxed mb-4">
                        Um score de <strong>{npsStats.score}</strong> é classificado como <strong>{npsLabel(npsStats.score)}</strong>.
                      </p>
                      <div className="space-y-2 text-xs opacity-80">
                        <p>• Acima de 75: Excelente (Fidelidade alta)</p>
                        <p>• Acima de 50: Muito Bom (Qualidade alta)</p>
                        <p>• Acima de 0: Razoável (Aperfeiçoamento)</p>
                        <p>• Abaixo de 0: Crítico (Ação imediata)</p>
                      </div>
                    </div>
                  </div>

                  {/* Classification Table */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">O que significa cada nota?</h3>
                    <div className="space-y-3">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="text-2xl font-black text-emerald-600 w-14 text-center bg-white rounded-lg py-1 shadow-sm border border-emerald-100">9-10</div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-emerald-700 uppercase mb-0.5">Promotores</p>
                          <p className="text-[10px] text-emerald-600/80 leading-tight">São seus fãs. Eles recomendam o serviço e trazem novos clientes organicamente.</p>
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="text-2xl font-black text-amber-600 w-14 text-center bg-white rounded-lg py-1 shadow-sm border border-amber-100">7-8</div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-amber-700 uppercase mb-0.5">Passivos</p>
                          <p className="text-[10px] text-amber-600/80 leading-tight">Estão satisfeitos, mas não são leais. Podem mudar por qualquer oferta de preço.</p>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="text-2xl font-black text-red-600 w-14 text-center bg-white rounded-lg py-1 shadow-sm border border-red-100">0-6</div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-red-700 uppercase mb-0.5">Detratores</p>
                          <p className="text-[10px] text-red-600/80 leading-tight">Clientes infelizes que podem criticar a marca e desmotivar outros clientes.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Distribuição das Notas (Contagem Real):</p>
                      <div className="flex justify-between items-center text-[11px] font-bold px-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-emerald-600 text-lg">{npsStats.promotores}</span>
                          <span className="text-slate-400 text-[8px] uppercase">Promotores</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-amber-600 text-lg">{npsStats.passivos}</span>
                          <span className="text-slate-400 text-[8px] uppercase">Passivos</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-red-600 text-lg">{npsStats.detratores}</span>
                          <span className="text-slate-400 text-[8px] uppercase">Detratores</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Page 2 - Methodology and Detailed Results */}
            <section className="print:break-before-page mt-12 pt-12 border-t-2 border-slate-100 print:pt-8 is-report-block">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-800 rounded-sm" />
                Detalhamento Meta-Analítico
              </h2>

              <div className="grid md:grid-cols-2 gap-10">
                {/* Methodology Explanation */}
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-600">Entendendo a Metodologia NPS</h3>
                    <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                      <p>
                        O <strong>Net Promoter Score (NPS)</strong> é calculado com base na subtração da porcentagem de Promotores pela porcentagem de Detratores.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                          <p><strong>Promotores (9-10):</strong> Clientes entusiasmados que impulsionam o crescimento.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" />
                          <p><strong>Passivos (7-8):</strong> Clientes satisfeitos, mas indiferentes, vulneráveis à concorrência.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1" />
                          <p><strong>Detratores (0-6):</strong> Clientes infelizes que podem danificar sua marca.</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border text-center font-bold text-slate-800">
                        NPS = % Promotores - % Detratores
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-6 rounded-2xl">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Status do Score</h3>
                    <p className="text-sm italic opacity-90">
                      "Um score de <strong>{npsStats.score}</strong> é classificado como <strong>{npsLabel(npsStats.score)}</strong>. 
                      Isso indica que para cada detrator, existem aproximadamente <strong>{(npsStats.promotores / Math.max(npsStats.detratores, 1)).toFixed(1)}</strong> promotores no ecossistema atual."
                    </p>
                  </div>
                </div>

                {/* Question Breakdown */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Resultados por Indicador — Memória de Cálculo</h3>
                  <div className="space-y-5">
                    {perguntas.filter(p => !['secao'].includes(p.tipo)).map(p => {
                      const stats = getPerguntaStats(p.id);
                      if (stats.total === 0) return null;
                      const percProm = stats.totalScoreCount > 0 ? Math.round(stats.promotores / stats.totalScoreCount * 100) : 0;
                      const percPass = stats.totalScoreCount > 0 ? Math.round(stats.passivos / stats.totalScoreCount * 100) : 0;
                      const percDetr = stats.totalScoreCount > 0 ? Math.round(stats.detratores / stats.totalScoreCount * 100) : 0;
                      
                      return (
                        <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[10px] font-black text-slate-700 leading-tight flex-1" title={p.texto}>
                              {p.tipo === 'matriz_nps' && <span className="inline-block bg-primary/10 text-primary rounded px-1 py-0.5 text-[8px] font-bold mr-1">MATRIZ</span>}
                              {p.texto}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[8px] text-slate-400">{stats.totalScoreCount} resp.</span>
                              <span className={`text-sm font-black px-2 py-0.5 rounded-lg border ${stats.score >= 50 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : stats.score >= 0 ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-red-600 border-red-200 bg-red-50'}`}>
                                {stats.score > 0 ? '+' : ''}{stats.score}
                              </span>
                            </div>
                          </div>

                          {/* Step 1: Stacked bar */}
                          <div>
                            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                              <div className="bg-emerald-500 h-full flex items-center justify-center" style={{ width: `${percProm}%` }}>
                                {percProm >= 15 && <span className="text-[7px] font-bold text-white">{percProm}%</span>}
                              </div>
                              <div className="bg-amber-400 h-full flex items-center justify-center" style={{ width: `${percPass}%` }}>
                                {percPass >= 15 && <span className="text-[7px] font-bold text-white">{percPass}%</span>}
                              </div>
                              <div className="bg-red-500 h-full flex items-center justify-center" style={{ width: `${percDetr}%` }}>
                                {percDetr >= 15 && <span className="text-[7px] font-bold text-white">{percDetr}%</span>}
                              </div>
                            </div>
                          </div>

                          {/* Step 2: Group legend with counts */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-emerald-50 rounded-lg p-2">
                              <span className="text-emerald-600 font-black text-xs block">{stats.promotores}</span>
                              <span className="text-[8px] text-emerald-600 font-bold uppercase">Prom. ({percProm}%)</span>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2">
                              <span className="text-amber-600 font-black text-xs block">{stats.passivos}</span>
                              <span className="text-[8px] text-amber-600 font-bold uppercase">Pass. ({percPass}%)</span>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2">
                              <span className="text-red-600 font-black text-xs block">{stats.detratores}</span>
                              <span className="text-[8px] text-red-600 font-bold uppercase">Detr. ({percDetr}%)</span>
                            </div>
                          </div>

                          {/* Step 3: Formula */}
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center gap-3 text-xs font-black">
                            <span className="text-emerald-600">{percProm}%</span>
                            <span className="text-slate-300">−</span>
                            <span className="text-red-500">{percDetr}%</span>
                            <span className="text-slate-300">=</span>
                            <span className={stats.score >= 50 ? 'text-emerald-600' : stats.score >= 0 ? 'text-amber-600' : 'text-red-600'}>
                              {stats.score > 0 ? '+' : ''}{stats.score}
                            </span>
                            <span className="text-[8px] font-normal text-slate-400 ml-1">(Score NPS)</span>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>

                {/* Qualitative Responses (Direct Answers Table) */}
              <section className="mt-12 pt-12 border-t border-slate-100 print:break-before-page print:pt-8 is-report-block">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Consolidado Qualitativo (Detalhamento de Respostas)
                </h3>
                
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-3 py-3 font-bold text-slate-500 uppercase tracking-wider">Respondente</th>
                          <th className="px-3 py-3 font-bold text-slate-500 uppercase tracking-wider">Depto</th>
                          {/* Dynamic Columns: Texto + Matrix Items */}
                          {(() => {
                            const cols: any[] = [];
                            perguntas.filter(p => !['secao'].includes(p.tipo)).forEach(p => {
                              if (p.tipo === 'matriz_nps') {
                                const rows = (p.opcoes as any)?.rows || [];
                                rows.forEach((row: string) => {
                                  cols.push({ id: `${p.id}-${row}`, isMatrix: true, parentId: p.id, parentText: p.texto, texto: row });
                                });
                              } else {
                                cols.push(p);
                              }
                            });
                            return cols.slice(0, 10);
                          })().map((col, i) => (
                            <th key={i} className="px-3 py-3 font-bold text-slate-500 uppercase tracking-wider border-l border-slate-100 min-w-[100px]">
                              {col.isMatrix ? (
                                <div className="leading-tight">
                                  <span className="opacity-40 block text-[7px] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{col.parentText}</span>
                                  {col.texto}
                                </div>
                              ) : (
                                <span className="truncate block" title={col.texto}>{col.texto}</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {respostas.filter(r => r.finalizado).slice(0, 50).map((r, idx) => {
                          const flattenedCols: any[] = [];
                          perguntas.filter(p => !['secao'].includes(p.tipo)).forEach(p => {
                            if (p.tipo === 'matriz_nps') {
                                const rows = (p.opcoes as any)?.rows || [];
                              rows.forEach((row: string) => {
                                flattenedCols.push({ idIdx: `${p.id}-${row}`, isMatrix: true, parentId: p.id, texto: row });
                              });
                            } else {
                              flattenedCols.push(p);
                            }
                          });
                          const currentCols = flattenedCols.slice(0, 10);

                          return (
                            <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}>
                              <td className="px-3 py-2.5 font-bold text-slate-700 capitalize whitespace-nowrap">{r.respondente_nome || 'Anônimo'}</td>
                              <td className="px-3 py-2.5 text-slate-500">{r.respondente_departamento || '—'}</td>
                              {currentCols.map((col, i) => {
                                let ans = null;
                                if (col.isMatrix) {
                                  ans = respostaItens.find(ri => {
                                    if (ri.resposta_id !== r.id || ri.pergunta_id !== col.parentId) return false;
                                    try {
                                      const parsed = JSON.parse(ri.valor);
                                      return parsed.linha === col.texto;
                                    } catch { return false; }
                                  });
                                } else {
                                  ans = respostaItens.find(ri => ri.resposta_id === r.id && ri.pergunta_id === col.id);
                                }
                                
                                let displayVal = '—';
                                if (ans) {
                                  if (col.isMatrix) {
                                    try {
                                      const parsed = JSON.parse(ans.valor);
                                      displayVal = parsed.is_na ? 'N/A' : parsed.nota;
                                    } catch {
                                      displayVal = ans.valor;
                                    }
                                  } else {
                                    displayVal = ans.valor;
                                  }
                                }

                                const scoreNum = Number(displayVal);
                                const isNumeric = !isNaN(scoreNum) && displayVal !== '—' && displayVal !== 'N/A';

                                return (
                                  <td key={i} className={`px-3 py-2.5 border-l border-slate-50/50 ${ans ? 'text-slate-900 border-l' : 'text-slate-200'}`}>
                                    <div className="flex items-center gap-1.5">
                                      {isNumeric && (
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${scoreNum >= 9 ? 'bg-emerald-500' : scoreNum >= 7 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                      )}
                                      <span className="truncate max-w-[120px]">{displayVal}</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 bg-slate-50 text-[8px] text-center text-slate-400 italic">
                    * Exibindo as primeiras 50 respostas e até 8 colunas de dados. O relatório completo requer exportação CSV.
                  </div>
                </div>
              </section>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 mt-12">
              © {new Date().getFullYear()} - Sistema de Gestão de Pesquisas e Satisfação
            </p>
          </div>
        </div>
      )}

      {/* ── Divulgação Tab ────────────────────────────────────────────────── */}
      {activeTab === 'divulgacao' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Botões de Download */}
          <div className="flex justify-end gap-3 print:hidden">
            <button 
              onClick={async () => {
                try {
                  const qrElement = document.querySelector('#qrcode-container svg') as SVGElement;
                  if (!qrElement) return;
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const svgData = new XMLSerializer().serializeToString(qrElement);
                  const img = new Image();
                  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                  const url = URL.createObjectURL(svgBlob);
                  
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    canvas.toBlob((blob) => {
                      if (blob) {
                        const link = document.createElement('a');
                        link.download = `qrcode-${formulario?.slug}.png`;
                        link.href = URL.createObjectURL(blob);
                        link.click();
                        toast.success('QR Code baixado com sucesso!');
                      }
                    });
                  };
                  img.src = url;
                } catch (error) {
                  toast.error('Erro ao baixar QR Code');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" />
              Baixar QR Code
            </button>
            <button 
              onClick={async () => {
                try {
                  const element = document.getElementById('material-divulgacao');
                  if (!element) return;
                  
                  toast.info('Gerando PDF...');
                  
                  const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                  });
                  
                  const imgData = canvas.toDataURL('image/png');
                  const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                  });
                  
                  const imgWidth = 210; // A4 width in mm
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  
                  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                  pdf.save(`divulgacao-${formulario?.slug}.pdf`);
                  
                  toast.success('PDF baixado com sucesso!');
                } catch (error) {
                  toast.error('Erro ao gerar PDF');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </button>
          </div>

          {/* Material para Impressão */}
          <div id="material-divulgacao" className="bg-white rounded-2xl border shadow-sm p-12 print:shadow-none print:border-0">
            {/* Logo */}
            {formulario?.logo_url && (
              <div className="flex justify-center mb-8">
                <img 
                  src={formulario.logo_url} 
                  alt="Logo" 
                  className="max-h-24 object-contain"
                />
              </div>
            )}

            {/* Título */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4" style={{ color: formulario?.cor_tema || '#3b82f6' }}>
                {formulario?.nome}
              </h1>
              {formulario?.descricao && (
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {formulario.descricao}
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center mb-12">
              <div className="bg-white p-8 rounded-2xl border-4 border-gray-200 shadow-lg" id="qrcode-container">
                <QRCodeSVG 
                  value={`https://formularios-pesquisas.vercel.app/f/${formulario?.slug}`}
                  size={400}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-center mt-8 text-xl font-bold text-gray-700">
                Escaneie o QR Code para participar
              </p>
            </div>

            {/* Informações Adicionais */}
            <div className="border-t pt-8 mt-8">
              <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                {formulario?.data_inicio && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">📅 Início da Pesquisa</p>
                    <p>{new Date(formulario.data_inicio).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</p>
                  </div>
                )}
                {formulario?.data_fim && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">⏰ Término da Pesquisa</p>
                    <p>{new Date(formulario.data_fim).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>✨ Sua opinião é muito importante!</strong><br />
                  A pesquisa é anônima e confidencial. Suas respostas nos ajudam a melhorar continuamente.
                </p>
              </div>
            </div>
          </div>

          {/* Instruções para Divulgação */}
          <div className="bg-card border rounded-xl p-6 print:hidden">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Instruções para Divulgação
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Baixar PDF:</strong> Gera um arquivo PDF pronto para impressão em A4</li>
              <li>• <strong>Baixar QR Code:</strong> Baixa apenas a imagem do QR Code em PNG</li>
              <li>• Fixe o material em locais de fácil visualização (murais, quadros de avisos, chão de fábrica)</li>
              <li>• O QR Code pode ser escaneado por qualquer smartphone com câmera</li>
              <li>• Certifique-se de que a pesquisa está ativa antes de divulgar</li>
              <li>• O link aponta para: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://formularios-pesquisas.vercel.app</code></li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Entendendo os Cálculos Tab ────────────────────────────────────────── */}
      {activeTab === 'calculos' && (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
          <div className="bg-card border rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Guia Completo de Métricas e Cálculos
            </h2>

            <div className="space-y-12">
              {/* Seção 1: NPS Geral */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="font-bold text-lg">O que é o Score NPS?</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O <strong>Net Promoter Score (NPS)</strong> é uma metodologia global para medir a satisfação e lealdade do cliente através de uma única pergunta: 
                  <span className="italic"> "Em uma escala de 0 a 10, o quanto você recomendaria este serviço/empresa?"</span>
                </p>
                
                <div className="grid sm:grid-cols-3 gap-4 py-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                    <p className="text-xl font-black text-emerald-700">9 - 10</p>
                    <p className="text-xs font-bold text-emerald-600 uppercase mt-1">Promotores</p>
                    <p className="text-[10px] text-emerald-800/60 mt-2">Clientes leais, entusiasmados e que indicam seu serviço.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                    <p className="text-xl font-black text-amber-700">7 - 8</p>
                    <p className="text-xs font-bold text-amber-600 uppercase mt-1">Passivos</p>
                    <p className="text-[10px] text-amber-800/60 mt-2">Satisfeitos, mas neutros. Não indicam, mas não falam mal.</p>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/10 p-4 rounded-xl text-center">
                    <p className="text-xl font-black text-destructive">0 - 6</p>
                    <p className="text-xs font-bold text-destructive uppercase mt-1">Detratores</p>
                    <p className="text-[10px] text-destructive/60 mt-2">Insatisfeitos que podem gerar boca-a-boca negativo.</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-2xl border text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Fórmula de Cálculo</p>
                  <p className="text-2xl font-black text-primary tracking-tighter">NPS = % Promotores - % Detratores</p>
                  <p className="text-[11px] text-muted-foreground mt-2">O resultado varia de <strong>-100 a +100</strong>.</p>
                </div>
              </section>

              {/* Seção 2: Matriz NPS */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
                  <h3 className="font-bold text-lg">Entendendo a Pergunta de Matriz</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A <strong>Matriz NPS</strong> permite avaliar múltiplos itens (setores, atributos ou serviços) em uma única estrutura, 
                  economizando tempo do respondente e permitindo comparativos diretos.
                </p>
                
                <div className="space-y-4 bg-muted/20 p-5 rounded-xl border-l-4 border-primary">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">1</div>
                    <div>
                      <p className="font-bold text-sm">Cada linha é um voto único</p>
                      <p className="text-xs text-muted-foreground font-medium text-primary bg-primary/5 p-2 rounded mt-1 border border-primary/10"> 
                        <strong>Aviso Importante:</strong> Se uma pessoa avalia 10 setores em uma matriz, ela gera 
                        <strong> 10 pontos de dados</strong>. Por isso, a soma das notas pode ser maior que o número de pessoas.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">2</div>
                    <div>
                      <p className="font-bold text-sm">Score por Setor vs Score da Questão</p>
                      <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-1 mt-1">
                        <li><strong>Por Setor:</strong> O NPS é calculado isoladamente para aquela linha específica (Top/Bottom 3).</li>
                        <li><strong>NPS Questão:</strong> É o NPS de "Volume". Soma-se todos os votos de todas as linhas e faz o cálculo sobre o total da pergunta.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seção 3: Zonas de Desempenho */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                  <h3 className="font-bold text-lg">Zonas de Desempenho (Benchmarks)</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  O Score final é enquadrado em zonas que indicam a saúde da relação com os clientes:
                </p>

                <div className="rounded-xl border border-border overflow-hidden">
                  {[
                    { zone: "Zona de Excelência", range: "75 a 100", color: "bg-emerald-500", text: "Excelente fidelidade e satisfação." },
                    { zone: "Zona de Qualidade", range: "50 a 74", color: "bg-blue-500", text: "Bom nível, mas há pontos pontuais a ajustar." },
                    { zone: "Zona de Aperfeiçoamento", range: "0 a 49", color: "bg-amber-500", text: "Nível neutro. Empate de forças entre críticos e fãs." },
                    { zone: "Zona Crítica", range: "-100 a -1", color: "bg-red-500", text: "Necessidade de ação imediada. Base majoritariamente insatisfeita." },
                  ].map((z, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border-b last:border-0 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${z.color}`} />
                        <div>
                          <p className="text-sm font-bold">{z.zone}</p>
                          <p className="text-[11px] text-muted-foreground">{z.text}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black p-1.5 bg-muted rounded border border-border/50">{z.range}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ── Response Detail Modal ─────────────────────────────────────────────────── */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Resposta</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Data</p>
                  <p className="font-medium">{new Date(selectedResponse.criado_em).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Respondente</p>
                  <p className="font-medium">{selectedResponse.respondente_nome || 'Anônimo'}</p>
                  {selectedResponse.respondente_email && <p className="text-xs text-muted-foreground">{selectedResponse.respondente_email}</p>}
                </div>
                {selectedResponse.respondente_departamento && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Departamento</p>
                    <p className="font-medium">{selectedResponse.respondente_departamento}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${selectedResponse.finalizado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {selectedResponse.finalizado ? '✓ Finalizado' : '⏳ Incompleto'}
                  </span>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-2">Respostas</h3>
                {perguntas.filter(p => p.tipo !== 'secao').map(p => {
                  const items = respostaItens.filter(ri => ri.resposta_id === selectedResponse.id && ri.pergunta_id === p.id);

                  return (
                    <div key={p.id} className="space-y-1.5">
                      <p className="font-medium text-sm">{p.texto}</p>
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic bg-muted/50 px-3 py-2 rounded">Não respondido</p>
                      ) : (
                        <div className="bg-muted/50 p-3 rounded-md space-y-1">
                          {items.map((item, idx) => {
                            let display: any = item.valor;
                            try {
                              const parsed = JSON.parse(item.valor);
                              if (parsed && 'linha' in parsed) {
                                display = (
                                  <span>
                                    <strong>{parsed.linha}:</strong>{' '}
                                    {parsed.is_na
                                      ? <span className="text-muted-foreground">N/A</span>
                                      : <span className={`font-bold ${parsed.nota >= 9 ? 'text-emerald-600' : parsed.nota >= 7 ? 'text-amber-600' : 'text-red-500'}`}>{parsed.nota}</span>
                                    }
                                  </span>
                                );
                              } else if (Array.isArray(parsed)) {
                                display = parsed.join(', ');
                              }
                            } catch {}
                            return <div key={idx} className="text-sm">{display}</div>;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, subtitle, valueClass }: { label: string; value: string; subtitle?: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-[28px] font-black leading-tight ${valueClass || ''}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}
