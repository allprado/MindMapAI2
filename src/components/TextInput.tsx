'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, Type, List, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextInputProps {
  onSubmit: (text: string) => void;
  onItemsSubmit: (items: string) => void;
  isLoading: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({ onSubmit, onItemsSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'items'>('text');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim() && !isLoading) {
        if (mode === 'items') {
          onItemsSubmit(text.trim());
        } else {
          onSubmit(text.trim());
        }
      }
    },
    [text, onSubmit, onItemsSubmit, isLoading, mode]
  );

  const examples = [
    'Explique os conceitos fundamentais da inteligência artificial',
    'Descreva o processo de fotossíntese nas plantas',
    'Analise as principais teorias econômicas modernas',
    'Explique os princípios da programação orientada a objetos',
  ];

  const itemsExample = `EIXO TEMÁTICO 1 – GESTÃO GOVERNAMENTAL E GOVERNANÇA PÚBLICA

1 Planejamento e gestão estratégica
1.1 Análise de ambientes e cenários
1.2 Estabelecimento de objetivos e metas
1.3 Métodos de elaboração de mapas estratégicos
1.4 Implementação de estratégias
1.5 Ferramentas de gestão
1.6 Indicadores de desempenho

2 Gestão de pessoas
2.1 Evolução e funções da gestão de pessoas
2.2 Recrutamento e seleção
2.3 Gestão do desempenho
2.4 Valorização e sistemas de recompensas
2.5 Gestão por competências
2.6 Clima e cultura organizacional

3 Gestão de projetos
3.1 Conceitos básicos
3.2 Gerenciamento da integração
3.3 Metodologias ágeis`;

  const handleExampleClick = useCallback((example: string) => {
    setText(example);
  }, []);

  const handleItemsExampleClick = useCallback(() => {
    setText(itemsExample);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Input de Texto
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Digite ou cole o texto que você gostaria de transformar em um mapa mental
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
            mode === 'text'
              ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Texto Livre</span>
        </button>
        <button
          onClick={() => setMode('items')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
            mode === 'items'
              ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Itens</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'items'
                ? "Cole a estrutura de itens aqui...\n\nTÍTULO PRINCIPAL\n\n1 Item principal\n1.1 Subitem\n1.2 Subitem\n\n2 Outro item principal\n2.1 Subitem\n2.2 Subitem"
                : "Digite seu texto aqui... Quanto mais detalhado, melhor será o mapa mental gerado pela IA."
            }
            className="w-full h-48 p-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400"
            disabled={isLoading}
          />
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            {mode === 'items' && (
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Como usar o modo itens"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
            {mode === 'text' ? (
              <Type className="w-5 h-5 text-slate-400" />
            ) : (
              <List className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {text.length} caracteres
          </span>
          <motion.button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Gerando...' : 'Gerar Mapa Mental'}</span>
          </motion.button>
        </div>
      </form>

      {/* Examples based on mode */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {mode === 'items' ? 'Exemplo de estrutura:' : 'Exemplos para começar:'}
        </h3>
        <div className="space-y-2">
          {mode === 'items' ? (
            <motion.button
              onClick={handleItemsExampleClick}
              className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
            >
              Clique para ver exemplo de estrutura de itens
            </motion.button>
          ) : (
            examples.map((example, index) => (
              <motion.button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={isLoading}
              >
                {example}
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Como usar o modo Itens
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Formato de entrada:
                  </h4>
                  <p>O modo itens espera uma estrutura hierárquica específica:</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded font-mono text-xs">
                  <div className="text-purple-600 dark:text-purple-400">TÍTULO PRINCIPAL</div>
                  <br />
                  <div>1 Item principal</div>
                  <div>1.1 Subitem</div>
                  <div>1.2 Subitem</div>
                  <div>1.3 Subitem</div>
                  <br />
                  <div>2 Outro item principal</div>
                  <div>2.1 Subitem</div>
                  <div>2.2 Subitem</div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Regras importantes:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>O título principal fica na primeira linha</li>
                    <li>Itens principais começam com números: 1, 2, 3...</li>
                    <li>Subitens usam numeração decimal: 1.1, 1.2, 2.1...</li>
                    <li>Você pode ter vários níveis: 1.1.1, 1.1.2...</li>
                    <li>Deixe linhas em branco para separar seções</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Vantagens do modo itens:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Processamento mais rápido (não usa IA)</li>
                    <li>Estrutura exata como você define</li>
                    <li>Ideal para conteúdos já organizados</li>
                    <li>Perfeito para editais, apostilas e documentos estruturados</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
