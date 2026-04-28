import React from 'react';
import Modal from './Modal';

const ModalSucesso = ({ isOpen, onClose, titulo, mensagem, textoBotao = 'OK', acoes }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
        {/* Ícone de Sucesso */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6 animate-bounce">
          <svg 
            className="w-12 h-12 text-green-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Título e Mensagem */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
            {titulo || 'Operação realizada com sucesso!'}
          </h2>
          {mensagem && (
            <p className="text-sm text-slate-600 max-w-xs">
              {mensagem}
            </p>
          )}
        </div>

        {/* Botões de ação */}
        {acoes && acoes.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {acoes.map((acao, index) => (
              <button 
                key={index}
                onClick={acao.onClick}
                className={`flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 text-base font-bold leading-normal tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 ${
                  acao.primary 
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400'
                }`}
              >
                <span className="truncate">{acao.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <button 
            onClick={onClose}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-green-600 text-white text-base font-bold leading-normal tracking-wide transition-all hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-95"
          >
            <span className="truncate">{textoBotao}</span>
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ModalSucesso;
