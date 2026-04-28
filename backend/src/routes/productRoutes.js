const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Criar novo produto
 *     description: Cria um produto com suas variações e estoque inicial
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - marca
 *               - precoCusto
 *               - precoVenda
 *               - variacoes
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do produto
 *                 example: Camiseta Básica
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada
 *                 example: Camiseta 100% algodão
 *               marca:
 *                 type: string
 *                 description: Marca do produto
 *                 example: Nike
 *               categoria:
 *                 type: string
 *                 description: Categoria do produto
 *                 example: Camisetas
 *               precoCusto:
 *                 type: number
 *                 description: Preço de custo
 *                 example: 25.50
 *               precoVenda:
 *                 type: number
 *                 description: Preço de venda
 *                 example: 49.90
 *               imagens:
 *                 type: array
 *                 description: URLs das imagens do produto
 *                 items:
 *                   type: string
 *                   example: https://exemplo.com/imagem.jpg
 *               variacoes:
 *                 type: array
 *                 description: Variações do produto (tamanho, cor)
 *                 items:
 *                   type: object
 *                   required:
 *                     - sku
 *                     - tamanho
 *                     - cor
 *                   properties:
 *                     sku:
 *                       type: string
 *                       description: Código SKU único
 *                       example: CAM-BAS-P-AZ
 *                     tamanho:
 *                       type: string
 *                       description: Tamanho
 *                       example: P
 *                     cor:
 *                       type: string
 *                       description: Cor
 *                       example: Azul
 *                     quantidade:
 *                       type: integer
 *                       description: Quantidade inicial em estoque
 *                       example: 50
 *                     limiteMinimo:
 *                       type: integer
 *                       description: Limite mínimo de estoque
 *                       example: 10
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   get:
 *     summary: Listar todos os produtos
 *     description: Retorna lista completa de produtos com variações e estoque
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produtos recuperados com sucesso
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Produto'
 */
router.get('/products/options', productController.getProductOptions);
router.post('/products/options/:type', productController.addProductOption);

router.post('/products', productController.createProduct);
router.get('/products', productController.getAllProducts);
router.put('/products/:id', productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Buscar produto por ID
 *     description: Retorna detalhes de um produto específico
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto recuperado com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Produto'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   delete:
 *     summary: Remover produto
 *     description: Remove um produto e todas suas variações do sistema
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get('/products/:id', productController.getProductById);

/**
 * @swagger
 * /api/products/stock/{variationId}:
 *   patch:
 *     summary: Atualizar estoque
 *     description: Atualiza quantidade e limite mínimo de estoque de uma variação
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da variação do produto
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantidade:
 *                 type: integer
 *                 description: Nova quantidade em estoque
 *                 example: 50
 *               limiteMinimo:
 *                 type: integer
 *                 description: Novo limite mínimo de estoque
 *                 example: 10
 *     responses:
 *       200:
 *         description: Estoque atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       404:
 *         description: Variação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.patch('/products/stock/:variationId', productController.updateStock);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Deletar produto
 *     description: Remove um produto e todas as suas variações e estoque
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto removido com sucesso
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.delete('/products/:id', productController.deleteProduct);

module.exports = router;
