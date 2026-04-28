const express = require('express');
const router = express.Router();
const configurationController = require('../controllers/configurationController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../config/upload');

/**
 * @swagger
 * tags:
 *   name: Configurações
 *   description: Gerenciamento de configurações do sistema
 */

/**
 * @swagger
 * /api/configurations:
 *   get:
 *     summary: Listar todas as configurações
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configurações
 */
router.get('/', authMiddleware, configurationController.getAllConfigurations);

/**
 * @swagger
 * /api/configurations/catalogo/link:
 *   get:
 *     summary: Obter link do catálogo público da loja
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Link do catálogo retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     slug:
 *                       type: string
 *                     url:
 *                       type: string
 *                     urlRelativa:
 *                       type: string
 *       404:
 *         description: Slug do catálogo não encontrado
 */
router.get('/catalogo/link', authMiddleware, configurationController.getCatalogoLink);

/**
 * @swagger
 * /api/configurations/logo/upload:
 *   post:
 *     summary: Upload do logo da loja
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo atualizado com sucesso
 *       400:
 *         description: Nenhum arquivo foi enviado
 */
router.post('/logo/upload', authMiddleware, upload.single('logo'), configurationController.uploadLogo);

/**
 * @swagger
 * /api/configurations/logo/delete:
 *   delete:
 *     summary: Deletar logo da loja
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logo deletado com sucesso
 *       404:
 *         description: Logo não encontrado
 */
router.delete('/logo/delete', authMiddleware, configurationController.deleteLogo);

/**
 * @swagger
 * /api/configurations/{chave}:
 *   get:
 *     summary: Buscar configuração por chave
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chave
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *     responses:
 *       200:
 *         description: Configuração encontrada
 *       404:
 *         description: Configuração não encontrada
 */
router.get('/:chave', authMiddleware, configurationController.getConfigurationByKey);

/**
 * @swagger
 * /api/configurations:
 *   post:
 *     summary: Criar ou atualizar uma configuração
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chave
 *               - valor
 *             properties:
 *               chave:
 *                 type: string
 *                 description: Chave única da configuração
 *                 example: exigir_caixa_aberto
 *               valor:
 *                 type: string
 *                 description: Valor da configuração
 *                 example: true
 *               tipo:
 *                 type: string
 *                 enum: [texto, numero, booleano, json]
 *                 description: Tipo do valor
 *                 example: booleano
 *               descricao:
 *                 type: string
 *                 description: Descrição da configuração
 *     responses:
 *       200:
 *         description: Configuração atualizada
 *       201:
 *         description: Configuração criada
 */
router.post('/', authMiddleware, configurationController.upsertConfiguration);

/**
 * @swagger
 * /api/configurations/{chave}:
 *   delete:
 *     summary: Deletar uma configuração
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chave
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *     responses:
 *       200:
 *         description: Configuração deletada
 *       404:
 *         description: Configuração não encontrada
 */
router.delete('/:chave', authMiddleware, configurationController.deleteConfiguration);

/**
 * @swagger
 * /api/configurations/logo/upload:
 *   post:
 *     summary: Upload do logo da loja
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo atualizado com sucesso
 *       400:
 *         description: Nenhum arquivo foi enviado
 */
router.post('/logo/upload', authMiddleware, upload.single('logo'), configurationController.uploadLogo);

/**
 * @swagger
 * /api/configurations/logo/delete:
 *   delete:
 *     summary: Deletar logo da loja
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logo deletado com sucesso
 *       404:
 *         description: Logo não encontrado
 */
router.delete('/logo/delete', authMiddleware, configurationController.deleteLogo);

/**
 * @swagger
 * /api/configurations/onboarding:
 *   post:
 *     summary: Salvar configurações do onboarding
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeLoja:
 *                 type: string
 *                 description: Nome da loja
 *               estiloPDV:
 *                 type: string
 *                 enum: [branded, shortcuts]
 *                 description: Estilo do PDV
 *               produtos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *     responses:
 *       200:
 *         description: Configurações salvas com sucesso
 *       500:
 *         description: Erro ao salvar configurações
 */
router.post('/onboarding', authMiddleware, configurationController.saveOnboardingConfig);

module.exports = router;
