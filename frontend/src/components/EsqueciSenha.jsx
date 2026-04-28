import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import API_URL from '../config/apiUrl';

/**
 * Componente de Recuperação de Senha
 * Permite ao usuário solicitar redefinição de senha via e-mail
 */

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Por favor, digite seu e-mail' });
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Solicitando recuperação de senha para:', email);

      const response = await fetch(API_URL + '/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ E-mail de recuperação enviado:', data);
        setMessage({ 
          type: 'success', 
          text: 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.' 
        });
        setEmail('');
        
        // Em desenvolvimento, mostrar o token
        if (data.resetToken) {
          console.log('🔑 Token de reset (APENAS DEV):', data.resetToken);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao processar solicitação' });
      }

    } catch (err) {
      console.error('❌ Erro ao solicitar recuperação:', err);
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark"
      style={{
        backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7igL49KWeXPI3YgZFyRSn_s_aV1l8vBVX8eJ4JBnSswrJPeH0GHF_XigNR4wshPxHRo1oeDF25yRrvT1Y1kJ6YbYHVBOCgTLVrTxeIEFHI3W8KWDcr0lFdhpYFsqOFXx4hGU63d5Ti-uYGcoZKs3w6C5g8h6fhA3njEcHyui5OwhiuCaLlEK1DhrAv7V8QmlxHFD8M0EmMRMo8_UVlZZnL36aUpIwDFHBRqulvsjFGd2rdfBE3s3DANBjmo8PpoKprK1CuLU67C4')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/70 dark:bg-black/80 backdrop-blur-sm"></div>

      <div className="relative flex h-full grow flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-center p-6 sm:p-8">
          <a className="flex items-center gap-2 text-xl font-bold text-[#111318] dark:text-white" href="#">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-black">L</span>
            </div>
            <span>Loja de Roupas</span>
          </a>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8 rounded-xl bg-white/80 dark:bg-background-dark/80 p-6 sm:p-10 shadow-lg backdrop-blur-md">
            
            {/* Header */}
            <div className="flex flex-col gap-3 text-center">
              <h1 className="text-[#111318] dark:text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                Recuperação de Senha
              </h1>
              <p className="text-[#616f89] dark:text-gray-300 text-base font-normal leading-normal">
                Para redefinir sua senha, digite seu e-mail ou nome de usuário abaixo.
              </p>
            </div>

            {/* Messages */}
            {message.text && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="flex flex-col w-full">
                <p className="text-[#111318] dark:text-white text-base font-medium leading-normal pb-2">
                  E-mail ou Nome de Usuário
                </p>
                <div className="relative flex w-full items-center">
                  <input
                    className="form-input h-14 w-full rounded-lg border border-[#dbdfe6] dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 pr-12 text-base font-normal leading-normal text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 focus:border-primary dark:focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 transition-colors"
                    placeholder="Digite seu e-mail ou usuário"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="absolute right-4 flex items-center justify-center text-[#616f89] dark:text-gray-400">
                    <Mail size={20} />
                  </div>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-5 text-base font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <span className="truncate">Enviar</span>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 w-full text-sm font-normal leading-normal text-[#616f89] dark:text-gray-400 underline transition-colors hover:text-primary dark:hover:text-primary/80"
            >
              <ArrowLeft size={16} />
              Lembrou sua senha? Voltar para o Login
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative flex flex-col gap-4 px-5 py-8 text-center text-sm">
          <p className="text-[#616f89] dark:text-gray-400">
            © Vitrine360 - 2026 Loja de Roupas. Todos os direitos reservados a Júlio Hebert.
          </p>
        </footer>
      </div>
    </div>
  );
}
