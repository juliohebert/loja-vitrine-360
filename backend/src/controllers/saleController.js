const { Sale, User, Customer } = require('../models/Schema');

/**
 * Listar todas as vendas
 */
const getAllSales = async (req, res) => {
  try {
    console.log('🔵 [GET ALL SALES] Buscando todas as vendas...');
    console.log('🔵 [GET ALL SALES] req.tenantId:', req.tenantId);

    const sales = await Sale.findAll({
      where: { tenant_id: req.tenantId },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Customer,
          as: 'cliente',
          attributes: ['id', 'nome', 'cpf', 'telefone']
        }
      ],
      order: [['dataHora', 'DESC']]
    });

    console.log('🔵 [GET ALL SALES] Vendas encontradas:', sales.length);
    console.log('🔵 [GET ALL SALES] Dados:', JSON.stringify(sales.map(s => ({
      id: s.id,
      numero: s.numeroVenda,
      total: s.total,
      data: s.data,
      dataHora: s.dataHora,
      criadoEm: s.criadoEm
    })), null, 2));

    // Garantir que o campo criadoEm seja enviado corretamente
    const salesData = sales.map(sale => {
      const saleJson = sale.toJSON();
      // Adicionar explicitamente o campo criadoEm se não existir
      if (!saleJson.criadoEm && saleJson.criado_em) {
        saleJson.criadoEm = saleJson.criado_em;
      }
      return saleJson;
    });

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('❌ [GET ALL SALES] Erro ao buscar vendas:', error);
    console.error('❌ [GET ALL SALES] Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar vendas',
      details: error.message
    });
  }
};

/**
 * Buscar venda por ID
 */
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findOne({
      where: { 
        id: id,
        tenant_id: req.tenantId 
      },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Customer,
          as: 'cliente',
          attributes: ['id', 'nome', 'cpf', 'telefone']
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar venda'
    });
  }
};

/**
 * Criar nova venda
 */
const createSale = async (req, res) => {
  try {
    console.log('🟡 [CREATE SALE] Iniciando criação de venda...');
    console.log('🟡 [CREATE SALE] req.body:', JSON.stringify(req.body, null, 2));
    console.log('🟡 [CREATE SALE] req.user:', req.user);
    console.log('🟡 [CREATE SALE] req.tenantId:', req.tenantId);

    const {
      numeroVenda,
      vendedor,
      clienteId,
      caixaId,
      itens,
      formaPagamento,
      subtotal,
      desconto,
      total,
      troco,
      observacoes,
      data,
      dataHora
    } = req.body;

    // Validações
    if (!numeroVenda || !itens || itens.length === 0 || !formaPagamento) {
      console.log('❌ [CREATE SALE] Validação falhou - dados incompletos');
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos. Número da venda, itens e forma de pagamento são obrigatórios'
      });
    }

    // Remover o id do req.body para que o Sequelize gere um UUID
    const { id, ...saleData } = req.body;

    console.log('🟡 [CREATE SALE] Dados para criar venda:', {
      ...saleData,
      usuarioId: req.user?.id || req.userId,
      tenant_id: req.tenantId
    });

    const sale = await Sale.create({
      ...saleData,
      usuarioId: req.user?.id || req.userId, // ID do usuário logado
      tenant_id: req.tenantId // Associar tenantId à venda
    });

    console.log('✅ [CREATE SALE] Venda criada com sucesso:', sale.toJSON());

    res.status(201).json({
      success: true,
      data: sale,
      message: 'Venda registrada com sucesso'
    });
  } catch (error) {
    console.error('❌ [CREATE SALE] Erro ao criar venda:', error);
    console.error('❌ [CREATE SALE] Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar venda',
      details: error.message
    });
  }
};

/**
 * Buscar vendas por período
 */
const getSalesByPeriod = async (req, res) => {
  try {
    console.log('🟢 [GET SALES BY PERIOD] Buscando vendas por período...');
    console.log('🟢 [GET SALES BY PERIOD] Query params:', req.query);
    console.log('🟢 [GET SALES BY PERIOD] req.tenantId:', req.tenantId);

    const { dataInicio, dataFim } = req.query;

    const where = {};
    if (dataInicio && dataFim) {
      where.data = {
        [require('sequelize').Op.between]: [dataInicio, dataFim]
      };
    }

    where.tenant_id = req.tenantId;

    console.log('🟢 [GET SALES BY PERIOD] Where clause:', where);

    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Customer,
          as: 'cliente',
          attributes: ['id', 'nome', 'cpf']
        }
      ],
      order: [['dataHora', 'DESC']]
    });

    console.log('🟢 [GET SALES BY PERIOD] Vendas encontradas:', sales.length);

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('❌ [GET SALES BY PERIOD] Erro ao buscar vendas por período:', error);
    console.error('❌ [GET SALES BY PERIOD] Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar vendas',
      details: error.message
    });
  }
};

