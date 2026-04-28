import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import API_URL from '../config/apiUrl';

/**
 * Componente de Login
 * Tela de autenticação para acesso ao sistema da loja
 */

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    try {
      // TODO: Implementar chamada à API de autenticação
      console.log('📤 Tentando login:', formData);

      // Simulação de API call
      const response = await fetch(API_URL + '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          senha: formData.password // Backend espera 'senha' em vez de 'password'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Limpar TODOS os dados do localStorage exceto configurações essenciais
        const keysParaManter = ['theme', 'language'];
        const todasKeys = Object.keys(localStorage);
        
        todasKeys.forEach(key => {
          if (!keysParaManter.includes(key)) {
            localStorage.removeItem(key);
          }
        });
        
        console.log('🧹 localStorage limpo completamente');
        
        // Salvar token e dados do usuário
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Verificar se é super-admin
        if (data.user.funcao === 'super-admin') {
          console.log('👑 Super-admin detectado - redirecionando para seleção de lojas');
          navigate('/selecionar-loja');
        } else {
          navigate('/dashboard');
        }
      } else {
        const error = await response.json();
        setError(error.message || 'E-mail ou senha incorretos');
      }
    } catch (err) {
      console.error('❌ Erro no login:', err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex flex-1 justify-center items-center p-4 sm:p-6 lg:p-8">
        <div className="flex w-full max-w-5xl bg-white dark:bg-gray-900/50 rounded-xl shadow-2xl overflow-hidden">
          
          {/* Image Panel - Hidden on mobile */}
          <div 
            className="hidden lg:block w-1/2 bg-cover bg-center relative"
            style={{
              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpzxX0baeOeAyDzWvXCLTbqO85dHjI63j1e43Wd-5HAOaPCF3oh8o4LCRAATwq2hOdsaly7D5FVD5FpgIOCsLawMZH4F-L2oYyurBNUw8aydsfuVHA1pwV9eOZ566IqSMI9GMZvPFbm-TpeWNsulUg7-8ZwQ4hHmE-APS7fATBxPSAiqmAFQok8WwLmA09IRijEkqsXOevMYDt5t_aJtRfCkvWuSoRdpiOY7rZQYuy_a83OM9_csoW42LHbn9Td3uamrFdZrzSQ_k")'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"></div>
          </div>

          {/* Form Panel */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              
              {/* Header */}
              <div className="flex flex-col gap-2 text-center mb-8">
                <img src="/bolsas.png" alt="Logo bolsas" className="mx-auto mb-2 w-16 h-16 object-contain" />
                <h1 className="text-[#111318] dark:text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                  Bem-vindo(a)
                </h1>
                <h2 className="text-[#616f89] dark:text-gray-300 text-sm sm:text-base font-normal leading-normal">
                  Acesse sua conta para gerenciar sua loja.
                </h2>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* Email Input */}
                <div className="flex flex-col gap-2">
                  <label 
                    className="text-sm font-medium text-[#111318] dark:text-gray-200" 
                    htmlFor="email"
                  >
                    E-mail ou Usuário
                  </label>
                  <div className="relative flex w-full items-center">
                    <User className="absolute left-3 text-[#616f89] dark:text-gray-400" size={20} />
                    <input
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark/50 focus:border-primary focus:ring-2 focus:ring-primary/50 h-12 pl-10 pr-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors"
                      id="email"
                      name="email"
                      placeholder="email@example.com"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-2">
                  <label 
                    className="text-sm font-medium text-[#111318] dark:text-gray-200" 
                    htmlFor="password"
                  >
                    Senha
                  </label>
                  <div className="relative flex w-full items-center">
                    <Lock className="absolute left-3 text-[#616f89] dark:text-gray-400" size={20} />
                    <input
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-background-dark/50 focus:border-primary focus:ring-2 focus:ring-primary/50 h-12 pl-10 pr-12 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors"
                      id="password"
                      name="password"
                      placeholder="Sua senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#616f89] dark:text-gray-400 hover:text-[#111318] dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <a 
                    className="text-primary dark:text-primary text-sm font-normal underline hover:text-primary/80 dark:hover:text-primary/80 transition-colors cursor-pointer" 
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/forgot-password');
                    }}
                  >
                    Esqueci minha senha
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-5 bg-primary text-white text-base font-bold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-background-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>
              </form>

              {/* Create Account Link */}
              <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal text-center mt-6">
                Não tem uma conta?{' '}
                <a 
                  className="text-primary dark:text-primary font-semibold underline hover:text-primary/80 dark:hover:text-primary/80 transition-colors cursor-pointer" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/register');
                  }}
                >
                  Crie uma agora
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto py-5 px-5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm">
          <a 
            className="text-[#616f89] dark:text-gray-400 font-normal hover:text-primary dark:hover:text-primary transition-colors" 
            href="#"
          >
            Termos de Serviço
          </a>
          <a 
            className="text-[#616f89] dark:text-gray-400 font-normal hover:text-primary dark:hover:text-primary transition-colors" 
            href="#"
          >
            Política de Privacidade
          </a>
        </div>
        <p className="text-[#616f89] dark:text-gray-500 text-sm font-normal text-center mt-4">
          © Vitrine360 - 2026. Todos os direitos reservados a Júlio Hebert.
        </p>
      </footer>
    </div>
  );
}
