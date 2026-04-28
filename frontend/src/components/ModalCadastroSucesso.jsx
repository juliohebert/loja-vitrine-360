import React, { useEffect } from "react";

export default function ModalCadastroSucesso({ open, onClose }) {
  useEffect(() => {
    if (open) {
      // Prevenir scroll quando modal está aberto
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll quando modal é fechado
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      // Garantir que scroll seja restaurado ao desmontar
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Fundo escurecido */}
      <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose} />
      {/* Blobs decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 z-10">
        <div className="h-1.5 w-full bg-primary" />
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-6 shadow-inner ring-1 ring-blue-100 dark:ring-blue-800/50">
            <svg className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Cadastro realizado!
          </h2>
          <div className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm sm:text-base">
            <p>
              Usuário cadastrado com sucesso! Você tem direito a <span className="text-primary font-bold">14 dias grátis</span> para testar o sistema.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Informe seu login e senha para acessar e aproveitar.
            </p>
          </div>
          <button
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-4 focus:ring-blue-500/20 group flex items-center justify-center gap-2"
            onClick={onClose}
          >
            <span>OK, Entendi</span>
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
        <div className="h-4 bg-gray-50/50 dark:bg-black/10 w-full"></div>
      </div>
    </div>
  );
}