/**
 * Buscar vendas por vendedor
 */
const getSalesByVendedor = async (req, res) => {
  try {
    const { vendedor } = req.params;

    const sales = await Sale.findAll({
      where: { 
        tenant_id: req.tenantId, vendedor },
      order: [['dataHora', 'DESC']]
    });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Erro ao buscar vendas por vendedor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar vendas'
    });
  }
};

/**
 * Cancelar venda
 */
const cancelSale = async (req, res) => {
  try {
    console.log('🔴 [CANCEL SALE] Iniciando cancelamento de venda...');
    console.log('🔴 [CANCEL SALE] req.params.id:', req.params.id);
    console.log('🔴 [CANCEL SALE] req.body:', req.body);
    console.log('🔴 [CANCEL SALE] req.user:', req.user);
    console.log('🔴 [CANCEL SALE] req.tenantId:', req.tenantId);

    const { id } = req.params;
    const { motivo } = req.body;

    // Validações
    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'O motivo do cancelamento é obrigatório'
      });
    }

    // Buscar venda
    const sale = await Sale.findOne({
      where: { 
        id: id,
        tenant_id: req.tenantId 
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    // Verificar se já está cancelada
    if (sale.status === 'cancelado') {
      return res.status(400).json({
        success: false,
        error: 'Esta venda já foi cancelada anteriormente'
      });
    }

    // Atualizar status da venda
    await sale.update({
      status: 'cancelado',
      motivoCancelamento: motivo,
      canceladoPor: req.user?.id || req.userId,
      canceladoEm: new Date()
    });

    console.log('✅ [CANCEL SALE] Venda cancelada com sucesso:', {
      id: sale.id,
      numeroVenda: sale.numeroVenda,
      status: sale.status
    });

    res.json({
      success: true,
      message: 'Venda cancelada com sucesso',
      data: {
        id: sale.id,
        numeroVenda: sale.numeroVenda,
        status: sale.status,
        motivoCancelamento: sale.motivoCancelamento,
        canceladoEm: sale.canceladoEm
      }
    });
  } catch (error) {
    console.error('❌ [CANCEL SALE] Erro ao cancelar venda:', error);
    console.error('❌ [CANCEL SALE] Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar venda',
      details: error.message
    });
  }
};

/**
 * Criar venda a partir de pedido do catálogo
 * Cria uma venda pendente/rascunho que pode ser editada no PDV
 */
const createSaleFromCatalog = async (req, res) => {
  try {
    console.log('🛒 [CREATE SALE FROM CATALOG] Criando venda do catálogo...');
    
    const {
      cliente_nome,
      cliente_telefone,
      itens,
      subtotal,
      desconto,
      total,
      observacoes,
      origem_pedido_catalogo,
      numero_pedido_catalogo
    } = req.body;

    // Gerar número da venda
    const ultimaVenda = await Sale.findOne({
      where: { tenant_id: req.tenantId },
      order: [['id', 'DESC']]
    });

    const numeroVenda = ultimaVenda 
      ? parseInt(ultimaVenda.numeroVenda) + 1 
      : 1;

    // Criar venda sem cliente (será definido no PDV)
    // Status "ativo" com forma_pagamento "pendente" indica que precisa ser finalizada no PDV
    const venda = await Sale.create({
      numeroVenda: numeroVenda.toString().padStart(6, '0'),
      usuarioId: req.user.id,
      vendedor: req.user?.nome || 'Sistema',
      clienteId: null, // Sem cliente - será definido no PDV
      itens: itens,
      formaPagamento: 'pendente',
      subtotal: parseFloat(subtotal),
      desconto: parseFloat(desconto) || 0,
      total: parseFloat(total),
      troco: 0,
      observacoes: `📱 Pedido Catálogo #${numero_pedido_catalogo} - Cliente: ${cliente_nome} (${cliente_telefone})${observacoes ? ' - ' + observacoes : ''}`,
      data: new Date().toISOString().split('T')[0],
      dataHora: new Date(),
      status: 'ativo',
      tenant_id: req.tenantId
    });

    console.log('✅ Venda rascunho criada do pedido catálogo:', {
      vendaId: venda.id,
      numeroVenda: venda.numeroVenda,
      pedidoCatalogo: numero_pedido_catalogo,
      total: venda.total,
      status: 'ativo - forma_pagamento: pendente (aguardando finalização no PDV)'
    });

    res.json({
      success: true,
      data: venda,
      message: 'Venda criada como rascunho. Finalize no PDV para concluir.'
    });

  } catch (error) {
    console.error('❌ [CREATE SALE FROM CATALOG] Erro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar venda do catálogo',
      details: error.message
    });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  getSalesByPeriod,
  getSalesByVendedor,
  cancelSale,
  createSaleFromCatalog
};
