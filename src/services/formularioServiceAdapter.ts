/**
 * Service adapter que mantém a interface do mockData mas usa Supabase
 */

import { formularioService, perguntaService } from './supabase';
import { 
  supabasePerguntaToMock, 
  mockPerguntaToSupabase,
  supabaseFormularioToMock,
  numberToUuid,
  storeUuidMapping,
  type PerguntaMock,
  type FormularioMock
} from '@/lib/supabaseAdapters';

// Re-export types
export type { PerguntaMock, FormularioMock } from '@/lib/supabaseAdapters';

// Cache de dados para manter referências
let formularioCache: Map<number, { uuid: string, data: FormularioMock }> = new Map();
let perguntaCache: Map<number, { uuid: string, data: PerguntaMock }> = new Map();

/**
 * Busca formulário por slug
 */
export async function getFormularioBySlug(slug: string): Promise<FormularioMock | null> {
  try {
    const supabaseForm = await formularioService.getBySlug(slug);
    if (!supabaseForm) return null;
    
    const mockForm = supabaseFormularioToMock(supabaseForm);
    formularioCache.set(mockForm.id, { uuid: supabaseForm.id, data: mockForm });
    storeUuidMapping(supabaseForm.id, mockForm.id);
    
    return mockForm;
  } catch (error) {
    console.error('Erro ao buscar formulário:', error);
    return null;
  }
}

/**
 * Busca perguntas por formulário
 */
export async function getPerguntasByFormulario(formularioId: number): Promise<PerguntaMock[]> {
  try {
    const uuid = numberToUuid(formularioId);
    if (!uuid) {
      console.error('UUID não encontrado para formularioId:', formularioId);
      return [];
    }
    
    const supabasePerguntas = await perguntaService.getByFormulario(uuid);
    const mockPerguntas = supabasePerguntas.map(p => {
      const mock = supabasePerguntaToMock(p);
      perguntaCache.set(mock.id, { uuid: p.id, data: mock });
      storeUuidMapping(p.id, mock.id);
      return mock;
    });
    
    return mockPerguntas.sort((a, b) => a.ordem - b.ordem);
  } catch (error) {
    console.error('Erro ao buscar perguntas:', error);
    return [];
  }
}

/**
 * Adiciona nova pergunta
 */
export async function addPergunta(data: Omit<PerguntaMock, 'id'>): Promise<PerguntaMock> {
  try {
    const formularioUuid = numberToUuid(data.formulario_id);
    if (!formularioUuid) {
      throw new Error('Formulário não encontrado');
    }
    
    const supabaseData = mockPerguntaToSupabase(data, formularioUuid);
    const created = await perguntaService.create(supabaseData as any);
    
    const mock = supabasePerguntaToMock(created);
    perguntaCache.set(mock.id, { uuid: created.id, data: mock });
    storeUuidMapping(created.id, mock.id);
    
    return mock;
  } catch (error) {
    console.error('Erro ao adicionar pergunta:', error);
    throw error;
  }
}

/**
 * Remove pergunta
 */
export async function removePergunta(perguntaId: number): Promise<void> {
  try {
    const uuid = numberToUuid(perguntaId);
    if (!uuid) {
      throw new Error('Pergunta não encontrada');
    }
    
    await perguntaService.delete(uuid);
    perguntaCache.delete(perguntaId);
  } catch (error) {
    console.error('Erro ao remover pergunta:', error);
    throw error;
  }
}

/**
 * Atualiza pergunta
 */
export async function updatePergunta(perguntaId: number, updates: Partial<PerguntaMock>): Promise<PerguntaMock> {
  try {
    const uuid = numberToUuid(perguntaId);
    if (!uuid) {
      throw new Error('Pergunta não encontrada');
    }
    
    const cached = perguntaCache.get(perguntaId);
    if (!cached) {
      throw new Error('Pergunta não está no cache');
    }
    
    // TODO: Corrigir conversão de dados no adapter
    // Converter para formato Supabase, mas remover formulario_id do update
    const supabaseUpdates = mockPerguntaToSupabase(updates, cached.uuid);
    const { formulario_id, ...updateData } = supabaseUpdates;
    
    const updated = await perguntaService.update(uuid, updateData as any);
    
    const mock = supabasePerguntaToMock(updated);
    perguntaCache.set(mock.id, { uuid: updated.id, data: mock });
    
    return mock;
  } catch (error) {
    console.error('Erro ao atualizar pergunta:', error);
    throw error;
  }
}

/**
 * Reordena pergunta
 */
export async function reorderPergunta(perguntaId: number, newOrdem: number): Promise<void> {
  try {
    const uuid = numberToUuid(perguntaId);
    if (!uuid) {
      throw new Error('Pergunta não encontrada');
    }
    
    await perguntaService.update(uuid, { ordem: newOrdem });
  } catch (error) {
    console.error('Erro ao reordenar pergunta:', error);
    throw error;
  }
}

/**
 * Duplica pergunta
 */
export async function duplicatePergunta(perguntaId: number): Promise<PerguntaMock> {
  try {
    const cached = perguntaCache.get(perguntaId);
    if (!cached) {
      throw new Error('Pergunta não encontrada no cache');
    }
    
    const original = cached.data;
    const newPergunta = await addPergunta({
      ...original,
      texto: `${original.texto} (cópia)`,
      ordem: original.ordem + 5
    });
    
    return newPergunta;
  } catch (error) {
    console.error('Erro ao duplicar pergunta:', error);
    throw error;
  }
}

/**
 * Atualiza formulário
 */
export async function updateFormulario(formularioId: number, updates: Partial<FormularioMock>): Promise<void> {
  try {
    const uuid = numberToUuid(formularioId);
    if (!uuid) {
      throw new Error('Formulário não encontrado');
    }
    
    await formularioService.update(uuid, updates as any);
  } catch (error) {
    console.error('Erro ao atualizar formulário:', error);
    throw error;
  }
}

/**
 * Limpa caches (útil para testes)
 */
export function clearCaches() {
  formularioCache.clear();
  perguntaCache.clear();
}
