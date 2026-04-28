import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Package, 
  Palette, 
  Rocket, 
  ChevronLeft, 
  ChevronRight,
  Upload,
  X,
  Check,
  Sparkles
} from 'lucide-react';

/**
 * Componente de Onboarding
 * Fluxo inicial de configuração após criar conta
 */

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Dados do formulário
  const [storeName, setStoreName] = useState('');
  const [products, setProducts] = useState([
    { name: '', price: '' },
    { name: '', price: '' },
    { name: '', price: '' }
  ]);

  // Buscar nome da loja ao carregar
  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        const response = await fetch(`${API_URL}/api/configurations/nome_loja`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.valor) {
            setStoreName(data.data.valor);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar nome da loja:', error);
      }
    };
    
    fetchStoreName();
  }, []);
  const [pdvStyle, setPdvStyle] = useState(''); // 'branded' ou 'shortcuts'
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const totalSteps = 3;

  // Mensagens de carregamento
  const loadingMessages = [
    'Preparando o controle de estoque...',
    'Configurando o catálogo online...',
    'Aplicando suas preferências...',
    'Finalizando configurações...'
  ];

  useEffect(() => {
    if (isLoading) {
      let progress = 0;
      let messageIndex = 0;

      const interval = setInterval(() => {
        progress += 2;
        setLoadingProgress(progress);

        // Atualizar mensagem a cada 25% do progresso
        const newMessageIndex = Math.floor(progress / 25);
        if (newMessageIndex !== messageIndex && newMessageIndex < loadingMessages.length) {
          messageIndex = newMessageIndex;
          setLoadingMessage(loadingMessages[messageIndex]);
        }

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setCurrentStep(4);
          }, 500);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleNext = () => {
    if (currentStep === 2) {
      if (!storeName.trim()) {
        alert('Por favor, preencha o nome da loja');
        return;
      }
      if (!pdvStyle) {
        alert('Por favor, escolha uma opção para o PDV');
        return;
      }
    }

    if (currentStep === 3) {
      handleFinish();
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: '', price: '' }]);
  };

  const handleRemoveProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    if (field === 'price') {
      // Remover caracteres não numéricos exceto vírgula e ponto
      const numericValue = value.replace(/[^0-9,]/g, '');
      newProducts[index][field] = numericValue;
    } else {
      newProducts[index][field] = value;
    }
    setProducts(newProducts);
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const numericValue = value.replace(/[^0-9]/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setLoadingMessage(loadingMessages[0]);

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Se houver logo, fazer upload primeiro
      if (logo) {
        const formData = new FormData();
        formData.append('logo', logo);
        
        await fetch(`${API_URL}/api/configurations/logo/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      }

      // Salvar configurações do onboarding
      const configData = {
        nomeLoja: storeName,
        estiloPDV: pdvStyle,
        produtos: products.filter(p => p.name.trim() !== '').map(p => ({
          name: p.name,
          price: p.price ? parseFloat(p.price) / 100 : 0
        }))
      };

      await fetch(`${API_URL}/api/configurations/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });

      // Aguardar o loading completar
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Você será redirecionado mesmo assim.');
      setTimeout(() => navigate('/dashboard'), 1000);
    }
  };

  const handleStartSystem = () => {
    navigate('/dashboard');
  };

  // Etapa 1: Produtos Iniciais
  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Package className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
          Adicione alguns produtos
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
          Liste produtos para começar mais rápido
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-8">
          Você pode pular esta etapa e adicionar depois
        </p>

        <div className="space-y-3 mb-4">
          {products.map((product, index) => (
            <div key={index} className="flex gap-3">
              <input
                type="text"
                value={product.name}
                onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                placeholder="Nome do produto"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="text"
                  value={formatCurrency(product.price)}
                  onChange={(e) => handleProductChange(index, 'price', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {products.length > 1 && (
                <button
                  onClick={() => handleRemoveProduct(index)}
                  className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg
                           transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleAddProduct}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600
                   text-gray-600 dark:text-gray-400 rounded-lg hover:border-indigo-500
                   hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        >
          + Adicionar outro produto
        </button>
      </div>
    </div>
  );

  // Etapa 2: Estilo do PDV
  const renderStep2 = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-8">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Palette className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
          Personalize seu sistema
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          Escolha como prefere trabalhar
        </p>

        {/* Campo Nome da Loja */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <label className="block mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-gray-900 dark:text-white font-semibold text-base">
                Nome da Loja
              </span>
            </div>
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Ex: Loja do João, Moda Fashion, etc."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Este nome será usado em todo o sistema e nas suas vendas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opção: Minha Marca */}
          <div
            onClick={() => setPdvStyle('branded')}
            className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all
                     ${pdvStyle === 'branded' 
                       ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                       : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
          >
            {pdvStyle === 'branded' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className="mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Minha Marca em Destaque
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sistema com as cores e logo da sua loja
              </p>
            </div>

            {pdvStyle === 'branded' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {!logoPreview ? (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed 
                                  border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer
                                  hover:border-indigo-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Adicionar logo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="w-full h-32 object-contain bg-white dark:bg-gray-800 rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLogo();
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full
                               hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opção: Atalhos Rápidos */}
          <div
            onClick={() => setPdvStyle('shortcuts')}
            className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all
                     ${pdvStyle === 'shortcuts' 
                       ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                       : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
          >
            {pdvStyle === 'shortcuts' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="h-8 bg-indigo-200 dark:bg-indigo-800 rounded" />
                <div className="h-8 bg-indigo-200 dark:bg-indigo-800 rounded" />
                <div className="h-8 bg-indigo-200 dark:bg-indigo-800 rounded" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Atalhos para Agilidade
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Acesso rápido a produtos e categorias
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Etapa 3: Carregamento
  const renderStep3 = () => {
    if (!isLoading) {
      setIsLoading(true);
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] px-8">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-pulse">
              <Sparkles className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
            Preparando tudo para você
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12">
            {loadingMessage}
          </p>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full 
                       transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {loadingProgress}%
          </p>
        </div>
      </div>
    );
  };

  // Etapa 4: Conclusão
  const renderStep4 = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-8">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
              <Rocket className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-6 h-6 text-yellow-800" />
            </div>
          </div>
        </div>
        
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Tudo pronto!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
          Sua loja está configurada e pronta para usar
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-12">
          Se precisar de ajuda, entre em contato com o suporte
        </p>

        <button
          onClick={handleStartSystem}
          className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 
                   text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700
                   transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          Começar a usar o Vitrine360
        </button>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      {currentStep <= 2 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-4xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Etapa {currentStep} de {totalSteps}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`${currentStep <= 2 ? 'pt-24' : ''}`}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation Buttons */}
      {currentStep <= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                       ${currentStep === 1
                         ? 'text-gray-400 cursor-not-allowed'
                         : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg
                       font-medium hover:bg-indigo-700 transition-all transform hover:scale-105
                       shadow-md"
            >
              {currentStep === 2 ? 'Finalizar' : 'Próximo'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
