/* =========================================================
   CONFIG — configurações globais da aplicação
   ========================================================= */

// Produção usa a API pública; o fallback local existe somente para desenvolvimento.
const configuredApiUrl = window.__API_URL__ || document.querySelector('meta[name="api-base-url"]')?.content;
const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "3000";
const API_URL = configuredApiUrl || (isLocalFrontend ? "http://localhost:3000/api" : "https://chupchupcremosao.com/api");

// Número da loja no formato internacional, sem símbolos.
const WHATSAPP_NUMBER = "5527997765557";

// Chave usada para persistir o carrinho no localStorage.
const CART_STORAGE_KEY = "chupchup:cart";

// Quantidade de produtos por página no cardápio.
const PRODUCTS_PAGE_SIZE = 12;

// Valor mínimo dos produtos para criar um pedido.
const MIN_ORDER_VALUE_CENTS = 2400;

// Tempo (ms) de debounce da busca de produtos.
const SEARCH_DEBOUNCE_MS = 400;

// Opções de forma de pagamento aceitas.
// Ajuste os "value" para bater exatamente com o que o backend espera.
const PAYMENT_METHODS = [
  {
    value: "pix",
    label: "Pix",
    desc: "Pagamento instantâneo, confirmação na hora",
  },
  {
    value: "credit_card",
    label: "Cartão de crédito",
    desc: "Pagamento na entrega, maquininha do entregador",
  },
  {
    value: "debit_card",
    label: "Cartão de débito",
    desc: "Pagamento na entrega, maquininha do entregador",
  },
  {
    value: "cash",
    label: "Dinheiro",
    desc: "Pagamento na entrega",
  },
];
