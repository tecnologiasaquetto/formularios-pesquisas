import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type Users = Tables['users']['Row']
type Formularios = Tables['formularios']['Row']
type Perguntas = Tables['perguntas']['Row']
type Respostas = Tables['respostas']['Row']
type RespostaItens = Tables['resposta_itens']['Row']
type MatrizItens = Tables['matriz_itens']['Row']
type Departamentos = Tables['departamentos']['Row']

// User Services
export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('criado_em', { ascending: false })
    
    if (error) throw error
    return data as Users[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Users
  },

  async create(userData: Omit<Users, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data as Users
  },

  async update(id: string, userData: Partial<Users>) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Users
  },

  async delete(id: string) {
    // Primeiro deletar do auth (se possível/necessário usar supabaseAdmin)
    if (supabaseAdmin) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (authError) console.warn('Erro ao deletar do auth (pode não existir):', authError)
    } else {
      console.warn('supabaseAdmin não configurado. O usuário foi removido apenas da tabela local, o acesso via Auth ainda pode existir.');
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async createWithAuth(userData: any) {
    if (!supabaseAdmin) {
      throw new Error('Configuração incompleta: A chave VITE_SUPABASE_SERVICE_ROLE_KEY não foi encontrada no arquivo .env. Esta chave é obrigatória para criar usuários diretamente pelo painel administrativo.');
    }

    // 1. Criar no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.senha || 'temp123456',
      email_confirm: true,
      user_metadata: {
        nome: userData.nome,
        role: userData.role
      }
    })

    if (authError) throw authError

    // 2. Criar na tabela users
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        nome: userData.nome,
        role: userData.role,
        ativo: true
      })
      .select()
      .single()
    
    if (error) throw error
    return data as Users
  },

  async toggleStatus(id: string) {
    const user = await this.getById(id)
    return this.update(id, { ativo: !user.ativo })
  }
}

