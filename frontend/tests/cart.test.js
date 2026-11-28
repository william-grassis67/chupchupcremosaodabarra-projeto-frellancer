const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const cartSource = fs.readFileSync(path.join(__dirname, '../js/cart.js'), 'utf8');

function createCart(initialItems = []) {
    const storage = new Map([['chupchup:cart', JSON.stringify(initialItems)]]);
    const context = {
        CART_STORAGE_KEY: 'chupchup:cart',
        localStorage: {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
        },
        console,
    };
    vm.createContext(context);
    vm.runInContext(`${cartSource}\nthis.cartUnderTest = Cart;`, context);
    return { cart: context.cartUnderTest, storage };
}

test('refreshes old localStorage prices from current product data and preserves quantity', () => {
    const { cart, storage } = createCart([
        { productId: 7, name: 'Trufa de Maracujá', price: 7, image: '/old.jpg', quantity: 2 },
    ]);

    cart.syncProducts([{ id: 7, name: 'Trufa de Maracujá', price: 8, image: '/new.jpg' }]);

    assert.equal(cart.getItems()[0].price, 8);
    assert.equal(cart.getItems()[0].subtotal, 16);
    assert.equal(cart.getSubtotal(), 16);
    assert.equal(cart.getItems()[0].quantity, 2);
    assert.equal(JSON.parse(storage.get('chupchup:cart'))[0].price, 8);
});

test('sums several cart lines and quantities using exact cent values', () => {
    const { cart } = createCart([
        { productId: 1, name: 'Doce', price: 0.1, quantity: 3 },
        { productId: 2, name: 'Trufa', price: 8, quantity: 2 },
        { productId: 3, name: 'Bolo', price: 7, quantity: 1 },
    ]);

    assert.deepEqual(
        Array.from(cart.getItems(), (item) => item.subtotal),
        [0.3, 16, 7],
    );
    assert.equal(cart.getSubtotal(), 23.3);
});

test('reads legacy localStorage values with Brazilian decimal separators', () => {
    const { cart } = createCart([
        { productId: 1, name: 'Produto', price: '0,10', quantity: 3 },
    ]);

    assert.equal(cart.getItems()[0].price, 0.1);
    assert.equal(cart.getItems()[0].subtotal, 0.3);
    assert.equal(cart.getSubtotal(), 0.3);
});

test('refreshing an existing product updates its price before increasing quantity', () => {
    const { cart } = createCart([
        { productId: 1, name: 'Doce', price: 7, image: '/doce.jpg', quantity: 1 },
    ]);

    cart.addItem({ id: 1, name: 'Doce', price: 8, image: '/doce.jpg', available: true }, 1);

    assert.equal(cart.getItems()[0].price, 8);
    assert.equal(cart.getItems()[0].quantity, 2);
    assert.equal(cart.getSubtotal(), 16);
});
