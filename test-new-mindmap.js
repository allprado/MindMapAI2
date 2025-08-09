// Teste para criar novo mapa mental e verificar estrutura hierárquica
async function testNewMindMap() {
  try {
    console.log('Testando criação de novo mapa mental...');
    
    const response = await fetch('/api/generate-mindmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content: 'Inteligência Artificial',
        newMindMap: true
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta da API:', data);
    
    // Verificar estrutura hierárquica
    console.log('\n=== ANÁLISE DA ESTRUTURA HIERÁRQUICA ===');
    
    const nodes = data.nodes;
    const nodesByLevel = {};
    
    nodes.forEach(node => {
      const level = node.level;
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }
      nodesByLevel[level].push(node);
    });
    
    console.log('Nós por nível:');
    Object.keys(nodesByLevel).sort().forEach(level => {
      console.log(`Nível ${level}: ${nodesByLevel[level].length} nós`);
      nodesByLevel[level].forEach(node => {
        console.log(`  - ${node.id}: ${node.label} (parent: ${node.parent}, children: [${node.children?.join(', ') || ''}])`);
      });
    });
    
    // Verificar se todos os nós têm relacionamentos corretos
    let hasErrors = false;
    nodes.forEach(node => {
      if (node.level > 0 && !node.parent) {
        console.error(`❌ Erro: Nó ${node.id} (level ${node.level}) não tem parent definido`);
        hasErrors = true;
      }
      
      if (node.children && node.children.length > 0) {
        node.children.forEach(childId => {
          const childNode = nodes.find(n => n.id === childId);
          if (!childNode) {
            console.error(`❌ Erro: Filho ${childId} do nó ${node.id} não existe`);
            hasErrors = true;
          } else if (childNode.parent !== node.id) {
            console.error(`❌ Erro: Nó ${childId} deveria ter parent ${node.id}, mas tem ${childNode.parent}`);
            hasErrors = true;
          }
        });
      }
    });
    
    if (!hasErrors) {
      console.log('✅ Estrutura hierárquica está correta!');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar apenas no Node.js
if (typeof window === 'undefined') {
  testNewMindMap();
}
