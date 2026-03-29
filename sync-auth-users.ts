/**
 * Script para sincronizar usuários do Supabase Auth com a tabela users
 * Execute: npx tsx sync-auth-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY estão no .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncAuthUsers() {
  console.log('🔄 Iniciando sincronização de usuários...\n');

  try {
    // 1. Buscar todos os usuários do Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Erro ao buscar usuários do Auth: ${authError.message}`);
    }

    console.log(`📋 Encontrados ${authUsers.users.length} usuários no Authentication\n`);

    // 2. Buscar usuários existentes na tabela users
    const { data: existingUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id');
    
    if (dbError) {
      throw new Error(`Erro ao buscar usuários da tabela: ${dbError.message}`);
    }

    const existingUserIds = new Set(existingUsers?.map(u => u.id) || []);

    // 3. Sincronizar cada usuário
    let syncedCount = 0;
    let skippedCount = 0;

    for (const authUser of authUsers.users) {
      if (existingUserIds.has(authUser.id)) {
        console.log(`⏭️  Usuário já existe: ${authUser.email}`);
        skippedCount++;
        continue;
      }

      // Extrair dados do metadata ou usar defaults
      const nome = authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário';
      const role = authUser.user_metadata?.role || 'visualizador';

      // Inserir na tabela users
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          nome: nome,
          role: role,
          ativo: true,
          criado_em: authUser.created_at,
          ultimo_acesso: authUser.last_sign_in_at
        });

      if (insertError) {
        console.error(`❌ Erro ao sincronizar ${authUser.email}:`, insertError.message);
      } else {
        console.log(`✅ Sincronizado: ${authUser.email} (${nome}) - Role: ${role}`);
        syncedCount++;
      }
    }

    console.log('\n📊 Resumo da sincronização:');
    console.log(`   ✅ Sincronizados: ${syncedCount}`);
    console.log(`   ⏭️  Já existiam: ${skippedCount}`);
    console.log(`   📋 Total: ${authUsers.users.length}`);
    console.log('\n✨ Sincronização concluída!');

  } catch (error) {
    console.error('\n❌ Erro durante a sincronização:', error);
    process.exit(1);
  }
}

// Executar
syncAuthUsers();
