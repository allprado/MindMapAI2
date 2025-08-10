# 🔍 Debug: Menu de Mapas Mentais Múltiplos

## 🎯 Problema
O menu de seleção de mapas mentais não está aparecendo ao clicar no link dos nós que têm mais de um mapa mental.

## 🧪 Logs de Debug Adicionados

### 1. Função `handleNavigateToChildMindMap`
```typescript
console.log(`[DEBUG] Node ${node.id} - childMindMaps:`, childMindMaps);
console.log(`[DEBUG] Node ${node.id} - hasChildMindMaps:`, node.hasChildMindMaps);
console.log(`[DEBUG] Node ${node.id} - hasChildMindMap:`, node.hasChildMindMap);
console.log(`[DEBUG] Node ${node.id} - childMindMapIds:`, node.childMindMapIds);
```

### 2. Condição de Exibição do Link
```typescript
console.log(`[DEBUG] Node ${node.id} - shouldShowLink:`, shouldShowLink);
console.log(`[DEBUG] Node ${node.id} - hasChildMindMaps:`, hasChildMindMaps);
console.log(`[DEBUG] Node ${node.id} - mindMapsFromFunction:`, mindMapsFromFunction);
console.log(`[DEBUG] Node ${node.id} - getMindMapsForNode result:`, getMindMapsForNode?.(node.id));
```

## 📋 Passos para Teste

### 1. Criar Múltiplos Mapas em um Nó
1. Acesse `http://localhost:3002`
2. Crie um mapa mental inicial (Upload PDF ou Text Input)
3. Clique com botão direito em um nó
4. Selecione "Novo Mapa Mental" → "Gerar Automaticamente"
5. Volte para o mapa anterior
6. Clique novamente com botão direito no mesmo nó
7. Selecione "Novo Mapa Mental" → "Upload de PDF" (ou outra opção)

### 2. Verificar Links e Menu
1. Observe se aparece o link verde (🔗) no nó
2. Clique no link verde
3. Verificar no console do navegador os logs de debug
4. Observar se o menu de seleção aparece

## 🔍 Pontos de Verificação

### A. Link deve aparecer quando:
- `node.hasChildMindMaps === true` OU
- `node.hasChildMindMap === true` OU  
- `getMindMapsForNode(node.id).length > 0`

### B. Menu deve aparecer quando:
- `childMindMaps.length > 1`
- Posição calculada corretamente
- `setShowSelectionMenu(true)` chamado

### C. Navegação direta quando:
- `childMindMaps.length === 1`

## 🚨 Possíveis Problemas

### 1. Função `getMindMapsForNode` não está funcionando
- Verificar se está sendo passada corretamente do MindMapApp
- Verificar se `mindMapHistory` tem os dados corretos

### 2. Estados dos nós não estão sendo atualizados
- `childMindMapIds` array não está sendo populado
- `hasChildMindMaps` não está sendo definido como `true`

### 3. Menu não está renderizando
- Portal não está funcionando
- Z-index muito baixo
- Posicionamento incorreto

## 📝 Próximos Passos
1. Executar teste manual
2. Analisar logs no console
3. Verificar dados no estado
4. Corrigir problema identificado

**Status**: 🔄 Em depuração - logs adicionados para identificar problema
