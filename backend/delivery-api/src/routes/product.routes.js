const express = require('express');
const controller = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const adminAuth = require('../middlewares/adminAuth');
const {
  createProductRules,
  updateProductRules,
  idParamRule,
  listProductsQueryRules,
} = require('../validators/product.validator');

const router = express.Router();

// Public routes
router.get('/', listProductsQueryRules, validate, controller.getAll);
router.get('/:id', idParamRule, validate, controller.getById);

// Management routes (adminAuth is currently a no-op, see middlewares/adminAuth.js)
router.post('/', adminAuth, createProductRules, validate, controller.create);
router.put('/:id', adminAuth, updateProductRules, validate, controller.update);
router.delete('/:id', adminAuth, idParamRule, validate, controller.remove);

module.exports = router;
