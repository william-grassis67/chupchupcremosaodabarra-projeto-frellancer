# Chup Chup Gourmet — Frontend de Delivery

Frontend completo de um site de delivery, construído em **HTML5, CSS3 e JavaScript Vanilla** (sem frameworks, sem bibliotecas), integrado a uma API REST própria.

## 🍧 Sobre o projeto

Site institucional/cardápio para a marca **Chup Chup Gourmet**, onde o cliente:

1. Navega pelo cardápio (com filtro por categoria e busca textual);
2. Monta o carrinho (persistido em `localStorage`);
3. Preenche os dados de entrega e pagamento no checkout;
4. Preenche os dados e monta a mensagem do pedido;
5. Abre o WhatsApp da loja para o cliente revisar e enviar a mensagem.

Não há login, cadastro ou qualquer autenticação — é um fluxo 100% público, como um cardápio digital.

## 🛠️ Tecnologias

- HTML5 semântico
- CSS3 puro (custom properties, grid, flexbox) — zero frameworks (sem Bootstrap/Tailwind)
- JavaScript Vanilla (ES6+, módulos via IIFE) — sem React/Vue/Angular/jQuery
- `fetch` nativo para consumo da API
- `localStorage` para persistência do carrinho

## 📁 Estrutura

```
frontend/
├── index.html              # Página inicial (hero, categorias, cardápio)
├── 404.html                # Fallback visual para rotas inexistentes
├── pages/
│   ├── checkout.html       # Formulário de entrega e pagamento
│   └── success.html        # Aviso neutro sobre o pedido via WhatsApp
├── css/
│   ├── variables.css       # Todos os tokens de design (cor, tipo, espaçamento)
│   ├── reset.css
│   ├── global.css          # Tipografia, botões, badges, estados, formulários
│   ├── header.css
│   ├── hero.css
│   ├── categories.css
│   ├── products.css
│   ├── cart.css            # Drawer do carrinho + barra fixa mobile
│   ├── checkout.css
│   ├── success.css
│   ├── 404.css             # Identidade visual da página 404
│   └── responsive.css
├── js/
│   ├── config.js           # URL da API e constantes globais
│   ├── api.js              # Única camada de comunicação com o backend
│   ├── cart.js             # Estado e persistência do carrinho
│   ├── categories.js       # Busca e filtro de categorias
│   ├── products.js         # Renderização, busca (debounce) e paginação
│   ├── checkout.js         # Validação, resumo e mensagem do WhatsApp
│   └── main.js             # Inicialização, UI do carrinho e toast
└── assets/
    └── images/
        └── logo.jpg         # Selo da marca
```

## ▶️ Como executar

Este é um frontend estático — não precisa de build nem de `npm install`.

1. Em produção, o Nginx deve encaminhar `/api/*` para o backend Node.js.
2. Sirva a pasta `frontend/` com qualquer servidor estático, por exemplo:

   ```bash
   npx serve frontend
   # ou
    npx serve frontend -l 5500
   ```

3. Abra `http://localhost:5500` (ou a porta usada) no navegador.

> Abrir o `index.html` diretamente com duplo clique (`file://`) também funciona na maioria dos navegadores, mas um servidor estático é recomendado para evitar bloqueios de CORS/módulos.

Hospedagens estáticas que seguem a convenção `404.html` (incluindo o comando `serve` acima) exibem a página personalizada para qualquer rota inexistente. O botão principal retorna ao cardápio e o botão secundário tenta voltar pelo histórico do navegador.

## ⚙️ Configuração da API

A URL base da API fica centralizada em `js/config.js`. Por padrão, produção usa
`/api`, portanto o domínio do frontend precisa encaminhar esse caminho para o
backend. Quando frontend e backend estiverem em domínios diferentes, defina a
URL antes de carregar `js/config.js`:

```javascript
window.__API_URL__ = "https://api.seudominio.com/api";
```

