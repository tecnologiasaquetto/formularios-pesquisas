import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Configuração de variáveis de ambiente para Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';

// Supabase configurado

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Supabase environment variables not found!');
  console.error('📋 URL:', supabaseUrl);
  throw new Error('Faltam variáveis de ambiente do Supabase')
}

// Cliente único para evitar múltiplas instâncias de GoTrue e conflitos de Lock
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: false
  }
})

// Reutilizamos a mesma instância para rotas públicas
export const supabasePublic = supabase

// Cliente admin usando a Service Role Key (apenas se a chave estiver presente)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        lock: false
      }
    })
  : null

// Helper para autenticação
export const authHelpers = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async updateProfile(updates: any) {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) throw error
    return data
  },

  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
