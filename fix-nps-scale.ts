import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixNpsScale() {
  console.log('=== Verificando perguntas de Matriz NPS com escala 1-10 ===\n')

  // Buscar todas as perguntas de matriz_nps
  const { data: perguntas, error } = await supabase
    .from('perguntas')
    .select('id, texto, formulario_id, opcoes, validacoes')
    .eq('tipo', 'matriz_nps')

  if (error) {
    console.error('Erro ao buscar perguntas:', error)
    return
  }

  console.log(`Total de perguntas matriz_nps encontradas: ${perguntas?.length || 0}\n`)

  const paraCorrigir: any[] = []

  for (const p of (perguntas || [])) {
    // O config pode estar em opcoes ou validacoes dependendo da versão
    let config = p.opcoes || p.validacoes || {}
    
    if (typeof config === 'string') {
      try { config = JSON.parse(config) } catch { config = {} }
    }

    const escalaMin = config?.escala_min
    console.log(`Pergunta [${p.id}]: "${p.texto?.substring(0, 50)}..." → escala_min: ${escalaMin}`)

    if (escalaMin === 1) {
      paraCorrigir.push({ id: p.id, config, texto: p.texto })
    }
  }

  console.log(`\n=== Perguntas com escala_min: 1 (a corrigir): ${paraCorrigir.length} ===`)

  if (paraCorrigir.length === 0) {
    console.log('\nNenhuma pergunta precisa ser corrigida! A escala já está 0-10 no banco.')
    return
  }

  for (const p of paraCorrigir) {
    const novoConfig = { ...p.config, escala_min: 0 }
    
    // Tentar atualizar em 'opcoes'
    const { error: errOpcoes } = await supabase
      .from('perguntas')
      .update({ opcoes: novoConfig })
      .eq('id', p.id)

    if (errOpcoes) {
      console.error(`  ✗ Erro ao corrigir pergunta ${p.id}:`, errOpcoes.message)
    } else {
      console.log(`  ✓ Corrigido: "${p.texto?.substring(0, 50)}..." → escala_min: 0`)
    }
  }

  console.log('\n=== Correção finalizada! ===')
}

fixNpsScale()
