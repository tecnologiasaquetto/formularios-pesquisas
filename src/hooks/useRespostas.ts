import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { respostaService, statsService, perguntaService } from '@/services/supabase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Query Keys
export const respostaKeys = {
  all: ['respostas'] as const,
  byForm: (formId: string) => [...respostaKeys.all, 'form', formId] as const,
  detail: (id: string) => [...respostaKeys.all, 'detail', id] as const,
  items: (respostaId: string) => [...respostaKeys.detail(respostaId), 'items'] as const,
};

export const statsKeys = {
  all: ['stats'] as const,
  formStats: (formId: string) => [...statsKeys.all, 'form', formId] as const,
  npsStats: (formId: string) => [...statsKeys.all, 'nps', formId] as const,
  matrizStats: (formId: string) => [...statsKeys.all, 'matriz', formId] as const,
};

export const perguntaKeys = {
  all: ['perguntas'] as const,
  byForm: (formId: string) => [...perguntaKeys.all, 'form', formId] as const,
  matrizItens: (perguntaIds: string[]) => [...perguntaKeys.all, 'matriz-itens', perguntaIds] as const,
};

/**
 * Hook para buscar respostas de um formulário
 */
export function useRespostas(formId: string | undefined) {
  return useQuery({
    queryKey: respostaKeys.byForm(formId || ''),
    queryFn: () => respostaService.getByFormulario(formId!),
    enabled: !!formId,
  });
}

/**
 * Hook para buscar perguntas de um formulário
 */
export function usePerguntas(formId: string | undefined) {
  return useQuery({
    queryKey: perguntaKeys.byForm(formId || ''),
    queryFn: () => perguntaService.getByFormulario(formId!),
    enabled: !!formId,
  });
}

/**
 * Hook para buscar itens de resposta
 */
export function useRespostaItens(respostaIds: string[]) {
  return useQuery({
    queryKey: [...respostaKeys.all, 'items', respostaIds],
    queryFn: async () => {
      if (respostaIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('resposta_itens')
        .select('*')
        .in('resposta_id', respostaIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: respostaIds.length > 0,
  });
}

/**
 * Hook para buscar itens de matriz
 */
export function useMatrizItens(perguntaIds: string[]) {
  return useQuery({
    queryKey: perguntaKeys.matrizItens(perguntaIds),
    queryFn: async () => {
      if (perguntaIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('matriz_itens')
        .select('*')
        .in('pergunta_id', perguntaIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: perguntaIds.length > 0,
  });
}

/**
 * Hook para buscar estatísticas NPS
 */
export function useNpsStats(formId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.npsStats(formId || ''),
    queryFn: () => statsService.getNpsStats(formId!),
    enabled: !!formId,
    retry: false, // Não tentar novamente se falhar
  });
}

/**
 * Hook para buscar estatísticas de matriz
 */
export function useMatrizStats(formId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.matrizStats(formId || ''),
    queryFn: () => statsService.getMatrizStats(formId!),
    enabled: !!formId,
    retry: false,
  });
}

/**
 * Hook para buscar estatísticas gerais do formulário
 */
export function useFormStats(formId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.formStats(formId || ''),
    queryFn: () => statsService.getFormStats(formId!),
    enabled: !!formId,
  });
}

/**
 * Hook para criar uma resposta
 */
export function useCreateResposta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => respostaService.create(data),
    onSuccess: (_, variables) => {
      // Invalida respostas e stats do formulário
      if (variables.formulario_id) {
        queryClient.invalidateQueries({ 
          queryKey: respostaKeys.byForm(variables.formulario_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: statsKeys.formStats(variables.formulario_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: statsKeys.npsStats(variables.formulario_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: statsKeys.matrizStats(variables.formulario_id) 
        });
      }
      toast.success('Resposta enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar resposta:', error);
      toast.error('Erro ao enviar resposta');
    },
  });
}

/**
 * Hook para atualizar uma resposta
 */
export function useUpdateResposta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data, formId }: { id: string; data: any; formId: string }) => 
      respostaService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: respostaKeys.byForm(variables.formId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: statsKeys.formStats(variables.formId) 
      });
      toast.success('Resposta atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar resposta:', error);
      toast.error('Erro ao atualizar resposta');
    },
  });
}
