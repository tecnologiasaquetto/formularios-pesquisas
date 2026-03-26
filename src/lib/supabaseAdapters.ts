/**
 * Adapters para converter entre estrutura Mock e Supabase
 * Permite que o código existente continue funcionando com mínimas alterações
 */

import type { Database } from '@/types/supabase';

type SupabasePergunta = Database['public']['Tables']['perguntas']['Row'];
type SupabaseFormulario = Database['public']['Tables']['formularios']['Row'];

// Tipo Mock (como está no código atual)
export interface PerguntaMock {
  id: number;
  formulario_id: number;
  tipo: string;
  texto: string;
  ordem: number;
  obrigatorio: boolean;
  config: any;
}

export interface FormularioMock {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  mensagem_fim?: string;
  logo_url?: string;
  data_inicio?: string;
  data_fim?: string;
  mostrar_capa?: boolean;
  ativo: boolean;
  cor_tema?: string;
  criado_em: string;
}

/**
 * Converte pergunta do Supabase para formato Mock
 */
export function supabasePerguntaToMock(p: SupabasePergunta): PerguntaMock {
  // Combinar opcoes e validacoes em um único objeto config
  const config: any = {};
  
  if (p.opcoes) {
    const opcoes = p.opcoes as any;
    Object.assign(config, opcoes);
  }
  
  if (p.validacoes) {
    const validacoes = p.validacoes as any;
    Object.assign(config, validacoes);
  }

  return {
    id: hashStringToNumber(p.id), // Converter UUID para número temporário
    formulario_id: hashStringToNumber(p.formulario_id),
    tipo: p.tipo,
    texto: p.texto,
    ordem: p.ordem,
    obrigatorio: p.obrigatorio,
    config
  };
}

/**
 * Converte pergunta do formato Mock para Supabase
 */
export function mockPerguntaToSupabase(p: Partial<PerguntaMock>, formularioId: string): Partial<SupabasePergunta> {
  const { config, id, formulario_id, ...rest } = p;
  
  // Separar config em opcoes e validacoes
  const opcoes: any = {};
  const validacoes: any = {};
  
  if (config) {
    // Campos que vão para opcoes
    const opcoesFields = ['opcoes', 'linhas', 'escala_min', 'escala_max', 'label_min', 'label_max', 
                          'escala', 'labels', 'placeholder', 'descricao', 'mostrar_na'];
    
    // Campos que vão para validacoes
    const validacoesFields = ['min', 'max', 'required', 'pattern'];
    
    Object.keys(config).forEach(key => {
      if (opcoesFields.includes(key)) {
        opcoes[key] = config[key];
      } else if (validacoesFields.includes(key)) {
        validacoes[key] = config[key];
      } else {
        // Por padrão, colocar em opcoes
        opcoes[key] = config[key];
      }
    });
  }

  const result: any = {
    formulario_id: formularioId,
    ...rest
  };

  // Só incluir campos que foram passados
  if (p.tipo !== undefined) result.tipo = p.tipo;
  if (p.texto !== undefined) result.texto = p.texto;
  if (p.ordem !== undefined) result.ordem = p.ordem;
  if (p.obrigatorio !== undefined) result.obrigatorio = p.obrigatorio;
  if (Object.keys(opcoes).length > 0) result.opcoes = opcoes;
  if (Object.keys(validacoes).length > 0) result.validacoes = validacoes;

  return result;
}

/**
 * Converte formulário do Supabase para formato Mock
 */
export function supabaseFormularioToMock(f: SupabaseFormulario): FormularioMock {
  return {
    id: hashStringToNumber(f.id),
    nome: f.nome,
    slug: f.slug,
    descricao: f.descricao || undefined,
    mensagem_fim: f.mensagem_fim || undefined,
    logo_url: f.logo_url || undefined,
    data_inicio: f.data_inicio || undefined,
    data_fim: f.data_fim || undefined,
    mostrar_capa: f.mostrar_capa,
    ativo: f.ativo,
    cor_tema: f.cor_tema || undefined,
    criado_em: f.criado_em
  };
}

/**
 * Hash simples de string para número (para compatibilidade temporária)
 * Mantém um mapa de UUIDs para números consistentes
 */
const uuidToNumberMap = new Map<string, number>();
let nextId = 1;

function hashStringToNumber(uuid: string): number {
  if (uuidToNumberMap.has(uuid)) {
    return uuidToNumberMap.get(uuid)!;
  }
  
  const id = nextId++;
  uuidToNumberMap.set(uuid, id);
  return id;
}

/**
 * Recupera UUID original a partir do número
 */
export function numberToUuid(num: number): string | undefined {
  for (const [uuid, id] of uuidToNumberMap.entries()) {
    if (id === num) {
      return uuid;
    }
  }
  return undefined;
}

/**
 * Armazena mapeamento UUID <-> número para uso posterior
 */
export function storeUuidMapping(uuid: string, num: number) {
  uuidToNumberMap.set(uuid, num);
}

/**
 * Limpa o cache de mapeamentos
 */
export function clearUuidMappings() {
  uuidToNumberMap.clear();
  nextId = 1;
}
