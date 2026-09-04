const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

async function listProducts(filters = {}) {
  const { category, available, featured, search, page = 1, limit = 20 } = filters;

  const where = {};

  if (category) {
    where.categoria = { nome: { equals: category } };
  }
  if (available !== undefined) {
    where.disponivel = available;
  }
  if (featured !== undefined) {
    where.destaque = featured;
  }
  if (search) {
    where.nome = { contains: search };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { categoria: true },
      orderBy: { criadoEm: 'desc' },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { categoria: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

async function ensureCategoryExists(categoriaId) {
  const category = await prisma.category.findUnique({ where: { id: Number(categoriaId) } });
  if (!category) throw new AppError('categoriaId does not reference an existing category', 422);
  return category;
}

async function createProduct(data) {
  await ensureCategoryExists(data.categoriaId);

  return prisma.product.create({
    data: {
      nome: data.nome,
      descricao: data.descricao ?? null,
      preco: data.preco,
      imagem: data.imagem ?? null,
      disponivel: data.disponivel ?? true,
      destaque: data.destaque ?? false,
      categoriaId: Number(data.categoriaId),
    },
    include: { categoria: true },
  });
}

async function updateProduct(id, data) {
  await getProductById(id); // ensures 404 if missing

  if (data.categoriaId !== undefined) {
    await ensureCategoryExists(data.categoriaId);
  }

  return prisma.product.update({
    where: { id: Number(id) },
    data: {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.preco !== undefined && { preco: data.preco }),
      ...(data.imagem !== undefined && { imagem: data.imagem }),
      ...(data.disponivel !== undefined && { disponivel: data.disponivel }),
      ...(data.destaque !== undefined && { destaque: data.destaque }),
      ...(data.categoriaId !== undefined && { categoriaId: Number(data.categoriaId) }),
    },
    include: { categoria: true },
  });
}

async function deleteProduct(id) {
  await getProductById(id); // ensures 404 if missing

  const usedInOrders = await prisma.orderItem.count({ where: { produtoId: Number(id) } });
  if (usedInOrders > 0) {
    throw new AppError(
      'Cannot delete product: it is referenced by existing orders. Consider marking it as unavailable instead.',
      409,
    );
  }

  await prisma.product.delete({ where: { id: Number(id) } });
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
