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
      const storedItems = raw ? JSON.parse(raw) : [];
      items = Array.isArray(storedItems)
        ? storedItems.filter((item) => {
          const productId = Number(item?.productId);
          const quantity = Number(item?.quantity);
          return Number.isInteger(productId) && productId > 0
            && Number.isInteger(quantity) && quantity > 0
            && typeof item.name === "string"
            && Number.isFinite(toCents(item.price)) && toCents(item.price) > 0;
        }).map((item) => ({
          ...item,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          price: toCents(item.price) / 100,
        }))
        : [];
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
    return items.map((item) => {
      const priceCents = toCents(item.price);
      return {
        ...item,
        price: priceCents / 100,
        subtotal: (priceCents * item.quantity) / 100,
      };
    });
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
      items[index].name = product.name;
      items[index].price = product.price;
      items[index].image = product.image;
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

  function syncProducts(products) {
    const productsById = new Map(products.map((product) => [String(product.id), product]));
    let changed = false;

    items.forEach((item) => {
      const product = productsById.get(String(item.productId));
      if (!product) return;
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) return;
      const image = product.image ?? item.image;
      if (item.name !== product.name || toCents(item.price) !== toCents(price) || item.image !== image) {
        item.name = product.name;
        item.price = price;
        item.image = image;
        changed = true;
      }
    });

    if (changed) persist();
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
    const match = /^\s*(\d+)(?:[.,](\d{1,2}))?\s*$/.exec(String(value));
    if (!match) return NaN;
    return Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0") || 0);
  }

  function getSubtotal() {
    const subtotalCents = items.reduce(
      (sum, item) => sum + toCents(item.price) * item.quantity,
      0
    );
    return subtotalCents / 100;
  }

  function getDeliveryFee(neighborhood) {
    return 0;
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
    syncProducts,
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
