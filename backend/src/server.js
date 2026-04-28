const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const path = require('path');

// Carregar variáveis de ambiente se não estiverem definidas (Render já define)
if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

const { sequelize } = require('./models/Schema');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const cashRegisterRoutes = require('./routes/cashRegisterRoutes');
const configurationRoutes = require('./routes/configurationRoutes');
const userRoutes = require('./routes/userRoutes');
const saleRoutes = require('./routes/saleRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const accountPayableRoutes = require('./routes/accountPayableRoutes');
const accountReceivableRoutes = require('./routes/accountReceivableRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes'); // Importar rotas de assinatura
const planRoutes = require('./routes/planRoutes'); // Importar rotas de planos
const adminRoutes = require('./routes/adminRoutes'); // Importar rotas de admin (TEMPORÁRIO)
const catalogoRoutes = require('./routes/catalogoRoutes'); // Rotas públicas do catálogo
const pedidosCatalogoRoutes = require('./routes/pedidosCatalogoRoutes'); // Rotas admin de pedidos
const { initializeDefaultConfigurations } = require('./controllers/configurationController');
const { Client } = require('pg'); // Adicionar cliente do PostgreSQL para manipulação direta do banco
const tenantMiddleware = require('./middleware/tenantMiddleware');
// const Sentry = require('@sentry/node'); // Importar Sentry para monitoramento de erros

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173',
      'http://192.168.0.14:5173',
      'http://192.168.0.14:3000',
      'http://192.168.0.14:3002',
      'http://192.168.0.14:3003',
      'https://loja-seven-theta.vercel.app',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // Permitir qualquer subdomínio do Vercel
    if (origin && (origin.includes('.vercel.app') || allowedOrigins.indexOf(origin) !== -1)) {
      return callback(null, origin);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
};

// Desativar temporariamente o Sentry para depuração
// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
//   integrations: [
//     new Sentry.Integrations.Http({ tracing: true }),
//   ],
//   tracesSampleRate: 1.0,
// });

// Middlewares
app.use(cors(corsOptions));
// Aumentar limite para suportar upload de imagens em base64 (padrão é ~100kb)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware para capturar o tenantId, exceto para /api/subscriptions/metrics

// Aplicar tenantMiddleware apenas nas rotas que precisam de tenantId
app.use('/api/products', tenantMiddleware);
app.use('/api/sales', tenantMiddleware);
app.use('/api/configurations', tenantMiddleware);
// NÃO aplicar tenant middleware em /api/users/register e /api/auth/*
app.use('/api/users', (req, res, next) => {
  // Pular tenant middleware para registro e algumas rotas de auth
  if (req.path === '/register' || req.path.startsWith('/auth')) {
    return next();
  }
  return tenantMiddleware(req, res, next);
});
app.use('/api/suppliers', tenantMiddleware);
app.use('/api/purchase-orders', tenantMiddleware);
app.use('/api/accounts-payable', tenantMiddleware);
app.use('/api/accounts-receivable', tenantMiddleware);
app.use('/api/customers', tenantMiddleware);
app.use('/api/subscriptions', (req, res, next) => {
  if (req.path === '/metrics') return next();
  return tenantMiddleware(req, res, next);
});
// NOTA: pedidos-catalogo usa authMiddleware que já extrai tenantId do token

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Loja de Roupas API',
}));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/admin', adminRoutes); // Rota de admin (TEMPORÁRIO - DELETE DEPOIS!)
app.use('/api/catalogo', catalogoRoutes); // Rotas públicas do catálogo (sem auth)
app.use('/api/pedidos-catalogo', pedidosCatalogoRoutes); // Rotas admin de pedidos (com auth)
app.use('/api', productRoutes);
app.use('/api', customerRoutes);
app.use('/api/cash-registers', cashRegisterRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/accounts-payable', accountPayableRoutes);
app.use('/api/accounts-receivable', accountReceivableRoutes);
app.use('/api/subscriptions', subscriptionRoutes); // Registrar rota de assinatura
app.use('/api/plans', planRoutes); // Registrar rota de planos

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Loja de Roupas API',
    version: 'v1.0.1-cors-fix',
    corsFixed: true
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
// app.use(Sentry.Handlers.errorHandler()); // Middleware do Sentry para tratar erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const createDatabaseIfNotExists = async (databaseName) => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [databaseName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${databaseName}`);
    } 
  } catch (error) {
    console.error(`❌ Erro ao verificar/criar banco de dados: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
};

// Sincronizar banco de dados e iniciar servidor
const startServer = async () => {
  try {
    // Verificar e criar banco de dados apenas se não estiver usando DATABASE_URL
    if (!process.env.DATABASE_URL) {
      const databaseName = process.env.DB_NAME;
      await createDatabaseIfNotExists(databaseName);
    }

    // Sincronizar modelos (usar force: true apenas em desenvolvimento para recriar tabelas)
    // await sequelize.sync({ alter: true }); // Removido para evitar conflitos com migrations
    
    // Inicializar configurações padrão com tenantId padrão
    await initializeDefaultConfigurations({ tenantId: 'default' });

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

startServer();

module.exports = app;
