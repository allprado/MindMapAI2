# Sistema de Autenticação e Persistência - MindMap AI

## 📋 Visão Geral

O MindMap AI agora possui um sistema completo de autenticação e persistência usando Supabase, permitindo que os usuários:

- **Criem contas** e façam login
- **Salvem mapas mentais** na nuvem
- **Compartilhem mapas** públicos
- **Organizem** sua biblioteca de mapas
- **Colaborem** visualizando mapas de outros usuários

## 🚀 Funcionalidades Implementadas

### 1. Autenticação de Usuários
- **Registro**: Criação de conta com email, senha e nome completo
- **Login**: Autenticação segura com Supabase Auth
- **Logout**: Encerramento seguro da sessão
- **Perfil**: Gerenciamento automático de perfis de usuário

### 2. Persistência de Mapas Mentais
- **Salvar Mapas**: Salvar mapas mentais criados com IA
- **Carregar Mapas**: Carregar mapas salvos anteriormente
- **Atualizar Mapas**: Modificar e salvar mudanças
- **Excluir Mapas**: Remover mapas da biblioteca

### 3. Compartilhamento e Colaboração
- **Mapas Privados**: Mapas visíveis apenas para o criador
- **Mapas Públicos**: Mapas compartilhados publicamente
- **Galeria Pública**: Visualização de mapas de outros usuários
- **Duplicação**: Fazer cópias de mapas públicos

### 4. Organização e Busca
- **Busca por Texto**: Procurar mapas por título, descrição ou tags
- **Filtros**: Filtrar por tipo (privado/público)
- **Tags**: Organizar mapas com etiquetas
- **Ordenação**: Mapas ordenados por data de modificação

## 🏗️ Arquitetura do Sistema

### Backend (Supabase)
```
📁 Banco de Dados
├── 👥 profiles (perfis de usuário)
│   ├── id (UUID, referência auth.users)
│   ├── email (string)
│   ├── full_name (string)
│   ├── avatar_url (string)
│   └── timestamps
│
└── 🧠 mindmaps (mapas mentais)
    ├── id (UUID)
    ├── title (string)
    ├── description (string)
    ├── nodes (JSONB - estrutura do mapa)
    ├── edges (JSONB - conexões)
    ├── user_id (UUID, referência perfil)
    ├── is_public (boolean)
    ├── tags (array de strings)
    └── timestamps
```

### Frontend (React/Next.js)
```
📁 Componentes
├── 🔐 AuthModal.tsx (modal de login/registro)
├── 📚 SavedMindMaps.tsx (gerenciador de mapas)
├── 🧠 MindMapApp.tsx (aplicação principal)
└── 🔧 AuthContext.tsx (contexto de autenticação)

📁 Serviços
├── 🗄️ supabase.ts (configuração Supabase)
├── 📡 mindmap-service.ts (CRUD de mapas)
└── 🛣️ api/mindmaps/ (rotas da API)
```

## 🔒 Segurança (RLS - Row Level Security)

### Políticas de Segurança Implementadas:

**Profiles:**
- ✅ Qualquer pessoa pode ver perfis públicos
- ✅ Usuários podem criar seu próprio perfil
- ✅ Usuários podem atualizar apenas seu perfil

**MindMaps:**
- ✅ Usuários veem apenas seus próprios mapas privados
- ✅ Todos podem ver mapas públicos
- ✅ Usuários podem criar mapas em seu nome
- ✅ Usuários podem modificar apenas seus mapas
- ✅ Usuários podem excluir apenas seus mapas

## 🎯 Como Usar

### 1. Criando uma Conta
1. Clique em **"Entrar"** no cabeçalho
2. Selecione **"Criar conta"**
3. Preencha: nome, email e senha
4. Confirme o email (desenvolvimento local: automático)

### 2. Salvando um Mapa Mental
1. Crie um mapa mental usando IA ou texto
2. Clique no botão **"Salvar"** no cabeçalho
3. O mapa é salvo automaticamente na sua conta

### 3. Gerenciando Mapas Salvos
1. Clique em **"Meus Mapas"** no cabeçalho
2. **Abrir**: Carregar um mapa para edição
3. **Compartilhar**: Tornar público/privado
4. **Duplicar**: Fazer uma cópia
5. **Excluir**: Remover permanentemente

### 4. Explorando Mapas Públicos
1. Em "Meus Mapas", clique em **"Mapas Públicos"**
2. Navegue pela galeria de mapas compartilhados
3. **Duplicar** mapas interessantes para sua biblioteca

## 🔧 APIs Disponíveis

### Endpoints REST:

```typescript
GET    /api/mindmaps           // Listar mapas do usuário
GET    /api/mindmaps?public=true // Listar mapas públicos
GET    /api/mindmaps?search=query // Buscar mapas
POST   /api/mindmaps           // Criar novo mapa
GET    /api/mindmaps/[id]      // Obter mapa específico
PUT    /api/mindmaps/[id]      // Atualizar mapa
DELETE /api/mindmaps/[id]      // Excluir mapa
POST   /api/mindmaps/[id]/duplicate // Duplicar mapa
```

### Exemplo de Uso da API:

```typescript
// Criar mapa mental
const response = await fetch('/api/mindmaps', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Meu Mapa",
    description: "Descrição do mapa",
    nodes: [...nodes],
    isPublic: false,
    tags: ["tag1", "tag2"]
  })
});

// Buscar mapas
const response = await fetch('/api/mindmaps?search=machine learning');
const mindmaps = await response.json();
```

## 🗄️ Configuração do Banco de Dados

### Variáveis de Ambiente (.env.local):
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Migrações SQL:
As tabelas são criadas automaticamente via migrations em:
```
📁 supabase/migrations/
└── 20250810235724_create_mindmaps_tables.sql
```

## 🚀 Deployment para Produção

### 1. Supabase Cloud:
1. Criar projeto no [Supabase Cloud](https://supabase.com)
2. Executar migrations: `npx supabase db push`
3. Configurar variáveis de ambiente de produção

### 2. Vercel/Netlify:
1. Conectar repositório
2. Configurar variáveis de ambiente
3. Deploy automático

## 🔍 Troubleshooting

### Problemas Comuns:

**Erro: "Usuário não autenticado"**
- Verificar se o usuário está logado
- Conferir configuração do Supabase

**Mapas não aparecem:**
- Verificar políticas RLS
- Confirmar que user_id está correto

**Erro ao salvar:**
- Verificar se o usuário tem permissões
- Conferir estrutura dos dados

### Logs e Debug:
- Console do navegador para erros frontend
- Logs do Supabase para erros de banco
- Network tab para problemas de API

## 📈 Próximos Passos

### Funcionalidades Futuras:
- 📧 **Notificações por email**
- 👥 **Colaboração em tempo real**
- 🔗 **Compartilhamento por link**
- 📊 **Analytics de uso**
- 🎨 **Temas personalizáveis**
- 💬 **Comentários em mapas**

### Melhorias Técnicas:
- 🔄 **Sincronização offline**
- ⚡ **Cache otimizado**
- 🔍 **Busca avançada com Elasticsearch**
- 📱 **App mobile**

---

## 🤝 Contribuindo

Para contribuir com melhorias:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste localmente
5. Abra um Pull Request

O sistema está pronto para produção e pode ser facilmente expandido com novas funcionalidades!
