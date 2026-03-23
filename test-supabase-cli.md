# Testar Conexão via Supabase CLI

## 🚀 Instalar Supabase CLI (se ainda não tiver)

```bash
# Via npm
npm install -g supabase

# Ou via yarn
yarn global add supabase

# Ou via brew (macOS)
brew install supabase/tap/supabase
```

## 🔗 Conectar ao seu projeto

```bash
# Login no Supabase
supabase login

# Linkar ao projeto local
supabase link --project-ref ftxzpvrdyqnofxjmyeqd
```

## 🧪 Testar conexão

```bash
# Verificar status do projeto
supabase status

# Listar tabelas
supabase db list

# Testar acesso ao banco
supabase db shell
```

## 📊 Comandos úteis

```bash
# Verificar migrações
supabase migration list

# Verificar branches
supabase branches list

# Gerar types
supabase gen types typescript --local > src/types/supabase.ts
```

## 🔍 Se der erro

O CLI vai mostrar exatamente:
- ✅ Se o projeto existe
- ✅ Se você tem permissão
- ✅ Se a conexão está funcionando
- ❌ O que está errado

## 🎯 Próximos passos

1. **Instalar CLI**
2. **Fazer login**
3. **Linkar projeto**
4. **Testar comandos**
5. **Se funcionar, o problema é no frontend**
