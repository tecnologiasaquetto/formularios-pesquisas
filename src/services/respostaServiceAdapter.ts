/**
 * Service adapter para respostas - mantém interface do mockData mas usa Supabase
 */

import { respostaService, respostaItemService } from './supabase';
import { numberToUuid, storeUuidMapping } from '@/lib/supabaseAdapters';

export interface RespostaMock {
  id: number;
  formulario_id: number;
  respondente_nome?: string;
  respondente_email?: string;
  respondente_departamento?: string;
  ip_hash?: string;
  criado_em: string;
}

export interface RespostaItemMock {
  id: number;
  resposta_id: number;
  pergunta_id: number;
  valor: string;
  arquivo_url?: string;
}

export interface MatrizItemMock {
  id: number;
  resposta_id: number;
  pergunta_id: number;
  linha: string;
  nota: number | null;
  is_na: boolean;
}

let nextRespostaId = 1000;
const respostaCache = new Map<number, string>(); // number -> UUID

/**
 * Adiciona nova resposta
 */
export async function addResposta(data: Omit<RespostaMock, 'id' | 'criado_em'>): Promise<RespostaMock> {
  try {
    const formularioUuid = numberToUuid(data.formulario_id);
    if (!formularioUuid) {
      throw new Error('Formulário não encontrado');
    }

    const created = await respostaService.create({
      formulario_id: formularioUuid,
      respondente_nome: data.respondente_nome || null,
      respondente_email: data.respondente_email || null,
      respondente_departamento: data.respondente_departamento || null,
      ip_address: null,
      user_agent: null,
      finalizado: false
    });

    const mockId = nextRespostaId++;
    respostaCache.set(mockId, created.id);
    storeUuidMapping(created.id, mockId);

    return {
      id: mockId,
      formulario_id: data.formulario_id,
      respondente_nome: data.respondente_nome,
      respondente_email: data.respondente_email,
      respondente_departamento: data.respondente_departamento,
      ip_hash: data.ip_hash,
      criado_em: created.criado_em
    };
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    throw error;
  }
}

/**
 * Adiciona item de resposta
 */
export async function addRespostaItem(data: Omit<RespostaItemMock, 'id'>): Promise<RespostaItemMock> {
  try {
    const respostaUuid = respostaCache.get(data.resposta_id) || numberToUuid(data.resposta_id);
    const perguntaUuid = numberToUuid(data.pergunta_id);

    if (!respostaUuid || !perguntaUuid) {
      throw new Error('Resposta ou pergunta não encontrada');
    }

    const created = await respostaItemService.create({
      resposta_id: respostaUuid,
      pergunta_id: perguntaUuid,
      matriz_item_id: null,
      valor: data.valor,
      arquivo_url: data.arquivo_url || null
    });

    const mockId = nextRespostaId++;

    return {
      id: mockId,
      resposta_id: data.resposta_id,
      pergunta_id: data.pergunta_id,
      valor: data.valor,
      arquivo_url: data.arquivo_url
    };
  } catch (error) {
    console.error('Erro ao adicionar item de resposta:', error);
    throw error;
  }
}

/**
 * Adiciona item de matriz (NPS)
 */
export async function addMatrizItem(data: Omit<MatrizItemMock, 'id'>): Promise<MatrizItemMock> {
  try {
    const respostaUuid = respostaCache.get(data.resposta_id) || numberToUuid(data.resposta_id);
    const perguntaUuid = numberToUuid(data.pergunta_id);

    if (!respostaUuid || !perguntaUuid) {
      throw new Error('Resposta ou pergunta não encontrada');
    }

    // Para matriz NPS, salvamos como resposta_item com valor JSON
    const valor = data.is_na ? 'NA' : String(data.nota);
    
    const created = await respostaItemService.create({
      resposta_id: respostaUuid,
      pergunta_id: perguntaUuid,
      matriz_item_id: null,
      valor: JSON.stringify({
        linha: data.linha,
        nota: data.nota,
        is_na: data.is_na
      }),
      arquivo_url: null
    });

    const mockId = nextRespostaId++;

    return {
      id: mockId,
      resposta_id: data.resposta_id,
      pergunta_id: data.pergunta_id,
      linha: data.linha,
      nota: data.nota,
      is_na: data.is_na
    };
  } catch (error) {
    console.error('Erro ao adicionar item de matriz:', error);
    throw error;
  }
}

/**
 * Finaliza resposta
 */
export async function finalizarResposta(respostaId: number): Promise<void> {
  try {
    const respostaUuid = respostaCache.get(respostaId) || numberToUuid(respostaId);
    if (!respostaUuid) {
      throw new Error('Resposta não encontrada');
    }

    await respostaService.finalize(respostaUuid);
  } catch (error) {
    console.error('Erro ao finalizar resposta:', error);
    throw error;
  }
}
