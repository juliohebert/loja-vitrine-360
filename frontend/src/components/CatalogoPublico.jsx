import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import CarrinhoCompras from './CarrinhoCompras';
import { getApiUrl } from '../config/api';

const CatalogoPublico = () => {
  const { slug } = useParams(); // Capturar slug da URL
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [ordem, setOrdem] = useState('recentes');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  // Configurações da loja
  const [config, setConfig] = useState({
    nome_loja: 'Loja',
    logo_url: '',
    telefone_whatsapp: ''
  });

  const tenantId = localStorage.getItem('currentTenantId') || 'default';

  // Montar URL base da API baseado no slug
  const getApiUrlCatalogo = (endpoint) => {
    if (slug) {
      return getApiUrl(`catalogo/${slug}/${endpoint}`);
    }
    return getApiUrl(`catalogo/${endpoint}`);
  };

  // Carregar configurações da loja
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const url = slug 
          ? getApiUrl(`catalogo/${slug}/configuracoes`)
          : getApiUrl('catalogo/configuracoes');
          
        const headers = slug ? {} : { 'x-tenant-id': tenantId };
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (data.success) {
          setConfig(data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    carregarConfiguracoes();
  }, [tenantId, slug]);

  // Carregar produtos
  useEffect(() => {
    const carregarProdutos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limite: '20',
          pagina: pagina.toString(),
          ordem
        });
        
        if (busca) params.append('busca', busca);
        if (categoriaFiltro) params.append('categoria', categoriaFiltro);

        const url = slug
          ? `${getApiUrl(`catalogo/${slug}/produtos`)}?${params}`
          : `${getApiUrl('catalogo/produtos')}?${params}`;
          
        const headers = slug ? {} : { 'x-tenant-id': tenantId };

        const response = await fetch(url, { headers });
        
        const data = await response.json();
        if (data.success) {
          setProdutos(data.data);
          setTotalPaginas(data.pagination.total_paginas);
          
          // Extrair categorias únicas
          const cats = [...new Set(data.data.map(p => p.categoria).filter(Boolean))];
          setCategorias(cats);
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarProdutos();
  }, [busca, categoriaFiltro, ordem, pagina, tenantId, slug]);

  // Adicionar ao carrinho
  const adicionarAoCarrinho = (produto, variacao) => {
    const itemExistente = carrinho.find(
      item => item.produto_id === produto.id && 
              item.tamanho === variacao.tamanho && 
              item.cor === variacao.cor
    );

    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.produto_id === produto.id && 
        item.tamanho === variacao.tamanho && 
        item.cor === variacao.cor
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        produto_id: produto.id,
        nome: produto.nome,
        marca: produto.marca,
        tamanho: variacao.tamanho,
        cor: variacao.cor,
        quantidade: 1,
        preco_unitario: produto.preco_venda,
        imagem_url: produto.imagens?.[0] || null
      }]);
    }
    setCarrinhoAberto(true);
  };

  // Remover do carrinho
  const removerDoCarrinho = (index) => {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  };

  // Atualizar quantidade
  const atualizarQuantidade = (index, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(index);
      return;
    }
    setCarrinho(carrinho.map((item, i) =>
      i === index ? { ...item, quantidade: novaQuantidade } : item
    ));
  };

  // Limpar filtros
  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('');
    setOrdem('recentes');
    setPagina(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {config.logo_url ? (
                <img 
                  src={config.logo_url.startsWith('http') ? config.logo_url : `${getApiUrl('')}${config.logo_url}`}
                  alt={config.nome_loja} 
                  className="h-10 max-w-[200px] object-contain" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <h1 
                className="text-2xl font-bold text-primary" 
                style={{ display: config.logo_url ? 'none' : 'block' }}
              >
                {config.nome_loja}
              </h1>
            </div>
            
            <button
              onClick={() => setCarrinhoAberto(true)}
              className="relative p-2 text-gray-700 hover:text-primary transition-colors"
            >
              <ShoppingCart size={24} />
              {carrinho.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Categoria */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
              >
                <option value="">Todas as categorias</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="recentes">Mais recentes</option>
                <option value="menor_preco">Menor preço</option>
                <option value="maior_preco">Maior preço</option>
                <option value="nome">Nome A-Z</option>
              </select>
            </div>
          </div>

          {/* Botão limpar filtros */}
          {(busca || categoriaFiltro || ordem !== 'recentes') && (
            <button
              onClick={limparFiltros}
              className="mt-4 text-sm text-gray-600 hover:text-primary flex items-center gap-2"
            >
              <X size={16} />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
            {(busca || categoriaFiltro) && (
              <button
                onClick={limparFiltros}
                className="mt-4 text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtos.map(produto => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  onAdicionarAoCarrinho={adicionarAoCarrinho}
                />
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <span className="text-gray-600">
                  Página {pagina} de {totalPaginas}
                </span>
                
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Carrinho Sidebar */}
      <CarrinhoCompras
        aberto={carrinhoAberto}
        onFechar={() => setCarrinhoAberto(false)}
        itens={carrinho}
        onRemoverItem={removerDoCarrinho}
        onAtualizarQuantidade={atualizarQuantidade}
        configuracoes={config}
        slug={slug}
      />
    </div>
  );
};

// Componente Card de Produto
const ProdutoCard = ({ produto, onAdicionarAoCarrinho }) => {
  const [variacaoSelecionada, setVariacaoSelecionada] = useState(null);
  const [mostrarVariacoes, setMostrarVariacoes] = useState(false);
  const [imagemAtual, setImagemAtual] = useState(0);

  const variacoesComEstoque = produto.variacoes?.filter(
    v => v.estoque?.quantidade > 0
  ) || [];

  const imagens = produto.imagens || [];
  const temMultiplasImagens = imagens.length > 1;

  const proximaImagem = (e) => {
    e.stopPropagation();
    setImagemAtual((prev) => (prev + 1) % imagens.length);
  };

  const imagemAnterior = (e) => {
    e.stopPropagation();
    setImagemAtual((prev) => (prev - 1 + imagens.length) % imagens.length);
  };

  const irParaImagem = (index) => {
    setImagemAtual(index);
  };

  const handleAdicionar = () => {
    if (variacoesComEstoque.length === 0) return;

    if (variacoesComEstoque.length === 1) {
      onAdicionarAoCarrinho(produto, variacoesComEstoque[0]);
    } else {
      setMostrarVariacoes(true);
    }
  };

  const selecionarVariacao = (variacao) => {
    onAdicionarAoCarrinho(produto, variacao);
    setMostrarVariacoes(false);
    setVariacaoSelecionada(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
        {/* Imagem com Carrossel */}
        <div className="relative h-64 bg-gray-100 overflow-hidden">
          {imagens.length > 0 ? (
            <>
              <img
                src={imagens[imagemAtual]}
                alt={`${produto.nome} - ${imagemAtual + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Botões de navegação - aparecem apenas se houver múltiplas imagens */}
              {temMultiplasImagens && (
                <>
                  {/* Botão Anterior */}
                  <button
                    onClick={imagemAnterior}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Botão Próximo */}
                  <button
                    onClick={proximaImagem}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Indicadores de página (dots) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imagens.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          irParaImagem(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === imagemAtual 
                            ? 'bg-white w-6' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                        aria-label={`Ir para imagem ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Contador de imagens */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {imagemAtual + 1}/{imagens.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart size={48} />
            </div>
          )}
          
          {!produto.estoque_disponivel && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {produto.nome}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{produto.marca}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              R$ {parseFloat(produto.preco_venda).toFixed(2)}
            </span>
            
            <button
              onClick={handleAdicionar}
              disabled={!produto.estoque_disponivel}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              Adicionar
            </button>
          </div>
          
          {produto.total_estoque > 0 && produto.total_estoque <= 5 && (
            <p className="text-xs text-orange-600 mt-2">
              Apenas {produto.total_estoque} em estoque!
            </p>
          )}
        </div>
      </div>

      {/* Modal de Seleção de Variação */}
      {mostrarVariacoes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selecione uma opção</h3>
              <button
                onClick={() => setMostrarVariacoes(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              {variacoesComEstoque.map((variacao, idx) => (
                <button
                  key={idx}
                  onClick={() => selecionarVariacao(variacao)}
                  className="w-full text-left p-3 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{variacao.cor}</span>
                      {' - '}
                      <span className="text-gray-600">{variacao.tamanho}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {variacao.estoque?.quantidade} disponíveis
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CatalogoPublico;
