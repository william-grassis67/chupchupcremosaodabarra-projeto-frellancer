const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const MIN_ORDER_VALUE_CENTS = 2400;

const DELIVERY_FEES_CENTS = {
  'Antonio Lopez': 200,
  Areal: 200,
  Bugia: 200,
  Centro: 200,
  'Chácara do Atlântico': 200,
  Coabh: 200,
  'Coabh 2': 200,
  Favica: 200,
  Floresta: 200,
  Guaxindimba: 200,
  'Marcilio Dias 1': 200,
  'Marcilio Dias 2': 200,
  'Nossa Senhora Aparecida': 200,
  'Nova Bethânia': 200,
  'Quilombo Novo': 200,
  Santana: 200,
  Santiago: 200,
  'Santo Amaro': 200,
  'São Jose': 200,
  Urbens: 200,
  'Vila dos Pescadores': 200,
  'Nova Esperança': 200,
  'Novo Horizonte': 200,
  'Maria Manteiga': 300,
};

function decimalToCents(value) {
  const fixed = typeof value?.toFixed === 'function' ? value.toFixed(2) : String(value);
  const match = /^\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(fixed);
  if (!match) throw new AppError('Invalid monetary value', 422);
  return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0') || 0);
}

function centsToDecimal(cents) {
  return (cents / 100).toFixed(2);
}

function calculateDeliveryFeeCents(valorProdutosCents, bairro) {
  if (!(bairro in DELIVERY_FEES_CENTS)) {
    throw new AppError('bairro is not available for delivery', 422);
  }

  return valorProdutosCents > 2400 && valorProdutosCents < 3500
    ? DELIVERY_FEES_CENTS[bairro]
    : 0;
}

/**
 * Builds the order items and totals from scratch using ONLY data from the
 * database. The frontend cart is only used to know WHICH products and
 * quantities were selected — never trusted for prices or names.
 */
async function buildOrderItems(requestedItems) {
  const productIds = [...new Set(requestedItems.map((item) => Number(item.produtoId)))];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productsById = new Map(products.map((p) => [p.id, p]));

  const orderItemsData = [];
  let valorProdutosCents = 0;

  for (const requested of requestedItems) {
    const produtoId = Number(requested.produtoId);
    const quantidade = Number(requested.quantidade);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new AppError(`Invalid quantity for product ${produtoId}`, 422);
    }

    const product = productsById.get(produtoId);

    if (!product) {
      throw new AppError(`Product ${produtoId} does not exist`, 404);
    }

    if (!product.disponivel) {
      throw new AppError(`Product "${product.nome}" is not available`, 409);
    }

    const precoUnitarioCents = decimalToCents(product.preco);
    const subtotalCents = precoUnitarioCents * quantidade;

    valorProdutosCents += subtotalCents;

    orderItemsData.push({
      produtoId: product.id,
      nomeProduto: product.nome,
      quantidade,
      precoUnitario: centsToDecimal(precoUnitarioCents),
      subtotal: centsToDecimal(subtotalCents),
    });
  }

  return { orderItemsData, valorProdutosCents };
}

async function createOrder(payload) {
  const { itens, bairro } = payload;

  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError('itens must be a non-empty array', 422);
  }

  const { orderItemsData, valorProdutosCents } = await buildOrderItems(itens);
  if (valorProdutosCents < MIN_ORDER_VALUE_CENTS) {
    const missingCents = MIN_ORDER_VALUE_CENTS - valorProdutosCents;
    throw new AppError(
      `Minimum order value is R$ 24.00. Add R$ ${(missingCents / 100).toFixed(2)} more to continue.`,
      422,
    );
  }
  const taxaEntregaCents = calculateDeliveryFeeCents(valorProdutosCents, bairro);
  const valorTotalCents = valorProdutosCents + taxaEntregaCents;

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

  return order;
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
  calculateDeliveryFeeCents,
  listOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
