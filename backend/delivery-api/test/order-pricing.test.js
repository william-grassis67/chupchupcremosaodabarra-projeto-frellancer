const test = require('node:test');
const assert = require('node:assert/strict');
const {
    assertMinimumOrderValue,
    buildOrderPricing,
} = require('../src/services/order-pricing');

function product(id, nome, preco) {
    return { id, nome, preco, disponivel: true };
}

test('uses the current product price and multiplies each quantity in cents', () => {
    const pricing = buildOrderPricing(
        [{ produtoId: 1, quantidade: 2 }],
        [product(1, 'Trufa de Maracujá', '8.00')],
        'Centro',
    );

    assert.equal(pricing.orderItemsData[0].precoUnitario, '8.00');
    assert.equal(pricing.orderItemsData[0].subtotal, '16.00');
    assert.equal(pricing.valorProdutosCents, 1600);
});

test('sums multiple products with distinct quantities and decimal prices', () => {
    const pricing = buildOrderPricing(
        [
            { produtoId: 1, quantidade: 2 },
            { produtoId: 2, quantidade: 3 },
            { produtoId: 3, quantidade: 1 },
        ],
        [product(1, 'Trufa', '8.00'), product(2, 'Doce', '7.00'), product(3, 'Bolo', '8.50')],
        'Centro',
    );

    assert.deepEqual(pricing.orderItemsData.map((item) => item.subtotal), ['16.00', '21.00', '8.50']);
    assert.equal(pricing.valorProdutosCents, 4550);
    assert.equal(pricing.taxaEntregaCents, 0);
    assert.equal(pricing.valorTotalCents, 4550);
});

test('enforces the minimum and applies configured delivery rates at each boundary', () => {
    const cases = [
        { subtotal: '23.99', cents: 2399, fee: 0, free: false, belowMinimum: true },
        { subtotal: '24.00', cents: 2400, fee: 200, free: false, belowMinimum: false },
        { subtotal: '39.99', cents: 3999, fee: 200, free: false, belowMinimum: false },
        { subtotal: '40.00', cents: 4000, fee: 0, free: true, belowMinimum: false },
    ];

    for (const boundary of cases) {
        const pricing = buildOrderPricing(
            [{ produtoId: 1, quantidade: 1 }],
            [product(1, 'Produto', boundary.subtotal)],
            'Centro',
        );

        assert.equal(pricing.valorProdutosCents, boundary.cents);
        assert.equal(pricing.taxaEntregaCents, boundary.fee);
        assert.equal(pricing.valorTotalCents, boundary.cents + boundary.fee);
        assert.equal(pricing.entregaGratis, boundary.free);
        if (boundary.belowMinimum) {
            assert.throws(() => assertMinimumOrderValue(pricing.valorProdutosCents), { statusCode: 422 });
        } else {
            assert.doesNotThrow(() => assertMinimumOrderValue(pricing.valorProdutosCents));
        }
    }
});

test('uses the configured neighborhood rate at the minimum subtotal', () => {
    const pricing = buildOrderPricing(
        [{ produtoId: 1, quantidade: 3 }],
        [product(1, 'Produto', '8.00')],
        'Quilombo',
    );

    assert.equal(pricing.valorProdutosCents, 2400);
    assert.equal(pricing.taxaEntregaCents, 400);
    assert.equal(pricing.valorTotalCents, 2800);
    assert.equal(pricing.entregaGratis, false);
});

test('quotes free-delivery eligibility without inventing a fee before neighborhood selection', () => {
    const pricing = buildOrderPricing(
        [{ produtoId: 1, quantidade: 1 }],
        [product(1, 'Produto', '40.00')],
        null,
    );

    assert.equal(pricing.entregaGratis, true);
    assert.equal(pricing.taxaEntregaCents, null);
    assert.equal(pricing.valorTotalCents, null);
});

test('rejects invalid quantities', () => {
    assert.throws(
        () => buildOrderPricing([{ produtoId: 1, quantidade: 1.5 }], [product(1, 'Produto', '8.00')], 'Centro'),
        { statusCode: 422 },
    );
});
