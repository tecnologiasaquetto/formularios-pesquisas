// Debug: Verificar se está usando Supabase ou Mock
import { supabase } from './lib/supabase'
import { formularios as mockFormularios } from './lib/mockData'

console.log('🔍 DEBUG: Verificando conexão com Supabase...')

// Teste 1: Verificar se Supabase client existe
console.log('✅ Supabase client:', !!supabase)

// Teste 2: Tentar buscar dados do Supabase
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('count')
      .single()
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error)
      console.log('📊 Usando dados MOCK (fallback)')
      return false
    }
    
    console.log('✅ Conectado ao Supabase!')
    console.log('📊 Total de formulários no Supabase:', data)
    return true
  } catch (err) {
    console.error('❌ Erro geral:', err)
    console.log('📊 Usando dados MOCK (fallback)')
    return false
  }
}

// Teste 3: Comparar com dados mock
console.log('📊 Mock data count:', mockFormularios.length)

// Executar teste
testSupabaseConnection().then(isSupabaseConnected => {
  if (isSupabaseConnected) {
    console.log('🚀 App está usando SUPABASE (dados reais)')
  } else {
    console.log('📦 App está usando MOCK DATA')
  }
})

export { testSupabaseConnection }
