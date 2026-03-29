import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formularioService, statsService } from '@/services/supabase';
import { toast } from 'sonner';

// Query Keys - centralizados para facilitar invalidação
export const formularioKeys = {
  all: ['formularios'] as const,
  lists: () => [...formularioKeys.all, 'list'] as const,
  list: (filters?: any) => [...formularioKeys.lists(), filters] as const,
  details: () => [...formularioKeys.all, 'detail'] as const,
  detail: (id: string) => [...formularioKeys.details(), id] as const,
  stats: (id: string) => [...formularioKeys.detail(id), 'stats'] as const,
};

/**
 * Hook para buscar todos os formulários com suas estatísticas
 */
export function useFormularios() {
  return useQuery({
    queryKey: formularioKeys.list(),
    queryFn: async () => {
      const data = await formularioService.getAll();
      
      // Carregar estatísticas em paralelo
      const formsWithStats = await Promise.all(
        data.map(async (form) => {
          try {
            const stats = await statsService.getFormStats(form.id);
            return { ...form, totalRespostas: stats.totalRespostas };
          } catch (err) {
            console.error(`Erro ao carregar stats para ${form.id}:`, err);
            return { ...form, totalRespostas: 0 };
          }
        })
      );
      
      return formsWithStats;
    },
  });
}

/**
 * Hook para buscar um formulário específico
 */
export function useFormulario(id: string | undefined) {
  return useQuery({
    queryKey: formularioKeys.detail(id || ''),
    queryFn: () => formularioService.getById(id!),
    enabled: !!id, // Só executa se id existir
  });
}

/**
 * Hook para criar um novo formulário
 */
export function useCreateFormulario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => formularioService.create(data),
    onSuccess: () => {
      // Invalida a lista para forçar refetch
      queryClient.invalidateQueries({ queryKey: formularioKeys.lists() });
      toast.success('Formulário criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar formulário:', error);
      toast.error('Erro ao criar formulário');
    },
  });
}

/**
 * Hook para atualizar um formulário
 */
export function useUpdateFormulario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      formularioService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalida tanto a lista quanto o detalhe específico
      queryClient.invalidateQueries({ queryKey: formularioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formularioKeys.detail(variables.id) });
      toast.success('Formulário atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar formulário:', error);
      toast.error('Erro ao atualizar formulário');
    },
  });
}

/**
 * Hook para deletar um formulário
 */
export function useDeleteFormulario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => formularioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formularioKeys.lists() });
      toast.success('Formulário excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir formulário:', error);
      toast.error('Erro ao excluir formulário');
    },
  });
}

/**
 * Hook para duplicar um formulário
 */
export function useDuplicateFormulario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => formularioService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formularioKeys.lists() });
      toast.success('Formulário duplicado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao duplicar formulário:', error);
      toast.error('Erro ao duplicar formulário');
    },
  });
}

/**
 * Hook para alternar status ativo/inativo
 */
export function useToggleFormularioStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => formularioService.toggleStatus(id),
    onSuccess: (_, id) => {
      // Atualização otimista - atualiza o cache imediatamente
      queryClient.invalidateQueries({ queryKey: formularioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formularioKeys.detail(id) });
      toast.success('Status alterado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do formulário');
    },
  });
}
