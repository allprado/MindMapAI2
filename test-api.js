// Teste simples da API
const testAPI = async () => {
  try {
    console.log('Testando API de geração de mapa mental...');
    
    const response = await fetch('http://localhost:3001/api/generate-mindmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content: 'Inteligência Artificial e suas aplicações na sociedade moderna'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta da API:', data);
    
    // Teste de expansão de nó
    if (data.nodes && data.nodes.length > 0) {
      const leafNode = data.nodes.find(n => !n.children || n.children.length === 0);
      if (leafNode) {
        console.log('Testando expansão do nó:', leafNode.id);
        
        const expandResponse = await fetch('http://localhost:3001/api/generate-mindmap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            content: `Expanda o tópico: ${leafNode.label}. ${leafNode.description}`,
            expandNode: true,
            parentNodeId: leafNode.id
          }),
        });

        const expandData = await expandResponse.json();
        console.log('Resposta da expansão:', expandData);
      }
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
};

// Execute o teste se estiver rodando no Node.js
if (typeof module !== 'undefined' && module.exports) {
  testAPI();
}
