// Core Entity Types
export interface Formulario {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  mensagem_fim?: string;
  criado_em: string;
  ativo: boolean;
  logo_url?: string;
  data_inicio?: string;
  data_fim?: string;
  mostrar_capa?: boolean;
  cor_tema?: string;
}

export interface Pergunta {
  id: number;
  formulario_id: number;
  tipo: PerguntaType;
  texto: string;
  ordem: number;
  obrigatorio: boolean;
  config: PerguntaConfig;
}

export type PerguntaType = 
  | 'texto_curto'
  | 'texto_longo'
  | 'email'
  | 'numero'
  | 'data'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'likert'
  | 'nps_simples'
  | 'matriz_nps'
  | 'secao';

export interface PerguntaConfig {
  // Common config
  placeholder?: string;
  max_length?: number;
  min_length?: number;
  required?: boolean;
  
  // Radio/Checkbox/Select
  opcoes?: string[];
  permitir_outro?: boolean;
  
  // Number
  min?: number;
  max?: number;
  step?: number;
  
  // NPS
  escala_min?: number;
  escala_max?: number;
  mostrar_na?: boolean;
  label_min?: string;
  label_max?: string;
  
  // Matriz NPS
  linhas?: string[];
  
  // Section
  descricao?: string;
  
  // Likert
  labels?: string[];
  escala?: number;
}

// Response Types
export interface Resposta {
  id: number;
  formulario_id: number;
  criado_em: string;
  ip_hash: string;
}

export interface RespostaItem {
  id: number;
  resposta_id: number;
  pergunta_id: number;
  valor: string;
}

export interface MatrizItem {
  id: number;
  resposta_id: number;
  pergunta_id: number;
  linha: string;
  nota: number | null;
  is_na: boolean;
}

// Chart and Analytics Types
export interface NPSStats {
  score: number;
  promotores: number;
  passivos: number;
  detratores: number;
  total: number;
}

export interface MatrizStats {
  linha: string;
  media: number;
  avaliacoes: number;
  na: number;
  scoreNps: number | null;
  promotores: number;
  passivos: number;
  detratores: number;
}

export interface PerguntaStats {
  total: number;
  counts: Record<string, number>;
}

// UI Component Types
export interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueClass?: string;
}

// Chart Component Types
export interface QuestionChartProps {
  pergunta: Pergunta;
  respostaItens: RespostaItem[];
  matrizItens?: MatrizItem[];
}

export interface TimelineChartProps {
  respostas: Resposta[];
  title?: string;
}

export interface ExcelCell {
  value: string | number;
  type: 'string' | 'number';
  style?: {
    bold?: boolean;
    bg?: string;
    color?: string;
  };
}

export interface ExcelRow {
  cells: ExcelCell[];
}

export interface ExcelSheet {
  name: string;
  rows: ExcelRow[];
}

// Form State Types
export interface FormAnswers {
  [perguntaId: string]: string | number | boolean;
}

export interface MatrizAnswers {
  [perguntaId: string]: {
    [linha: string]: number | 'NA';
  };
}

export interface FormErrors {
  [perguntaId: string]: string;
}

// Filter Types
export interface DateFilters {
  startDate?: Date;
  endDate?: Date;
  hasActiveFilters: boolean;
}

// Export Types
export type ExportFormat = 'csv' | 'excel';

export interface ExportOptions {
  format: ExportFormat;
  includeStats?: boolean;
  includeRawData?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Type Guards
export function isPerguntaValid(pergunta: any): pergunta is Pergunta {
  return (
    pergunta &&
    typeof pergunta.id === 'number' &&
    typeof pergunta.formulario_id === 'number' &&
    typeof pergunta.tipo === 'string' &&
    typeof pergunta.texto === 'string' &&
    typeof pergunta.ordem === 'number' &&
    typeof pergunta.obrigatorio === 'boolean' &&
    typeof pergunta.config === 'object'
  );
}

export function isRespostaValid(resposta: any): resposta is Resposta {
  return (
    resposta &&
    typeof resposta.id === 'number' &&
    typeof resposta.formulario_id === 'number' &&
    typeof resposta.criado_em === 'string' &&
    typeof resposta.ip_hash === 'string'
  );
}

export function isMatrizNpsPergunta(pergunta: Pergunta): boolean {
  return pergunta.tipo === 'matriz_nps';
}

export function isNpsSimplesPergunta(pergunta: Pergunta): boolean {
  return pergunta.tipo === 'nps_simples';
}

export function isSectionPergunta(pergunta: Pergunta): boolean {
  return pergunta.tipo === 'secao';
}

// Constants
export const DEPARTAMENTOS = [
  "ADMINISTRATIVO", "AJUSTAGEM", "ALMOXARIFADO", "CALDERARIA",
  "COMERCIAL", "COMPRAS", "CONTROLE DE QUALIDADE", "CUSTOS",
  "DEPARTAMENTO PESSOAL", "EXPEDIÇÃO/LOGISTICA", "FINANCEIRO",
  "FISCAL/FATURAMENTO", "MANUTENÇÃO", "PCP", "PINTURA", "RH",
  "SEGURANÇA DO TRABALHO", "SGI", "TECNOLOGIA DA INFORMAÇÃO", "USINAGEM"
] as const;

export type Departamento = typeof DEPARTAMENTOS[number];

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Navigation Types
export type AdminTab = 'dashboard' | 'charts' | 'respostas' | 'departamentos';
export type FormStep = 'cover' | 'questions' | 'thankyou';
