const { Product, PedidoCatalogo, Configuration, Variation, Stock } = require('../models/Schema');
const { Op } = require('sequelize');

/**
 * Controlador para o Catálogo Público (sem autenticação)
 */

// Listar produtos disponíveis no catálogo (público)
exports.listarProdutosCatalogo = async (req, res) => {
  try {
    const { 
      categoria, 
      busca, 
      ordem = 'recentes',
      limite = 50,
      pagina = 1 
    } = req.query;

    const tenantId = req.headers['x-tenant-id'] || 'default';
    console.log('🔍 [LISTAR CATALOGO] TenantId:', tenantId);
    
    // Construir filtros
    const where = {
      tenant_id: tenantId,
      ativo: true,
      exibir_catalogo: true // Apenas produtos disponíveis no catálogo
    };

    // Filtro por categoria
    if (categoria) {
      where.categoria = categoria;
    }

    // Filtro por busca
    if (busca) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${busca}%` } },
        { marca: { [Op.iLike]: `%${busca}%` } },
        { descricao: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    // Determinar ordenação
    let order = [['id', 'DESC']]; // Mais recentes por padrão (usando ID)
    if (ordem === 'menor_preco') {
      order = [['preco_venda', 'ASC']];
    } else if (ordem === 'maior_preco') {
      order = [['preco_venda', 'DESC']];
    } else if (ordem === 'nome') {
      order = [['nome', 'ASC']];
    }

    // Paginação
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    console.log('🔍 [LISTAR CATALOGO] Filtros aplicados:', where);

    const { count, rows: produtos } = await Product.findAndCountAll({
      where,
      order,
      limit: parseInt(limite),
      offset,
      attributes: [
        'id',
        'nome',
        'descricao',
        'marca',
        'categoria',
        'preco_venda',
        'preco_custo',
        'imagens',
        'exibir_catalogo'
      ],
      include: [{
        model: Variation,
        as: 'variacoes',
        attributes: ['id', 'sku', 'tamanho', 'cor'],
        include: [{
          model: Stock,
          as: 'estoque',
          attributes: ['quantidade']
        }],
        required: false
      }]
    });

    // Calcular estoque total disponível
    const produtosComEstoque = produtos.map(produto => {
      const produtoJson = produto.toJSON();
      const estoqueTotal = produtoJson.variacoes?.reduce((total, variacao) => {
        return total + (variacao.estoque?.quantidade || 0);
      }, 0) || 0;

      return {
        ...produtoJson,
        estoque_disponivel: estoqueTotal > 0,
        total_estoque: estoqueTotal
      };
    });

    console.log('✅ [LISTAR CATALOGO] Produtos encontrados:', count);
    console.log('🔍 [LISTAR CATALOGO] Primeiros produtos:', produtos.slice(0, 2).map(p => ({
      id: p.id,
      nome: p.nome,
      exibir_catalogo: p.exibir_catalogo,
      ativo: p.ativo
    })));

    res.json({
      success: true,
      data: produtosComEstoque,
      pagination: {
        total: count,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total_paginas: Math.ceil(count / parseInt(limite))
      }
    });

  } catch (error) {
    console.error('Erro ao listar produtos do catálogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar produtos do catálogo',
      error: error.message
    });
  }
};

// Obter detalhes de um produto específico (público)
exports.obterDetalheProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] || 'default';

    const produto = await Product.findOne({
      where: {
        id,
        tenant_id: tenantId,
        ativo: true,
        exibir_catalogo: true // Apenas produtos disponíveis no catálogo
      },
      include: [{
        model: Variation,
        as: 'variacoes',
        attributes: ['id', 'sku', 'tamanho', 'cor'],
        include: [{
          model: Stock,
          as: 'estoque',
          attributes: ['quantidade']
        }],
        required: false
      }]
    });

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    const produtoJson = produto.toJSON();
    const estoqueTotal = produtoJson.variacoes?.reduce((total, variacao) => {
      return total + (variacao.estoque?.quantidade || 0);
    }, 0) || 0;

    res.json({
      success: true,
      data: {
        ...produtoJson,
        estoque_disponivel: estoqueTotal > 0,
        total_estoque: estoqueTotal
      }
    });

  } catch (error) {
    console.error('Erro ao obter detalhe do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar detalhes do produto',
      error: error.message
    });
  }
};

// Criar novo pedido do catálogo (público)
exports.criarPedidoCatalogo = async (req, res) => {
  try {
    const {
      cliente_nome,
      cliente_telefone,
      cliente_email,
      cliente_endereco,
      items,
      observacoes,
      origem = 'catalogo'
    } = req.body;

    const tenantId = req.headers['x-tenant-id'] || 'default';

    console.log('📦 Criando pedido do catálogo:', {
      tenantId,
      cliente_nome,
      items: items?.map(i => ({ produto_id: i.produto_id, nome: i.nome }))
    });

    // Validações
    if (!cliente_nome || !cliente_telefone) {
      return res.status(400).json({
        success: false,
        message: 'Nome e telefone do cliente são obrigatórios'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'O pedido deve conter pelo menos um item'
      });
    }

    // Validar e calcular valores dos itens
    let subtotal = 0;
    const itemsValidados = [];

    for (const item of items) {
      console.log('🔍 Buscando produto:', { 
        produto_id: item.produto_id, 
        tenantId,
        tipo: typeof item.produto_id 
      });

      const produto = await Product.findOne({
        where: {
          id: item.produto_id,
          tenant_id: tenantId
        }
      });

      if (!produto) {
        console.error('❌ Produto não encontrado:', {
          produto_id: item.produto_id,
          tenantId
        });
        return res.status(400).json({
          success: false,
          message: `Produto ${item.produto_id} não encontrado`
        });
      }

      const itemTotal = parseFloat(item.preco_unitario) * parseInt(item.quantidade);
      subtotal += itemTotal;

      itemsValidados.push({
        produto_id: produto.id,
        nome: item.nome || produto.nome,
        tamanho: item.tamanho,
        cor: item.cor,
        quantidade: parseInt(item.quantidade),
        preco_unitario: parseFloat(item.preco_unitario),
        total: itemTotal,
        imagem_url: item.imagem_url || (produto.imagens && produto.imagens[0]) || null
      });
    }

    // Gerar número do pedido
    const numeroPedido = await PedidoCatalogo.gerarNumeroPedido(tenantId);

    // Criar pedido
    const pedido = await PedidoCatalogo.create({
      numero_pedido: numeroPedido,
      cliente_nome,
      cliente_telefone,
      cliente_email,
      cliente_endereco,
      items: itemsValidados,
      subtotal,
      desconto: 0,
      valor_total: subtotal,
      status: 'novo',
      origem,
      observacoes,
      tenant_id: tenantId
    });

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: pedido
    });

  } catch (error) {
    console.error('Erro ao criar pedido do catálogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pedido',
      error: error.message
    });
  }
};

// Obter configurações públicas (número WhatsApp, nome da loja, etc)
exports.obterConfiguracoesCatalogo = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'default';

    const configuracoes = await Configuration.findAll({
      where: {
        tenant_id: tenantId,
        chave: {
          [Op.in]: ['nome_loja', 'logo_url', 'telefone_whatsapp', 'endereco_loja', 'email_loja']
        }
      }
    });

    const config = {};
    configuracoes.forEach(c => {
      config[c.chave] = c.valor;
    });

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Erro ao obter configurações do catálogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar configurações',
      error: error.message
    });
  }
};

// ==========================================
// MÉTODOS COM SLUG (para URLs amigáveis)
// ==========================================

/**
 * Buscar tenant_id pelo slug
 */
async function buscarTenantPorSlug(slug) {
  console.log('🔍 [BUSCAR TENANT POR SLUG] Buscando tenant para slug:', slug);
  
  const config = await Configuration.findOne({
    where: {
      chave: 'slug_catalogo',
      slug_catalogo: slug
    }
  });

  console.log('🔍 [BUSCAR TENANT POR SLUG] Configuração encontrada:', config ? {
    tenant_id: config.tenant_id,
    slug_catalogo: config.slug_catalogo
  } : 'null');

  if (!config) {
    return null;
  }

  return config.tenant_id;
}

/**
 * Listar produtos do catálogo por slug da loja
 */
exports.listarProdutosCatalogoPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tenantId = await buscarTenantPorSlug(slug);

    if (!tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    // Injetar tenantId no header para usar o método existente
    req.headers['x-tenant-id'] = tenantId;
    return exports.listarProdutosCatalogo(req, res);
  } catch (error) {
    console.error('Erro ao listar produtos por slug:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar produtos',
      error: error.message
    });
  }
};

/**
 * Obter detalhes de produto por slug da loja
 */
exports.obterDetalheProdutoPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tenantId = await buscarTenantPorSlug(slug);

    if (!tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    // Injetar tenantId no header
    req.headers['x-tenant-id'] = tenantId;
    return exports.obterDetalheProduto(req, res);
  } catch (error) {
    console.error('Erro ao obter produto por slug:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar produto',
      error: error.message
    });
  }
};

/**
 * Criar pedido do catálogo por slug da loja
 */
exports.criarPedidoCatalogoPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tenantId = await buscarTenantPorSlug(slug);

    if (!tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    // Injetar tenantId no header
    req.headers['x-tenant-id'] = tenantId;
    return exports.criarPedidoCatalogo(req, res);
  } catch (error) {
    console.error('Erro ao criar pedido por slug:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pedido',
      error: error.message
    });
  }
};

/**
 * Obter configurações do catálogo por slug da loja
 */
exports.obterConfiguracoesCatalogoPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tenantId = await buscarTenantPorSlug(slug);

    if (!tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    // Injetar tenantId no header
    req.headers['x-tenant-id'] = tenantId;
    return exports.obterConfiguracoesCatalogo(req, res);
  } catch (error) {
    console.error('Erro ao obter configurações por slug:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar configurações',
      error: error.message
    });
  }
};

module.exports = exports;
