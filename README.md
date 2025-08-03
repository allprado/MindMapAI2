# MindMapAI - Gerador de Mapas Mentais

Um aplicativo web moderno e responsivo para gerar mapas mentais automaticamente a partir de arquivos PDF usando a biblioteca Drawflow e integração com Google Gemini AI.

## 🎯 Funcionalidades

- **Upload de PDF**: Suporte para arquivos PDF de até 10MB
- **Integração com IA**: Usa Google Gemini para análise inteligente de conteúdo
- **Interface Moderna**: Design minimalista e responsivo
- **Editor Interativo**: Baseado na biblioteca Drawflow para manipulação visual
- **Personalização**: Edição de nós, cores e conexões
- **Exportação**: Salve seus mapas mentais como imagens PNG
- **Atalhos de Teclado**: Navegação rápida e eficiente

## 🚀 Como Usar

### 1. Configuração Inicial

1. Obtenha uma chave API do Google Gemini:
   - Acesse [Google AI Studio](https://aistudio.google.com/)
   - Crie uma nova chave API
   - Copie a chave gerada

2. Configure a chave API no aplicativo:
   - Cole sua chave no campo "Chave API Google Gemini"
   - Clique em "Salvar"

### 2. Gerando um Mapa Mental

1. **Upload do PDF**:
   - Arraste um arquivo PDF para a área de upload, ou
   - Clique na área de upload para selecionar um arquivo

2. **Configuração da Geração**:
   - Escolha a complexidade: Simples, Médio ou Complexo
   - Opcionalmente, defina um foco específico (ex: "conceitos principais", "cronologia")

3. **Gerar Mapa**:
   - Clique em "Gerar Mapa Mental"
   - Aguarde o processamento (pode levar alguns segundos)

### 3. Editando o Mapa Mental

#### Ferramentas Disponíveis:
- **➕ Adicionar Nó**: Cria um novo nó no canvas
- **✏️ Editar Nó**: Modifica o texto e cor de um nó selecionado
- **➖ Deletar Nó**: Remove o nó selecionado
- **🔍 Zoom In/Out**: Ajusta o zoom do canvas
- **🎯 Centralizar**: Retorna à visualização centralizada

#### Como Editar:
1. Clique em um nó para selecioná-lo
2. Use as ferramentas da sidebar ou atalhos de teclado
3. Para editar texto/cor: selecione o nó e clique em "Editar Nó"

### 4. Exportação

- Clique em "Exportar" no header para salvar como PNG
- O arquivo será baixado automaticamente

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + N` | Adicionar novo nó |
| `Ctrl + E` | Editar nó selecionado |
| `Delete` | Deletar nó selecionado |
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Centralizar canvas |
| `Esc` | Fechar modal |

## 🎨 Personalizações

### Cores Disponíveis:
- Azul (#4F46E5) - Padrão
- Verde (#059669)
- Vermelho (#DC2626)
- Laranja (#D97706)
- Roxo (#7C3AED)
- Rosa (#DB2777)

### Níveis de Complexidade:
- **Simples**: 5-8 conceitos principais
- **Médio**: 8-12 conceitos com subcategorias
- **Complexo**: Múltiplos níveis e conexões detalhadas

## 📱 Responsividade

O aplicativo é totalmente responsivo e funciona em:
- Desktop (recomendado para melhor experiência)
- Tablets
- Smartphones

## 🔧 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Biblioteca de Diagramas**: Drawflow
- **Processamento de PDF**: PDF.js
- **IA**: Google Gemini API
- **Exportação**: html2canvas
- **Design**: CSS Grid, Flexbox, CSS Custom Properties

## 🔒 Privacidade e Segurança

- A chave API é armazenada localmente no navegador
- Os arquivos PDF são processados localmente
- Apenas o texto extraído é enviado para a API do Gemini
- Nenhum dado é armazenado em servidores externos

## 🐛 Solução de Problemas

### Erro de API:
- Verifique se a chave API está correta
- Confirme se você tem créditos disponíveis no Google AI Studio
- Tente novamente após alguns minutos

### PDF não carrega:
- Verifique se o arquivo é um PDF válido
- Confirme se o tamanho é menor que 10MB
- Tente com um PDF diferente

### Mapa não renderiza:
- Recarregue a página
- Limpe o cache do navegador
- Verifique o console para erros

## 📈 Melhorias Futuras

- [ ] Suporte para outros formatos (DOCX, TXT)
- [ ] Templates de mapas mentais
- [ ] Colaboração em tempo real
- [ ] Exportação em múltiplos formatos
- [ ] Histórico de mapas gerados
- [ ] Integração com serviços de armazenamento em nuvem

## 📄 Licença

Este projeto está licenciado sob a MIT License.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

---

**Desenvolvido com ❤️ para facilitar a criação de mapas mentais inteligentes**