// Formulário Services
export const formularioService = {
  async getAll(includeInactive = false) {
    const query = supabase
      .from('formularios')
      .select(`
        *,
        users:criado_por(nome, email)
      `)
      .order('criado_em', { ascending: false })
    
    if (!includeInactive) {
      query.eq('ativo', true)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data as (Formularios & { users: { nome: string; email: string } | null })[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('formularios')
      .select(`
        *,
        users:criado_por(nome, email)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as (Formularios & { users: { nome: string; email: string } | null })
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('slug', slug)
      .eq('ativo', true)
      .single()
    
    if (error) throw error
    return data as Formularios
  },

  async create(formData: Omit<Formularios, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('formularios')
      .insert(formData)
      .select()
      .single()
    
    if (error) throw error
    return data as Formularios
  },

  async update(id: string, formData: Partial<Formularios>) {
    const { data, error } = await supabase
      .from('formularios')
      .update(formData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Formularios
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('formularios')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async toggleStatus(id: string) {
    const formulario = await this.getById(id)
    return this.update(id, { ativo: !formulario.ativo })
  },

  async duplicate(id: string) {
    const original = await this.getById(id)
    const perguntas = await perguntaService.getByFormulario(id)
    
    const newForm = await this.create({
      nome: `${original.nome} (cópia)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      descricao: original.descricao,
      mensagem_fim: original.mensagem_fim,
      logo_url: original.logo_url,
      data_inicio: original.data_inicio,
      data_fim: original.data_fim,
      mostrar_capa: original.mostrar_capa,
      ativo: false,
      cor_tema: original.cor_tema,
      criado_por: original.criado_por
    })

    // Duplicar perguntas
    for (const pergunta of perguntas) {
      const matrizItens = await matrizItemService.getByPergunta(pergunta.id)
      
      const newPergunta = await perguntaService.create({
        formulario_id: newForm.id,
        texto: pergunta.texto,
        tipo: pergunta.tipo,
        obrigatorio: pergunta.obrigatorio,
        ordem: pergunta.ordem,
        opcoes: pergunta.opcoes,
        validacoes: pergunta.validacoes
      })

      // Duplicar itens da matriz
      for (const item of matrizItens) {
        await matrizItemService.create({
          pergunta_id: newPergunta.id,
          linha: item.linha,
          coluna: item.coluna,
          ordem: item.ordem
        })
      }
    }

    return newForm
  }
}

// Pergunta Services
export const perguntaService = {
  async getByFormulario(formularioId: string) {
    const { data, error } = await supabase
      .from('perguntas')
      .select('*')
      .eq('formulario_id', formularioId)
      .order('ordem', { ascending: true })
    
    if (error) throw error
    return data as Perguntas[]
  },

  async create(perguntaData: Omit<Perguntas, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('perguntas')
      .insert(perguntaData)
      .select()
      .single()
    
    if (error) throw error
    return data as Perguntas
  },

  async update(id: string, perguntaData: Partial<Perguntas>) {
    // Usar supabaseAdmin para garantir que o administrador consiga salvar independente de políticas de RLS restritivas
    // e remover campos que não devem ser atualizados manualmente (usando o operador rest)
    const { id: _, criado_em: __, atualizado_em: ___, ...cleanData } = perguntaData as any;
    
    // Fallback para o cliente padrão se o admin não estiver disponível
    const client = (supabaseAdmin as any) || supabase;
    
    const { data, error } = await client
      .from('perguntas')
      .update(cleanData)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error(`[perguntaService] Erro ao atualizar pergunta ${id}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`[perguntaService] Atualizado com sucesso: ${id}:`, data[0]);
      return data[0] as Perguntas;
    }
    
    console.warn(`[perguntaService] Nenhuma linha encontrada para atualizar: ${id}`);
    return null;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('perguntas')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async reorder(perguntas: { id: string; ordem: number }[]) {
    const updates = perguntas.map(({ id, ordem }) => 
      supabase
        .from('perguntas')
        .update({ ordem })
        .eq('id', id)
    )
    
    await Promise.all(updates)
  }
}

// Matriz Item Services
export const matrizItemService = {
  async getByPergunta(perguntaId: string) {
    const { data, error } = await supabase
      .from('matriz_itens')
      .select('*')
      .eq('pergunta_id', perguntaId)
      .order('ordem', { ascending: true })
    
    if (error) throw error
    return data as MatrizItens[]
  },

  async create(itemData: Omit<MatrizItens, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('matriz_itens')
      .insert(itemData)
      .select()
      .single()
    
    if (error) throw error
    return data as MatrizItens
  },

  async update(id: string, itemData: Partial<MatrizItens>) {
    const { data, error } = await supabase
      .from('matriz_itens')
      .update(itemData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as MatrizItens
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('matriz_itens')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Resposta Services
export const respostaService = {
  async getByFormulario(formularioId: string) {
    const { data, error } = await supabase
      .from('respostas')
      .select(`
        *,
        resposta_itens(
          *,
          perguntas(texto, tipo),
          matriz_itens(linha, coluna)
        )
      `)
      .eq('formulario_id', formularioId)
      .order('criado_em', { ascending: false })
    
    if (error) throw error
    return data as (Respostas & { 
      resposta_itens: (RespostaItens & { 
        perguntas: Pick<Perguntas, 'texto' | 'tipo'>
        matriz_itens: Pick<MatrizItens, 'linha' | 'coluna'> | null
      })[]
    })[]
  },

  async create(respostaData: Omit<Respostas, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('respostas')
      .insert(respostaData)
      .select()
      .single()
    
    if (error) throw error
    return data as Respostas
  },

  async update(id: string, respostaData: Partial<Respostas>) {
    const { data, error } = await supabase
      .from('respostas')
      .update(respostaData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Respostas
  },

  async finalize(id: string) {
    return this.update(id, { finalizado: true })
  }
}

// Resposta Item Services
export const respostaItemService = {
  async create(itemData: Omit<RespostaItens, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('resposta_itens')
      .insert(itemData)
      .select()
      .single()
    
    if (error) throw error
    return data as RespostaItens
  },

  async createBatch(items: Omit<RespostaItens, 'id' | 'criado_em'>[]) {
    const { data, error } = await supabase
      .from('resposta_itens')
      .insert(items)
      .select()
    
    if (error) throw error
    return data as RespostaItens[]
  },

  async update(id: string, itemData: Partial<RespostaItens>) {
    const { data, error } = await supabase
      .from('resposta_itens')
      .update(itemData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as RespostaItens
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('resposta_itens')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Departamento Services
export const departamentoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('departamentos')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    if (error) throw error
    return data as Departamentos[]
  },

  async create(deptData: Omit<Departamentos, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('departamentos')
      .insert(deptData)
      .select()
      .single()
    
    if (error) throw error
    return data as Departamentos
  },

  async update(id: string, deptData: Partial<Departamentos>) {
    const { data, error } = await supabase
      .from('departamentos')
      .update(deptData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Departamentos
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('departamentos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export interface MatrizStatItem {
  linha: string
  media: number
  avaliacoes: number
  na: number
  scoreNps: number | null
  promotores?: number
  detratores?: number
  percPromotores?: number
  percDetratores?: number
}

// Statistics Services
export const statsService = {
  async getNpsStats(formularioId: string) {
    const { data, error } = await supabase
      .rpc('calc_nps_stats', { p_formulario_id: formularioId })
    
    if (error) throw error
    return data as any
  },

  async getFormStats(formularioId: string) {
    const respostas = await respostaService.getByFormulario(formularioId)
    
    return {
      totalRespostas: respostas.length,
      respostasHoje: respostas.filter(r => 
        new Date(r.criado_em).toDateString() === new Date().toDateString()
      ).length,
      taxaConclusao: respostas.length > 0 ? respostas.filter(r => r.finalizado).length / respostas.length * 100 : 0,
      ultimaResposta: respostas[0]?.criado_em || null
    }
  },

  async getMatrizStats(formularioId: string): Promise<Record<string, MatrizStatItem[]>> {
    const { data, error } = await supabase
      .from('resposta_itens')
      .select(`
        valor,
        pergunta_id,
        matriz_itens (linha),
        perguntas!inner (formulario_id, tipo)
      `)
      .eq('perguntas.formulario_id', formularioId)
      .eq('perguntas.tipo', 'matriz_nps')

    if (error) throw error

    // Group by pergunta_id, then by linha
    const byPergunta: Record<string, Record<string, { notas: number[]; naCount: number }>> = {}
    
    data.forEach((item: any) => {
      const perguntaId = item.pergunta_id
      if (!perguntaId) return

      let linha = item.matriz_itens?.linha
      let notaValue = item.valor
      let isNa = item.valor === 'NA'

      if (!linha && item.valor) {
        try {
          const parsed = JSON.parse(item.valor)
          if (parsed && typeof parsed === 'object' && 'linha' in parsed) {
            linha = parsed.linha
            notaValue = parsed.nota
            isNa = parsed.is_na
          }
        } catch(e) {}
      }

      if (!linha) return

      if (!byPergunta[perguntaId]) byPergunta[perguntaId] = {}
      if (!byPergunta[perguntaId][linha]) byPergunta[perguntaId][linha] = { notas: [], naCount: 0 }
      
      if (isNa || notaValue === null) {
        byPergunta[perguntaId][linha].naCount++
      } else {
        const nota = parseInt(String(notaValue))
        if (!isNaN(nota)) byPergunta[perguntaId][linha].notas.push(nota)
      }
    })

    const calcStats = (linhaStats: Record<string, { notas: number[]; naCount: number }>): MatrizStatItem[] =>
      Object.entries(linhaStats).map(([linha, stats]) => {
        const totalValido = stats.notas.length
        const media = totalValido > 0 
          ? Number((stats.notas.reduce((a, b) => a + b, 0) / totalValido).toFixed(1))
          : 0
        const promotores = stats.notas.filter(n => n >= 9).length
        const detratores = stats.notas.filter(n => n <= 6).length
        const percPromotores = totalValido > 0 ? Math.round((promotores / totalValido) * 100) : 0
        const percDetratores = totalValido > 0 ? Math.round((detratores / totalValido) * 100) : 0
        const scoreNps = totalValido > 0 
          ? percPromotores - percDetratores
          : null
        return { linha, media, avaliacoes: totalValido, na: stats.naCount, scoreNps, promotores, detratores, percPromotores, percDetratores }
      }).sort((a, b) => (b.scoreNps ?? -101) - (a.scoreNps ?? -101))

    const result: Record<string, MatrizStatItem[]> = {}
    for (const [pid, linhaStats] of Object.entries(byPergunta)) {
      result[pid] = calcStats(linhaStats)
    }
    return result
  }
}

// File Upload Services
export const fileService = {
  async uploadLogo(file: File, formularioId: string) {
    const fileName = `formularios/${formularioId}/logo-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)
    
    return publicUrl
  },

  async uploadAnexo(file: File, respostaId: string, perguntaId: string) {
    const fileName = `respostas/${respostaId}/${perguntaId}/${Date.now()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)
    
    return publicUrl
  },

  async deleteFile(path: string, bucket: 'logos' | 'uploads') {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
  }
}

// Realtime Services
export const realtimeService = {
  subscribeToFormularios(callback: (payload: any) => void) {
    return supabase
      .channel('formularios')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'formularios' 
        }, 
        callback
      )
      .subscribe()
  },

  subscribeToRespostas(formularioId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`respostas-${formularioId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'respostas',
          filter: `formulario_id=eq.${formularioId}`
        }, 
        callback
      )
      .subscribe()
  },

  unsubscribe(channel: any) {
    supabase.removeChannel(channel)
  }
}
