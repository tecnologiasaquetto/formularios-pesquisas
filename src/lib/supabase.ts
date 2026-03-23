import { createClient } from '@supabase/supabase-js'

// Para desenvolvimento, use valores hardcoded ou window.ENV
// Para produção, use Vite env variables
const getEnvVar = (key: string) => {
  // Primeiro tenta import.meta.env (Vite)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Fallback para window.ENV (se definido globalmente)
  if (typeof window !== 'undefined' && (window as any).ENV?.[key]) {
    return (window as any).ENV[key];
  }
  // Fallback para desenvolvimento
  const defaults: Record<string, string> = {
    REACT_APP_SUPABASE_URL: 'https://your-project-id.supabase.co',
    REACT_APP_SUPABASE_ANON_KEY: 'default-key',
    REACT_APP_SUPABASE_SERVICE_ROLE_KEY: 'default-service-key'
  };
  return defaults[key] || '';
};

const supabaseUrl = getEnvVar('REACT_APP_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('REACT_APP_SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnvVar('REACT_APP_SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Supabase environment variables not found!');
  console.error('📋 Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  console.error('📁 Create .env.local file with your credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Para operações server-side (admin)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
