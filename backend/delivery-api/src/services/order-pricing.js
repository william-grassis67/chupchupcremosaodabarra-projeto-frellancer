const AppError = require('../utils/AppError');
const { normalizeNeighborhood } = require('../utils/neighborhood');

const MIN_ORDER_VALUE_CENTS = 2400;
const FREE_DELIVERY_THRESHOLD_CENTS = 4000;

const DELIVERY_FEES_CENTS = {
    'Antonio Lopez': 400,
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
    'Quilombo Novo': 400,
    Quilombo: 400,
    'Novo Santana': 400,
    Santana: 400,
    Santiago: 200,
    'Santo Amaro': 200,
    'São Jose': 200,
    Urbens: 200,
    'Vila dos Pescadores': 200,
    'Nova Esperança': 400,
    'Novo Horizonte': 400,
    'Maria Manteiga': 400,
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
    const normalizedNeighborhood = normalizeNeighborhood(bairro);
    const canonicalNeighborhood = Object.keys(DELIVERY_FEES_CENTS).find(
        (name) => normalizeNeighborhood(name) === normalizedNeighborhood,
    );

    if (!canonicalNeighborhood) {
        throw new AppError('bairro is not available for delivery', 422);
    }

    if (valorProdutosCents < MIN_ORDER_VALUE_CENTS || valorProdutosCents >= FREE_DELIVERY_THRESHOLD_CENTS) return 0;
    return DELIVERY_FEES_CENTS[canonicalNeighborhood];
}

function assertMinimumOrderValue(valorProdutosCents) {
    if (valorProdutosCents < MIN_ORDER_VALUE_CENTS) {
        const missingCents = MIN_ORDER_VALUE_CENTS - valorProdutosCents;
        throw new AppError(
            `Minimum order value is R$ 24.00. Add R$ ${(missingCents / 100).toFixed(2)} more to continue.`,
            422,
        );
    }
}

function buildOrderPricing(requestedItems, products, bairro) {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const orderItemsData = [];
    let valorProdutosCents = 0;

    for (const requested of requestedItems) {
        const produtoId = Number(requested.produtoId);
        const quantidade = Number(requested.quantidade);

        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            throw new AppError(`Invalid quantity for product ${produtoId}`, 422);
        }

        const product = productsById.get(produtoId);
        if (!product) throw new AppError(`Product ${produtoId} does not exist`, 404);
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

    const taxaEntregaCents = bairro
        ? calculateDeliveryFeeCents(valorProdutosCents, bairro)
        : null;
    return {
        orderItemsData,
        valorProdutosCents,
        taxaEntregaCents,
        valorTotalCents: taxaEntregaCents === null ? null : valorProdutosCents + taxaEntregaCents,
        entregaGratis: valorProdutosCents >= FREE_DELIVERY_THRESHOLD_CENTS,
    };
}

module.exports = {
    MIN_ORDER_VALUE_CENTS,
    FREE_DELIVERY_THRESHOLD_CENTS,
    assertMinimumOrderValue,
    buildOrderPricing,
    calculateDeliveryFeeCents,
    centsToDecimal,
    decimalToCents,
};
