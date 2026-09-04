/* =========================================================
   CATEGORIES — busca as categorias na API e controla o filtro.
   Emite o evento "categories:change" no document sempre que
   o usuário troca de categoria, para que products.js reaja.
   ========================================================= */

const Categories = (function () {
  const scrollEl = document.getElementById("categoriesScroll");
  let activeId = "all";
  let categories = [];

  /**
   * Normaliza um objeto de categoria vindo da API para um
   * formato estável usado pelo restante do frontend.
   * Aceita variações comuns de nomes de campo.
   */
  function normalize(raw) {
    return {
      id: String(raw.id ?? raw._id ?? raw.categoryId),
      name: raw.name ?? raw.title ?? "Categoria",
    };
  }

  function renderSkeleton() {
    scrollEl.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const chip = document.createElement("div");
      chip.className = "category-chip skeleton chip-skeleton";
      scrollEl.appendChild(chip);
    }
  }

  function renderChips() {
    scrollEl.innerHTML = "";

    const allChip = createChip("all", "Todos");
    scrollEl.appendChild(allChip);

    categories.forEach((category) => {
      const chip = createChip(category.id, category.name);
      scrollEl.appendChild(chip);
    });
  }

  function createChip(id, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-chip";
    button.dataset.categoryId = id;
    button.textContent = label;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(id === activeId));
    if (id === activeId) button.classList.add("is-active");

    button.addEventListener("click", () => selectCategory(id));
    return button;
  }

  function selectCategory(id) {
    if (id === activeId) return;
    activeId = id;

    [...scrollEl.querySelectorAll(".category-chip")].forEach((chip) => {
      const isActive = chip.dataset.categoryId === id;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-selected", String(isActive));
    });

    document.dispatchEvent(
      new CustomEvent("categories:change", {
        detail: { categoryId: id === "all" ? null : id },
      })
    );
  }

  async function load() {
    renderSkeleton();
    try {
      const data = await api.getCategories();
      categories = (Array.isArray(data) ? data : data.categories || []).map(
        normalize
      );
      renderChips();
    } catch (err) {
      // Se as categorias falharem, ainda deixamos o "Todos" disponível
      // para que os produtos possam ser carregados normalmente.
      categories = [];
      renderChips();
      console.error("Erro ao carregar categorias:", err);
    }
  }

  function getActiveId() {
    return activeId === "all" ? null : activeId;
  }

  return { load, getActiveId };
})();
