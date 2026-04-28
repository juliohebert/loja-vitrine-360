const { CashRegister, User } = require('../models/Schema');
const { Op } = require('sequelize');

/**
 * Abrir um novo caixa
 */
exports.openCashRegister = async (req, res) => {
  try {
    const { saldoInicial, observacoes } = req.body;
    const usuarioId = req.user.id; // Do middleware de autenticação

    // Verificar se já existe um caixa aberto para este usuário
    const caixaAberto = await CashRegister.findOne({
      where: {
        usuarioId,
        status: 'aberto',
        tenant_id: req.tenantId
      }
    });

    if (caixaAberto) {
      return res.status(400).json({
        message: 'Já existe um caixa aberto para este usuário',
        data: caixaAberto
      });
    }

    // Criar novo caixa
    const novoCaixa = await CashRegister.create({
      usuarioId,
      saldoInicial: saldoInicial || 0,
      tenant_id: req.tenantId,
      observacoes
    });

    // Buscar o caixa criado com o relacionamento do usuário
    const caixaComUsuario = await CashRegister.findByPk(novoCaixa.id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }]
    });

    res.status(201).json({
      message: 'Caixa aberto com sucesso',
      data: caixaComUsuario
    });
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    res.status(500).json({
      message: 'Erro ao abrir caixa',
      error: error.message
    });
  }
};

/**
 * Fechar um caixa
 */
exports.closeCashRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const { saldoFinal, observacoes } = req.body;
    const usuarioId = req.user.id;

    // Buscar o caixa
    const caixa = await CashRegister.findOne({
      where: {
        id,
        usuarioId,
        status: 'aberto',
        tenant_id: req.tenantId
      }
    });

    if (!caixa) {
      return res.status(404).json({
        message: 'Caixa não encontrado ou já está fechado'
      });
    }

    // Atualizar caixa
    await caixa.update({
      status: 'fechado',
      dataFechamento: new Date(),
      saldoFinal,
      observacoes: observacoes || caixa.observacoes
    });

    res.status(200).json({
      message: 'Caixa fechado com sucesso',
      data: caixa
    });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    res.status(500).json({
      message: 'Erro ao fechar caixa',
      error: error.message
    });
  }
};

/**
 * Buscar caixa aberto do usuário
 */
exports.getOpenCashRegister = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const caixaAberto = await CashRegister.findOne({
      where: {
        usuarioId,
        status: 'aberto',
        tenant_id: req.tenantId // Usar nome do campo no banco: tenant_id
      },
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      order: [['dataAbertura', 'DESC']]
    });

    if (!caixaAberto) {
      return res.status(200).json({
        message: 'Nenhum caixa aberto encontrado',
        data: null
      });
    }

    res.status(200).json({
      message: 'Caixa aberto encontrado',
      data: caixaAberto
    });
  } catch (error) {
    console.error('Erro ao buscar caixa aberto:', error);
    res.status(500).json({
      message: 'Erro ao buscar caixa aberto',
      error: error.message
    });
  }
};

/**
 * Listar todos os caixas (com filtros)
 */
exports.getAllCashRegisters = async (req, res) => {
  try {
    const { status, dataInicio, dataFim, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      tenant_id: req.tenantId // FILTRO DE MULTITENANCY
    };

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por data
    if (dataInicio || dataFim) {
      where.dataAbertura = {};
      if (dataInicio) {
        where.dataAbertura[Op.gte] = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataAbertura[Op.lte] = new Date(dataFim);
      }
    }

    const { count, rows: caixas } = await CashRegister.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }],
      order: [['dataAbertura', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      message: 'Caixas recuperados com sucesso',
      data: caixas,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar caixas:', error);
    res.status(500).json({
      message: 'Erro ao listar caixas',
      error: error.message
    });
  }
};

/**
 * Buscar um caixa por ID
 */
exports.getCashRegisterById = async (req, res) => {
  try {
    const { id } = req.params;

    const caixa = await CashRegister.findOne({
      where: { 
        id: id,
        tenant_id: req.tenantId 
      },
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }]
    });

    if (!caixa) {
      return res.status(404).json({
        message: 'Caixa não encontrado'
      });
    }

    res.status(200).json({
      message: 'Caixa encontrado',
      data: caixa
    });
  } catch (error) {
    console.error('Erro ao buscar caixa:', error);
    res.status(500).json({
      message: 'Erro ao buscar caixa',
      error: error.message
    });
  }
};
