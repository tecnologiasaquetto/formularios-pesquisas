# Supabase Setup Guide

## 🚀 Passo a Passo para Configurar Supabase

### 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub/GitLab/Email
4. Clique em "New Project"
5. **Organization**: Escolha ou crie uma organização
6. **Project Name**: `formularios-pesquisas`
7. **Database Password**: Use uma senha forte e guarde-a
8. **Region**: Escolha a região mais próxima (ex: South America)
9. Aguarde a criação do projeto (2-3 minutos)

### 2. Configurar Environment Variables

Crie o arquivo `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Onde encontrar as keys:**
- Vá para Project Settings > API
- Copie a `URL` e `anon key`
- Copie a `service_role` (NUNCA expor no frontend)

### 3. Instalar Dependências

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-react
npm install @supabase/auth-helpers-nextjs
```

### 4. Criar Supabase Client

Crie `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Para operações server-side
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### 5. Executar Schema SQL

1. Vá para SQL Editor no Supabase Dashboard
2. Copie e cole o conteúdo de `docs/database-schema.md`
3. Execute o SQL (deve levar alguns segundos)
4. Verifique se todas as tabelas foram criadas em Table Editor

### 6. Configurar Authentication

#### 6.1 Habilitar Auth Providers

Vá para Authentication > Settings:

1. **Email/Password**: 
   - Enable email confirmations: `false` (para desenvolvimento)
   - Enable email confirmations: `true` (para produção)

2. **Social Providers** (opcional):
   - Google: Configure OAuth credentials
   - GitHub: Configure OAuth credentials

#### 6.2 Custom JWT Claims

Para incluir role no JWT:

```sql
-- Criar função para custom claims
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role, 'visualizador')
  FROM users
  WHERE users.id = auth.uid()
$$;

-- Adicionar claim customizado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 7. Configurar Storage

#### 7.1 Criar Buckets

```sql
-- Criar bucket para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Criar bucket para arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false);
```

#### 7.2 Policies para Storage

```sql
-- Logos bucket policies
CREATE POLICY "Public read access for logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Admins can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND 
    auth.jwt() ->> 'role' = 'administrador'
  );

CREATE POLICY "Admins can update logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND 
    auth.jwt() ->> 'role' = 'administrador'
  );

CREATE POLICY "Admins can delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND 
    auth.jwt() ->> 'role' = 'administrador'
  );
```

### 8. Habilitar Realtime

Para cada tabela que precisa de updates em tempo real:

```sql
-- Habilitar realtime para formularios
ALTER publication supabase_realtime ADD TABLE formularios;

-- Habilitar realtime para respostas
ALTER publication supabase_realtime ADD TABLE respostas;

-- Habilitar realtime para users
ALTER publication supabase_realtime ADD TABLE users;
```

### 9. Testar Conexão

Crie `src/test-supabase.ts`:

```typescript
import { supabase } from './lib/supabase'

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('count')
    
    if (error) {
      console.error('Error connecting to Supabase:', error)
    } else {
      console.log('✅ Supabase connection successful!')
      console.log('Formulários count:', data)
    }
  } catch (err) {
    console.error('Connection failed:', err)
  }
}

testConnection()
```

Execute: `npx ts-node src/test-supabase.ts`

### 10. Backup e Segurança

#### 10.1 Backup Automático

1. Vá para Settings > Database
2. Configure "Daily backups" (recomendado)
3. Configure "Point in Time Recovery" (opcional)

#### 10.2 Segurança

1. **Nunca expor** `service_role_key` no frontend
2. **Sempre usar** RLS policies
3. **Validar inputs** no frontend e backend
4. **Rate limiting** para APIs públicas
5. **Monitorar** logs de acesso

### 11. Migrations

Para versionar o schema:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref your-project-id

# Criar migration
supabase db push

# Gerar types
supabase gen types typescript --local > src/types/supabase.ts
```

### 12. Monitoramento

Configure monitoramento no Supabase Dashboard:

1. **Logs**: Verifique erros e performance
2. **Metrics**: Monitore uso da database
3. **Usage**: Track API calls e storage
4. **Database**: Monitore queries lentas

### ✅ Checklist Final

- [ ] Projeto criado no Supabase
- [ ] Environment variables configuradas
- [ ] Dependências instaladas
- [ ] Schema SQL executado
- [ ] Authentication configurado
- [ ] Storage buckets criados
- [ ] Realtime habilitado
- [ ] Conexão testada
- [ ] Backup configurado
- [ ] RLS policies aplicadas
- [ ] Types gerados

### 🚀 Próximos Passos

1. Implementar API services
2. Migrar dados mock
3. Integrar com frontend
4. Testar tudo
5. Deploy para produção
