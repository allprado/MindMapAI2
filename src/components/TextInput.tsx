'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, Type } from 'lucide-react';
import { motion } from 'framer-motion';

interface TextInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim() && !isLoading) {
        onSubmit(text.trim());
      }
    },
    [text, onSubmit, isLoading]
  );

  const examples = [
    'Explique os conceitos fundamentais da inteligência artificial',
    'Descreva o processo de fotossíntese nas plantas',
    'Analise as principais teorias econômicas modernas',
    'Explique os princípios da programação orientada a objetos',
  ];

  const handleExampleClick = useCallback((example: string) => {
    setText(example);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite seu texto aqui... Quanto mais detalhado, melhor será o mapa mental gerado pela IA."
            className="w-full h-48 p-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400"
            disabled={isLoading}
          />
          <div className="absolute top-3 right-3">
            <Type className="w-5 h-5 text-slate-400" />
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

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Exemplos para começar:
        </h3>
        <div className="space-y-2">
          {examples.map((example, index) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};
