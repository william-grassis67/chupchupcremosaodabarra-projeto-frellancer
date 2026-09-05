const { body, param, query } = require('express-validator');

const createProductRules = [
  body('nome').trim().notEmpty().withMessage('nome is required').isLength({ max: 150 }),
  body('descricao').optional({ nullable: true }).isString(),
  body('preco')
    .notEmpty().withMessage('preco is required')
    .isFloat({ gt: 0 }).withMessage('preco must be a positive number'),
  body('imagem').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 500 }),
  body('categoriaId')
    .notEmpty().withMessage('categoriaId is required')
    .isInt({ gt: 0 }).withMessage('categoriaId must be a positive integer'),
  body('disponivel').optional().isBoolean(),
  body('destaque').optional().isBoolean(),
];

const updateProductRules = [
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('nome').optional().trim().notEmpty().isLength({ max: 150 }),
  body('descricao').optional({ nullable: true }).isString(),
  body('preco').optional().isFloat({ gt: 0 }).withMessage('preco must be a positive number'),
  body('imagem').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 500 }),
  body('categoriaId').optional().isInt({ gt: 0 }),
  body('disponivel').optional().isBoolean(),
  body('destaque').optional().isBoolean(),
];

const idParamRule = [param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer')];

const listProductsQueryRules = [
  query('category').optional().isString(),
  query('available').optional().isBoolean().toBoolean(),
  query('featured').optional().isBoolean().toBoolean(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  createProductRules,
  updateProductRules,
  idParamRule,
  listProductsQueryRules,
};
