const { Configuration } = require('../models/Schema');
const path = require('path');
const fs = require('fs');

/**
 * Obter todas as configurações
 */
exports.getAllConfigurations = async (req, res) => {
  try {
    const configuracoes = await Configuration.findAll({
      where: { tenant_id: req.tenantId }, // Filtrar pelo tenantId
      order: [['chave', 'ASC']]
    });

    res.status(200).json({
      message: 'Configurações recuperadas com sucesso',
      data: configuracoes
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      message: 'Erro ao buscar configurações',
      error: error.message
    });
  }
};

/**
 * Obter uma configuração por chave
 */
exports.getConfigurationByKey = async (req, res) => {
  try {
    const { chave } = req.params;

    let config = await Configuration.findOne({
      where: { chave, tenant_id: req.tenantId } // Filtrar pelo tenantId
    });

    // Se não encontrou, buscar o default e criar para este tenant
    if (!config) {
      const defaultConfig = await Configuration.findOne({
        where: { chave, tenant_id: 'default' }
      });

      if (defaultConfig) {
        // Criar cópia da configuração default para este tenant
        config = await Configuration.create({
          chave: defaultConfig.chave,
          valor: defaultConfig.valor,
          tipo: defaultConfig.tipo,
          descricao: defaultConfig.descricao,
          tenant_id: req.tenantId
        });
      } else {
        return res.status(404).json({
          message: 'Configuração não encontrada'
        });
      }
    }

    // Retornar valor convertido de acordo com o tipo
    let valorConvertido = config.valor;
    if (config.tipo === 'booleano') {
      valorConvertido = config.valor === 'true';
    } else if (config.tipo === 'numero') {
      valorConvertido = parseFloat(config.valor);
    } else if (config.tipo === 'json') {
      valorConvertido = JSON.parse(config.valor);
    }

    res.status(200).json({
      message: 'Configuração encontrada',
      data: {
        ...config.toJSON(),
        valorConvertido
      }
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      message: 'Erro ao buscar configuração',
      error: error.message
    });
  }
};

/**
 * Criar ou atualizar uma configuração
 */
exports.upsertConfiguration = async (req, res) => {
  try {
    const { chave, valor, tipo, descricao } = req.body;

    if (!chave || valor === undefined) {
      return res.status(400).json({
        message: 'Chave e valor são obrigatórios'
      });
    }

    // Validar tipo
    const tiposValidos = ['texto', 'numero', 'booleano', 'json'];
    if (tipo && !tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: `Tipo inválido. Use: ${tiposValidos.join(', ')}`
      });
    }

    // Converter valor para string de acordo com o tipo
    let valorString = String(valor);
    if (tipo === 'json' && typeof valor === 'object') {
      valorString = JSON.stringify(valor);
    }

    const [config, created] = await Configuration.findOrCreate({
      where: { chave, tenant_id: req.tenantId }, // Filtrar pelo tenantId
      defaults: {
        chave,
        valor: valorString,
        tipo: tipo || 'texto',
        descricao,
        tenant_id: req.tenantId // Associar tenantId à configuração
      }
    });

    if (!created) {
      // Atualizar se já existir
      const updateData = {
        valor: valorString,
        tipo: tipo || config.tipo,
        descricao: descricao !== undefined ? descricao : config.descricao
      };
      
      // Se for slug_catalogo, atualizar também o campo slug_catalogo
      if (chave === 'slug_catalogo') {
        updateData.slug_catalogo = valorString;
      }
      
      await config.update(updateData);
    }

    res.status(created ? 201 : 200).json({
      message: created ? 'Configuração criada com sucesso' : 'Configuração atualizada com sucesso',
      data: config
    });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({
      message: 'Erro ao salvar configuração',
      error: error.message
    });
  }
};

/**
 * Deletar uma configuração
 */
