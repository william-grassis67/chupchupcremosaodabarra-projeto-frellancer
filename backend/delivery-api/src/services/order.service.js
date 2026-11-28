const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const {
  assertMinimumOrderValue,
  buildOrderPricing,
  calculateDeliveryFeeCents,
  centsToDecimal,
} = require('./order-pricing');

/**
 * Builds the order items and totals from scratch using ONLY data from the
 * database. The frontend cart is only used to know WHICH products and
 * quantities were selected — never trusted for prices or names.
 */
async function buildOrderItems(requestedItems, bairro) {
  const productIds = [...new Set(requestedItems.map((item) => Number(item.produtoId)))];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  return buildOrderPricing(requestedItems, products, bairro);
}

async function quoteOrder(payload) {
  const { itens, bairro } = payload;
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError('itens must be a non-empty array', 422);
  }
  if (itens.length > 100) throw new AppError('itens cannot contain more than 100 entries', 422);

  const pricing = await buildOrderItems(itens, bairro);
  return {
    itens: pricing.orderItemsData,
    valorProdutos: centsToDecimal(pricing.valorProdutosCents),
    taxaEntrega: pricing.taxaEntregaCents === null ? null : centsToDecimal(pricing.taxaEntregaCents),
    valorTotal: pricing.valorTotalCents === null ? null : centsToDecimal(pricing.valorTotalCents),
    entregaGratis: pricing.entregaGratis,
  };
}

async function createOrder(payload) {
  const { itens, bairro } = payload;

  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError('itens must be a non-empty array', 422);
  }

  const pricing = await buildOrderItems(itens, bairro);
  const { orderItemsData, valorProdutosCents, taxaEntregaCents, valorTotalCents } = pricing;
  assertMinimumOrderValue(valorProdutosCents);
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        nomeCliente: payload.nomeCliente,
        endereco: payload.endereco,
        numero: payload.numero,
        complemento: payload.complemento ?? null,
        bairro: payload.bairro,
        observacao: payload.observacao ?? null,
        formaPagamento: payload.formaPagamento,
        valorProdutos: centsToDecimal(valorProdutosCents),
        taxaEntrega: centsToDecimal(taxaEntregaCents),
        valorTotal: centsToDecimal(valorTotalCents),
        status: 'pending',
        itens: {
          create: orderItemsData,
        },
      },
      include: { itens: true },
    });

    return created;
  });

  return { ...order, entregaGratis: pricing.entregaGratis };
}

async function listOrders(filters = {}) {
  const { status, page = 1, limit = 20 } = filters;

  const where = {};
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { itens: true },
      orderBy: { criadoEm: 'desc' },
      skip,
      take,
    }),
    prisma.order.count({ where }),
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

async function getOrderById(id) {
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { itens: true },
  });
  if (!order) throw new AppError('Order not found', 404);
  return order;
}

async function updateOrderStatus(id, status) {
  await getOrderById(id); // ensures 404 if missing

  return prisma.order.update({
    where: { id: Number(id) },
    data: { status },
    include: { itens: true },
  });
}

async function deleteOrder(id) {
  await getOrderById(id); // ensures 404 if missing
  // OrderItem rows cascade-delete automatically (see prisma schema onDelete: Cascade)
  await prisma.order.delete({ where: { id: Number(id) } });
}

module.exports = {
  createOrder,
  quoteOrder,
  calculateDeliveryFeeCents,
  listOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
