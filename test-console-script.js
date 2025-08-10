// Test script for multiple mind maps functionality
// Execute in browser console after creating multiple mind maps

console.log('=== TESTE: Múltiplos Mapas Mentais ===');

// 1. Verificar se existem múltiplos mapas no histórico
function checkMindMapHistory() {
  console.log('1. Verificando histórico de mapas mentais...');
  
  // Tentar acessar o estado do React (se disponível)
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
  console.log('React elements found:', reactElements.length);
  
  // Verificar nós com links
  const nodeLinks = document.querySelectorAll('button[title*="mapa mental"]');
  console.log('Nós com links encontrados:', nodeLinks.length);
  
  nodeLinks.forEach((link, index) => {
    console.log(`Link ${index + 1}:`, link.title);
  });
}

// 2. Verificar se existem dados nos nós
function checkNodeData() {
  console.log('2. Verificando dados dos nós...');
  
  const customNodes = document.querySelectorAll('[data-node-id]');
  console.log('Nós customizados encontrados:', customNodes.length);
  
  customNodes.forEach((node, index) => {
    const nodeId = node.getAttribute('data-node-id');
    console.log(`Nó ${index + 1} - ID: ${nodeId}`);
  });
}

// 3. Simular clique no link
function testLinkClick() {
  console.log('3. Testando clique no link...');
  
  const links = document.querySelectorAll('button[title*="mapa mental"]');
  if (links.length > 0) {
    console.log('Clicando no primeiro link...');
    links[0].click();
    
    // Verificar se menu apareceu
    setTimeout(() => {
      const menu = document.querySelector('[class*="selection"]') || 
                   document.querySelector('[class*="floating"]') ||
                   document.querySelector('[style*="position: fixed"]');
      
      if (menu) {
        console.log('✅ Menu encontrado!', menu);
      } else {
        console.log('❌ Menu não encontrado');
      }
    }, 500);
  } else {
    console.log('❌ Nenhum link encontrado');
  }
}

// Executar testes
checkMindMapHistory();
checkNodeData();
testLinkClick();

console.log('=== FIM DO TESTE ===');
