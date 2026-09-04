const { body, param } = require('express-validator');

const VALID_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const VALID_NEIGHBORHOODS = [
  'Antonio Lopez',
  'Areal',
  'Bugia',
  'Centro',
  'Chácara do Atlântico',
  'Coabh',
  'Coabh 2',
  'Favica',
  'Floresta',
  'Guaxindimba',
  'Marcilio Dias 1',
  'Marcilio Dias 2',
  'Maria Manteiga',
  'Nossa Senhora Aparecida',
  'Nova Bethânia',
  'Nova Esperança',
  'Novo Horizonte',
  'Quilombo Novo',
  'Santana',
  'Santiago',
  'Santo Amaro',
  'São Jose',
  'Urbens',
  'Vila dos Pescadores',
];

const createOrderRules = [
  body('nomeCliente').trim().notEmpty().withMessage('nomeCliente is required').isLength({ max: 150 }),
  body('endereco').trim().notEmpty().withMessage('endereco is required').isLength({ max: 200 }),
  body('numero').trim().notEmpty().withMessage('numero is required').isLength({ max: 20 }),
  body('complemento').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('bairro')
    .trim()
    .notEmpty().withMessage('bairro is required')
    .isIn(VALID_NEIGHBORHOODS).withMessage('bairro is not available for delivery'),
  body('observacao').optional({ nullable: true }).isString(),
  body('formaPagamento').trim().notEmpty().withMessage('formaPagamento is required').isLength({ max: 50 }),
  body('taxaEntrega').not().exists().withMessage('taxaEntrega is calculated by the server'),
  body('valorProdutos').not().exists().withMessage('valorProdutos is calculated by the server'),
  body('valorTotal').not().exists().withMessage('valorTotal is calculated by the server'),
  body('itens')
    .isArray({ min: 1 }).withMessage('itens must be a non-empty array'),
  body('itens.*.produtoId')
    .notEmpty().withMessage('produtoId is required for each item')
    .isInt({ gt: 0 }).withMessage('produtoId must be a positive integer'),
  body('itens.*.quantidade')
    .notEmpty().withMessage('quantidade is required for each item')
    .isInt({ gt: 0 }).withMessage('quantidade must be a positive integer'),
];

const updateStatusRules = [
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('status')
    .trim().notEmpty().withMessage('status is required')
    .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
];

const idParamRule = [param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer')];

module.exports = {
  createOrderRules,
  updateStatusRules,
  idParamRule,
  VALID_STATUSES,
  VALID_NEIGHBORHOODS,
};
