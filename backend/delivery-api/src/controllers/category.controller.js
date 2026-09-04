const categoryService = require('../services/category.service');
const catchAsync = require('../utils/catchAsync');
const { success } = require('../utils/apiResponse');

const getAll = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategories();
  return success(res, categories);
});

const getById = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return success(res, category);
});

const create = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return success(res, category, 201);
});

const update = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return success(res, category);
});

const remove = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  return success(res, { message: 'Category deleted successfully' });
});

module.exports = { getAll, getById, create, update, remove };
