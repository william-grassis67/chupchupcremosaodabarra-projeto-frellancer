/* =========================================================
   API — toda comunicação com o backend passa por aqui.
   Nenhum outro arquivo deve chamar fetch() diretamente.
   ========================================================= */

/**
 * Erro customizado para respostas de API com "success": false.
 * Guarda a mensagem e o objeto de erros de validação (se houver).
 */
class ApiError extends Error {
  constructor(message, errors, status) {
    super(message || "Erro ao comunicar com o servidor.");
    this.name = "ApiError";
    this.errors = errors || null;
    this.status = status || null;
  }
}

/**
 * Monta uma querystring a partir de um objeto, ignorando
 * valores undefined, null ou string vazia.
 */
function buildQueryString(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Wrapper central de requisições. Sempre resolve com "data" em caso
 * de sucesso, ou rejeita com um ApiError em caso de falha —
 * seja falha de rede, seja "success: false" no corpo da resposta.
 */
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (networkError) {
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o servidor está rodando."
    );
  }

  let body = null;
  try {
    body = await response.json();
  } catch (parseError) {
    // Resposta sem corpo JSON (ex.: 204 No Content)
    body = null;
  }

  if (!response.ok || !body || body.success === false) {
    const message =
      (body && body.message) || `Erro inesperado (HTTP ${response.status}).`;
    const errors = body && body.errors ? body.errors : null;
    throw new ApiError(message, errors, response.status);
  }

  return body.data;
}

async function requestWithMeta(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  } catch (networkError) {
    throw new ApiError("Não foi possível conectar à API. Verifique se o servidor está rodando.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || body.success === false) {
    throw new ApiError((body && body.message) || `Erro inesperado (HTTP ${response.status}).`, body && body.errors, response.status);
  }
  return { data: body.data, meta: body.meta || {} };
}

const api = {
  // ---------- Produtos ----------
  getProducts(params = {}) {
    return request(`/products${buildQueryString(params)}`);
  },

  getProductsPage(params = {}) {
    return requestWithMeta(`/products${buildQueryString(params)}`);
  },

  getProduct(id) {
    return request(`/products/${id}`);
  },

  createProduct(payload) {
    return request(`/products`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateProduct(id, payload) {
    return request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteProduct(id) {
    return request(`/products/${id}`, { method: "DELETE" });
  },

  // ---------- Categorias ----------
  getCategories() {
    return request(`/categories`);
  },

  getCategory(id) {
    return request(`/categories/${id}`);
  },

  createCategory(payload) {
    return request(`/categories`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCategory(id, payload) {
    return request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteCategory(id) {
    return request(`/categories/${id}`, { method: "DELETE" });
  },

  // ---------- Pedidos ----------
  createOrder(payload) {
    return request(`/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getOrders(params = {}) {
    return request(`/orders${buildQueryString(params)}`);
  },

  getOrdersPage(params = {}) {
    return requestWithMeta(`/orders${buildQueryString(params)}`);
  },

  getOrder(id) {
    return request(`/orders/${id}`);
  },

  updateOrderStatus(id, status) {
    return request(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  deleteOrder(id) {
    return request(`/orders/${id}`, { method: "DELETE" });
  },

  // ---------- Health check ----------
  checkHealth() {
    return request(`/health`);
  },
};
