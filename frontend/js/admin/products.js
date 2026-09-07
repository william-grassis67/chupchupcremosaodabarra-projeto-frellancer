let adminProducts = [];
let adminFeaturedProducts = [];
let adminCategories = [];

function productPayload() {
	const payload = new FormData();
	payload.append("nome", productName.value.trim());
	payload.append("descricao", productDescription.value.trim());
	payload.append("preco", productPrice.value);
	payload.append("categoriaId", productCategory.value);
	payload.append("disponivel", String(productAvailable.checked));
	payload.append("destaque", String(productFeatured.checked));
	if (productImageFile.files[0]) payload.append("imagem", productImageFile.files[0]);
	else if (productImageUrl.value.trim()) payload.append("imagem", productImageUrl.value.trim());
	return payload;
}

function productOptions() {
	productCategory.innerHTML = `<option value="">Selecione</option>${adminCategories.map((item) => `<option value="${item.id}">${Admin.escape(item.nome)}</option>`).join("")}`;
	productFilter.innerHTML = `<option value="">Todas as categorias</option>${adminCategories.map((item) => `<option value="${item.id}">${Admin.escape(item.nome)}</option>`).join("")}`;
}

function featuredOrder(items) {
	return [...items].sort((a, b) => Number(a.ordemDestaque || 0) - Number(b.ordemDestaque || 0) || Number(a.id) - Number(b.id));
}

function renderFeaturedOrganizer() {
	const items = featuredOrder(adminFeaturedProducts);
	if (!items.length) {
		featuredProducts.innerHTML = `<div class="admin-empty"><strong>Nenhum destaque definido</strong>Edite um produto e marque “Em destaque” para organizá-lo aqui.</div>`;
		return;
	}

	featuredProducts.innerHTML = `<div class="featured-list">${items.map((item, index) => `
		<div class="featured-row">
			<span class="featured-position">${index + 1}</span>
			<div class="featured-info"><strong>${Admin.escape(item.nome)}</strong><small>${Admin.escape(item.categoria?.nome || "Sem categoria")}</small></div>
			<label class="featured-priority">Prioridade <input type="number" min="1" value="${Number(item.ordemDestaque || index + 1)}" data-featured-priority="${item.id}"></label>
			<div class="featured-actions"><button class="admin-action" type="button" data-featured-up="${item.id}" ${index === 0 ? "disabled" : ""} aria-label="Mover destaque para cima">↑</button><button class="admin-action" type="button" data-featured-down="${item.id}" ${index === items.length - 1 ? "disabled" : ""} aria-label="Mover destaque para baixo">↓</button><button class="admin-action danger" type="button" data-featured-remove="${item.id}">Remover</button></div>
		</div>`).join("")}</div>`;

	featuredProducts.querySelectorAll("[data-featured-priority]").forEach((input) => input.addEventListener("change", () => updateFeaturedPriority(input.dataset.featuredPriority, input.value)));
	featuredProducts.querySelectorAll("[data-featured-up]").forEach((button) => button.addEventListener("click", () => moveFeatured(button.dataset.featuredUp, -1)));
	featuredProducts.querySelectorAll("[data-featured-down]").forEach((button) => button.addEventListener("click", () => moveFeatured(button.dataset.featuredDown, 1)));
	featuredProducts.querySelectorAll("[data-featured-remove]").forEach((button) => button.addEventListener("click", () => removeFeatured(button.dataset.featuredRemove)));
}

function renderProducts() {
	productsTable.innerHTML = adminProducts.length ? `<div class="admin-table-scroll"><table class="admin-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Disponibilidade</th><th>Destaque</th><th>Ordem</th><th>Ações</th></tr></thead><tbody>${adminProducts.map((item) => `<tr><td><img class="admin-product-image" src="${Admin.escape(item.imagem || "")}" alt=""><span class="admin-product-name">${Admin.escape(item.nome)}</span><small class="admin-muted">#${item.id}</small></td><td>${Admin.escape(item.categoria?.nome || "-")}</td><td class="admin-price">${Admin.money(item.preco)}</td><td class="${item.disponivel ? "admin-available" : "admin-unavailable"}">${item.disponivel ? "Disponível" : "Indisponível"}</td><td class="admin-star">${item.destaque ? "★" : "☆"}</td><td>${item.destaque ? Number(item.ordemDestaque || 0) || "-" : "-"}</td><td><button class="admin-action" data-edit-product="${item.id}">Editar</button> <button class="admin-action danger" data-delete-product="${item.id}">Excluir</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="admin-empty"><strong>Nenhum produto encontrado</strong>Crie um produto ou ajuste o filtro.</div>`;
	productsTable.querySelectorAll("[data-edit-product]").forEach((button) => button.addEventListener("click", () => editProduct(button.dataset.editProduct)));
	productsTable.querySelectorAll("[data-delete-product]").forEach((button) => button.addEventListener("click", () => removeProduct(button.dataset.deleteProduct)));
}

