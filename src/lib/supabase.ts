import { createClient } from '@supabase/supabase-js'

// Configuração de variáveis de ambiente para Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';

// Supabase configurado

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Supabase environment variables not found!');
  console.error('📋 URL:', supabaseUrl);
  console.error('📋 Key:', supabaseAnonKey ? 'exists' : 'missing');
  throw new Error('Supabase credentials missing');
}

// Criar apenas UMA instância do cliente Supabase (singleton)
// Usar uma variável global para garantir singleton mesmo com hot reload
declare global {
  var __supabase: ReturnType<typeof createClient> | undefined;
}

if (!globalThis.__supabase) {
  globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-ftxzpvrdyqnofxjmyeqd-auth-token',
      flowType: 'pkce'
    }
  });
}

export const supabase = globalThis.__supabase;

// Para operações admin, usar o mesmo cliente (não criar nova instância)
export const supabaseAdmin = supabase;

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
