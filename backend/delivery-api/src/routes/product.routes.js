const express = require('express');
const upload = require('../middlewares/upload');
const controller = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const adminAuth = require('../middlewares/adminAuth');
const createApiLimiter = require('../config/rateLimit');
const {
  createProductRules,
  updateProductRules,
  idParamRule,
  listProductsQueryRules,
} = require('../validators/product.validator');

const router = express.Router();
const writeLimiter = createApiLimiter();

// Public routes
router.get('/', listProductsQueryRules, validate, controller.getAll);
router.get('/:id', idParamRule, validate, controller.getById);

// Management routes (adminAuth is currently a no-op, see middlewares/adminAuth.js)
router.post('/', adminAuth, writeLimiter, upload.single('imagem'), createProductRules, validate, controller.create);
router.put('/:id', adminAuth, writeLimiter, upload.single('imagem'), updateProductRules, validate, controller.update);
router.delete('/:id', adminAuth, writeLimiter, idParamRule, validate, controller.remove);

module.exports = router;
