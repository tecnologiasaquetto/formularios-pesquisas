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

async function testLogin() {
  console.log('🔍 Testando login e busca de usuário...\n');
  
  try {
    const userId = 'e380a80b-9ce6-4f12-9bf1-92e8a8919162';
    
    // Verificar se o usuário existe na tabela users
    console.log('📊 Verificando usuário na tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message);
      return;
    }
    
    if (userData) {
      console.log('✅ Usuário encontrado na tabela users!');
      console.log('\n📋 Dados do usuário:');
      console.log(JSON.stringify(userData, null, 2));
      
      console.log('\n🎉 Tudo pronto!');
      console.log('\n🔐 Você pode fazer login com:');
      console.log(`   Email: ${userData.email}`);
      console.log(`   Senha: (a senha que você definiu no Supabase Auth)`);
      console.log('\n🌐 Acesse: http://localhost:8082/login');
    } else {
      console.log('❌ Usuário não encontrado na tabela users');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testLogin();
