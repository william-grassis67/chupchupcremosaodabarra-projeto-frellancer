const express = require('express');
const controller = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const adminAuth = require('../middlewares/adminAuth');
const {
  createCategoryRules,
  updateCategoryRules,
  idParamRule,
} = require('../validators/category.validator');

const router = express.Router();

// Public routes
router.get('/', controller.getAll);
router.get('/:id', idParamRule, validate, controller.getById);

// Management routes (adminAuth is currently a no-op, see middlewares/adminAuth.js)
router.post('/', adminAuth, createCategoryRules, validate, controller.create);
router.put('/:id', adminAuth, updateCategoryRules, validate, controller.update);
router.delete('/:id', adminAuth, idParamRule, validate, controller.remove);

module.exports = router;
