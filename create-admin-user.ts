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

async function createAdminUser() {
  console.log('🔍 Criando usuário administrador...\n');
  
  try {
    const email = 'tecnologia@saquetto.com.br';
    
    console.log(`📧 Email: ${email}`);
    console.log('⏳ Inserindo usuário na tabela users...\n');
    
    // UUID do usuário criado no Supabase Auth
    const userId = 'e380a80b-9ce6-4f12-9bf1-92e8a8919162';
    
    // Inserir na tabela users
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        nome: 'Tecnologia Saquetto',
        cargo: 'Administrador do Sistema',
        departamento: 'TECNOLOGIA DA INFORMAÇÃO',
        role: 'administrador',
        ativo: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('\n📊 Dados do usuário:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n🎉 Agora você pode fazer login com:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: (a senha que você definiu no Supabase Auth)`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createAdminUser();
