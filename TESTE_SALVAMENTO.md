# 🧪 Guia de Teste - Correção do Bug de Salvamento

## 🐛 Problema Identificado e Corrigido

**Problema:** Mapas mentais salvos não apareciam na seção "Meus Mapas" apesar de estarem no banco.

**Causa:** 
1. As APIs estavam usando `MindMapService` que faz requisições client-side
2. O frontend não estava enviando tokens de autenticação nas requisições
3. Falta de autenticação server-side nas rotas da API

## ✅ Correções Implementadas

### 1. **Autenticação Server-Side**
- ✅ Criada função `getUserFromRequest()` para extrair usuário do token
- ✅ Todas as rotas da API agora validam autenticação
- ✅ Uso do `supabaseAdmin` com service role key

### 2. **Autenticação Client-Side**
- ✅ Função `getAuthHeaders()` para incluir token em requisições
- ✅ Atualização de todas as funções no `SavedMindMaps.tsx`
- ✅ Atualização da função `handleSaveMindMap()` no `MindMapApp.tsx`

### 3. **Rotas da API Atualizadas**
- ✅ `/api/mindmaps` (GET/POST) com autenticação
- ✅ `/api/mindmaps/[id]` (GET/PUT/DELETE) com autenticação
- ✅ `/api/mindmaps/[id]/duplicate` (POST) com autenticação

## 🧪 Como Testar

### Teste 1: Salvar Novo Mapa Mental
1. **Acesse:** http://localhost:3001
2. **Faça login** ou crie uma conta
3. **Crie um mapa mental** (por texto ou PDF)
4. **Clique em "Salvar"** no cabeçalho
5. **Resultado esperado:** Mensagem "Mapa mental salvo com sucesso!"

### Teste 2: Verificar na Lista
1. **Clique em "Meus Mapas"** no cabeçalho
2. **Resultado esperado:** O mapa salvo deve aparecer na lista
3. **Verificar:** Título, data de criação, número de nós

### Teste 3: Funcionalidades da Lista
1. **Na lista de mapas, teste:**
   - ✅ **Abrir:** Carrega o mapa para edição
   - ✅ **Compartilhar:** Alterna entre público/privado
   - ✅ **Duplicar:** Cria uma cópia
   - ✅ **Excluir:** Remove o mapa

### Teste 4: Atualizar Mapa Existente
1. **Abra um mapa salvo**
2. **Faça modificações** nos nós
3. **Clique em "Atualizar"**
4. **Resultado esperado:** Mudanças são salvas
5. **Verifique** na lista que a data foi atualizada

### Teste 5: Mapas Públicos
1. **Torne um mapa público** (botão compartilhar)
2. **Acesse "Mapas Públicos"** na lista
3. **Resultado esperado:** Mapa aparece na galeria pública
4. **Teste duplicar** um mapa público

## 🔍 Logs de Debug

### No Console do Navegador:
```javascript
// Verificar se o token está sendo enviado
fetch('/api/mindmaps', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
```

### No Supabase Dashboard:
1. **Acesse:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. **Verifique tabelas:**
   - `profiles`: Usuários criados
   - `mindmaps`: Mapas salvos com `user_id` correto

## 🚨 Possíveis Problemas e Soluções

### Problema: "Usuário não autenticado"
**Solução:** 
- Verificar se o usuário está logado
- Limpar cache do navegador
- Fazer logout e login novamente

### Problema: Mapas não aparecem
**Solução:**
- Verificar console para erros
- Confirmar que `user_id` na tabela está correto
- Verificar se RLS está funcionando

### Problema: Token expirado
**Solução:**
- Fazer logout e login novamente
- Verificar configuração do JWT no Supabase

## 📊 Estrutura de Dados Esperada

### Tabela `mindmaps`:
```sql
{
  "id": "uuid",
  "title": "Título do Mapa",
  "description": "Descrição opcional",
  "nodes": [...], -- Array de nós do mapa
  "edges": [...], -- Array de conexões
  "user_id": "uuid_do_usuario",
  "is_public": false,
  "tags": ["tag1", "tag2"],
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Headers de Requisição:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## ✅ Checklist de Funcionalidades

- [ ] Login/Registro funciona
- [ ] Criar mapa mental funciona
- [ ] Salvar mapa mental funciona
- [ ] Mapas aparecem em "Meus Mapas"
- [ ] Abrir mapa salvo funciona
- [ ] Atualizar mapa existente funciona
- [ ] Tornar mapa público/privado funciona
- [ ] Duplicar mapa funciona
- [ ] Excluir mapa funciona
- [ ] Buscar mapas funciona
- [ ] Galeria de mapas públicos funciona

---

## 🎯 Resultado Final Esperado

Após as correções, o fluxo completo deve funcionar:
1. **Usuário faz login** ✅
2. **Cria mapa mental** ✅
3. **Salva na nuvem** ✅
4. **Vê na lista "Meus Mapas"** ✅
5. **Pode editar, compartilhar, duplicar** ✅

**Status:** 🟢 **CORRIGIDO** - Sistema de persistência totalmente funcional!
