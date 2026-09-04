/* =========================================================
   CART — estado do carrinho, 100% controlado no frontend
   e persistido em localStorage.
   ========================================================= */

const Cart = (function () {
  let items = [];
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) items = [];
    } catch (err) {
      items = [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      // localStorage indisponível (modo privado, cota excedida, etc.)
      console.warn("Não foi possível salvar o carrinho:", err);
    }
    notify();
  }

  function notify() {
    listeners.forEach((fn) => fn(getState()));
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function getItems() {
    return items.slice();
  }

  function findIndex(productId) {
    return items.findIndex((item) => item.productId === productId);
  }

  /**
   * Adiciona um produto ao carrinho (ou incrementa a quantidade
   * se já existir). Recebe o produto já normalizado.
   */
  function addItem(product, quantity = 1) {
    if (!product.available) return;

    const index = findIndex(product.id);
    if (index >= 0) {
      items[index].quantity += quantity;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      });
    }
    persist();
  }

  function increment(productId) {
    const index = findIndex(productId);
    if (index >= 0) {
      items[index].quantity += 1;
      persist();
    }
  }

  function decrement(productId) {
    const index = findIndex(productId);
    if (index < 0) return;
    items[index].quantity -= 1;
    if (items[index].quantity <= 0) {
      items.splice(index, 1);
    }
    persist();
  }

  function removeItem(productId) {
    items = items.filter((item) => item.productId !== productId);
    persist();
  }

  function clear() {
    items = [];
    persist();
  }

  function getTotalQuantity() {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  function toCents(value) {
    return Math.round(Number(value) * 100);
  }

  function getSubtotal() {
    const subtotalCents = items.reduce(
      (sum, item) => sum + toCents(item.price) * item.quantity,
      0
    );
    return subtotalCents / 100;
  }

  function getDeliveryFee(neighborhood) {
    const subtotal = getSubtotal();
    return items.length > 0 && subtotal > 24 && subtotal < 35
      ? DELIVERY_FEES[neighborhood] || 0
      : 0;
  }

  function getTotal(neighborhood) {
    return getSubtotal() + getDeliveryFee(neighborhood);
  }

  function isEmpty() {
    return items.length === 0;
  }

  function getState(neighborhood) {
    return {
      items: getItems(),
      totalQuantity: getTotalQuantity(),
      subtotal: getSubtotal(),
      deliveryFee: getDeliveryFee(neighborhood),
      total: getTotal(neighborhood),
    };
  }

  load();

  return {
    onChange,
    getItems,
    addItem,
    increment,
    decrement,
    removeItem,
    clear,
    getTotalQuantity,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    isEmpty,
    getState,
  };
})();
