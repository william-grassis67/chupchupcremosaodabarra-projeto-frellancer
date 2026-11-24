const express = require('express');
const controller = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const adminAuth = require('../middlewares/adminAuth');
const createApiLimiter = require('../config/rateLimit');
const {
  createCategoryRules,
  updateCategoryRules,
  idParamRule,
} = require('../validators/category.validator');

const router = express.Router();
const writeLimiter = createApiLimiter();

// Public routes
router.get('/', controller.getAll);
router.get('/:id', idParamRule, validate, controller.getById);

// Management routes (adminAuth is currently a no-op, see middlewares/adminAuth.js)
router.post('/', adminAuth, writeLimiter, createCategoryRules, validate, controller.create);
router.put('/:id', adminAuth, writeLimiter, updateCategoryRules, validate, controller.update);
router.delete('/:id', adminAuth, writeLimiter, idParamRule, validate, controller.remove);

module.exports = router;
