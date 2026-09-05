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

// Tempo (ms) de debounce da busca de produtos.
const SEARCH_DEBOUNCE_MS = 400;

// Bairros aceitos pela API e suas taxas na faixa de entrega aplicável.
const DELIVERY_FEES = Object.freeze({
  "Antonio Lopez": 2,
  Areal: 2,
  Bugia: 2,
  Centro: 2,
  "Chácara do Atlântico": 2,
  Coabh: 2,
  "Coabh 2": 2,
  Favica: 2,
  Floresta: 2,
  Guaxindimba: 2,
  "Marcilio Dias 1": 2,
  "Marcilio Dias 2": 2,
  "Nossa Senhora Aparecida": 2,
  "Nova Bethânia": 2,
  "Quilombo Novo": 2,
  Santana: 2,
  Santiago: 2,
  "Santo Amaro": 2,
  "São Jose": 2,
  Urbens: 2,
  "Vila dos Pescadores": 2,
  "Maria Manteiga": 3,
  "Nova Esperança": 2,
  "Novo Horizonte": 2,
});

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
