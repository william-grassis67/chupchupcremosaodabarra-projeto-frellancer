/* =========================================================
   PRODUCTS — busca, renderização, busca textual (debounce)
   e paginação do cardápio.
   ========================================================= */

const Products = (function () {
  const gridEl = document.getElementById("productsGrid");
  const stateEl = document.getElementById("productsState");
  const paginationEl = document.getElementById("productsPagination");
  const searchInput = document.getElementById("searchInput");

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23fff3d6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%23a70c12' text-anchor='middle' dominant-baseline='middle'%3ESem imagem%3C/text%3E%3C/svg%3E";

  let currentPage = 1;
  let totalPages = 1;
  let currentCategory = null;
  let currentSearch = "";
  let searchDebounceTimer = null;
  let requestToken = 0;

  /**
   * Normaliza um produto vindo da API para um formato estável.
   * Aceita variações comuns de nomes de campo, já que o schema
   * exato deve ser confirmado com o backend real.
   */
  function normalize(raw) {
    const categoryName =
      (raw.category && (raw.category.name || raw.category.title)) ||
      raw.categoryName ||
      raw.category_name ||
      null;

    return {
      id: raw.id ?? raw._id,
      name: raw.nome ?? raw.name ?? raw.title ?? "Produto",
      description: raw.descricao ?? raw.description ?? raw.details ?? "",
      price: Number(raw.preco ?? raw.price ?? raw.value ?? 0),
      image:
        raw.image ??
        raw.imageUrl ??
        raw.image_url ??
        raw.photo ??
        PLACEHOLDER_IMAGE,
      categoryName,
      available: raw.disponivel ?? raw.available ?? raw.isAvailable ?? raw.in_stock ?? true,
      featured: raw.destaque ?? raw.featured ?? raw.isFeatured ?? raw.highlight ?? false,
    };
  }

  function formatPrice(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function renderState({ icon, title, message }) {
    gridEl.innerHTML = "";
    paginationEl.innerHTML = "";
    stateEl.hidden = false;
    stateEl.innerHTML = `
      <div class="state-icon" aria-hidden="true">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
    `;
  }

  function renderLoading() {
    stateEl.hidden = true;
    paginationEl.innerHTML = "";
    gridEl.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const card = document.createElement("div");
      card.className = "product-card is-skeleton";
      card.innerHTML = `
        <div class="product-media skeleton"></div>
        <div class="product-body">
          <div class="skeleton skeleton-line" style="width:40%"></div>
          <div class="skeleton skeleton-line" style="width:80%"></div>
          <div class="skeleton skeleton-line" style="width:60%"></div>
        </div>
      `;
      gridEl.appendChild(card);
    }
  }

  function renderProducts(products) {
    stateEl.hidden = true;

    if (products.length === 0) {
      renderState({
        icon: "🔍",
        title: "Nenhum produto encontrado",
        message: "Tente buscar por outro termo ou escolher outra categoria.",
      });
      return;
    }

    gridEl.innerHTML = "";
    products.forEach((product) => {
      gridEl.appendChild(renderCard(product));
    });
  }

  function renderCard(product) {
    const card = document.createElement("article");
    card.className = "product-card" + (product.available ? "" : " is-unavailable");

    const mediaBadge = product.featured
      ? `<span class="badge badge-featured">Destaque</span>`
      : !product.available
      ? `<span class="badge badge-unavailable">Indisponível</span>`
      : "";

    card.innerHTML = `
      <div class="product-media">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" />
        ${mediaBadge}
      </div>
      <div class="product-body">
        ${product.categoryName ? `<span class="product-category">${escapeHtml(product.categoryName)}</span>` : ""}
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ""}
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button
            type="button"
            class="product-add-btn"
            aria-label="Adicionar ${escapeHtml(product.name)} ao carrinho"
            ${product.available ? "" : "disabled"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
    `;

    const addBtn = card.querySelector(".product-add-btn");
    addBtn.addEventListener("click", () => {
      if (!product.available) return;
      Cart.addItem(product, 1);
      Toast.show(`${product.name} adicionado ao carrinho`);
    });

    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderPagination() {
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.textContent = "Anterior";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
    paginationEl.appendChild(prevBtn);

    for (let page = 1; page <= totalPages; page++) {
      const pageBtn = document.createElement("button");
      pageBtn.type = "button";
      pageBtn.textContent = String(page);
      if (page === currentPage) pageBtn.classList.add("is-active");
      pageBtn.addEventListener("click", () => goToPage(page));
      paginationEl.appendChild(pageBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.textContent = "Próximo";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => goToPage(currentPage + 1));
    paginationEl.appendChild(nextBtn);
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    load();
    document
      .getElementById("cardapio")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Extrai total de páginas da resposta da API, aceitando
   * tanto um array simples quanto um objeto paginado
   * ({ products, total, totalPages, page, ... }).
   */
  function parseResponse(data) {
    if (Array.isArray(data)) {
      return { list: data, pages: 1 };
    }
    const list = data.products || data.items || data.data || [];
    const pages =
      data.totalPages ||
      data.pages ||
      (data.total ? Math.ceil(data.total / PRODUCTS_PAGE_SIZE) : 1);
    return { list, pages: pages || 1 };
  }

  async function load() {
    const token = ++requestToken;
    renderLoading();

    const params = {
      available: true,
      page: currentPage,
      limit: PRODUCTS_PAGE_SIZE,
    };
    if (currentCategory) params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;

    try {
      const data = await api.getProducts(params);
      if (token !== requestToken) return; // resposta obsoleta, ignore

      const { list, pages } = parseResponse(data);
      totalPages = Math.max(1, pages);
      renderProducts(list.map(normalize));
      renderPagination();
    } catch (err) {
      if (token !== requestToken) return;
      console.error("Erro ao carregar produtos:", err);
      renderState({
        icon: "⚠️",
        title: "Não foi possível carregar os produtos",
        message: "Tente novamente em instantes.",
      });
    }
  }

  function setCategory(categoryId) {
    currentCategory = categoryId;
    currentPage = 1;
    load();
  }

  function setSearch(term) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentSearch = term.trim();
      currentPage = 1;
      load();
    }, SEARCH_DEBOUNCE_MS);
  }

  function bindEvents() {
    document.addEventListener("categories:change", (event) => {
      setCategory(event.detail.categoryId);
    });

    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        setSearch(event.target.value);
      });
    }
  }

  function init() {
    bindEvents();
    load();
  }

  return { init };
})();
