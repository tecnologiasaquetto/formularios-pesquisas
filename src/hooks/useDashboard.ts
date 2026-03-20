import { useState, useMemo } from "react";
import type { 
  Formulario, 
  Pergunta, 
  Resposta, 
  RespostaItem, 
  MatrizItem,
  NPSStats,
  MatrizStats,
  PerguntaStats,
  AdminTab,
  DateFilters
} from "@/types";

export function useDashboard(formularioId: number) {
  // States
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // Date filters object
  const dateFilters: DateFilters = {
    startDate,
    endDate,
    hasActiveFilters: !!(startDate || endDate)
  };

  // Mock data - would come from API in real app
  const formulario = { id: formularioId, nome: "Formulário Teste", slug: "teste" } as Formulario;
  const perguntas: Pergunta[] = [];
  const allRespostas: Resposta[] = [];
  const respostaItens: RespostaItem[] = [];
  const matrizItens: MatrizItem[] = [];

  // Filter responses by date
  const filteredRespostas = useMemo(() => {
    return allRespostas.filter(resposta => {
      const responseDate = new Date(resposta.criado_em);
      
      if (startDate && responseDate < startDate) return false;
      if (endDate && responseDate > endDate) return false;
      
      return true;
    });
  }, [allRespostas, startDate, endDate]);

  // Calculate NPS stats
  const npsStats = useMemo((): NPSStats | null => {
    // Mock calculation - would use real data
    return {
      score: 42,
      promotores: 15,
      passivos: 8,
      detratores: 5,
      total: 28
    };
  }, [filteredRespostas]);

  // Calculate matriz stats
  const matrizStats = useMemo((): MatrizStats[] => {
    // Mock calculation - would use real data
    return [];
  }, [filteredRespostas]);

  // Check if has matriz questions
  const hasMatriz = perguntas.some(p => p.tipo === 'matriz_nps');

  // Get stats for a specific question
  const getPerguntaStats = (perguntaId: number): PerguntaStats => {
    // Mock calculation - would use real data
    return {
      total: 10,
      counts: {
        'Option 1': 5,
        'Option 2': 3,
        'Option 3': 2
      }
    };
  };

  // Helper function to get NPS color
  const npsColor = (score: number): string => {
    if (score >= 50) return 'text-success';
    if (score >= 0) return 'text-warning';
    return 'text-destructive';
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Toggle calendar states
  const toggleStartCalendar = () => setShowStartCalendar(!showStartCalendar);
  const toggleEndCalendar = () => setShowEndCalendar(!showEndCalendar);

  return {
    // States
    activeTab,
    setActiveTab,
    isExporting,
    setIsExporting,
    isLoading,
    dateFilters,
    showStartCalendar,
    showEndCalendar,
    
    // Data
    formulario,
    perguntas,
    filteredRespostas,
    allRespostas,
    respostaItens,
    matrizItens,
    npsStats,
    matrizStats,
    hasMatriz,
    
    // Functions
    getPerguntaStats,
    npsColor,
    clearFilters,
    setStartDate,
    setEndDate,
    toggleStartCalendar,
    toggleEndCalendar
  };
}
