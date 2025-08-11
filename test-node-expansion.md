# Teste de Expansão de Nós

## Problema Relatado
"aparentemente os mapas mentais gerados a partir de nós não estão sendo salvos com o mapa principal, pois ao fechar e reabrir, os links não aparecem"

## Análise dos Logs
Baseado nos logs do terminal, vemos:

1. **Mapa mental criado**: 33 nós iniciais
2. **Nó expandido**: ID 16 "Estratégias de Crescimento" → 4 novos nós criados  
3. **PUT request**: Mapa salvo com sucesso (1.2s)
4. **GET request**: Lista de mapas atualizada (0.6s)

## Hipóteses

### Hipótese 1: Salvamento automático existe
Os logs mostram um PUT request, mas não vemos logs de `handleSaveMindMap` sendo executado. Isso pode indicar:
- Existe algum salvamento automático não identificado
- O salvamento ocorre em outro componente 

### Hipótese 2: Função `handleExpandNode` pode salvar diretamente
A função `handleExpandNode` atualiza o estado dos nós, mas não chama `handleSaveMindMap`. 

### Hipótese 3: Problema na persistência de relacionamentos
Os nós expandidos podem estar sendo salvos, mas:
- As relações parent/children não estão sendo persistidas corretamente
- O carregamento não reconstrói as relações adequadamente

## Próximos Passos

1. **Verificar se há salvamento automático**
2. **Testar carregar mapa com nós expandidos**
3. **Verificar estrutura dos dados no banco**
4. **Adicionar logs específicos para rastrear o problema**

## Estrutura dos Nós Expandidos
```
16 (Estratégias de Crescimento) -> parent: 10
├── 16_1754877868725_1 (Penetração Mercado) -> parent: 16
├── 16_1754877868725_2 (Desenvolvimento Produto) -> parent: 16  
├── 16_1754877868725_3 (Desenvolvimento Mercado) -> parent: 16
└── 16_1754877868725_4 (Diversificação Estratégica) -> parent: 16
```

Os nós filhos têm IDs únicos e parent correto, mas precisamos verificar se:
1. O nó pai (16) tem os filhos na propriedade `children`
2. Os dados são salvos corretamente no banco
3. O carregamento reconstrói as relações
