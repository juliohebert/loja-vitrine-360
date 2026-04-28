import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  X, 
  Plus,
  Save,
  ArrowLeft,
  Trash2,
  Upload
} from 'lucide-react';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import ModalSucesso from './ModalSucesso';
import ModalErro from './ModalErro';
import API_URL from '../config/apiUrl';

/**
 * Componente de Cadastro de Produto - Redesenhado
 * Fluxo simplificado e progressivo:
 * 1. Informações essenciais (nome e preço)
 * 2. Detalhes expandíveis (categoria, SKU, custos)
 * 3. Controle de estoque
 * 4. Imagem do produto
 * 5. Variações (opcional)
 */

export default function CriarProdutoNovo() {
  const navigate = useNavigate();
  const { id: produtoId } = useParams();
  const modoEdicao = !!produtoId;

  // Estados principais
  const [formData, setFormData] = useState({
    nome: '',
    precoVenda: '',
    categoria: 'Geral',
    subcategoria: '',
    marca: '',
    descricao: '',
    precoCusto: '',
    sku: '',
    codigoBarras: '',
    unidade: 'un',
    exibir_catalogo: false
  });

  // Opções dinâmicas
  const [categorias, setCategorias] = useState(['Geral']);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);

  // Quick Add inline
  const [quickAdd, setQuickAdd] = useState({ tipo: null, valor: '', salvando: false, erro: '' });

  // Controle de estoque
  const [controleEstoque, setControleEstoque] = useState({
    ativo: true,
    quantidade: 0,
    estoqueMinimo: 0
  });

  // Variações
  const [variacoes, setVariacoes] = useState([]);
  const [novaVariacao, setNovaVariacao] = useState({
    tamanho: '',
    cor: '',
    estoque: 0,
    precoVariacao: ''
  });

  // Imagens
  const [imagens, setImagens] = useState([]);

  // Estados de UI
  const [mostrarVariacoes, setMostrarVariacoes] = useState(false);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });

  // Verificar autenticação e carregar opções
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    carregarOpcoes();

    if (modoEdicao && produtoId) {
      carregarProduto(produtoId);
    }
  }, [navigate, modoEdicao, produtoId]);

  // Carregar opções dinâmicas do backend
  const carregarOpcoes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/options`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categories || ['Geral']);
        setSubcategorias(data.subcategories || []);
        setMarcas(data.brands || []);
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  // Adicionar nova opção (categoria, subcategoria ou marca)
  const handleQuickAddSalvar = async () => {
    if (!quickAdd.valor.trim()) return;
    setQuickAdd(prev => ({ ...prev, salvando: true, erro: '' }));
    try {
      const response = await fetch(`${API_URL}/api/products/options/${quickAdd.tipo}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ value: quickAdd.valor.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setQuickAdd(prev => ({ ...prev, salvando: false, erro: data.error || 'Erro ao salvar' }));
        return;
      }
      // Atualizar lista local e selecionar novo item
      if (quickAdd.tipo === 'categories') {
        setCategorias(data.list);
        setFormData(prev => ({ ...prev, categoria: quickAdd.valor.trim() }));
      } else if (quickAdd.tipo === 'subcategories') {
        setSubcategorias(data.list);
        setFormData(prev => ({ ...prev, subcategoria: quickAdd.valor.trim() }));
      } else if (quickAdd.tipo === 'brands') {
        setMarcas(data.list);
        setFormData(prev => ({ ...prev, marca: quickAdd.valor.trim() }));
      }
      setQuickAdd({ tipo: null, valor: '', salvando: false, erro: '' });
    } catch (error) {
      setQuickAdd(prev => ({ ...prev, salvando: false, erro: 'Erro de conexão' }));
    }
  };

  // Carregar produto em modo edição
  const carregarProduto = async (id) => {
    try {
      setCarregando(true);
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Erro ao carregar produto');

      const data = await response.json();
      const produto = data.data;

      // Parsear categoria que pode ter ' > subcategoria'
      const catParts = (produto.categoria || 'Geral').split(' > ');

      setFormData({
        nome: produto.nome || '',
        precoVenda: formatarValor(produto.precoVenda),
        categoria: catParts[0] || 'Geral',
        subcategoria: catParts[1] || '',
        marca: produto.marca || '',
        descricao: produto.descricao || '',
        precoCusto: formatarValor(produto.precoCusto),
        sku: produto.sku || '',
        codigoBarras: produto.codigoBarras || '',
        unidade: produto.unidade || 'un',
        exibir_catalogo: produto.exibir_catalogo || false
      });

      if (produto.variacoes && Array.isArray(produto.variacoes)) {
        setVariacoes(produto.variacoes.map((v, index) => ({
          id: index + 1,
          tamanho: v.tamanho || '',
          cor: v.cor || '',
          estoque: v.estoque?.quantidade || 0,
          precoVariacao: v.precoVariacao ? formatarValor(v.precoVariacao) : ''
        })));
      }

      if (produto.imagens) {
        setImagens(produto.imagens);
      }

      setCarregando(false);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      setModalErro({
        isOpen: true,
        mensagem: 'Erro ao carregar dados do produto'
      });
      setCarregando(false);
    }
  };

  // Formatar valores monetários
  const formatarValor = (valor) => {
    if (!valor) return '';
    const numero = parseFloat(valor);
    return numero.toFixed(2).replace('.', ',');
  };

  // Converter valor formatado para número
  const converterParaNumero = (valor) => {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'));
  };

  // Handler para mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpar erro do campo
    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handler para campos monetários
  const handleMoneyChange = (name, value) => {
    // Remover tudo exceto dígitos e vírgula
    let valorLimpo = value.replace(/[^\d,]/g, '');
    
    // Garantir apenas uma vírgula
    const partes = valorLimpo.split(',');
    if (partes.length > 2) {
      valorLimpo = partes[0] + ',' + partes.slice(1).join('');
    }

    // Limitar casas decimais a 2
    if (partes[1] && partes[1].length > 2) {
      valorLimpo = partes[0] + ',' + partes[1].substring(0, 2);
    }

    setFormData(prev => ({
      ...prev,
      [name]: valorLimpo
    }));

    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Calcular margem de lucro
  const calcularMargem = () => {
    const custo = converterParaNumero(formData.precoCusto);
    const venda = converterParaNumero(formData.precoVenda);
    
    if (custo === 0) return '0';
    const margem = ((venda - custo) / custo) * 100;
    return margem.toFixed(1);
  };

  // Calcular lucro por peça
  const calcularLucro = () => {
    const custo = converterParaNumero(formData.precoCusto);
    const venda = converterParaNumero(formData.precoVenda);
    return (venda - custo).toFixed(2).replace('.', ',');
  };

  // Upload de imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setModalErro({
        isOpen: true,
        mensagem: 'Por favor, selecione apenas arquivos de imagem'
      });
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setModalErro({
        isOpen: true,
        mensagem: 'A imagem deve ter no máximo 5MB'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagens(prev => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Remover imagem
  const removerImagem = (index) => {
    setImagens(prev => prev.filter((_, i) => i !== index));
  };

  // Adicionar variação
  const adicionarVariacao = () => {
    if (!novaVariacao.tamanho || !novaVariacao.cor) {
      setErros(prev => ({ ...prev, variacao: 'Preencha tamanho e cor' }));
      return;
    }

    const nova = {
      id: Date.now(),
      ...novaVariacao
    };

    setVariacoes(prev => [...prev, nova]);
    setNovaVariacao({ tamanho: '', cor: '', estoque: 0, precoVariacao: '' });
    setErros(prev => ({ ...prev, variacao: '' }));
  };

  // Remover variação
  const removerVariacao = (id) => {
    setVariacoes(prev => prev.filter(v => v.id !== id));
  };

  // Validar formulário
  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome do produto é obrigatório';
    }

    if (!formData.precoVenda) {
      novosErros.precoVenda = 'Preço de venda é obrigatório';
    } else if (converterParaNumero(formData.precoVenda) <= 0) {
      novosErros.precoVenda = 'Preço deve ser maior que zero';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Salvar produto
  const handleSalvar = async () => {
    if (!validarFormulario()) {
      // Scroll para o primeiro erro
      const primeiroErro = Object.keys(erros)[0];
      const elemento = document.querySelector(`[name="${primeiroErro}"]`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elemento.focus();
      }
      return;
    }

    try {
      setCarregando(true);

      // Se não há variações, criar uma padrão
      const variacoesParaEnviar = variacoes.length > 0 
        ? variacoes.map(v => ({
            tamanho: v.tamanho,
            cor: v.cor,
            quantidade: parseInt(v.estoque) || 0,
            precoVariacao: v.precoVariacao ? converterParaNumero(v.precoVariacao) : null
          }))
        : [{
            tamanho: 'Único',
            cor: 'Padrão',
            quantidade: controleEstoque.quantidade || 0
          }];

      const produtoData = {
        nome: formData.nome?.trim(),
        marca: formData.marca?.trim() || 'Sem marca',
        precoVenda: converterParaNumero(formData.precoVenda),
        precoCusto: converterParaNumero(formData.precoCusto) || 0,
        categoria: formData.subcategoria
          ? `${formData.categoria} > ${formData.subcategoria}`
          : formData.categoria,
        descricao: formData.descricao,
        sku: formData.sku,
        codigoBarras: formData.codigoBarras,
        unidade: formData.unidade,
        exibir_catalogo: formData.exibir_catalogo,
        controleEstoque: controleEstoque.ativo,
        quantidade: controleEstoque.quantidade,
        estoqueMinimo: controleEstoque.estoqueMinimo,
        imagens: imagens,
        variacoes: variacoesParaEnviar
      };

      console.log('📦 Dados sendo enviados:', produtoData);
      console.log('🔍 exibir_catalogo:', formData.exibir_catalogo, '(tipo:', typeof formData.exibir_catalogo, ')');
      console.log('✅ Validação:', {
        nome: !!produtoData.nome,
        precoVenda: produtoData.precoVenda > 0
      });

      const url = modoEdicao 
        ? `${API_URL}/api/products/${produtoId}`
        : `${API_URL}/api/products`;
      
      const method = modoEdicao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(produtoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar produto');
      }

      setModalSucesso({
        isOpen: true,
        mensagem: modoEdicao 
          ? 'Produto atualizado com sucesso!' 
          : 'Produto cadastrado com sucesso!',
        acoes: !modoEdicao // Só mostra ações ao criar novo produto
      });

      setCarregando(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setModalErro({
        isOpen: true,
        mensagem: error.message || 'Erro ao salvar produto'
      });
      setCarregando(false);
    }
  };

  return (
    <>
      {/* Modais */}
      <ModalSucesso 
        isOpen={modalSucesso.isOpen}
        onClose={() => {
          setModalSucesso({ isOpen: false, mensagem: '', acoes: false });
          navigate('/dashboard');
        }}
        mensagem={modalSucesso.mensagem}
        acoes={modalSucesso.acoes ? [
          {
            label: 'Cadastrar Novo Produto',
            onClick: () => {
              setModalSucesso({ isOpen: false, mensagem: '', acoes: false });
              // Limpar formulário
              setFormData({
                nome: '',
                precoVenda: '',
                categoria: 'Geral',
                subcategoria: '',
                marca: '',
                descricao: '',
                precoCusto: '',
                sku: '',
                codigoBarras: '',
                unidade: 'un',
                exibir_catalogo: false
              });
              setImagens([]);
              setVariacoes([]);
              setControleEstoque({ ativo: true, quantidade: 0, estoqueMinimo: 0 });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            primary: false
          },
          {
            label: 'Ver Produtos',
            onClick: () => {
              setModalSucesso({ isOpen: false, mensagem: '', acoes: false });
              navigate('/estoque');
            },
            primary: true
          }
        ] : undefined}
      />
      <ModalErro
        isOpen={modalErro.isOpen}
        onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
        mensagem={modalErro.mensagem}
      />

      {/* Layout principal */}
      <div className="layout-with-sidebar">
        {/* Sidebar */}
        <Sidebar />

        {/* Conteúdo Principal */}
        <div className="main-content">
        {/* Header fixo */}
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-700 pl-16 pr-6 lg:px-6 h-16 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-gray-900 dark:text-white text-2xl font-bold">
              {modoEdicao ? 'Editar Produto' : 'Novo Produto'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={carregando}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Produto
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Content com scroll */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Container Principal - Grid 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              
              {/* Coluna Esquerda - Formulário */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-5">
                  
                  {/* Linha 1: Código + Código Extra */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Código (SKU)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="Gerado automaticamente"
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Código de Barras (EAN/GTIN)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="codigoBarras"
                        value={formData.codigoBarras}
                        onChange={handleInputChange}
                        placeholder="Ex: 7891234567890"
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Linha 2: Nome */}
                  <div>
                    <label className="block mb-2">
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                        Nome do Produto <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Ex: Camiseta Polo Masculina"
                      className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                        erros.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {erros.nome && (
                      <p className="text-red-500 text-xs mt-1">{erros.nome}</p>
                    )}
                  </div>

                  {/* Linha 3: Categoria + Subcategoria + Marca */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Categoria */}
                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Categoria
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="categoria"
                          value={formData.categoria}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setQuickAdd(prev => prev.tipo === 'categories' ? { tipo: null, valor: '', salvando: false, erro: '' } : { tipo: 'categories', valor: '', salvando: false, erro: '' })}
                          className="flex-shrink-0 w-9 h-[42px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-primary hover:bg-primary/5 transition-colors"
                          title="Adicionar categoria"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {quickAdd.tipo === 'categories' && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg space-y-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nova categoria..."
                            value={quickAdd.valor}
                            onChange={e => setQuickAdd(prev => ({ ...prev, valor: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleQuickAddSalvar(); if (e.key === 'Escape') setQuickAdd({ tipo: null, valor: '', salvando: false, erro: '' }); }}
                            className="w-full px-2.5 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          {quickAdd.erro && <p className="text-red-500 text-xs">{quickAdd.erro}</p>}
                          <div className="flex gap-2">
                            <button type="button" onClick={handleQuickAddSalvar} disabled={quickAdd.salvando || !quickAdd.valor.trim()} className="flex-1 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                              {quickAdd.salvando ? 'Salvando...' : 'Adicionar'}
                            </button>
                            <button type="button" onClick={() => setQuickAdd({ tipo: null, valor: '', salvando: false, erro: '' })} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subcategoria */}
                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Subcategoria
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="subcategoria"
                          value={formData.subcategoria}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">Nenhuma</option>
                          {subcategorias.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setQuickAdd(prev => prev.tipo === 'subcategories' ? { tipo: null, valor: '', salvando: false, erro: '' } : { tipo: 'subcategories', valor: '', salvando: false, erro: '' })}
                          className="flex-shrink-0 w-9 h-[42px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-primary hover:bg-primary/5 transition-colors"
                          title="Adicionar subcategoria"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {quickAdd.tipo === 'subcategories' && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg space-y-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nova subcategoria..."
                            value={quickAdd.valor}
                            onChange={e => setQuickAdd(prev => ({ ...prev, valor: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleQuickAddSalvar(); if (e.key === 'Escape') setQuickAdd({ tipo: null, valor: '', salvando: false, erro: '' }); }}
                            className="w-full px-2.5 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          {quickAdd.erro && <p className="text-red-500 text-xs">{quickAdd.erro}</p>}
                          <div className="flex gap-2">
                            <button type="button" onClick={handleQuickAddSalvar} disabled={quickAdd.salvando || !quickAdd.valor.trim()} className="flex-1 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                              {quickAdd.salvando ? 'Salvando...' : 'Adicionar'}
                            </button>
                            <button type="button" onClick={() => setQuickAdd({ tipo: null, valor: '', salvando: false, erro: '' })} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Marca */}
                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Marca
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="marca"
                          value={formData.marca}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">Nenhuma</option>
                          {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setQuickAdd(prev => prev.tipo === 'brands' ? { tipo: null, valor: '', salvando: false, erro: '' } : { tipo: 'brands', valor: '', salvando: false, erro: '' })}
                          className="flex-shrink-0 w-9 h-[42px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-primary hover:bg-primary/5 transition-colors"
                          title="Adicionar marca"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {quickAdd.tipo === 'brands' && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg space-y-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nova marca..."
                            value={quickAdd.valor}
                            onChange={e => setQuickAdd(prev => ({ ...prev, valor: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleQuickAddSalvar(); if (e.key === 'Escape') setQuickAdd({ tipo: null, valor: '', salvando: false, erro: '' }); }}
                            className="w-full px-2.5 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          {quickAdd.erro && <p className="text-red-500 text-xs">{quickAdd.erro}</p>}
                          <div className="flex gap-2">
                            <button type="button" onClick={handleQuickAddSalvar} disabled={quickAdd.salvando || !quickAdd.valor.trim()} className="flex-1 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                              {quickAdd.salvando ? 'Salvando...' : 'Adicionar'}
                            </button>
                            <button type="button" onClick={() => setQuickAdd({ tipo: null, valor: '', salvando: false, erro: '' })} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Linha 4: Preço de Venda + Preço de Custo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Preço de Venda <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm">
                          R$
                        </div>
                        <input
                          type="text"
                          name="precoVenda"
                          value={formData.precoVenda}
                          onChange={(e) => handleMoneyChange('precoVenda', e.target.value)}
                          placeholder="0,00"
                          className={`w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                            erros.precoVenda ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                      </div>
                      {erros.precoVenda && (
                        <p className="text-red-500 text-xs mt-1">{erros.precoVenda}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Preço de Custo
                        </span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm">
                          R$
                        </div>
                        <input
                          type="text"
                          name="precoCusto"
                          value={formData.precoCusto}
                          onChange={(e) => handleMoneyChange('precoCusto', e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Margem de Lucro (calculada) */}
                  {formData.precoCusto && formData.precoVenda && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Margem de Lucro</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {calcularMargem()}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Lucro por Peça</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            R$ {calcularLucro()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Linha 6: Toggle Controlar Estoque */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Controlar Estoque</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Monitore a quantidade disponível</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={controleEstoque.ativo}
                        onChange={(e) => setControleEstoque(prev => ({ ...prev, ativo: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Campos de Estoque + Unidade na mesma linha */}
                  {controleEstoque.ativo && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Estoque Atual */}
                      <div>
                        <label className="block mb-2">
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            Estoque Atual
                          </span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={controleEstoque.quantidade}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').replace(/^0+/, '') || '0';
                            setControleEstoque(prev => ({ ...prev, quantidade: parseInt(val) || 0 }));
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>

                      {/* Estoque Mínimo */}
                      <div>
                        <label className="block mb-2">
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            Estoque Mínimo (Alerta)
                          </span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={controleEstoque.estoqueMinimo}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').replace(/^0+/, '') || '0';
                            setControleEstoque(prev => ({ ...prev, estoqueMinimo: parseInt(val) || 0 }));
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>

                      {/* Unidade de Medida */}
                      <div>
                        <label className="block mb-2">
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            Unidade de Medida
                          </span>
                        </label>
                        <select
                          name="unidade"
                          value={formData.unidade}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="un">Unidade (un)</option>
                          <option value="kg">Quilograma (kg)</option>
                          <option value="g">Grama (g)</option>
                          <option value="l">Litro (l)</option>
                          <option value="ml">Mililitro (ml)</option>
                          <option value="m">Metro (m)</option>
                          <option value="cm">Centímetro (cm)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Unidade de Medida (quando estoque desativado) */}
                  {!controleEstoque.ativo && (
                    <div>
                      <label className="block mb-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                          Unidade de Medida
                        </span>
                      </label>
                      <select
                        name="unidade"
                        value={formData.unidade}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="un">Unidade (un)</option>
                        <option value="kg">Quilograma (kg)</option>
                        <option value="g">Grama (g)</option>
                        <option value="l">Litro (l)</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="m">Metro (m)</option>
                        <option value="cm">Centímetro (cm)</option>
                      </select>
                    </div>
                  )}

                  {/* Linha 8: Descrição */}
                  <div>
                    <label className="block mb-2">
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                        Descrição
                      </span>
                    </label>
                    <textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Descreva os detalhes do produto..."
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                    />
                  </div>

                  {/* Checkbox Exibir no Catálogo */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input
                      type="checkbox"
                      id="exibir_catalogo"
                      name="exibir_catalogo"
                      checked={formData.exibir_catalogo}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="exibir_catalogo" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                      Exibir este produto no catálogo público
                    </label>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

                  {/* Seção de Variações */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Variações do Produto
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Tamanhos, cores e estoques diferentes
                        </p>
                      </div>
                      <button
                        onClick={() => setMostrarVariacoes(!mostrarVariacoes)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        {mostrarVariacoes ? 'Ocultar' : 'Adicionar Variações'}
                      </button>
                    </div>

                    {mostrarVariacoes && (
                      <div className="space-y-3">
                        {/* Formulário Nova Variação */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              placeholder="Tamanho"
                              value={novaVariacao.tamanho}
                              onChange={(e) => setNovaVariacao(prev => ({ ...prev, tamanho: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Cor"
                              value={novaVariacao.cor}
                              onChange={(e) => setNovaVariacao(prev => ({ ...prev, cor: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="Estoque"
                              value={novaVariacao.estoque}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').replace(/^0+/, '') || '0';
                                setNovaVariacao(prev => ({ ...prev, estoque: parseInt(val) || 0 }));
                              }}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={adicionarVariacao}
                              className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar
                            </button>
                          </div>
                          {erros.variacao && (
                            <p className="text-red-500 text-xs">{erros.variacao}</p>
                          )}
                        </div>

                        {/* Lista de Variações */}
                        {variacoes.length > 0 && (
                          <div className="space-y-2">
                            {variacoes.map((variacao) => (
                              <div
                                key={variacao.id}
                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {variacao.tamanho} - {variacao.cor}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Estoque: {variacao.estoque} unidades
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removerVariacao(variacao.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Coluna Direita - Imagem */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    Imagem do Produto
                  </h3>

                  {/* Upload Area */}
                  {imagens.length === 0 ? (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Clique para adicionar
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          PNG, JPG até 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      {/* Preview Principal */}
                      <div className="relative group">
                        <img
                          src={imagens[0]}
                          alt="Imagem do produto"
                          className="w-full h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          onClick={() => removerImagem(0)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Adicionar mais imagens */}
                      {imagens.length < 4 && (
                        <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Adicionar mais imagens
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Miniaturas */}
                      {imagens.length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                          {imagens.slice(1).map((img, index) => (
                            <div key={index + 1} className="relative group">
                              <img
                                src={img}
                                alt={`Imagem ${index + 2}`}
                                className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                              <button
                                onClick={() => removerImagem(index + 1)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Botões de ação - rodapé */}
            <div className="flex items-center justify-end gap-3 pt-4 pb-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={carregando}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {carregando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Produto
                  </>
                )}
              </button>
            </div>
          </div>
          </div>
        </main>
      </div>
      </div>
    </>
  );
}
