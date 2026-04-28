import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCog, FaSave, FaUndo, FaCheckCircle, FaTimesCircle, FaUpload, FaTrash, FaStore } from 'react-icons/fa';
import Sidebar from './Sidebar';
import Toast from './Toast';
import { getAuthHeaders, decodeToken } from '../utils/auth';
import PlanosDisponiveis from './PlanosDisponiveis';
import API_URL from '../config/apiUrl';

export default function Configuracoes() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alteracoes, setAlteracoes] = useState({});
  const [toast, setToast] = useState({ isOpen: false, message: '', tipo: 'sucesso' });
  const [abaAtiva, setAbaAtiva] = useState('configuracoes');
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [nomeLoja, setNomeLoja] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [catalogoLink, setCatalogoLink] = useState({ url: '', slug: '' });
  const [catalogoCarregado, setCatalogoCarregado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    carregarConfiguracoes();
    carregarLinkCatalogo();
  }, [navigate]);

  const carregarLinkCatalogo = async () => {
    // Gerar slug localmente a partir do tenant_id (funciona sem backend)
    const gerarSlugLocal = () => {
      const token = localStorage.getItem('token');
      const decoded = token ? decodeToken(token) : null;
      const tenantId = decoded?.tenantId || '';
      const slug = tenantId
        .replace(/^tenant_/, '')
        .replace(/_\d+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || tenantId.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'minha-loja';
      const url = `${window.location.origin}/catalogo/${slug}`;
      setCatalogoLink({ slug, url });
      setCatalogoCarregado(true);
    };

    try {
      const response = await fetch(API_URL + '/api/configurations/catalogo/link', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.url) {
          setCatalogoLink(data.data);
          setCatalogoCarregado(true);
          return;
        }
      }
      // Fallback local se backend indisponível ou sem slug
      gerarSlugLocal();
    } catch (error) {
      console.error('Erro ao carregar link do catálogo:', error);
      gerarSlugLocal();
    }
  };

  const copiarLink = () => {
    if (catalogoLink && catalogoLink.url) {
      navigator.clipboard.writeText(catalogoLink.url);
      setCopiado(true);
      setToast({ isOpen: true, message: 'Link copiado para a área de transferência!', tipo: 'sucesso' });
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch(API_URL + '/api/configurations', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data);
        
        // Extrair logo_url e nome_loja das configurações
        const logoConfig = data.data.find(c => c.chave === 'logo_url');
        const nomeConfig = data.data.find(c => c.chave === 'nome_loja');
        
        if (logoConfig && logoConfig.valor) {
          setLogoUrl(logoConfig.valor);
        }
        if (nomeConfig && nomeConfig.valor) {
          setNomeLoja(nomeConfig.valor);
        }
      } else {
        setToast({ isOpen: true, message: 'Erro ao carregar configurações', tipo: 'erro' });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setToast({ isOpen: true, message: 'Erro ao carregar configurações', tipo: 'erro' });
    }
  };

  const handleChange = (chave, valor) => {
    setAlteracoes({
      ...alteracoes,
      [chave]: valor
    });
  };

  const getValorAtual = (config) => {
    if (alteracoes.hasOwnProperty(config.chave)) {
      return alteracoes[config.chave];
    }
    return config.valor;
  };

  const getValorConvertido = (config) => {
    const valor = getValorAtual(config);
    if (config.tipo === 'booleano') {
      return valor === 'true' || valor === true;
    }
    return valor;
  };

  const salvarConfiguracoes = async () => {
    if (Object.keys(alteracoes).length === 0) {
      setToast({ isOpen: true, message: 'Nenhuma alteração para salvar', tipo: 'aviso' });
      return;
    }

    setLoading(true);
    try {
      let erros = 0;
      let sucesso = 0;

      for (const [chave, valor] of Object.entries(alteracoes)) {
        const config = configs.find(c => c.chave === chave);
        const response = await fetch(API_URL + '/api/configurations', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            chave,
            valor: valor.toString(),
            tipo: config.tipo,
            descricao: config.descricao
          })
        });

        if (response.ok) {
          sucesso++;
        } else {
          erros++;
        }
      }

      if (erros === 0) {
        setToast({ isOpen: true, message: `${sucesso} configuração(ões) salva(s) com sucesso!`, tipo: 'sucesso' });
        setAlteracoes({});
        carregarConfiguracoes();
      } else {
        setToast({ isOpen: true, message: `${sucesso} salvas, ${erros} com erro`, tipo: 'aviso' });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setToast({ isOpen: true, message: 'Erro ao salvar configurações', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  const descartarAlteracoes = () => {
    setAlteracoes({});
    setToast({ isOpen: true, message: 'Alterações descartadas', tipo: 'sucesso' });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setToast({ isOpen: true, message: 'Por favor, selecione uma imagem válida', tipo: 'erro' });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ isOpen: true, message: 'A imagem deve ter no máximo 5MB', tipo: 'erro' });
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload para o servidor
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(API_URL + '/api/configurations/logo/upload', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          // Não incluir Content-Type, deixar o browser definir com boundary
        },
        body: formData
      });

      // Remover Content-Type do headers para FormData
      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const responseWithCorrectHeaders = await fetch(API_URL + '/api/configurations/logo/upload', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (responseWithCorrectHeaders.ok) {
        const data = await responseWithCorrectHeaders.json();
        setLogoUrl(data.data.logoUrl);
        setToast({ isOpen: true, message: 'Logo atualizado com sucesso!', tipo: 'sucesso' });
        carregarConfiguracoes();
      } else {
        const error = await responseWithCorrectHeaders.json();
        setToast({ isOpen: true, message: error.message || 'Erro ao fazer upload do logo', tipo: 'erro' });
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setToast({ isOpen: true, message: 'Erro ao fazer upload do logo', tipo: 'erro' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Deseja realmente remover o logo da loja?')) return;

    setUploadingLogo(true);
    try {
      const response = await fetch(API_URL + '/api/configurations/logo/delete', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setLogoUrl('');
        setLogoPreview(null);
        setToast({ isOpen: true, message: 'Logo removido com sucesso!', tipo: 'sucesso' });
        carregarConfiguracoes();
      } else {
        const error = await response.json();
        setToast({ isOpen: true, message: error.message || 'Erro ao remover logo', tipo: 'erro' });
      }
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      setToast({ isOpen: true, message: 'Erro ao remover logo', tipo: 'erro' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveNomeLoja = async () => {
    if (!nomeLoja.trim()) {
      setToast({ isOpen: true, message: 'Digite um nome para a loja', tipo: 'aviso' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL + '/api/configurations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          chave: 'nome_loja',
          valor: nomeLoja,
          tipo: 'texto',
          descricao: 'Nome da loja exibido no menu sidebar'
        })
      });

      if (response.ok) {
        setToast({ isOpen: true, message: 'Nome da loja atualizado com sucesso!', tipo: 'sucesso' });
        carregarConfiguracoes();
      } else {
        const error = await response.json();
        setToast({ isOpen: true, message: error.message || 'Erro ao atualizar nome da loja', tipo: 'erro' });
      }
    } catch (error) {
      console.error('Erro ao salvar nome da loja:', error);
      setToast({ isOpen: true, message: 'Erro ao salvar nome da loja', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  const getConfigIcone = (chave) => {
    switch(chave) {
      case 'exigir_caixa_aberto':
        return '🏪';
      case 'permitir_venda_estoque_zero':
        return '📦';
      case 'limite_desconto_pdv':
        return '💰';
      case 'logo_url':
        return '🖼️';
      case 'nome_loja':
        return '🏬';
      default:
        return '⚙️';
    }
  };

  const getConfigNome = (chave) => {
    const nomes = {
      'exigir_caixa_aberto': 'Exigir Caixa Aberto',
      'permitir_venda_estoque_zero': 'Venda com Estoque Zero',
      'limite_desconto_pdv': 'Limite de Desconto PDV',
      'logo_url': 'URL da Logo',
      'nome_loja': 'Nome da Loja'
    };
    return nomes[chave] || chave;
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <div className="main-content content-with-hamburger">
        {/* Toast */}
        {toast.isOpen && (
          <Toast
            isOpen={toast.isOpen}
            mensagem={toast.message}
            tipo={toast.tipo}
            onClose={() => setToast({ ...toast, isOpen: false })}
          />
        )}

        {/* Header com gradiente */}
        <header className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg mobile-header-spacing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                    <FaCog className="text-2xl sm:text-3xl" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Configurações do Sistema</h1>
                    <p className="text-blue-100 mt-1 text-sm sm:text-base">Personalize e ajuste o comportamento da aplicação</p>
                  </div>
                </div>
              </div>

              {Object.keys(alteracoes).length > 0 && abaAtiva === 'configuracoes' && (
                <div className="flex gap-3">
                  <button
                    onClick={descartarAlteracoes}
                    className="px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 flex items-center gap-2 font-semibold transition-all"
                    disabled={loading}
                  >
                    <FaUndo /> Descartar
                  </button>
                  <button
                    onClick={salvarConfiguracoes}
                    className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-semibold disabled:bg-gray-300 disabled:text-gray-500 transition-all shadow-lg"
                    disabled={loading}
                  >
                    <FaSave /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              )}
            </div>

            {/* Badge de alterações pendentes */}
            {Object.keys(alteracoes).length > 0 && abaAtiva === 'configuracoes' && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-semibold shadow-lg animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                {Object.keys(alteracoes).length} alteração(ões) pendente(s)
              </div>
            )}

            {/* Abas de navegação */}
            <div className="mt-6 flex gap-2 border-b border-white/20">
              <button
                onClick={() => setAbaAtiva('configuracoes')}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                  abaAtiva === 'configuracoes'
                    ? 'bg-white text-blue-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-icons-outlined text-lg">settings</span>
                  Configurações
                </span>
              </button>
              <button
                onClick={() => setAbaAtiva('planos')}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                  abaAtiva === 'planos'
                    ? 'bg-white text-blue-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-icons-outlined text-lg">workspace_premium</span>
                  Planos
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {abaAtiva === 'configuracoes' && (
            <>
              {/* Informações */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 text-white rounded-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-3">Informações sobre as Configurações</h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>As configurações são aplicadas <strong>imediatamente após salvar</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Exigir Caixa Aberto:</strong> Bloqueia vendas no PDV se não houver caixa aberto</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Venda com Estoque Zero:</strong> Permite vender produtos mesmo sem estoque disponível</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Limite de Desconto PDV:</strong> Percentual máximo de desconto permitido nas vendas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Logo da Loja:</strong> Faça upload ou cole a URL de uma imagem para personalizar o menu</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Nome da Loja:</strong> Nome exibido ao lado da logo no menu lateral</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Seção de Identidade Visual */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FaStore className="text-blue-600" />
                  Identidade Visual da Loja
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card do Nome da Loja */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">🏬</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Nome da Loja</h3>
                        <p className="text-sm text-gray-600">Nome exibido no menu lateral</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={nomeLoja}
                        onChange={(e) => setNomeLoja(e.target.value)}
                        placeholder="Digite o nome da loja"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                        maxLength={50}
                      />
                      <button
                        onClick={handleSaveNomeLoja}
                        disabled={loading || !nomeLoja.trim()}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2 font-semibold transition-all shadow-md"
                      >
                        <FaSave /> {loading ? 'Salvando...' : 'Salvar Nome'}
                      </button>
                    </div>
                  </div>

                  {/* Card do Logo */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">🖼️</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Logo da Loja</h3>
                        <p className="text-sm text-gray-600">Imagem exibida no menu lateral</p>
                      </div>
                    </div>

                    {/* Preview do Logo */}
                    <div className="mb-4">
                      {(logoPreview || logoUrl) ? (
                        <div className="relative">
                          <img
                            src={logoPreview || (API_URL + logoUrl)}
                            alt="Logo da loja"
                            className="w-full h-48 object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
                          />
                          <button
                            onClick={handleDeleteLogo}
                            disabled={uploadingLogo}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md"
                            title="Remover logo"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-400">
                            <FaUpload className="mx-auto text-4xl mb-2" />
                            <p className="text-sm">Nenhum logo cadastrado</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botão de Upload */}
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2 font-semibold transition-all shadow-md cursor-pointer">
                        <FaUpload /> {uploadingLogo ? 'Fazendo upload...' : 'Fazer Upload do Logo'}
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Formatos aceitos: JPG, PNG, GIF, WebP (máx. 5MB)
                    </p>
                  </div>

                  {/* Card do Link do Catálogo */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md border-2 border-purple-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">🔗</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Link do Catálogo Público</h3>
                        <p className="text-sm text-gray-600">Compartilhe este link nas suas redes sociais</p>
                      </div>
                    </div>

                    {catalogoCarregado ? (
                      <div className="space-y-3">
                        {/* URL do Catálogo */}
                        <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
                          <p className="text-xs text-gray-600 mb-2 font-semibold">Seu link exclusivo:</p>
                          <p className="text-sm font-mono text-purple-700 break-all">
                            {catalogoLink.url}
                          </p>
                        </div>

                        {/* Botão de Copiar */}
                        <button
                          onClick={copiarLink}
                          className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                            copiado
                              ? 'bg-green-500 text-white'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                          }`}
                        >
                          {copiado ? (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Link Copiado!
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copiar Link
                            </>
                          )}
                        </button>

                        {/* Dica */}
                        <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
                          <p className="text-xs text-purple-800">
                            <span className="font-semibold">💡 Dica:</span> Compartilhe este link no Instagram, Facebook, WhatsApp ou onde seus clientes estão!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">Carregando link do catálogo...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Configurações em Cards */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FaCog className="text-blue-600" />
                Configurações do Sistema
              </h2>

              {/* Configurações em Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {configs.filter(config => config.chave !== 'nome_loja' && config.chave !== 'logo_url').map(config => (
              <div
                key={config.chave}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  alteracoes.hasOwnProperty(config.chave) 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : 'border border-gray-200'
                }`}
              >
                {/* Header do Card */}
                <div className={`p-6 ${
                  alteracoes.hasOwnProperty(config.chave)
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl bg-white p-3 rounded-lg shadow-sm">
                        {getConfigIcone(config.chave)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {getConfigNome(config.chave)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{config.descricao}</p>
                      </div>
                    </div>
                    {alteracoes.hasOwnProperty(config.chave) && (
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold shadow-sm">
                        Modificado
                      </span>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-6">
                  {/* Input baseado no tipo */}
                  {config.tipo === 'booleano' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange(config.chave, 'true')}
                        className={`flex-1 px-6 py-4 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-all ${
                          getValorConvertido(config) === true
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        <FaCheckCircle className="text-xl" /> Ativado
                      </button>
                      <button
                        onClick={() => handleChange(config.chave, 'false')}
                        className={`flex-1 px-6 py-4 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-all ${
                          getValorConvertido(config) === false
                            ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        <FaTimesCircle className="text-xl" /> Desativado
                      </button>
                    </div>
                  )}

                  {config.tipo === 'numero' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Valor (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={getValorAtual(config)}
                          onChange={(e) => handleChange(config.chave, e.target.value)}
                          className="w-full px-5 py-4 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                          %
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${Math.min(getValorAtual(config) || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">
                          {getValorAtual(config) || 0}%
                        </span>
                      </div>
                    </div>
                  )}

                  {config.tipo === 'texto' && (
                    <div>
                      {config.chave === 'logo_url' ? (
                        <div className="space-y-4">
                          {/* Preview da logo */}
                          {getValorAtual(config) && (
                            <div className="flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                              <img 
                                src={getValorAtual(config)} 
                                alt="Preview da logo"
                                className="max-h-24 max-w-full object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="text-gray-400 text-sm items-center gap-2 hidden">
                                <span className="text-2xl">⚠️</span>
                                <span>Erro ao carregar imagem</span>
                              </div>
                            </div>
                          )}
                          {/* Upload de arquivo */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Fazer upload de imagem (gera URL temporária)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  // Gera uma URL temporária local para preview
                                  const url = URL.createObjectURL(file);
                                  handleChange(config.chave, url);
                                  // Aqui você pode implementar o upload para um serviço externo e salvar a URL retornada
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">Ou cole a URL abaixo</p>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg mt-2"
                              placeholder="Cole a URL da logo aqui"
                              value={getValorAtual(config) || ''}
                              onChange={e => handleChange(config.chave, e.target.value)}
                            />
                          </div>
                        </div>
                      ) : config.chave === 'nome_loja' ? (
                        <input
                          type="text"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                          placeholder="Digite o nome da loja"
                          value={getValorAtual(config) || ''}
                          onChange={e => handleChange(config.chave, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                          value={getValorAtual(config) || ''}
                          onChange={e => handleChange(config.chave, e.target.value)}
                        />
                      )}
                      {config.chave === 'logo_url' && (
                        <p className="text-xs text-gray-500 mt-2">
                          🔗 Cole a URL de uma imagem hospedada
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {configs.length === 0 && (
              <div className="col-span-2 text-center py-20">
                <div className="bg-white rounded-2xl shadow-lg p-12 inline-block">
                  <FaCog className="mx-auto text-7xl mb-4 text-gray-300" />
                  <p className="text-xl font-semibold text-gray-600">Nenhuma configuração disponível</p>
                  <p className="text-sm text-gray-400 mt-2">As configurações aparecerão aqui quando disponíveis</p>
                </div>
              </div>
            )}
          </div>
            </>
          )}

          {abaAtiva === 'planos' && (
            <PlanosDisponiveis />
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
