# Administração

Painel administrativo do Chup Chup Gourmet, dentro do mesmo frontend da loja. Usa HTML5, CSS3, JavaScript Vanilla e as endpoints reais do backend.

## Execução

```bash
cd frontend
python3 -m http.server 5500
```

- Loja: `http://localhost:5500/`
- Administração: `http://localhost:5500/admin/`

Em produção, o Nginx deve encaminhar `/api/*` para o backend Node.js. A URL fica centralizada em `js/config.js`.

## Estrutura

- `index.html`: dashboard e navegação administrativa
- `products.html`, `categories.html`, `orders.html`: atalhos para as seções do painel
- `../css/admin*.css`: estilos administrativos usando os tokens do frontend
- `../js/admin/*.js`: dashboard, produtos, categorias e pedidos

Os produtos e categorias usam os campos reais `nome`, `descricao`, `preco`, `imagem`, `categoriaId`, `disponivel`, `destaque` e `ativo`. A administração de pedidos usa `GET`, detalhes, atualização de status e exclusão.

O checkout da loja não chama `POST /api/orders`. Ele monta uma mensagem com os dados do carrinho e abre o WhatsApp configurado em `js/config.js` pela constante `WHATSAPP_NUMBER`.
