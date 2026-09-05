const productService = require('../services/product.service');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/apiResponse');

function publicBaseUrl(req) {
  const fallback = process.env.NODE_ENV === 'production'
    ? 'https://chupchupcremosao.com'
    : `${req.protocol}://${req.get('host')}`;
  return (process.env.PUBLIC_BASE_URL || fallback).replace(/\/$/, '');
}

function imageValue(req) {
  if (req.file) return `${publicBaseUrl(req)}/uploads/products/${req.file.filename}`;
  return req.body.imagem || null;
}

function productValue(req) {
  const data = { ...req.body };
  for (const field of ['disponivel', 'destaque']) {
    if (data[field] === 'true') data[field] = true;
    if (data[field] === 'false') data[field] = false;
  }
  return data;
}

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
  const product = await productService.createProduct({ ...productValue(req), imagem: imageValue(req) });
  return success(res, product, 201);
});

const update = catchAsync(async (req, res) => {
  const data = productValue(req);
  if (req.file || Object.prototype.hasOwnProperty.call(req.body, 'imagem')) data.imagem = imageValue(req);
  const product = await productService.updateProduct(req.params.id, data);
  return success(res, product);
});

const remove = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  return success(res, { message: 'Product deleted successfully' });
});

module.exports = { getAll, getById, create, update, remove };