Em desenvolvimento local, a página servida em `localhost` usa automaticamente
`http://localhost:3000/api`. A API deve permitir a origem do frontend em
`CORS_ORIGIN`.

## 🔌 Endpoints utilizadas pelo frontend

| Ação no site | Endpoint |
|---|---|
| Listar cardápio / filtrar por categoria / buscar / paginar | `GET /api/products?available=true&category=&search=&page=&limit=` |
| Buscar categorias para os filtros | `GET /api/categories` |
| Consultar produtos e categorias | `GET /api/products`, `GET /api/categories` |

Todas as chamadas passam exclusivamente por `js/api.js` — nenhum outro arquivo faz `fetch()` diretamente. As respostas são tratadas no padrão do backend:

```json
{ "success": true, "data": {} }
{ "success": false, "message": "...", "errors": {} }
```

## ⚠️ Sobre o formato dos dados (importante)

O backend real não estava disponível no mesmo workspace para leitura de controllers/DTOs no momento da construção deste frontend. Por isso:

- `js/products.js` e `js/categories.js` possuem uma função `normalize()` que aceita as variações mais comuns de nomes de campo (ex.: `image` / `imageUrl` / `image_url`, `available` / `isAvailable`, `category` / `categoryName`).
- `js/checkout.js` monta a mensagem com cliente, endereço, itens, totais, pagamento e observação.

**Antes de apresentar ao cliente**, confira os nomes reais de propriedades no backend (controllers/validators/DTOs) e ajuste:
- as funções `normalize()` em `js/products.js` e `js/categories.js`;
- a constante `WHATSAPP_NUMBER` em `js/config.js`;
- a lista `PAYMENT_METHODS` em `js/config.js` (os `value` devem bater com o que o backend espera).

O checkout envia `POST /api/orders` para calcular e registrar o pedido e, em seguida, abre o WhatsApp para o cliente revisar e enviar a mensagem. O formulário solicita nome, endereço, número, complemento, bairro, pagamento e uma observação opcional para localização; telefone e cidade não fazem parte do contrato.

## ✅ Funcionalidades

- Header com logo, navegação e contador de itens no carrinho
- Hero de apresentação da marca
- Filtro de categorias (via API, não apenas visual) + opção "Todos"
- Busca de produtos com debounce (400ms)
- Paginação real (via `page`/`limit` da API)
- Cards de produto com imagem, descrição, preço, categoria, selo de destaque e disponibilidade
- Produtos indisponíveis não podem ser adicionados ao carrinho
- Carrinho persistido em `localStorage`: adicionar, incrementar, decrementar, remover, limpar, subtotal e total
- Barra fixa de carrinho no mobile
- Checkout com validação de campos obrigatórios, seleção de pagamento, observações, estado de carregamento no botão e bloqueio de envios duplicados
- Tratamento de erros da API (mensagem geral + erros por campo, quando enviados)
- Confirmação informativa após abrir o WhatsApp, sem afirmar que o pedido já foi recebido
- Administração em `admin/` com dashboard, produtos, categorias e pedidos
- Estados visuais de carregando, API indisponível, nenhum produto encontrado e carrinho vazio
- HTML semântico, labels, `alt` em imagens, foco visível e navegação por teclado

## 🧪 Como testar

1. Com o backend rodando, acesse a página inicial e confira se as categorias e produtos carregam.
2. Teste a busca digitando um termo existente e um inexistente (estado "nenhum produto encontrado").
3. Desligue o backend momentaneamente e recarregue a página para ver o estado de "API indisponível".
4. Adicione produtos ao carrinho, altere quantidades, remova um item e esvazie o carrinho.
5. Vá para o checkout com o carrinho vazio (deve mostrar o aviso de carrinho vazio).
6. Preencha o checkout com o carrinho cheio e finalize pelo WhatsApp — confira a mensagem pronta na conversa da loja.
7. Redimensione a janela para simular mobile e confira a barra fixa do carrinho.
