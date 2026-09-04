const orderService = require('../services/order.service');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/apiResponse');

const create = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  return success(res, order, 201);
});

const getAll = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const { items, meta } = await orderService.listOrders({ status, page, limit });
  return success(res, items, 200, meta);
});

const getById = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  return success(res, order);
});

const updateStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  return success(res, order);
});

const remove = catchAsync(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  return success(res, { message: 'Order deleted successfully' });
});

module.exports = { create, getAll, getById, updateStatus, remove };
