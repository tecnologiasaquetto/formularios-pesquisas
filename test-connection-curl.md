# Testar Conexão Supabase com cURL

## 🔍 Teste 1: Verificar se o projeto existe

```bash
# Testar se o projeto Supabase responde
curl -I "https://ftxzpvrdyqnofxjmyeqd.supabase.co"

# Deve retornar 200 OK se o projeto existir
```

## 🔍 Teste 2: Testar API REST

```bash
# Testar acesso à API com anon key
curl -X GET "https://ftxzpvrdyqnofxjmyeqd.supabase.co/rest/v1/formularios?select=count" \
  -H "apikey: SUA_ANON_KEY_COMPLETA_AQUI" \
  -H "Content-Type: application/json"

# Se funcionar, vai retornar: [{"count": 0}]
# Se der erro, vai retornar: {"message": "Invalid API key"}
```

## 🔍 Teste 3: Verificar chave correta

```bash
# Testar com uma chave válida (exemplo)
curl -X GET "https://ftxzpvrdyqnofxjmyeqd.supabase.co/rest/v1/formularios?select=count" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3RfaWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4MDAwMDAwMCwiZXhwIjoxOTk1NTU1OTk5fQ.abc123def456ghi789jkl012mno345pqr678stu901wxy234zab567cde890" \
  -H "Content-Type: application/json"
```

## 🎯 Como interpretar os resultados

### ✅ Se funcionar:
- HTTP 200 OK
- Resposta: `[{"count": 0}]`
- Conexão está OK, problema é no frontend

### ❌ Se der erro:
- HTTP 401: "Invalid API key" → Chave está errada
- HTTP 404: "Not Found" → Projeto não existe
- HTTP 403: "Forbidden" → Permissão negada

## 📋 Próximos passos

1. **Teste com cURL** para isolar o problema
2. **Se funcionar**, o problema é no código React/Supabase client
3. **Se não funcionar**, o problema é na chave/projeto

## 🔧 Alternativa: Instalar CLI manualmente

Se npm global não funcionar:
```bash
# Baixar diretamente
curl -L https://github.com/supabase/cli/releases/latest/download/supabase-windows-amd64.exe -o supabase.exe

# Mover para PATH
move supabase.exe C:\Windows\System32\

# Testar
supabase --version
```