exports.deleteConfiguration = async (req, res) => {
  try {
    const { chave } = req.params;

    const config = await Configuration.findOne({
      where: { chave, tenant_id: req.tenantId } // Filtrar pelo tenantId
    });

    if (!config) {
      return res.status(404).json({
        message: 'Configuração não encontrada'
      });
    }

    await config.destroy();

    res.status(200).json({
      message: 'Configuração deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar configuração:', error);
    res.status(500).json({
      message: 'Erro ao deletar configuração',
      error: error.message
    });
  }
};

/**
 * Inicializar configurações padrão
 */
exports.initializeDefaultConfigurations = async (req) => {
  try {
    const defaults = [
      {
        chave: 'exigir_caixa_aberto',
        valor: 'false',
        tipo: 'booleano',
        descricao: 'Define se é obrigatório ter um caixa aberto para realizar vendas no PDV'
      },
      {
        chave: 'permitir_venda_estoque_zero',
        valor: 'false',
        tipo: 'booleano',
        descricao: 'Permite realizar vendas mesmo quando o produto está sem estoque'
      },
      {
        chave: 'limite_desconto_pdv',
        valor: '50',
        tipo: 'numero',
        descricao: 'Percentual máximo de desconto permitido no PDV'
      },
      {
        chave: 'logo_url',
        valor: '',
        tipo: 'texto',
        descricao: 'URL da logo da loja exibida no menu sidebar'
      },
      {
        chave: 'nome_loja',
        valor: 'ModaStore',
        tipo: 'texto',
        descricao: 'Nome da loja exibido no menu sidebar'
      }
    ];

    for (const config of defaults) {
      await Configuration.findOrCreate({
        where: { chave: config.chave, tenant_id: 'default' },
        defaults: { ...config, tenant_id: 'default' }
      });
    }

    console.log('✅ Configurações padrão inicializadas');
  } catch (error) {
    console.error('❌ Erro ao inicializar configurações padrão:', error);
  }
};

/**
 * Upload de logo da loja
 */
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Nenhum arquivo foi enviado'
      });
    }

    // Construir URL do arquivo
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Buscar configuração antiga de logo para deletar arquivo antigo
    const oldConfig = await Configuration.findOne({
      where: { chave: 'logo_url', tenant_id: req.tenantId }
    });

    // Deletar arquivo antigo se existir
    if (oldConfig && oldConfig.valor) {
      const oldFilePath = path.join(__dirname, '../../', oldConfig.valor);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          console.warn('Aviso: Não foi possível deletar logo antigo:', err.message);
        }
      }
    }

    // Atualizar ou criar configuração com nova logo
    const [config, created] = await Configuration.findOrCreate({
      where: { chave: 'logo_url', tenant_id: req.tenantId },
      defaults: {
        chave: 'logo_url',
        valor: logoUrl,
        tipo: 'texto',
        descricao: 'URL da logo da loja exibida no menu sidebar',
        tenant_id: req.tenantId
      }
    });

    if (!created) {
      await config.update({ valor: logoUrl });
    }

    res.status(200).json({
      message: 'Logo atualizado com sucesso',
      data: {
        logoUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    
    // Deletar arquivo enviado em caso de erro
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Erro ao deletar arquivo após falha:', err);
      }
    }
    
    res.status(500).json({
      message: 'Erro ao fazer upload do logo',
      error: error.message
    });
  }
};

/**
 * Deletar logo da loja
 */
exports.deleteLogo = async (req, res) => {
  try {
    const config = await Configuration.findOne({
      where: { chave: 'logo_url', tenant_id: req.tenantId }
    });

    if (!config || !config.valor) {
      return res.status(404).json({
        message: 'Logo não encontrado'
      });
    }

    // Deletar arquivo físico
    const filePath = path.join(__dirname, '../../', config.valor);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Aviso: Não foi possível deletar arquivo do logo:', err.message);
      }
    }

    // Atualizar configuração para valor vazio
    await config.update({ valor: '' });

    res.status(200).json({
      message: 'Logo deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar logo:', error);
    res.status(500).json({
      message: 'Erro ao deletar logo',
      error: error.message
    });
  }
};

/**
 * Obter link do catálogo público da loja
 */
