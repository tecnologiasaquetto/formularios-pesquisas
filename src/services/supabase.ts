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
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
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
    const { data, error } = await supabase
      .from('perguntas')
      .update(perguntaData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Perguntas
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
      taxaConclusao: respostas.filter(r => r.finalizado).length / respostas.length * 100,
      ultimaResposta: respostas[0]?.criado_em || null
    }
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
