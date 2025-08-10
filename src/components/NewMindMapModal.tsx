'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Upload, FileText, List, Brain } from 'lucide-react';
import { Portal } from './Portal';

interface NewMindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeLabel: string;
  onCreateAutomatic: () => void;
  onCreateFromPDF: (file: File) => void;
  onCreateFromText: (text: string, isItems?: boolean) => void;
}

export const NewMindMapModal: React.FC<NewMindMapModalProps> = ({
  isOpen,
  onClose,
  nodeLabel,
  onCreateAutomatic,
  onCreateFromPDF,
  onCreateFromText,
}) => {
  const [selectedMode, setSelectedMode] = useState<'auto' | 'pdf' | 'text' | null>(null);
  const [textMode, setTextMode] = useState<'normal' | 'items'>('normal');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleClose = useCallback(() => {
    setSelectedMode(null);
    setText('');
    setFile(null);
    setTextMode('normal');
    onClose();
  }, [onClose]);

  const handleCreateAutomatic = useCallback(() => {
    onCreateAutomatic();
    handleClose();
  }, [onCreateAutomatic, handleClose]);

  const handleCreateFromPDF = useCallback(() => {
    if (file) {
      onCreateFromPDF(file);
      handleClose();
    }
  }, [file, onCreateFromPDF, handleClose]);

  const handleCreateFromText = useCallback(() => {
    if (text.trim()) {
      onCreateFromText(text.trim(), textMode === 'items');
      handleClose();
    }
  }, [text, textMode, onCreateFromText, handleClose]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  }, []);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100000] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Novo Mapa Mental
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Baseado em: <span className="font-medium">"{nodeLabel}"</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedMode ? (
            /* Mode Selection */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Como você gostaria de criar o mapa mental?
              </h3>
              
              <div className="grid gap-4">
                {/* Automatic Generation */}
                <motion.button
                  onClick={() => setSelectedMode('auto')}
                  className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                        Gerar Automaticamente
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        A IA criará um mapa detalhado sobre "{nodeLabel}"
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* PDF Upload */}
                <motion.button
                  onClick={() => setSelectedMode('pdf')}
                  className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                        Upload de PDF
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Envie um PDF relacionado a "{nodeLabel}"
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Text Input */}
                <motion.button
                  onClick={() => setSelectedMode('text')}
                  className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                      <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                        Inserir Texto
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Digite ou cole texto sobre "{nodeLabel}"
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          ) : selectedMode === 'auto' ? (
            /* Automatic Generation Confirmation */
            <div className="text-center space-y-6">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Brain className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Geração Automática
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  A IA criará um mapa mental detalhado sobre <strong>"{nodeLabel}"</strong> usando conhecimento avançado.
                </p>
              </div>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setSelectedMode(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreateAutomatic}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Mapa</span>
                </button>
              </div>
            </div>
          ) : selectedMode === 'pdf' ? (
            /* PDF Upload */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedMode(null)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
              >
                <span>← Voltar</span>
              </button>
              
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Upload de PDF
              </h3>
              
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-slate-600 dark:text-slate-400">
                    Clique para selecionar um arquivo PDF
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {file && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setSelectedMode(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFromPDF}
                  disabled={!file}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Processar PDF</span>
                </button>
              </div>
            </div>
          ) : selectedMode === 'text' ? (
            /* Text Input */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedMode(null)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
              >
                <span>← Voltar</span>
              </button>
              
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Inserir Texto
              </h3>
              
              {/* Text Mode Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setTextMode('normal')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                    textMode === 'normal'
                      ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Texto Normal</span>
                </button>
                <button
                  onClick={() => setTextMode('items')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                    textMode === 'items'
                      ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Itens</span>
                </button>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  textMode === 'items'
                    ? `Digite a estrutura de itens sobre "${nodeLabel}":\n\n1 Item principal\n1.1 Subitem\n1.2 Subitem\n\n2 Outro item\n2.1 Subitem`
                    : `Digite o texto sobre "${nodeLabel}"...`
                }
                className="w-full h-48 p-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400"
              />
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setSelectedMode(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFromText}
                  disabled={!text.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Criar Mapa</span>
                </button>
              </div>
            </div>
            ) : null}
          </div>
        </motion.div>
      </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