exports.getCatalogoLink = async (req, res) => {
  try {
    // Buscar slug_catalogo das configurações
    const config = await Configuration.findOne({
      where: { 
        chave: 'slug_catalogo',
        tenant_id: req.tenantId 
      }
    });

    // Gerar slug automaticamente se ainda não existir
    let slug;
    if (!config || !config.valor) {
      // Criar slug baseado no tenant_id
      slug = req.tenantId
        .replace(/^tenant_/, '')
        .replace(/_\d+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (!slug) slug = req.tenantId.replace(/[^a-z0-9]/gi, '').toLowerCase();

      await Configuration.findOrCreate({
        where: { chave: 'slug_catalogo', tenant_id: req.tenantId },
        defaults: {
          chave: 'slug_catalogo',
          valor: slug,
          slug_catalogo: slug, // IMPORTANTE: Precisa setar esta coluna também
          tipo: 'texto',
          descricao: 'Slug único do catálogo público',
          tenant_id: req.tenantId
        }
      });
    } else {
      slug = config.valor;
    }

    // Gerar URL completa do catálogo
    const origin = req.get('origin') || req.get('referer');
    let catalogoUrl;
    
    if (origin) {
      const frontendUrl = origin.replace(/\/$/, '');
      catalogoUrl = `${frontendUrl}/catalogo/${slug}`;
    } else {
      const protocol = req.protocol;
      const host = req.get('host');
      catalogoUrl = `${protocol}://${host}/catalogo/${slug}`;
    }

    res.status(200).json({
      success: true,
      data: {
        slug,
        url: catalogoUrl,
        urlRelativa: `/catalogo/${slug}`
      }
    });
  } catch (error) {
    console.error('Erro ao buscar link do catálogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar link do catálogo',
      error: error.message
    });
  }
};

/**
 * Salvar configurações do onboarding
 */
exports.saveOnboardingConfig = async (req, res) => {
  try {
    const { nomeLoja, estiloPDV, produtos } = req.body;
    const { Product } = require('../models/Schema');

    // Salvar nome da loja
    if (nomeLoja) {
      const [config, created] = await Configuration.findOrCreate({
        where: { chave: 'nome_loja', tenant_id: req.tenantId },
        defaults: {
          chave: 'nome_loja',
          valor: nomeLoja,
          tipo: 'texto',
          descricao: 'Nome da loja',
          tenant_id: req.tenantId
        }
      });
      if (!created) {
        await config.update({ valor: nomeLoja });
      }
    }

    // Salvar estilo do PDV
    if (estiloPDV) {
      const [config, created] = await Configuration.findOrCreate({
        where: { chave: 'estilo_pdv', tenant_id: req.tenantId },
        defaults: {
          chave: 'estilo_pdv',
          valor: estiloPDV,
          tipo: 'texto',
          descricao: 'Estilo do PDV (branded ou shortcuts)',
          tenant_id: req.tenantId
        }
      });
      if (!created) {
        await config.update({ valor: estiloPDV });
      }
    }

    // Criar produtos iniciais
    if (produtos && Array.isArray(produtos) && produtos.length > 0) {
      for (const produto of produtos) {
        if (produto.name && produto.name.trim() !== '') {
          await Product.create({
            nome: produto.name,
            preco: parseFloat(produto.price) || 0,
            quantidade: 0,
            categoria: 'Geral',
            tenant_id: req.tenantId
          });
        }
      }
    }

    // Marcar onboarding como concluído
    const [config, created] = await Configuration.findOrCreate({
      where: { chave: 'onboarding_concluido', tenant_id: req.tenantId },
      defaults: {
        chave: 'onboarding_concluido',
        valor: 'true',
        tipo: 'booleano',
        descricao: 'Indica se o onboarding foi concluído',
        tenant_id: req.tenantId
      }
    });
    if (!created) {
      await config.update({ valor: 'true' });
    }

    res.status(200).json({
      success: true,
      message: 'Configurações do onboarding salvas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar configurações do onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configurações do onboarding',
      error: error.message
    });
  }
};
