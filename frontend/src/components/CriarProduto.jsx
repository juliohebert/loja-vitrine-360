import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import ModalSucesso from './ModalSucesso';
import ModalErro from './ModalErro';
import API_URL from '../config/apiUrl';

const CriarProduto = () => {
  const navigate = useNavigate();
  const { id: produtoId } = useParams();
  const modoEdicao = !!produtoId;
  
  // Estado do formulário principal
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    skuBase: '',
    precoCusto: '',
    precoVenda: '',
    marca: '',
    categoria: 'Camisetas',
    exibir_catalogo: false
  });

  // Estado para nova variação
  const [novaVariacao, setNovaVariacao] = useState({
    tamanho: '',
    cor: '',
    estoque: ''
  });

  // Lista de variações adicionadas
  const [variacoes, setVariacoes] = useState([]);

  // Imagens
  const [imagens, setImagens] = useState([]);

  const [proximoId, setProximoId] = useState(1);

  // Erros de validação
  const [erros, setErros] = useState({});

  // Estados dos modais
  const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Se está em modo edição, carregar dados do produto
    if (modoEdicao && produtoId) {
      carregarProduto(produtoId);
    }
  }, [navigate, modoEdicao, produtoId]);

  const carregarProduto = async (id) => {
    try {
      setCarregando(true);
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar produto');
      }

      const data = await response.json();
      const produto = data.data;

      console.log('📦 Produto carregado do backend:', produto);
      console.log('💰 Preço de custo original:', produto.precoCusto);
      console.log('💰 Preço de venda original:', produto.precoVenda);

      // Preencher formulário com dados do produto
      // Converter valores numéricos para formato brasileiro (R$)
      const precoCustoFormatado = produto.precoCusto 
        ? parseFloat(produto.precoCusto).toFixed(2).replace('.', ',')
        : '';
      const precoVendaFormatado = produto.precoVenda 
        ? parseFloat(produto.precoVenda).toFixed(2).replace('.', ',')
        : '';

      console.log('💵 Preço de custo formatado:', precoCustoFormatado);
      console.log('💵 Preço de venda formatado:', precoVendaFormatado);
      console.log('✅ Exibir no catálogo:', produto.exibir_catalogo);

      setFormData({
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        skuBase: produto.sku || '',
        precoCusto: precoCustoFormatado ? `R$ ${precoCustoFormatado}` : '',
        precoVenda: precoVendaFormatado ? `R$ ${precoVendaFormatado}` : '',
        marca: produto.marca || '',
        categoria: produto.categoria || 'Camisetas',
        exibir_catalogo: produto.exibir_catalogo === true || produto.exibir_catalogo === 'true'
      });

      // Preencher variações
      if (produto.variacoes && Array.isArray(produto.variacoes)) {
        const variacoesFormatadas = produto.variacoes.map((v, index) => ({
          id: index + 1,
          tamanho: v.tamanho || '',
          cor: v.cor || '',
          estoque: v.estoque?.quantidade || 0,
          limiteMinimo: v.estoque?.limiteMinimo || 10
        }));
        setVariacoes(variacoesFormatadas);
        setProximoId(variacoesFormatadas.length + 1);
      }

      // Preencher imagens
      if (produto.imagens && Array.isArray(produto.imagens)) {
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Validar campo individual
  const validarCampo = (name, value) => {
    const novosErros = { ...erros };

    switch(name) {
      case 'nome':
        if (!value.trim()) {
          novosErros.nome = 'Nome do produto é obrigatório';
        } else if (value.length < 3) {
          novosErros.nome = 'Nome deve ter no mínimo 3 caracteres';
        } else {
          delete novosErros.nome;
        }
        break;

      case 'precoCusto':
        const custoNum = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
        if (!value) {
          novosErros.precoCusto = 'Preço de custo é obrigatório';
        } else if (isNaN(custoNum) || custoNum <= 0) {
          novosErros.precoCusto = 'Preço de custo deve ser maior que zero';
        } else {
          delete novosErros.precoCusto;
        }
        break;

      case 'precoVenda':
        const vendaNum = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
        const custoAtual = parseFloat(formData.precoCusto.replace(/[^\d,]/g, '').replace(',', '.'));
        if (!value) {
          novosErros.precoVenda = 'Preço de venda é obrigatório';
        } else if (isNaN(vendaNum) || vendaNum <= 0) {
          novosErros.precoVenda = 'Preço de venda deve ser maior que zero';
        } else if (!isNaN(custoAtual) && vendaNum < custoAtual) {
          novosErros.precoVenda = 'Preço de venda não pode ser menor que o custo';
        } else {
          delete novosErros.precoVenda;
        }
        break;

      case 'marca':
        if (!value.trim()) {
          novosErros.marca = 'Marca é obrigatória';
        } else {
          delete novosErros.marca;
        }
        break;

      case 'categoria':
        if (!value) {
          novosErros.categoria = 'Categoria é obrigatória';
        } else {
          delete novosErros.categoria;
        }
        break;

      default:
        break;
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Validar todos os campos
  const validarFormulario = () => {
    const novosErros = {};

    // Nome
    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome do produto é obrigatório';
    } else if (formData.nome.length < 3) {
      novosErros.nome = 'Nome deve ter no mínimo 3 caracteres';
    }

    // Preço de custo
    const custoNum = parseFloat(formData.precoCusto.replace(/[^\d,]/g, '').replace(',', '.'));
    if (!formData.precoCusto) {
      novosErros.precoCusto = 'Preço de custo é obrigatório';
    } else if (isNaN(custoNum) || custoNum <= 0) {
      novosErros.precoCusto = 'Preço de custo deve ser maior que zero';
    }

    // Preço de venda
    const vendaNum = parseFloat(formData.precoVenda.replace(/[^\d,]/g, '').replace(',', '.'));
    if (!formData.precoVenda) {
      novosErros.precoVenda = 'Preço de venda é obrigatório';
    } else if (isNaN(vendaNum) || vendaNum <= 0) {
      novosErros.precoVenda = 'Preço de venda deve ser maior que zero';
    } else if (!isNaN(custoNum) && vendaNum < custoNum) {
      novosErros.precoVenda = 'Preço de venda não pode ser menor que o custo';
    }

    // Marca
    if (!formData.marca.trim()) {
      novosErros.marca = 'Marca é obrigatória';
    }

    // Categoria
    if (!formData.categoria) {
      novosErros.categoria = 'Categoria é obrigatória';
    }

    // Variações
    if (variacoes.length === 0) {
      novosErros.variacoes = 'Adicione pelo menos uma variação do produto';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Calcular margem de lucro
  const calcularMargem = () => {
    const custo = parseFloat(formData.precoCusto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const venda = parseFloat(formData.precoVenda.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    
    if (custo === 0) return '0';
    const margem = ((venda - custo) / custo) * 100;
    return margem.toFixed(1);
  };

  // Calcular lucro por peça em R$
  const calcularLucroPorPeca = () => {
    const custo = parseFloat(formData.precoCusto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const venda = parseFloat(formData.precoVenda.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    
    const lucro = venda - custo;
    return lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Adicionar variação
  const adicionarVariacao = () => {
    if (!novaVariacao.estoque || novaVariacao.estoque === '') {
      setErros({ ...erros, variacaoEstoque: 'Quantidade em estoque é obrigatória' });
      return;
    }

    const estoqueNum = parseInt(novaVariacao.estoque);
    if (isNaN(estoqueNum) || estoqueNum < 0) {
      setErros({ ...erros, variacaoEstoque: 'Quantidade deve ser um número válido' });
      return;
    }

    const nova = {
      id: proximoId,
      tamanho: novaVariacao.tamanho,
      cor: novaVariacao.cor,
      estoque: estoqueNum
    };

    setVariacoes([...variacoes, nova]);
    setProximoId(proximoId + 1);
    setNovaVariacao({ tamanho: 'P', cor: 'Azul', estoque: '' });
    
    // Limpar erro de variações
    const novosErros = { ...erros };
    delete novosErros.variacoes;
    delete novosErros.variacaoEstoque;
    setErros(novosErros);
  };

  // Remover variação
  const removerVariacao = (id) => {
    setVariacoes(variacoes.filter(v => v.id !== id));
  };

  // Atualizar estoque de variação
  const atualizarEstoque = (id, novoEstoque) => {
    setVariacoes(variacoes.map(v => 
      v.id === id ? { ...v, estoque: parseInt(novoEstoque) || 0 } : v
    ));
  };

  // Handlers do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validar campo após mudança (se já teve erro)
    if (erros[name]) {
      validarCampo(name, value);
    }
  };

  const handleNovaVariacaoChange = (e) => {
    const { name, value } = e.target;
    setNovaVariacao({ ...novaVariacao, [name]: value });
  };

  const handleSalvar = async () => {
    // Validar formulário
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
      const token = localStorage.getItem('token');
      
      // Se não há variações, criar uma padrão
      const variacoesParaEnviar = variacoes.length > 0 
        ? variacoes.map(v => ({
            tamanho: v.tamanho,
            cor: v.cor,
            quantidade: v.estoque,
            limiteMinimo: v.limiteMinimo || 10,
            sku: formData.skuBase ? `${formData.skuBase}-${v.tamanho}-${v.cor}` : undefined
          }))
        : [{
            tamanho: 'Único',
            cor: 'Padrão',
            quantidade: 0,
            limiteMinimo: 10
          }];
      
      // Preparar dados para envio
      const produtoData = {
        nome: formData.nome,
        descricao: formData.descricao,
        marca: formData.marca,
        categoria: formData.categoria,
        precoCusto: parseFloat(formData.precoCusto.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        precoVenda: parseFloat(formData.precoVenda.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        exibir_catalogo: formData.exibir_catalogo,
        imagens: imagens,
        variacoes: variacoesParaEnviar
      };

      const url = modoEdicao 
        ? `${API_URL}/api/products/${produtoId}`
        : API_URL + '/api/products';
      
      const method = modoEdicao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(produtoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${modoEdicao ? 'atualizar' : 'salvar'} produto`);
      }

      const data = await response.json();
      setModalSucesso({ 
        isOpen: true, 
        mensagem: modoEdicao 
          ? 'O produto foi atualizado com sucesso.'
          : 'O produto foi cadastrado e as informações foram salvas.' 
      });
    } catch (error) {
      console.error(`Erro ao ${modoEdicao ? 'atualizar' : 'salvar'} produto:`, error);
      setModalErro({ 
        isOpen: true, 
        mensagem: error.message || `Falha ao ${modoEdicao ? 'atualizar' : 'salvar'} o produto. Verifique os dados e tente novamente.` 
      });
    }
  };

  const handleSalvarEAdicionar = async () => {
    // Validar formulário
    if (!validarFormulario()) {
      const primeiroErro = Object.keys(erros)[0];
      const elemento = document.querySelector(`[name="${primeiroErro}"]`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elemento.focus();
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Preparar dados para envio
      const produtoData = {
        nome: formData.nome,
        descricao: formData.descricao,
        marca: formData.marca,
        categoria: formData.categoria,
        precoCusto: parseFloat(formData.precoCusto.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        precoVenda: parseFloat(formData.precoVenda.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        exibir_catalogo: formData.exibir_catalogo,
        imagens: imagens,
        variacoes: variacoes.map(v => ({
          tamanho: v.tamanho,
          cor: v.cor,
          quantidade: v.estoque,
          sku: formData.skuBase ? `${formData.skuBase}-${v.tamanho}-${v.cor}` : undefined
        }))
      };

      const response = await fetch(API_URL + '/api/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(produtoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar produto');
      }

      setModalSucesso({ 
        isOpen: true, 
        mensagem: 'O produto foi cadastrado com sucesso. Você pode adicionar outro produto.' 
      });
      
      // Limpar formulário para novo produto
      setFormData({
        nome: '',
        descricao: '',
        skuBase: '',
        precoCusto: '',
        precoVenda: '',
        marca: '',
        categoria: 'Camisetas',
        exibir_catalogo: false
      });
      setVariacoes([]);
      setImagens([]);
      setErros({});
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setModalErro({ 
        isOpen: true, 
        mensagem: error.message || 'Falha ao salvar o produto. Verifique os dados e tente novamente.' 
      });
    }
  };

  const handleCancelar = () => {
    navigate('/dashboard');
  };

  // Handler para upload de imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setModalErro({ 
          isOpen: true, 
          mensagem: 'Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)' 
        });
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setModalErro({ 
          isOpen: true, 
          mensagem: 'A imagem deve ter no máximo 5MB. Por favor, selecione uma imagem menor.' 
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagens([...imagens, reader.result]);
      };
      reader.readAsDataURL(file);
    }
    // Limpar input para permitir upload da mesma imagem novamente
    e.target.value = '';
  };

  // Remover imagem
  const removerImagem = (index) => {
    setImagens(imagens.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-screen bg-background-light">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-slate-200 px-6 h-16 bg-white">
          <h1 className="text-slate-900 text-3xl font-bold leading-tight">
            {modoEdicao ? 'Editar Produto' : 'Cadastro de Produto'}
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
            {/* Formulário */}
            <div className="bg-white rounded-xl shadow-sm p-6">

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - 2/3 */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Informações Principais */}
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Informações Principais</h2>
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Nome do Produto <span className="text-red-500">*</span>
                    </p>
                    <input 
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      onBlur={(e) => validarCampo('nome', e.target.value)}
                      className={`form-input rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                        erros.nome ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                      }`}
                      placeholder="Ex: Camisa Polo Slim Fit"
                    />
                    {erros.nome && (
                      <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
                    )}
                  </label>
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Descrição do Produto</p>
                    <textarea 
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white focus:border-primary min-h-20 placeholder:text-slate-400 p-3 text-sm font-normal leading-normal" 
                      placeholder="Descreva os detalhes do produto, como material, caimento, etc."
                    ></textarea>
                  </label>
                </div>
              </div>

              {/* Adicionar Variações */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Adicionar Variações</h2>
                
                {/* Marca e Categoria */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Marca <span className="text-red-500">*</span>
                    </p>
                    <input 
                      name="marca"
                      value={formData.marca}
                      onChange={handleInputChange}
                      onBlur={(e) => validarCampo('marca', e.target.value)}
                      className={`form-input rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                        erros.marca ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                      }`}
                      placeholder="Ex: Marca Famosa"
                    />
                    {erros.marca && (
                      <p className="text-red-500 text-sm mt-1">{erros.marca}</p>
                    )}
                  </label>
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Categoria <span className="text-red-500">*</span>
                    </p>
                    <select 
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      onBlur={(e) => validarCampo('categoria', e.target.value)}
                      className={`form-select rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                        erros.categoria ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                      }`}
                    >
                      <option>Camisetas</option>
                      <option>Calças</option>
                      <option>Bermudas</option>
                      <option>Shorts</option>
                      <option>Vestidos</option>
                      <option>Saias</option>
                      <option>Blusas</option>
                      <option>Jaquetas</option>
                      <option>Casacos</option>
                      <option>Moletons</option>
                      <option>Conjuntos</option>
                      <option>Macacões</option>
                      <option>Calçados</option>
                      <option>Acessórios</option>
                      <option>Underwear</option>
                    </select>
                    {erros.categoria && (
                      <p className="text-red-500 text-sm mt-1">{erros.categoria}</p>
                    )}
                  </label>
                </div>

                {/* Checkbox Exibir no Catálogo */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                  <input
                    type="checkbox"
                    id="exibir_catalogo"
                    checked={formData.exibir_catalogo}
                    onChange={(e) => setFormData(prev => ({ ...prev, exibir_catalogo: e.target.checked }))}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="exibir_catalogo" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                    Exibir este produto no catálogo público
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end p-4 bg-slate-50 rounded-lg border mb-6">
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Tamanho</p>
                    <input 
                      type="text"
                      list="tamanhos-sugestoes"
                      name="tamanho"
                      value={novaVariacao.tamanho}
                      onChange={handleNovaVariacaoChange}
                      placeholder="Digite ou escolha: P, M, G, 36, 38..."
                      className="form-input w-full rounded-lg h-10 px-3 border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400"
                    />
                    <datalist id="tamanhos-sugestoes">
                      <option value="PP" />
                      <option value="P" />
                      <option value="M" />
                      <option value="G" />
                      <option value="GG" />
                      <option value="XG" />
                      <option value="36" />
                      <option value="38" />
                      <option value="40" />
                      <option value="42" />
                      <option value="44" />
                      <option value="46" />
                      <option value="48" />
                      <option value="50" />
                      <option value="Único" />
                      <option value="2 anos" />
                      <option value="4 anos" />
                      <option value="6 anos" />
                      <option value="8 anos" />
                      <option value="10 anos" />
                      <option value="12 anos" />
                    </datalist>
                  </label>
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Cor</p>
                    <input 
                      type="text"
                      list="cores-sugestoes"
                      name="cor"
                      value={novaVariacao.cor}
                      onChange={handleNovaVariacaoChange}
                      placeholder="Digite ou escolha: Azul, Preto, Vermelho..."
                      className="form-input w-full rounded-lg h-10 px-3 border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400"
                    />
                    <datalist id="cores-sugestoes">
                      <option value="Azul" />
                      <option value="Branco" />
                      <option value="Preto" />
                      <option value="Vermelho" />
                      <option value="Verde" />
                      <option value="Amarelo" />
                      <option value="Rosa" />
                      <option value="Cinza" />
                      <option value="Marrom" />
                      <option value="Laranja" />
                      <option value="Roxo" />
                      <option value="Bege" />
                    </datalist>
                  </label>
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Estoque <span className="text-red-500">*</span>
                    </p>
                    <input 
                      name="estoque"
                      value={novaVariacao.estoque}
                      onChange={handleNovaVariacaoChange}
                      className={`form-input w-full rounded-lg h-10 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                        erros.variacaoEstoque ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                      }`}
                      placeholder="0" 
                      type="number"
                    />
                  </label>
                  <button 
                    onClick={adicionarVariacao}
                    className="flex w-full md:w-auto min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700"
                  >
                    <span className="truncate">Adicionar</span>
                  </button>
                </div>
                {erros.variacaoEstoque && (
                  <p className="text-red-500 text-sm mt-2">{erros.variacaoEstoque}</p>
                )}
                {erros.variacoes && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-red-600 text-sm font-medium">{erros.variacoes}</p>
                  </div>
                )}

                {/* Tabela de Variações */}
                <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Variações Adicionadas</h3>
                
                {/* Desktop: Tabela */}
                <div className="hidden md:block overflow-x-auto border rounded-lg scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 max-w-full">
                  <table className="min-w-[480px] w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-3" scope="col">Tamanho</th>
                        <th className="px-4 py-3" scope="col">Cor</th>
                        <th className="px-4 py-3" scope="col">Estoque</th>
                        <th className="px-4 py-3 text-right" scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variacoes.length === 0 ? (
                        <tr className="bg-white border-b">
                          <td colSpan="4" className="px-6 py-4 text-center text-slate-500">
                            Nenhuma variação adicionada
                          </td>
                        </tr>
                      ) : (
                        variacoes.map((variacao, index) => (
                          <tr key={variacao.id} className={`bg-white ${index < variacoes.length - 1 ? 'border-b' : ''}`}>
                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{variacao.tamanho}</td>
                            <td className="px-4 py-3">{variacao.cor}</td>
                            <td className="px-4 py-3">
                              <input 
                                className="form-input w-16 h-8 rounded-md bg-slate-50 border-slate-300 text-center text-xs" 
                                type="number" 
                                value={variacao.estoque}
                                onChange={(e) => atualizarEstoque(variacao.id, e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => removerVariacao(variacao.id)}
                                className="p-1 text-slate-500 hover:text-red-500"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Cards */}
                <div className="md:hidden space-y-3">
                  {variacoes.length === 0 ? (
                    <div className="bg-white border rounded-lg p-6 text-center text-slate-500">
                      Nenhuma variação adicionada
                    </div>
                  ) : (
                    variacoes.map((variacao) => (
                      <div key={variacao.id} className="bg-white border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <span className="text-xs font-medium text-slate-500 uppercase">Tamanho:</span>
                              <span className="text-sm font-semibold text-slate-900">{variacao.tamanho}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-xs font-medium text-slate-500 uppercase">Cor:</span>
                              <span className="text-sm text-slate-700">{variacao.cor}</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-medium text-slate-500 uppercase">Estoque:</span>
                              <input 
                                className="form-input w-20 h-8 rounded-md bg-slate-50 border-slate-300 text-center text-xs" 
                                type="number" 
                                value={variacao.estoque}
                                onChange={(e) => atualizarEstoque(variacao.id, e.target.value)}
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => removerVariacao(variacao.id)}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita - 1/3 */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Mídia */}
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Mídia</h2>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100" htmlFor="dropzone-file">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 text-slate-500 mb-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                      </svg>
                      <p className="mb-2 text-sm text-slate-500">
                        <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG ou GIF (MAX. 800x400px)</p>
                    </div>
                    <input 
                      className="hidden" 
                      id="dropzone-file" 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {imagens.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        className="rounded-md aspect-square object-cover w-full" 
                        src={img}
                        alt={`Produto ${index + 1}`}
                      />
                      <button
                        onClick={() => removerImagem(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  {imagens.length < 6 && (
                    <label htmlFor="dropzone-file-add" className="flex items-center justify-center bg-slate-100 rounded-md aspect-square cursor-pointer hover:bg-slate-200">
                      <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      <input 
                        className="hidden" 
                        id="dropzone-file-add" 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Preços e Estoque */}
              <div className="pt-6 border-t border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Preços e Estoque</h2>
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Código de Barras/SKU Base
                    </p>
                    <input 
                      name="skuBase"
                      value={formData.skuBase}
                      onChange={handleInputChange}
                      className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary" 
                      placeholder="Ex: CP-SLIM"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                        Preço de Custo <span className="text-red-500">*</span>
                      </p>
                      <input 
                        name="precoCusto"
                        value={formData.precoCusto}
                        onChange={handleInputChange}
                        onBlur={(e) => validarCampo('precoCusto', e.target.value)}
                        className={`form-input rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                          erros.precoCusto ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                        }`}
                        placeholder="R$ 0,00" 
                        type="text"
                      />
                      {erros.precoCusto && (
                        <p className="text-red-500 text-xs mt-1">{erros.precoCusto}</p>
                      )}
                    </label>
                    <label className="flex flex-col">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                        Preço de Venda <span className="text-red-500">*</span>
                      </p>
                      <input 
                        name="precoVenda"
                        value={formData.precoVenda}
                        onChange={handleInputChange}
                        onBlur={(e) => validarCampo('precoVenda', e.target.value)}
                        className={`form-input rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                          erros.precoVenda ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                        }`}
                        placeholder="R$ 0,00" 
                        type="text"
                      />
                      {erros.precoVenda && (
                        <p className="text-red-500 text-xs mt-1">{erros.precoVenda}</p>
                      )}
                    </label>
                  </div>
                  <div>
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Margem de Lucro</p>
                    <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm">Lucro por peça</span>
                        <span className="font-semibold text-green-600 text-base">R$ {calcularLucroPorPeca()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm">Margem percentual</span>
                        <span className="font-semibold text-green-600 text-base">{calcularMargem()}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de ação no final do formulário */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
                    <button 
                      onClick={handleCancelar}
                      className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 border-2 border-slate-300 bg-transparent text-slate-900 text-base font-bold leading-normal tracking-[0.015em] hover:bg-slate-100"
                    >
                      <span className="truncate">Cancelar</span>
                    </button>
                    {!modoEdicao && (
                      <button 
                        onClick={handleSalvarEAdicionar}
                        className="flex min-w-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-slate-200 text-slate-900 text-base font-bold leading-normal tracking-[0.015em] hover:bg-slate-300"
                      >
                        <span className="truncate">Salvar e Adicionar Outro</span>
                      </button>
                    )}
                    <button 
                      onClick={handleSalvar}
                      className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-700"
                    >
                      <span className="truncate">{modoEdicao ? 'Atualizar' : 'Salvar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>

      {/* Modais */}
      <ModalSucesso
        isOpen={modalSucesso.isOpen}
        onClose={() => {
          setModalSucesso({ isOpen: false, mensagem: '' });
          navigate('/estoque');
        }}
        titulo="Produto cadastrado!"
        mensagem={modalSucesso.mensagem}
      />

      <ModalErro
        isOpen={modalErro.isOpen}
        onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
        titulo="Erro ao salvar produto"
        mensagem={modalErro.mensagem}
        textoBotao="OK"
      />
    </div>
  );
};

export default CriarProduto;
