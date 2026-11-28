/* =========================================================
  CHECKOUT — validação, resumo e envio do pedido pelo WhatsApp.
  ========================================================= */

const Checkout = (function () {
  const form = document.getElementById("checkoutForm");
  const summaryItemsEl = document.getElementById("summaryItems");
  const summarySubtotalEl = document.getElementById("summarySubtotal");
  const summaryDeliveryEl = document.getElementById("summaryDelivery");
  const summaryTotalEl = document.getElementById("summaryTotal");
  const freeDeliveryMessageEl = document.getElementById("freeDeliveryMessage");
  const paymentOptionsEl = document.getElementById("paymentOptions");
  const submitBtn = document.getElementById("submitOrderBtn");
  const submitErrorEl = document.getElementById("submitError");
  const emptyNoticeEl = document.getElementById("checkoutEmptyNotice");
  const checkoutContentEl = document.getElementById("checkoutContent");
  let currentQuote = null;
  let quoteRequestId = 0;
  let syncingQuote = false;
  let isSubmitting = false;
  let isBelowMinimum = false;

  function formatPrice(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function updateMinimumOrderState(subtotal = Cart.getSubtotal()) {
    const missingCents = MIN_ORDER_VALUE_CENTS - Math.round(subtotal * 100);
    isBelowMinimum = missingCents > 0;
    submitBtn.disabled = isSubmitting || isBelowMinimum;
    if (isBelowMinimum) {
      submitErrorEl.textContent = `Pedido mínimo de R$ 24,00. Faltam ${formatPrice(missingCents / 100)} para atingir o pedido mínimo de R$ 24,00.`;
      submitErrorEl.classList.add("is-visible");
    } else {
      submitErrorEl.classList.remove("is-visible");
      submitErrorEl.textContent = "";
    }
  }

  function renderSummary(quote = currentQuote) {
    const state = Cart.getState();

    summaryItemsEl.innerHTML = state.items
      .map(
        (item) => `
        <div class="summary-item">
          <span class="summary-item-name">${item.quantity}x ${escapeHtml(item.name)}</span>
          <span class="summary-item-qty">${formatPrice(item.subtotal)}</span>
        </div>`
      )
      .join("");

    summarySubtotalEl.textContent = formatPrice(quote ? Number(quote.valorProdutos) : state.subtotal);
    const hasDeliveryQuote = quote && quote.taxaEntrega !== null;
    summaryDeliveryEl.textContent = hasDeliveryQuote ? formatPrice(Number(quote.taxaEntrega)) : "Selecione o bairro";
    summaryTotalEl.textContent = hasDeliveryQuote ? formatPrice(Number(quote.valorTotal)) : "Selecione o bairro";
    freeDeliveryMessageEl.hidden = !quote?.entregaGratis;
    updateMinimumOrderState(quote ? Number(quote.valorProdutos) : state.subtotal);
  }

  async function refreshQuote() {
    if (syncingQuote) return null;
    if (Cart.isEmpty()) {
      quoteRequestId += 1;
      currentQuote = null;
      return null;
    }
    const neighborhood = form.elements.neighborhood.value;

    const requestId = ++quoteRequestId;
    try {
      const quote = await api.quoteOrder({
        bairro: neighborhood || undefined,
        itens: Cart.getItems().map((item) => ({
          produtoId: Number(item.productId),
          quantidade: Number(item.quantity),
        })),
      });
      if (requestId !== quoteRequestId) return;
      currentQuote = quote;
      syncingQuote = true;
      Cart.syncProducts(quote.itens.map((item) => ({
        id: item.produtoId,
        name: item.nomeProduto,
        price: Number(item.precoUnitario),
      })));
      syncingQuote = false;
      renderSummary(quote);
      return quote;
    } catch (error) {
      if (requestId !== quoteRequestId) return;
      currentQuote = null;
      renderSummary(null);
      summaryDeliveryEl.textContent = "Não foi possível calcular";
      summaryTotalEl.textContent = "Não foi possível calcular";
      return null;
    }
  }

  function renderPaymentOptions() {
    paymentOptionsEl.innerHTML = PAYMENT_METHODS.map(
      (method, index) => `
      <label class="radio-card">
        <input type="radio" name="paymentMethod" value="${method.value}" ${index === 0 ? "checked" : ""} required />
        <span>
          <span class="radio-label">${escapeHtml(method.label)}</span><br />
          <span class="radio-desc">${escapeHtml(method.desc)}</span>
        </span>
      </label>`
    ).join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function clearFieldErrors() {
    form.querySelectorAll(".field.has-error").forEach((field) => {
      field.classList.remove("has-error");
    });
    submitErrorEl.classList.remove("is-visible");
    submitErrorEl.textContent = "";
  }

  function setFieldError(name, message) {
    const field = form.querySelector(`[data-field="${name}"]`);
    if (!field) return;
    field.classList.add("has-error");
    const errorEl = field.querySelector(".error-msg");
    if (errorEl) errorEl.textContent = message;
  }

  function validate(formData) {
    let valid = true;
    const required = {
      customerName: "Informe o nome completo.",
      street: "Informe o endereço.",
      number: "Informe o número.",
      neighborhood: "Informe o bairro.",
    };

    Object.entries(required).forEach(([name, message]) => {
      if (!formData.get(name) || !formData.get(name).toString().trim()) {
        setFieldError(name, message);
        valid = false;
      }
    });

    if (Cart.isEmpty()) {
      valid = false;
    }

    if (Math.round(Cart.getSubtotal() * 100) < MIN_ORDER_VALUE_CENTS) {
      submitErrorEl.textContent = `Pedido mínimo de R$ 24,00. Faltam ${formatPrice((MIN_ORDER_VALUE_CENTS - Math.round(Cart.getSubtotal() * 100)) / 100)} para atingir o pedido mínimo de R$ 24,00.`;
      submitErrorEl.classList.add("is-visible");
      valid = false;
    }

    if (!formData.get("neighborhood")) {
      setFieldError("neighborhood", "Selecione um bairro válido para entrega.");
      valid = false;
    }

    return valid;
  }

  function setLoading(isLoading) {
    isSubmitting = isLoading;
    submitBtn.disabled = isSubmitting || isBelowMinimum;
    submitBtn.textContent = isLoading
      ? "Abrindo WhatsApp..."
      : "Finalizar pedido pelo WhatsApp";
  }

  async function syncCartWithCatalog() {
    const firstPage = await api.getProductsPage({ page: 1, limit: 100 });
    const products = [...(firstPage.data || [])];
    for (let page = 2; page <= (firstPage.meta.totalPages || 1); page += 1) {
      const nextPage = await api.getProductsPage({ page, limit: 100 });
      products.push(...(nextPage.data || []));
    }
    if (!currentQuote) {
      Cart.syncProducts(products.map((product) => ({
        id: product.id,
        name: product.nome,
        price: Number(product.preco),
        image: product.imagem,
      })));
    }
  }

  function getApiErrorMessage(error) {
    if (!error.errors || Array.isArray(error.errors)) return error.message;
    const details = Object.entries(error.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(" ");
    return details ? `${error.message} ${details}` : error.message;
  }

  function buildWhatsAppMessage(formData, order) {
    const payment = PAYMENT_METHODS.find((method) => method.value === formData.get("paymentMethod"));
    const items = order.itens.map((item) => `${item.quantidade}x ${item.nomeProduto} - ${formatPrice(Number(item.subtotal))}`).join("\n");
    const deliveryFee = `${formatPrice(Number(order.taxaEntrega))}${order.entregaGratis ? " (grátis)" : ""}`;
    return `Olá! Gostaria de fazer um pedido.\n\n*PEDIDO*\n\n${items}\n\n*Subtotal:* ${formatPrice(Number(order.valorProdutos))}\n*Taxa de entrega:* ${deliveryFee}\n*Total:* ${formatPrice(Number(order.valorTotal))}\n\n*CLIENTE*\nNome: ${formData.get("customerName").trim()}\n\n*ENDEREÇO*\n${formData.get("street").trim()}\nNúmero: ${formData.get("number").trim()}\nComplemento: ${(formData.get("complement") || "Não informado").trim()}\nBairro: ${formData.get("neighborhood").trim()}\n\n*PAGAMENTO*\n${payment ? payment.label : formData.get("paymentMethod")}\n\n*OBSERVAÇÃO*\n${(formData.get("notes") || "Nenhuma").trim()}\n\nObrigado!`;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearFieldErrors();

    if (submitBtn.disabled) return; // evita envios duplicados

    const formData = new FormData(form);

    if (Math.round(Cart.getSubtotal() * 100) < MIN_ORDER_VALUE_CENTS) {
      updateMinimumOrderState();
      return;
    }

    if (Cart.isEmpty()) {
      submitErrorEl.textContent = "Seu carrinho está vazio.";
      submitErrorEl.classList.add("is-visible");
      return;
    }

    if (!validate(formData)) {
      submitErrorEl.textContent = "Verifique os campos destacados.";
      submitErrorEl.classList.add("is-visible");
      return;
    }

    setLoading(true);
    try {
      const quote = await refreshQuote();
      if (!quote) throw new Error("Não foi possível atualizar os preços. Tente novamente.");
      if (Number(quote.valorProdutos) * 100 < MIN_ORDER_VALUE_CENTS) {
        updateMinimumOrderState(Number(quote.valorProdutos));
        return;
      }
      const order = await api.createOrder({
        nomeCliente: formData.get("customerName").trim(),
        endereco: formData.get("street").trim(),
        numero: formData.get("number").trim(),
        complemento: (formData.get("complement") || "").trim() || null,
        bairro: formData.get("neighborhood"),
        observacao: (formData.get("notes") || "").trim() || null,
        formaPagamento: formData.get("paymentMethod"),
        itens: Cart.getItems().map((item) => ({
          produtoId: Number(item.productId),
          quantidade: Number(item.quantity),
        })),
      });

      const message = buildWhatsAppMessage(formData, order);
      sessionStorage.setItem("chupchup:lastOrder", JSON.stringify({ order, message }));
      window.location.href = "../pages/success.html";
    } catch (error) {
      submitErrorEl.textContent = getApiErrorMessage(error) || "Não foi possível registrar o pedido.";
      submitErrorEl.classList.add("is-visible");
    } finally {
      setLoading(false);
    }
  }

  function renderEmptyState() {
    const isEmpty = Cart.isEmpty();
    emptyNoticeEl.hidden = !isEmpty;
    checkoutContentEl.hidden = isEmpty;
  }

  function init() {
    if (!form) return; // não estamos na página de checkout

    renderEmptyState();
    if (Cart.isEmpty()) return;

    renderSummary();
    renderPaymentOptions();
    Cart.onChange(() => {
      renderEmptyState();
      if (Cart.isEmpty()) {
        quoteRequestId += 1;
        currentQuote = null;
        return;
      }
      if (!syncingQuote) refreshQuote();
      renderSummary();
    });
    form.addEventListener("submit", handleSubmit);
    form.elements.neighborhood.addEventListener("change", refreshQuote);
    syncCartWithCatalog().catch(() => {
      submitErrorEl.textContent = "Não foi possível atualizar os preços do cardápio.";
      submitErrorEl.classList.add("is-visible");
    });
    refreshQuote();
  }

  return { init };
})();
