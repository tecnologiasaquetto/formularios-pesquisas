# Database Schema - Formulários e Pesquisas

## 📋 Overview

Schema completo para o sistema de formulários e pesquisas com Supabase.

## 🗄️ Tables

### 1. `users`
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(100),
  departamento VARCHAR(100),
  role user_role NOT NULL DEFAULT 'visualizador',
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('administrador', 'visualizador');
```

### 2. `formularios`
```sql
CREATE TABLE formularios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  mensagem_fim TEXT,
  logo_url VARCHAR(500),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  mostrar_capa BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  cor_tema VARCHAR(7) DEFAULT '#3b82f6',
  criado_por UUID REFERENCES users(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. `perguntas`
```sql
CREATE TABLE perguntas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID REFERENCES formularios(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo pergunta_tipo NOT NULL,
  obrigatorio BOOLEAN DEFAULT false,
  ordem INTEGER NOT NULL,
  opcoes JSONB, -- Para radio, checkbox, etc.
  validacoes JSONB, -- Regras de validação
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE pergunta_tipo AS ENUM (
  'texto_curto', 'texto_longo', 'email', 'numero', 'data',
  'radio', 'checkbox', 'dropdown', 'likert', 'nps_simples',
  'matriz_nps', 'secao', 'arquivo'
);
```

### 4. `matriz_itens`
```sql
CREATE TABLE matriz_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pergunta_id UUID REFERENCES perguntas(id) ON DELETE CASCADE,
  linha VARCHAR(255) NOT NULL,
  coluna VARCHAR(255) NOT NULL,
  ordem INTEGER NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. `respostas`
```sql
CREATE TABLE respostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID REFERENCES formularios(id) ON DELETE CASCADE,
  respondente_nome VARCHAR(255),
  respondente_email VARCHAR(255),
  respondente_departamento VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  finalizado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. `resposta_itens`
```sql
CREATE TABLE resposta_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resposta_id UUID REFERENCES respostas(id) ON DELETE CASCADE,
  pergunta_id UUID REFERENCES perguntas(id) ON DELETE CASCADE,
  matriz_item_id UUID REFERENCES matriz_itens(id) ON DELETE CASCADE,
  valor TEXT,
  arquivo_url VARCHAR(500),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. `departamentos`
```sql
CREATE TABLE departamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 Relationships

```
users (1) ←→ (N) formularios (criado_por)
formularios (1) ←→ (N) perguntas
perguntas (1) ←→ (N) matriz_itens
formularios (1) ←→ (N) respostas
respostas (1) ←→ (N) resposta_itens
perguntas (1) ←→ (N) resposta_itens
matriz_itens (1) ←→ (N) resposta_itens
```

## 🔐 Row Level Security (RLS)

### Users Table
```sql
-- Apenas admins podem ver todos os usuários
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'administrador');

-- Apenas admins podem inserir usuários
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'administrador');

-- Apenas admins podem atualizar usuários
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'administrador');

-- Apenas admins podem deletar usuários
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (auth.jwt() ->> 'role' = 'administrador');
```

### Formularios Table
```sql
-- Todos os usuários autenticados podem ver formulários ativos
CREATE POLICY "Authenticated users can view active forms" ON formularios
  FOR SELECT USING (auth.role() = 'authenticated' AND ativo = true);

-- Apenas admins podem ver todos os formulários
CREATE POLICY "Admins can view all forms" ON formularios
  FOR SELECT USING (auth.jwt() ->> 'role' = 'administrador');

-- Apenas admins podem gerenciar formulários
CREATE POLICY "Admins can manage forms" ON formularios
  FOR ALL USING (auth.jwt() ->> 'role' = 'administrador');
```

### Respostas Table
```sql
-- Todos podem inserir respostas (formulários públicos)
CREATE POLICY "Anyone can insert responses" ON respostas
  FOR INSERT WITH CHECK (true);

-- Apenas admins podem ver todas as respostas
CREATE POLICY "Admins can view all responses" ON respostas
  FOR SELECT USING (auth.jwt() ->> 'role' = 'administrador');

-- Visualizadores podem ver respostas dos formulários que têm acesso
CREATE POLICY "Viewers can view responses" ON respostas
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'visualizador' AND
    EXISTS (
      SELECT 1 FROM formularios f 
      WHERE f.id = respostas.formulario_id AND f.ativo = true
    )
  );
```

## 🚀 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_formularios_ativos ON formularios(ativo) WHERE ativo = true;
CREATE INDEX idx_formularios_slug ON formularios(slug);
CREATE INDEX idx_perguntas_formulario ON perguntas(formulario_id);
CREATE INDEX idx_perguntas_ordem ON perguntas(formulario_id, ordem);
CREATE INDEX idx_respostas_formulario ON respostas(formulario_id);
CREATE INDEX idx_respostas_data ON respostas(criado_em);
CREATE INDEX idx_resposta_itens_resposta ON resposta_itens(resposta_id);
CREATE INDEX idx_resposta_itens_pergunta ON resposta_itens(pergunta_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

## 📊 Triggers

```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_em = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formularios_updated_at BEFORE UPDATE ON formularios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perguntas_updated_at BEFORE UPDATE ON perguntas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔧 Functions

```sql
-- Calculate NPS statistics
CREATE OR REPLACE FUNCTION calc_nps_stats(p_formulario_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'score', COALESCE(AVG(CASE WHEN valor::int >= 9 THEN 1 WHEN valor::int <= 6 THEN -1 ELSE 0 END) * 100, 0),
    'promotores', COALESCE(COUNT(CASE WHEN valor::int >= 9 THEN 1 END), 0),
    'passivos', COALESCE(COUNT(CASE WHEN valor::int IN (7,8) THEN 1 END), 0),
    'detratores', COALESCE(COUNT(CASE WHEN valor::int <= 6 THEN 1 END), 0),
    'total', COUNT(*)
  )
  INTO result
  FROM resposta_itens ri
  JOIN perguntas p ON ri.pergunta_id = p.id
  WHERE p.formulario_id = p_formulario_id
  AND p.tipo = 'nps_simples'
  AND ri.valor IS NOT NULL
  AND ri.valor ~ '^[0-9]+$';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 Next Steps

1. ✅ Criar schema no Supabase
2. ✅ Configurar RLS policies
3. ✅ Criar indexes e triggers
4. ✅ Migrar dados mock
5. ✅ Implementar API services
6. ✅ Integrar com frontend
