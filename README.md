# 🧠 MindMap AI

Uma aplicação web moderna e inteligente para criação de mapas mentais a partir de arquivos PDF e texto, utilizando o poder da IA Google Gemini 2.0 Flash.

## ✨ Funcionalidades

- 📄 **Upload de PDFs**: Extraia automaticamente o conteúdo de arquivos PDF e gere mapas mentais estruturados
- 📝 **Input de Texto**: Digite ou cole texto para criar mapas mentais instantaneamente
- 🎯 **Nós Interativos**: Clique em qualquer nó para obter explicações detalhadas no painel lateral
- 💬 **Chat com IA**: Faça perguntas específicas sobre qualquer tópico do mapa mental
- 🎨 **Interface Moderna**: Design elegante, responsivo e com modo escuro
- ⚡ **Tempo Real**: Visualização instantânea com animações suaves
- 🔄 **Navegação Intuitiva**: Zoom, pan e minimap para fácil navegação

## 🚀 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI/UX**: Tailwind CSS, Framer Motion, Lucide React
- **Visualização**: ReactFlow (@xyflow/react)
- **IA**: Google Gemini 2.0 Flash
- **PDF Processing**: pdf-parse
- **Styling**: Tailwind CSS com componentes customizados

## 📦 Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/mindmap-ai.git
   cd mindmap-ai
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   
   Edite o arquivo `.env.local` e adicione sua chave da API do Google AI:
   ```
   GOOGLE_API_KEY=sua_chave_da_api_aqui
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 🔑 Configuração da API

### Google AI API Key

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crie uma nova chave API
3. Copie a chave e adicione no arquivo `.env.local`

## 🎯 Como Usar

### 1. Upload de PDF
- Clique na aba "Upload PDF"
- Arraste um arquivo PDF ou clique para selecionar
- Aguarde o processamento e visualize o mapa mental gerado

### 2. Input de Texto
- Clique na aba "Text Input"
- Digite ou cole o texto desejado
- Use os exemplos fornecidos como inspiração
- Clique em "Gerar Mapa Mental"

### 3. Interação com Nós
- Clique em qualquer nó do mapa mental
- Um painel lateral abrirá com explicações detalhadas
- Use o chat para fazer perguntas específicas sobre o tópico
- Experimente as perguntas rápidas sugeridas

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── api/                    # Rotas da API
│   │   ├── chat/              # Chat com IA
│   │   ├── generate-mindmap/  # Geração de mapas mentais
│   │   └── upload-pdf/        # Upload e processamento de PDFs
│   ├── globals.css            # Estilos globais
│   ├── layout.tsx             # Layout principal
│   └── page.tsx               # Página inicial
├── components/                 # Componentes React
│   ├── MindMapApp.tsx         # Componente principal
│   ├── MindMapFlow.tsx        # Visualização do mapa mental
│   ├── CustomNode.tsx         # Nó customizado
│   ├── FileUpload.tsx         # Upload de arquivos
│   ├── TextInput.tsx          # Input de texto
│   └── SidePanel.tsx          # Painel lateral com chat
└── types/
    └── index.ts               # Tipos TypeScript
```

## 🎨 Componentes Principais

### MindMapApp
Componente principal que gerencia o estado da aplicação e coordena todos os outros componentes.

### MindMapFlow
Renderiza o mapa mental usando ReactFlow com nós personalizados e funcionalidades de navegação.

### CustomNode
Nó personalizado com diferentes estilos baseados no nível hierárquico.

### SidePanel
Painel lateral com informações detalhadas e chat com IA para cada nó.

## 🔧 Personalização

### Cores dos Nós
As cores são automaticamente atribuídas baseadas no nível:
- **Nível 0** (Central): Purple/Pink gradients
- **Nível 1** (Principais): Blue tones
- **Nível 2** (Secundários): Green tones
- **Nível 3+** (Folhas): Orange/Yellow tones

### Layout dos Nós
O algoritmo de posicionamento organiza os nós em um layout radial:
- Nó central no centro (0,0)
- Nós de nível 1 distribuídos em círculo
- Nós filhos posicionados próximos aos pais

## 📱 Responsividade

A aplicação é totalmente responsiva e se adapta a diferentes tamanhos de tela:
- **Desktop**: Layout completo com painel lateral
- **Tablet**: Interface adaptada para touch
- **Mobile**: Layout otimizado para telas pequenas

## 🌙 Modo Escuro

Suporte completo ao modo escuro com:
- Detecção automática da preferência do sistema
- Cores adaptadas para melhor contraste
- Transições suaves entre temas

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## 🚀 Deploy

### Vercel (Recomendado)
1. Faça push do código para o GitHub
2. Conecte o repositório no Vercel
3. Configure a variável de ambiente `GOOGLE_API_KEY`
4. Deploy automático!

### Outros Provedores
A aplicação pode ser hospedada em qualquer provedor que suporte Next.js:
- Netlify
- Heroku
- Railway
- DigitalOcean

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Google AI](https://ai.google.dev/) pelo Gemini 2.0 Flash
- [ReactFlow](https://reactflow.dev/) pela biblioteca de visualização
- [Tailwind CSS](https://tailwindcss.com/) pelo framework CSS
- [Framer Motion](https://www.framer.com/motion/) pelas animações

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se sua chave da API do Google AI está configurada corretamente
2. Consulte a [documentação do Google AI](https://ai.google.dev/docs)
3. Abra uma issue no GitHub para relatar bugs ou sugerir melhorias

---

Feito com ❤️ usando Next.js e Google Gemini AI
