# 🚀 Deploy no Vercel

## Configuração de Variáveis de Ambiente

Para que a aplicação funcione corretamente no Vercel, você precisa configurar as seguintes variáveis de ambiente:

### 1. Acessar Configurações do Projeto
1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Environment Variables**

### 2. Adicionar Variáveis Obrigatórias

Adicione as seguintes variáveis:

#### `VITE_SUPABASE_URL`
- **Valor**: URL do seu projeto Supabase
- **Exemplo**: `https://ftxzpvrdyqnofxjmyeqd.supabase.co`
- **Onde encontrar**: Supabase Dashboard > Project Settings > API > Project URL

#### `VITE_SUPABASE_ANON_KEY`
- **Valor**: Chave anônima do Supabase
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar**: Supabase Dashboard > Project Settings > API > anon/public key

#### `REACT_APP_SUPABASE_URL` (compatibilidade)
- **Valor**: Mesmo valor de `VITE_SUPABASE_URL`

#### `REACT_APP_SUPABASE_ANON_KEY` (compatibilidade)
- **Valor**: Mesmo valor de `VITE_SUPABASE_ANON_KEY`

### 3. Variável Opcional (Admin)

#### `VITE_SUPABASE_SERVICE_ROLE_KEY`
- **Valor**: Service Role Key do Supabase
- **Onde encontrar**: Supabase Dashboard > Project Settings > API > service_role key
- **⚠️ ATENÇÃO**: Esta chave é sensível! Só adicione se realmente necessário para funcionalidades admin.

## Configuração de Build

O Vercel deve detectar automaticamente as configurações do Vite. Caso precise configurar manualmente:

- **Framework Preset**: Vite
- **Build Command**: `npm run build` ou `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` ou `pnpm install`

## Após Configurar

1. Salve as variáveis de ambiente
2. Faça um novo deploy (ou aguarde o redeploy automático)
3. Teste as rotas:
   - `/` - Deve redirecionar para login
   - `/login` - Página de login
   - `/admin/formularios` - Lista de formulários
   - `/f/seu-slug` - Formulário público

## Troubleshooting

### Erro 404 em rotas
✅ **Resolvido**: O arquivo `vercel.json` já está configurado para redirecionar todas as rotas para `index.html`

### Erro "Supabase environment variables not found"
❌ **Solução**: Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas no Vercel

### Página em branco
❌ **Solução**: 
1. Abra o console do navegador (F12)
2. Verifique se há erros de CORS ou variáveis de ambiente
3. Confirme que as variáveis estão corretas no Vercel

### Funcionalidades admin não funcionam
❌ **Solução**: Adicione a variável `VITE_SUPABASE_SERVICE_ROLE_KEY` no Vercel

## Comandos Úteis

```bash
# Build local para testar
npm run build
# ou
pnpm build

# Preview do build
npm run preview
# ou
pnpm preview
```

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build executado com sucesso
- [ ] Rota `/login` acessível
- [ ] Rota `/f/slug-teste` acessível (criar um formulário de teste)
- [ ] Login funcionando
- [ ] Dashboard admin acessível
- [ ] Formulários públicos funcionando

## Suporte

Se encontrar problemas, verifique:
1. Logs do Vercel (aba Deployments > Logs)
2. Console do navegador (F12)
3. Configurações do Supabase (RLS policies, CORS)
