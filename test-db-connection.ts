import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');
  
  try {
    // Testar conexão básica
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('✅ Conexão estabelecida!');
    console.log('Session:', session ? 'Ativa' : 'Não autenticado');
    
    // Verificar tabelas
    console.log('\n📊 Verificando tabelas...\n');
    
    const tables = [
      'users',
      'formularios',
      'perguntas',
      'respostas',
      'resposta_itens',
      'matriz_itens',
      'departamentos'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Tabela '${table}': ${error.message}`);
        } else {
          console.log(`✅ Tabela '${table}': OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela '${table}': Erro ao verificar`);
      }
    }
    
    console.log('\n✨ Teste concluído!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  }
}

testConnection();
