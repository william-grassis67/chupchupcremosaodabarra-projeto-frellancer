const { body, param } = require('express-validator');

const createCategoryRules = [
  body('nome').trim().notEmpty().withMessage('nome is required').isLength({ max: 100 }),
  body('descricao').optional({ nullable: true }).isString(),
  body('ativo').optional().isBoolean(),
];

const updateCategoryRules = [
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('nome').optional().trim().notEmpty().isLength({ max: 100 }),
  body('descricao').optional({ nullable: true }).isString(),
  body('ativo').optional().isBoolean(),
];

const idParamRule = [param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer')];

module.exports = { createCategoryRules, updateCategoryRules, idParamRule };
