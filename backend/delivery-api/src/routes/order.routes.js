const express = require('express');
const controller = require('../controllers/order.controller');
const validate = require('../middlewares/validate');
const adminAuth = require('../middlewares/adminAuth');
const {
  createOrderRules,
  updateStatusRules,
  idParamRule,
} = require('../validators/order.validator');

const router = express.Router();

// Public route: customers submit their order from the frontend cart
router.post('/', createOrderRules, validate, controller.create);

// Management routes (adminAuth is currently a no-op, see middlewares/adminAuth.js)
router.get('/', adminAuth, controller.getAll);
router.get('/:id', adminAuth, idParamRule, validate, controller.getById);
router.put('/:id/status', adminAuth, updateStatusRules, validate, controller.updateStatus);
router.delete('/:id', adminAuth, idParamRule, validate, controller.remove);

module.exports = router;
