/* =========================================================
  CHECKOUT — validação, resumo e envio do pedido pelo WhatsApp.
  ========================================================= */

const Checkout = (function () {
  const form = document.getElementById("checkoutForm");
  const summaryItemsEl = document.getElementById("summaryItems");
  const summarySubtotalEl = document.getElementById("summarySubtotal");
  const summaryDeliveryEl = document.getElementById("summaryDelivery");
  const summaryTotalEl = document.getElementById("summaryTotal");
  const paymentOptionsEl = document.getElementById("paymentOptions");
  const submitBtn = document.getElementById("submitOrderBtn");
  const submitErrorEl = document.getElementById("submitError");
  const emptyNoticeEl = document.getElementById("checkoutEmptyNotice");
  const checkoutContentEl = document.getElementById("checkoutContent");

  function formatPrice(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function updateMinimumOrderState() {
    const missingCents = MIN_ORDER_VALUE_CENTS - Math.round(Cart.getSubtotal() * 100);
    const belowMinimum = missingCents > 0;
    submitBtn.disabled = belowMinimum;
    if (belowMinimum) {
      submitErrorEl.textContent = `Pedido mínimo de R$ 24,00. Faltam ${formatPrice(missingCents / 100)} para atingir o pedido mínimo de R$ 24,00.`;
      submitErrorEl.classList.add("is-visible");
    } else {
      submitErrorEl.classList.remove("is-visible");
      submitErrorEl.textContent = "";
    }
  }

  function renderSummary() {
    const neighborhood = form.elements.neighborhood.value;
    const state = Cart.getState(neighborhood);

    summaryItemsEl.innerHTML = state.items
      .map(
        (item) => `
        <div class="summary-item">
          <span class="summary-item-name">${item.quantity}x ${escapeHtml(item.name)}</span>
          <span class="summary-item-qty">${formatPrice(item.price * item.quantity)}</span>
        </div>`
      )
      .join("");

    summarySubtotalEl.textContent = formatPrice(state.subtotal);
    summaryDeliveryEl.textContent = formatPrice(state.deliveryFee);
    summaryTotalEl.textContent = formatPrice(state.total);
    updateMinimumOrderState();
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

    if (!DELIVERY_FEES[formData.get("neighborhood")]) {
      setFieldError("neighborhood", "Selecione um bairro válido para entrega.");
      valid = false;
    }

    return valid;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading
      ? "Abrindo WhatsApp..."
      : "Finalizar pedido pelo WhatsApp";
  }

  function getApiErrorMessage(error) {
    if (!error.errors || Array.isArray(error.errors)) return error.message;
    const details = Object.entries(error.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(" ");
    return details ? `${error.message} ${details}` : error.message;
  }

  function buildWhatsAppMessage(formData, order) {
    const state = Cart.getState(formData.get("neighborhood"));
    const payment = PAYMENT_METHODS.find((method) => method.value === formData.get("paymentMethod"));
    const items = state.items.map((item) => `${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}`).join("\n");
    return `Olá! Gostaria de fazer um pedido.\n\n*PEDIDO*\n\n${items}\n\n*Subtotal:* ${formatPrice(Number(order.valorProdutos))}\n*Taxa de entrega:* ${formatPrice(Number(order.taxaEntrega))}\n*Total:* ${formatPrice(Number(order.valorTotal))}\n\n*CLIENTE*\nNome: ${formData.get("customerName").trim()}\n\n*ENDEREÇO*\n${formData.get("street").trim()}\nNúmero: ${formData.get("number").trim()}\nComplemento: ${(formData.get("complement") || "Não informado").trim()}\nBairro: ${formData.get("neighborhood").trim()}\n\n*PAGAMENTO*\n${payment ? payment.label : formData.get("paymentMethod")}\n\n*OBSERVAÇÃO*\n${(formData.get("notes") || "Nenhuma").trim()}\n\nObrigado!`;
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

      sessionStorage.setItem("chupchup:lastOrder", JSON.stringify(order));
      const message = buildWhatsAppMessage(formData, order);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
      submitErrorEl.textContent = "Pedido registrado! Confira a mensagem no WhatsApp e envie para finalizar.";
      submitErrorEl.classList.add("is-visible");
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
      if (!Cart.isEmpty()) renderSummary();
    });
    form.addEventListener("submit", handleSubmit);
    form.elements.neighborhood.addEventListener("change", renderSummary);
  }

  return { init };
})();