async function getAllProducts(params) {
	const firstPage = await api.getProductsPage({ page: 1, limit: 100, ...params });
	const items = [...(firstPage.data || [])];
	for (let page = 2; page <= (firstPage.meta.totalPages || 1); page += 1) {
		const nextPage = await api.getProductsPage({ page, limit: 100, ...params });
		items.push(...(nextPage.data || []));
	}
	return items;
}

async function refreshProducts() {
	try {
		adminCategories = await api.getCategories();
		productOptions();
		const params = { search: productSearch.value.trim() };
		const category = adminCategories.find((item) => String(item.id) === productFilter.value);
		if (category) params.category = category.nome;
		[adminProducts, adminFeaturedProducts] = await Promise.all([getAllProducts(params), getAllProducts({ featured: true })]);
		renderFeaturedOrganizer();
		renderProducts();
	} catch (error) {
		productsTable.innerHTML = `<div class="admin-empty">${Admin.escape(error.message)}</div>`;
		featuredProducts.innerHTML = `<div class="admin-empty">${Admin.escape(error.message)}</div>`;
	}
}

async function updateFeaturedPriority(id, value) {
	const priority = Math.max(1, Number.parseInt(value, 10) || 1);
	try {
		await api.updateProduct(id, { destaque: true, ordemDestaque: priority });
		Admin.toast("Prioridade atualizada.");
		await refreshProducts();
	} catch (error) {
		Admin.toast(error.message, true);
	}
}

async function moveFeatured(id, direction) {
	const items = featuredOrder(adminFeaturedProducts);
	const currentIndex = items.findIndex((item) => String(item.id) === String(id));
	const targetIndex = currentIndex + direction;
	if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return;
	[items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];
	try {
		await Promise.all(items.map((item, index) => api.updateProduct(item.id, { destaque: true, ordemDestaque: index + 1 })));
		Admin.toast("Ordem dos destaques atualizada.");
		await refreshProducts();
	} catch (error) {
		Admin.toast(error.message, true);
	}
}

async function removeFeatured(id) {
	try {
		await api.updateProduct(id, { destaque: false, ordemDestaque: 0 });
		Admin.toast("Produto removido dos destaques.");
		await refreshProducts();
	} catch (error) {
		Admin.toast(error.message, true);
	}
}

function resetProduct() {
	productForm.reset();
	productId.value = "";
	productAvailable.checked = true;
	productModalTitle.textContent = "Novo produto";
	productSave.textContent = "Salvar produto";
}

async function editProduct(id) {
	try {
		adminCategories = await api.getCategories();
		productOptions();
		const item = await api.getProduct(id);
		productId.value = item.id;
		productName.value = item.nome;
		productDescription.value = item.descricao || "";
		productPrice.value = item.preco;
		productImageUrl.value = item.imagem || "";
		productImageFile.value = "";
		productCategory.value = item.categoriaId;
		productAvailable.checked = item.disponivel;
		productFeatured.checked = item.destaque;
		productModalTitle.textContent = "Editar produto";
		productSave.textContent = "Salvar alterações";
		Admin.modal("productModal");
	} catch (error) {
		Admin.toast(error.message, true);
	}
}

async function removeProduct(id) {
	if (!confirm("Tem certeza que deseja excluir este produto?")) return;
	try {
		await api.deleteProduct(id);
		Admin.toast("Produto excluído com sucesso.");
		refreshProducts();
	} catch (error) {
		Admin.toast(error.message, true);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	newProduct.addEventListener("click", async () => {
		resetProduct();
		await refreshProducts();
		Admin.modal("productModal");
	});
	productSearch.addEventListener("input", refreshProducts);
	productFilter.addEventListener("change", refreshProducts);
	reloadProducts.addEventListener("click", refreshProducts);
	productForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (!productForm.reportValidity()) return;
		const id = productId.value;
		Admin.loading(productSave, true, id ? "Salvar alterações" : "Salvar produto");
		try {
			if (id) await api.updateProduct(id, productPayload());
			else await api.createProduct(productPayload());
			Admin.modal("productModal", false);
			Admin.toast(id ? "Produto atualizado com sucesso." : "Produto criado com sucesso.");
			refreshProducts();
			loadDashboard();
		} catch (error) {
			Admin.toast(error.message, true);
		} finally {
			Admin.loading(productSave, false, id ? "Salvar alterações" : "Salvar produto");
		}
	});
});

window.AdminProducts = { refresh: refreshProducts };
