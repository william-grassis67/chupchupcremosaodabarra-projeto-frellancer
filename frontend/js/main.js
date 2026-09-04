/* =========================================================
   MAIN — inicialização da aplicação, UI do carrinho (drawer +
   barra mobile) e toast de feedback. Roda em todas as páginas.
   ========================================================= */

/* ---------- Toast ---------- */
const Toast = (function () {
  const el = document.getElementById("toast");
  let hideTimer = null;

  function show(message, { isError = false } = {}) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", isError);
    el.classList.add("is-visible");

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      el.classList.remove("is-visible");
    }, 2600);
  }

  return { show };
})();

/* ---------- Carrinho (UI) ---------- */
const CartUI = (function () {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  const openBtn = document.getElementById("cartButton");
  const closeBtn = document.getElementById("cartCloseBtn");
  const itemsEl = document.getElementById("cartItems");
  const footerEl = document.getElementById("cartFooter");
  const cartCountEls = document.querySelectorAll(".cart-count");
  const subtotalEl = document.getElementById("cartSubtotal");
  const deliveryEl = document.getElementById("cartDelivery");
  const totalEl = document.getElementById("cartTotal");
  const clearLink = document.getElementById("clearCartLink");
  const mobileBar = document.getElementById("mobileCartBar");
  const mobileBarCount = document.getElementById("mobileBarCount");
  const mobileBarTotal = document.getElementById("mobileBarTotal");
  const mobileBarCta = document.getElementById("mobileBarCta");

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23fff3d6'/%3E%3C/svg%3E";

  function formatPrice(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function open() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    drawer.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function renderItem(item) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-media">
        <img src="${item.image || PLACEHOLDER_IMAGE}" alt="${escapeHtml(item.name)}" loading="lazy" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-unit-price">${formatPrice(item.price)} / unid.</div>
        <div class="qty-control">
          <button type="button" class="qty-decrease" aria-label="Diminuir quantidade">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button type="button" class="qty-increase" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>
      <div class="cart-item-remove">
        <span class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</span>
        <button type="button" class="remove-btn">Remover</button>
      </div>
    `;

    row.querySelector(".qty-increase").addEventListener("click", () => {
      Cart.increment(item.productId);
    });
    row.querySelector(".qty-decrease").addEventListener("click", () => {
      Cart.decrement(item.productId);
    });
    row.querySelector(".remove-btn").addEventListener("click", () => {
      Cart.removeItem(item.productId);
    });

    return row;
  }

  function render(state) {
    if (!itemsEl) return;

    if (state.items.length === 0) {
      itemsEl.innerHTML = `
        <div class="cart-empty">
          <div class="state-icon" aria-hidden="true">🛒</div>
          <h3>Seu carrinho está vazio</h3>
          <p>Adicione produtos do cardápio para continuar.</p>
        </div>
      `;
      footerEl.hidden = true;
    } else {
      itemsEl.innerHTML = "";
      state.items.forEach((item) => itemsEl.appendChild(renderItem(item)));
      footerEl.hidden = false;
      subtotalEl.textContent = formatPrice(state.subtotal);
      deliveryEl.textContent = formatPrice(state.deliveryFee);
      totalEl.textContent = formatPrice(state.total);
    }

    cartCountEls.forEach((el) => {
      el.textContent = String(state.totalQuantity);
      el.hidden = state.totalQuantity === 0;
    });

    if (mobileBar) {
      const hasItems = state.totalQuantity > 0;
      mobileBar.classList.toggle("is-visible", hasItems);
      document.body.classList.toggle("has-mobile-bar", hasItems);
      mobileBarCount.textContent = `${state.totalQuantity} ${state.totalQuantity === 1 ? "item" : "itens"}`;
      mobileBarTotal.textContent = formatPrice(state.total);
    }
  }

  function bindEvents() {
    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (overlay) overlay.addEventListener("click", close);
    if (mobileBarCta) mobileBarCta.addEventListener("click", open);
    if (clearLink) {
      clearLink.addEventListener("click", () => {
        Cart.clear();
        Toast.show("Carrinho esvaziado");
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    Cart.onChange(render);
  }

  function init() {
    bindEvents();
    render(Cart.getState());
  }

  return { init, open, close };
})();

/* ---------- Página de sucesso ---------- */
const SuccessPage = (function () {
  const orderNumberEl = document.getElementById("orderNumber");

  function init() {
    if (!orderNumberEl) return;

    try {
      const raw = sessionStorage.getItem("chupchup:lastOrder");
      const order = raw ? JSON.parse(raw) : null;
      if (order && order.id) {
        orderNumberEl.textContent = `Pedido #${order.id}`;
      } else {
        orderNumberEl.textContent = "Pedido recebido";
      }
    } catch (err) {
      orderNumberEl.textContent = "Pedido recebido";
    }
  }

  return { init };
})();

/* ---------- Ações gerais da página inicial ---------- */
function bindHeroActions() {
  const heroCta = document.getElementById("heroMenuCta");
  if (heroCta) {
    heroCta.addEventListener("click", () => {
      document.getElementById("cardapio").scrollIntoView({ behavior: "smooth" });
    });
  }
}

/* ---------- Inicialização ---------- */
document.addEventListener("DOMContentLoaded", () => {
  CartUI.init();
  bindHeroActions();

  // Página inicial (cardápio)
  if (document.getElementById("productsGrid")) {
    Categories.load();
    Products.init();
  }

  // Página de checkout
  if (document.getElementById("checkoutForm")) {
    Checkout.init();
  }

  // Página de sucesso
  SuccessPage.init();
});
