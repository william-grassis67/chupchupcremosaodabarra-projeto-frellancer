const productService = require('../services/product.service');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/apiResponse');

const getAll = catchAsync(async (req, res) => {
  const { category, available, featured, search, page, limit } = req.query;

  const { items, meta } = await productService.listProducts({
    category,
    available,
    featured,
    search,
    page,
    limit,
  });

  return success(res, items, 200, meta);
});

const getById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return success(res, product);
});

const create = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  return success(res, product, 201);
});

const update = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return success(res, product);
});

const remove = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  return success(res, { message: 'Product deleted successfully' });
});

module.exports = { getAll, getById, create, update, remove };
