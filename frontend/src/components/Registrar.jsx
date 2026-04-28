import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Layers } from 'lucide-react';
import ModalCadastroSucesso from './ModalCadastroSucesso';

/**
 * Componente de Registro de Usuário
 * Tela para criação de nova conta no sistema
 */

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nomeLoja: 'Minha Loja', // Nome temporário, será atualizado no onboarding
          email: formData.email,
          senha: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Fazer login automático após registro
        const loginResponse = await fetch(`${API_URL}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            senha: formData.password
          })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok && loginData.token) {
          // Salvar token para usar no onboarding
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
        }

        // Limpar formulário
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });

        setShowModal(true);
      } else {
        setErrors({ general: data.error || 'Erro ao criar conta' });
      }

    } catch (err) {
      console.error('❌ Erro ao criar conta:', err);
      setErrors({ general: 'Erro ao conectar com o servidor. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalCadastroSucesso open={showModal} onClose={() => navigate('/onboarding')} />
      <div className="w-full min-h-screen bg-background-light dark:bg-background-dark px-4 py-12 pb-24">
        <div className="w-full max-w-md mx-auto">
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Layers className="text-primary dark:text-primary" size={32} />
            </div>
            <h1 className="text-[#111318] dark:text-white text-3xl font-bold tracking-tight">
              Crie sua Conta
            </h1>
            <p className="text-[#616f89] dark:text-gray-400 mt-2 text-base text-center font-normal">
              Comece agora e aproveite <span className="text-primary font-semibold">14 dias grátis</span>
            </p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-normal">
            
            {/* E-mail */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                E-mail
              </p>
              <div className="relative flex w-full items-center">
                <Mail className="absolute left-3.5 text-[#616f89] dark:text-gray-400" size={20} />
                <input
                  className={`w-full rounded-lg border ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-11 pr-4 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                  name="email"
                  placeholder="seuemail@exemplo.com"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </label>

            {/* Senha */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Senha
              </p>
              <div className="relative flex w-full items-center">
                <Lock className="absolute left-3.5 text-[#616f89] dark:text-gray-400" size={20} />
                <input
                  className={`w-full rounded-lg border ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-11 pr-12 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                  name="password"
                  placeholder="Crie uma senha forte"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#616f89] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 absolute right-3.5 transition-colors"
                  aria-label="Mostrar senha"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </label>

            {/* Confirmação de Senha */}
            <label className="flex flex-col">
              <p className="text-[#111318] dark:text-gray-300 text-base font-medium leading-normal pb-2">
                Confirmação de Senha
              </p>
              <div className="relative flex w-full items-center">
                <Lock className="absolute left-3.5 text-[#616f89] dark:text-gray-400" size={20} />
                <input
                  className={`w-full rounded-lg border ${errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-background-dark/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-11 pr-12 text-base text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-400 transition-colors`}
                  name="confirmPassword"
                  placeholder="Confirme sua senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[#616f89] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 absolute right-3.5 transition-colors"
                  aria-label="Mostrar senha"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Criando conta...</span>
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#616f89] dark:text-gray-400 font-normal">
              Já tem uma conta?{' '}
              <a 
                className="font-semibold text-primary dark:text-primary hover:underline transition-colors cursor-pointer" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Faça Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
