# 🧪 Teste Manual: Múltiplos Mapas Mentais

## 📋 Procedimento de Teste

### Passo 1: Criar Mapa Mental Inicial
1. Acesse http://localhost:3002
2. Vá para "Text Input"
3. Digite: "Gestão de Projetos"
4. Clique em "Gerar Mapa Mental"

### Passo 2: Criar Primeiro Mapa Filho
1. Clique com botão direito em qualquer nó (ex: o nó raiz)
2. Selecione "Novo Mapa Mental"
3. Escolha "Gerar Automaticamente"
4. Aguarde a criação

### Passo 3: Voltar ao Mapa Original
1. Use o botão "Voltar" ou breadcrumb
2. Verifique se aparece o link verde (🔗) no nó

### Passo 4: Criar Segundo Mapa Filho
1. Clique com botão direito no MESMO nó
2. Selecione "Novo Mapa Mental"
3. Escolha "Inserir Texto" → modo "Texto Normal"
4. Digite qualquer texto e crie

### Passo 5: Testar Menu de Seleção
1. Volte ao mapa original
2. Clique no link verde (🔗) no nó
3. **DEVE APARECER** um menu flutuante com 2 opções

## 🔍 O que Observar no Console

### Logs Esperados:
```
[DEBUG] getMindMapsForNode(node-id): [...]
[DEBUG] mindMapHistory: [...]
[DEBUG] Node node-id - childMindMaps: [...]
[DEBUG] Node node-id - hasChildMindMaps: true
[DEBUG] Showing selection menu for node node-id
```

### Se não funcionar:
- Verifique se `mindMapHistory` tem múltiplos itens com mesmo `parentNodeId`
- Verifique se `getMindMapsForNode` retorna array com length > 1
- Verifique se `childMindMaps.length > 1` na função de navegação

## 🎯 Resultado Esperado

✅ Menu flutuante deve aparecer com:
- Lista dos mapas mentais criados
- Ícones indicando método de criação
- Data/hora de criação
- Seleção funcionando

❌ Se não aparecer:
- Verificar logs de debug
- Conferir se os dados estão sendo persistidos corretamente
- Validar se a condição de exibição está funcionando

**Executar teste agora** 🚀
