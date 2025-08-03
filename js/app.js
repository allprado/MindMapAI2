// Configuração global
const CONFIG = {
    geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['application/pdf'],
    nodeColors: ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777'],
    defaultNodeColor: '#4F46E5'
};

// Estado global da aplicação
const AppState = {
    editor: null,
    currentFile: null,
    apiKey: null,
    isGenerating: false,
    selectedNodeId: null,
    nodeCounter: 0,
    mindMapData: null
};

// Classe principal da aplicação
class MindMapApp {
    constructor() {
        this.initializeApp();
        this.setupEventListeners();
        this.loadStoredApiKey();
    }

    initializeApp() {
        // Inicializar Drawflow
        const container = document.getElementById('drawflow');
        AppState.editor = new Drawflow(container);
        AppState.editor.reroute = true;
        AppState.editor.reroute_fix_curvature = true;
        AppState.editor.force_first_input = false;
        AppState.editor.start();

        // Configurar PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        this.updateUIState();
    }

    setupEventListeners() {
        // Upload de arquivo
        const fileUploadArea = document.getElementById('fileUploadArea');
        const pdfInput = document.getElementById('pdfInput');
        const removeFile = document.getElementById('removeFile');

        fileUploadArea.addEventListener('click', () => pdfInput.click());
        fileUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        fileUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        fileUploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        pdfInput.addEventListener('change', this.handleFileSelect.bind(this));
        removeFile.addEventListener('click', this.removeFile.bind(this));

        // API Key
        const saveApiKey = document.getElementById('saveApiKey');
        saveApiKey.addEventListener('click', this.saveApiKey.bind(this));

        // Geração do mapa mental
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.addEventListener('click', this.generateMindMap.bind(this));

        // Ferramentas
        document.getElementById('addNodeBtn').addEventListener('click', () => this.addCustomNode());
        document.getElementById('editNodeBtn').addEventListener('click', () => this.editSelectedNode());
        document.getElementById('deleteNodeBtn').addEventListener('click', () => this.deleteSelectedNode());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomCanvas(1.2));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomCanvas(0.8));
        document.getElementById('centerBtn').addEventListener('click', () => this.centerCanvas());

        // Header actions
        document.getElementById('clearBtn').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.exportMindMap.bind(this));

        // Modal
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('cancelEdit').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('saveEdit').addEventListener('click', this.saveNodeEdit.bind(this));

        // Color presets
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                document.getElementById('nodeColor').value = color;
            });
        });

        // Drawflow events
        AppState.editor.on('nodeSelected', (id) => {
            AppState.selectedNodeId = id;
            this.updateUIState();
        });

        AppState.editor.on('nodeUnselected', () => {
            AppState.selectedNodeId = null;
            this.updateUIState();
        });

        AppState.editor.on('nodeRemoved', () => {
            this.updateNodeCount();
        });

        AppState.editor.on('nodeCreated', () => {
            this.updateNodeCount();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    // Manipulação de arquivos
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (!this.validateFile(file)) {
            return;
        }

        try {
            AppState.currentFile = file;
            this.updateFileInfo(file);
            this.updateUIState();
            this.showToast('Arquivo carregado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            this.showToast('Erro ao processar o arquivo', 'error');
        }
    }

    validateFile(file) {
        if (!CONFIG.supportedFormats.includes(file.type)) {
            this.showToast('Formato de arquivo não suportado. Use apenas PDF.', 'error');
            return false;
        }

        if (file.size > CONFIG.maxFileSize) {
            this.showToast('Arquivo muito grande. Máximo 10MB.', 'error');
            return false;
        }

        return true;
    }

    updateFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = fileInfo.querySelector('.file-name');
        
        fileName.textContent = file.name;
        fileInfo.style.display = 'block';
        document.getElementById('fileUploadArea').style.display = 'none';
    }

    removeFile() {
        AppState.currentFile = null;
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('fileUploadArea').style.display = 'block';
        document.getElementById('pdfInput').value = '';
        this.updateUIState();
    }

    // API Key management
    saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (!apiKey) {
            this.showToast('Por favor, insira uma chave API válida', 'error');
            return;
        }

        AppState.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        this.updateUIState();
        this.showToast('Chave API salva com sucesso!', 'success');
    }

    loadStoredApiKey() {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            AppState.apiKey = storedKey;
            document.getElementById('apiKey').value = storedKey;
            this.updateUIState();
        }
    }

    // Extração de texto do PDF
    async extractTextFromPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + ' ';
            }

            return fullText.trim();
        } catch (error) {
            console.error('Erro ao extrair texto do PDF:', error);
            throw new Error('Falha na extração do texto do PDF');
        }
    }

    // Geração do mapa mental
    async generateMindMap() {
        if (!AppState.currentFile || !AppState.apiKey) {
            this.showToast('Carregue um arquivo PDF e configure a API Key', 'error');
            return;
        }

        if (AppState.isGenerating) {
            return;
        }

        try {
            AppState.isGenerating = true;
            this.showLoading(true);

            // Extrair texto do PDF
            const text = await this.extractTextFromPDF(AppState.currentFile);
            
            // Gerar mapa mental com Gemini
            const mindMapData = await this.generateWithGemini(text);
            
            // Renderizar mapa mental
            this.renderMindMap(mindMapData);
            
            this.showToast('Mapa mental gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar mapa mental:', error);
            this.showToast('Erro ao gerar mapa mental: ' + error.message, 'error');
        } finally {
            AppState.isGenerating = false;
            this.showLoading(false);
        }
    }

    async generateWithGemini(text) {
        const complexity = document.getElementById('complexity').value;
        const focus = document.getElementById('focus').value.trim();

        const prompt = this.buildPrompt(text, complexity, focus);

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        try {
            const response = await fetch(`${CONFIG.geminiBaseUrl}?key=${AppState.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Erro na API do Gemini');
            }

            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            
            // Parse do JSON retornado
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta inválida da API');
            }

            return JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
        } catch (error) {
            if (error.message.includes('API key')) {
                throw new Error('Chave API inválida ou sem permissões');
            }
            throw error;
        }
    }

    buildPrompt(text, complexity, focus) {
        const complexityInstructions = {
            simple: 'Crie um mapa mental simples com 5-8 conceitos principais',
            medium: 'Crie um mapa mental de complexidade média com 8-12 conceitos e subcategorias',
            complex: 'Crie um mapa mental complexo e detalhado com múltiplos níveis e conexões'
        };

        let prompt = `
Analise o seguinte texto e crie um mapa mental estruturado em formato JSON.

${complexityInstructions[complexity]}.

${focus ? `Foque especificamente em: ${focus}` : ''}

O formato de saída deve ser um JSON válido com a seguinte estrutura:
{
  "title": "Título principal do mapa mental",
  "nodes": [
    {
      "id": "node_1",
      "text": "Texto do nó",
      "x": 100,
      "y": 100,
      "color": "#4F46E5",
      "isRoot": true
    }
  ],
  "connections": [
    {
      "from": "node_1",
      "to": "node_2"
    }
  ]
}

Regras importantes:
1. Use IDs únicos para cada nó
2. Posicione os nós de forma organizada (considere um layout radial a partir do centro)
3. O nó raiz deve estar centralizado (x: 400, y: 300)
4. Use cores diferentes para categorias diferentes
5. Mantenha o texto dos nós conciso (máximo 3-4 palavras)
6. Crie conexões lógicas entre conceitos relacionados

Texto para análise:
${text.substring(0, 4000)}...
`;

        return prompt;
    }

    renderMindMap(data) {
        // Limpar canvas
        AppState.editor.clear();
        AppState.mindMapData = data;

        // Criar nós
        data.nodes.forEach(node => {
            this.createNode(node.id, node.text, node.x, node.y, node.color || CONFIG.defaultNodeColor);
        });

        // Criar conexões
        setTimeout(() => {
            data.connections.forEach(conn => {
                try {
                    AppState.editor.addConnection(conn.from, conn.to, 'output_1', 'input_1');
                } catch (error) {
                    console.warn('Erro ao criar conexão:', error);
                }
            });
        }, 100);

        this.updateNodeCount();
    }

    createNode(id, text, x, y, color = CONFIG.defaultNodeColor) {
        const nodeHtml = `
            <div class="mind-map-node" style="background-color: ${color}; color: white; padding: 10px; border-radius: 8px; text-align: center; min-width: 120px;">
                <div style="font-weight: 500; font-size: 14px;">${text}</div>
            </div>
        `;

        AppState.editor.addNode(id, 1, 1, x, y, id, {}, nodeHtml);
    }

    // Ferramentas do canvas
    addCustomNode() {
        AppState.nodeCounter++;
        const nodeId = `custom_node_${AppState.nodeCounter}`;
        const x = Math.random() * 400 + 200;
        const y = Math.random() * 300 + 150;
        
        this.createNode(nodeId, 'Novo Nó', x, y);
        this.updateNodeCount();
        this.showToast('Nó adicionado', 'info');
    }

    editSelectedNode() {
        if (!AppState.selectedNodeId) {
            this.showToast('Selecione um nó para editar', 'warning');
            return;
        }

        const nodeData = AppState.editor.getNodeFromId(AppState.selectedNodeId);
        const nodeElement = document.querySelector(`#node-${AppState.selectedNodeId} .mind-map-node`);
        
        if (nodeElement) {
            const currentText = nodeElement.textContent.trim();
            const currentColor = nodeElement.style.backgroundColor || CONFIG.defaultNodeColor;
            
            document.getElementById('nodeText').value = currentText;
            document.getElementById('nodeColor').value = this.rgbToHex(currentColor);
            document.getElementById('nodeModal').style.display = 'flex';
        }
    }

    saveNodeEdit() {
        if (!AppState.selectedNodeId) return;

        const newText = document.getElementById('nodeText').value.trim();
        const newColor = document.getElementById('nodeColor').value;

        if (!newText) {
            this.showToast('O texto do nó não pode estar vazio', 'error');
            return;
        }

        const nodeElement = document.querySelector(`#node-${AppState.selectedNodeId} .mind-map-node`);
        if (nodeElement) {
            nodeElement.innerHTML = `<div style="font-weight: 500; font-size: 14px;">${newText}</div>`;
            nodeElement.style.backgroundColor = newColor;
        }

        this.closeModal();
        this.showToast('Nó atualizado com sucesso', 'success');
    }

    deleteSelectedNode() {
        if (!AppState.selectedNodeId) {
            this.showToast('Selecione um nó para deletar', 'warning');
            return;
        }

        AppState.editor.removeNodeId(`node-${AppState.selectedNodeId}`);
        AppState.selectedNodeId = null;
        this.updateNodeCount();
        this.showToast('Nó removido', 'info');
    }

    zoomCanvas(factor) {
        const container = document.getElementById('drawflow');
        const currentZoom = AppState.editor.zoom || 1;
        const newZoom = Math.max(0.3, Math.min(3, currentZoom * factor));
        AppState.editor.zoom_value = newZoom;
        AppState.editor.canvas_x = 0;
        AppState.editor.canvas_y = 0;
        AppState.editor.zoom_refresh();
    }

    centerCanvas() {
        AppState.editor.canvas_x = 0;
        AppState.editor.canvas_y = 0;
        AppState.editor.zoom_value = 1;
        AppState.editor.zoom_refresh();
    }

    clearCanvas() {
        if (AppState.editor.drawflow.Home.data && Object.keys(AppState.editor.drawflow.Home.data).length > 0) {
            if (confirm('Tem certeza que deseja limpar o mapa mental?')) {
                AppState.editor.clear();
                AppState.mindMapData = null;
                this.updateNodeCount();
                this.showToast('Canvas limpo', 'info');
            }
        }
    }

    // Exportação
    async exportMindMap() {
        if (!AppState.mindMapData && (!AppState.editor.drawflow.Home.data || Object.keys(AppState.editor.drawflow.Home.data).length === 0)) {
            this.showToast('Nenhum mapa mental para exportar', 'warning');
            return;
        }

        try {
            const canvas = document.getElementById('drawflow');
            const { default: html2canvas } = await import('https://cdn.skypack.dev/html2canvas');
            
            const canvasElement = await html2canvas(canvas, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true
            });

            // Download da imagem
            const link = document.createElement('a');
            link.download = `mindmap_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvasElement.toDataURL();
            link.click();

            this.showToast('Mapa mental exportado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.showToast('Erro ao exportar mapa mental', 'error');
        }
    }

    // Utilitários
    closeModal() {
        document.getElementById('nodeModal').style.display = 'none';
    }

    updateUIState() {
        const hasFile = AppState.currentFile !== null;
        const hasApiKey = AppState.apiKey !== null;
        const canGenerate = hasFile && hasApiKey && !AppState.isGenerating;

        document.getElementById('generateBtn').disabled = !canGenerate;
        
        // Atualizar texto do botão de geração
        const generateBtn = document.getElementById('generateBtn');
        if (AppState.isGenerating) {
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        } else {
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Gerar Mapa Mental';
        }
    }

    updateNodeCount() {
        const nodeCount = Object.keys(AppState.editor.drawflow.Home.data).length;
        document.getElementById('nodeCount').textContent = `${nodeCount} nós`;
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Remover após 5 segundos
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const result = rgb.match(/\d+/g);
        if (result && result.length >= 3) {
            return '#' + result.slice(0, 3).map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        return CONFIG.defaultNodeColor;
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.addCustomNode();
                    break;
                case 'e':
                    e.preventDefault();
                    this.editSelectedNode();
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelectedNode();
                    break;
                case '=':
                case '+':
                    e.preventDefault();
                    this.zoomCanvas(1.2);
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomCanvas(0.8);
                    break;
                case '0':
                    e.preventDefault();
                    this.centerCanvas();
                    break;
            }
        }

        if (e.key === 'Escape') {
            this.closeModal();
        }
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    new MindMapApp();
});
