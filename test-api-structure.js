// Teste simples para verificar estrutura da API
const testNewMindMap = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/generate-mindmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content: 'Análise de Sentimento',
        newMindMap: true
      }),
    });

    const data = await response.json();
    console.log('=== DADOS RETORNADOS PELA API ===');
    console.log('Total de nós:', data.nodes.length);
    
    // Verificar estrutura hierárquica
    data.nodes.forEach(node => {
      console.log(`Nó ${node.id}: "${node.label}" (level ${node.level})`);
      console.log(`  Parent: ${node.parent || 'nenhum'}`);
      console.log(`  Children: [${node.children?.join(', ') || 'nenhum'}]`);
      console.log('---');
    });
    
    // Verificar se existe nó central
    const centralNode = data.nodes.find(n => n.level === 0);
    console.log('Nó central encontrado:', centralNode ? centralNode.label : 'NENHUM');
    
    // Verificar consistency
    data.nodes.forEach(node => {
      if (node.children) {
        node.children.forEach(childId => {
          const childNode = data.nodes.find(n => n.id === childId);
          if (!childNode) {
            console.error(`❌ ERRO: Filho ${childId} não existe`);
          } else if (childNode.parent !== node.id) {
            console.error(`❌ ERRO: Inconsistência - ${childId} deveria ter parent ${node.id}, mas tem ${childNode.parent}`);
          }
        });
      }
    });

  } catch (error) {
    console.error('Erro:', error);
  }
};

testNewMindMap();
