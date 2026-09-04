const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

async function listCategories() {
  return prisma.category.findMany({ orderBy: { nome: 'asc' } });
}

async function getCategoryById(id) {
  const category = await prisma.category.findUnique({ where: { id: Number(id) } });
  if (!category) throw new AppError('Category not found', 404);
  return category;
}

async function createCategory(data) {
  return prisma.category.create({
    data: {
      nome: data.nome,
      descricao: data.descricao ?? null,
      ativo: data.ativo ?? true,
    },
  });
}

async function updateCategory(id, data) {
  await getCategoryById(id); // ensures 404 if missing
  return prisma.category.update({
    where: { id: Number(id) },
    data: {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.ativo !== undefined && { ativo: data.ativo }),
    },
  });
}

async function deleteCategory(id) {
  await getCategoryById(id); // ensures 404 if missing

  const productsUsingCategory = await prisma.product.count({
    where: { categoriaId: Number(id) },
  });

  if (productsUsingCategory > 0) {
    throw new AppError(
      'Cannot delete category: there are products associated with it',
      409,
    );
  }

  await prisma.category.delete({ where: { id: Number(id) } });
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
