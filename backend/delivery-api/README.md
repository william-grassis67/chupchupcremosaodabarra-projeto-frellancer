# Delivery API

A complete REST API backend for a food delivery website, built with **Node.js**, **Express**, and **Prisma ORM** on **MySQL**.

There is **no customer authentication** — customers browse products and submit orders directly. Management (product/category/order administration) routes are separated architecturally so authentication can be added later without touching route or controller code.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Request / Response Examples](#request--response-examples)
- [Error Format](#error-format)
- [Security Notes](#security-notes)

## Features

- Full CRUD for **Products** and **Categories**
- Product filtering by category, availability, featured flag, and name search
- **Order creation** from a frontend-managed cart, with **server-side price recalculation** (the API never trusts prices sent by the client)
- Historical snapshot of product name/price stored on each order item
- Order status workflow (`pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`, or `cancelled`)
- Clear separation of public routes, order routes, and management routes
- Standardized JSON success/error responses
- Input validation on every write endpoint
- Security hardening: Helmet, configurable CORS, rate limiting, centralized error handling with no stack traces in production

## Tech Stack

- Node.js + Express.js
- MySQL
- Prisma ORM
- express-validator
- helmet, cors, express-rate-limit
- dotenv
- bcrypt (included as a dependency, reserved for future admin authentication)

## Requirements

- Node.js 18+
- MySQL 8+ (or compatible, e.g. MariaDB)
- npm

## Installation

```bash
git clone <your-repo-url> delivery-api
cd delivery-api
npm install
```

## Environment Configuration

Copy the example environment file and adjust the values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the API listens on | `3000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `DATABASE_URL` | MySQL connection string used by Prisma | `mysql://root:password@localhost:3306/delivery_db` |
| `CORS_ORIGIN` | Comma-separated list of allowed origins (`*` for any, dev only) | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window per IP | `100` |
| `ADMIN_PASSWORD_HASH` | Reserved for future admin authentication (unused today) | *(empty)* |

## Database Setup

1. Create the MySQL database referenced in `DATABASE_URL` (or let Prisma create it as part of the first migration, depending on your MySQL user permissions).
2. Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. (Optional) Seed the database with sample categories and products:

```bash
node prisma/seed.js
```

## Running the Server

```bash
# development (auto-restart with nodemon)
npm run dev

# production
npm start
```

The API will be available at `http://localhost:PORT`. Check `GET /api/health` to confirm it's running.

## Project Structure

```text
src/
├── controllers/     # Request handlers - parse input, call services, format response
├── services/        # Business logic and Prisma queries
├── routes/          # Express routers, one per resource
├── middlewares/      # Error handling, validation runner, admin auth placeholder
├── validators/       # express-validator rule sets per resource
├── utils/            # Response helpers, AppError, async wrapper
├── config/           # Prisma client, CORS, rate limit configuration
├── app.js            # Express app assembly
└── server.js         # Process entry point, DB connection, graceful shutdown

prisma/
├── schema.prisma      # Data model (Product, Category, Order, OrderItem)
└── seed.js            # Optional sample data

.env.example
.gitignore
package.json
README.md
```

## API Endpoints

### Products (public read, management write)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products. Supports `?category=`, `?available=`, `?featured=`, `?search=`, `?page=`, `?limit=` |
| GET | `/api/products/:id` | Get a single product |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/:id` | Update a product |
| DELETE | `/api/products/:id` | Delete a product (blocked if referenced by existing orders) |

### Categories (public read, management write)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id` | Get a single category |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Update a category |
| DELETE | `/api/categories/:id` | Delete a category (blocked if it has products) |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Create an order from a cart (public) |
| GET | `/api/orders` | List orders. Supports `?status=`, `?page=`, `?limit=` (management) |
| GET | `/api/orders/:id` | Get a single order (management) |
| PUT | `/api/orders/:id/status` | Update order status (management) |
| DELETE | `/api/orders/:id` | Delete an order (management) |

### Misc

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |

## Request / Response Examples

### Create a product

`POST /api/products`

```json
{
  "nome": "Classic Cheeseburger",
  "descricao": "Beef patty, cheddar, lettuce, tomato and special sauce",
  "preco": 25.90,
  "imagem": "https://example.com/images/cheeseburger.jpg",
  "categoriaId": 1,
  "disponivel": true,
  "destaque": true
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "Classic Cheeseburger",
    "descricao": "Beef patty, cheddar, lettuce, tomato and special sauce",
    "preco": "25.90",
    "imagem": "https://example.com/images/cheeseburger.jpg",
    "disponivel": true,
    "destaque": true,
    "categoriaId": 1,
    "criadoEm": "2026-01-01T12:00:00.000Z",
    "atualizadoEm": "2026-01-01T12:00:00.000Z",
    "categoria": { "id": 1, "nome": "hamburgers", "descricao": "...", "ativo": true }
  }
}
```

### Filter products

```
GET /api/products?category=hamburgers&available=true&search=cheese&page=1&limit=10
```

### Create an order

`POST /api/orders`

The client only sends **which products and quantities** were selected — the API looks up current prices and names itself and ignores any price sent by the client.

```json
{
  "nomeCliente": "John Smith",
  "endereco": "123 Main St",
  "numero": "45B",
  "complemento": "Apt 2",
  "bairro": "Santana",
  "observacao": "Blue house next to the church",
  "formaPagamento": "credit_card",
  "itens": [
    { "produtoId": 1, "quantidade": 2 },
    { "produtoId": 3, "quantidade": 1 }
  ]
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "nomeCliente": "John Smith",
    "endereco": "123 Main St",
    "numero": "45B",
    "complemento": "Apt 2",
    "bairro": "Downtown",
    "observacao": "Blue house next to the church",
    "formaPagamento": "credit_card",
    "valorProdutos": "58.30",
    "taxaEntrega": "0.00",
    "valorTotal": "58.30",
    "status": "pending",
    "criadoEm": "2026-01-01T12:05:00.000Z",
    "atualizadoEm": "2026-01-01T12:05:00.000Z",
    "itens": [
      {
        "id": 1,
        "pedidoId": 10,
        "produtoId": 1,
        "nomeProduto": "Classic Cheeseburger",
        "quantidade": 2,
        "precoUnitario": "25.90",
        "subtotal": "51.80"
      },
      {
        "id": 2,
        "pedidoId": 10,
        "produtoId": 3,
        "nomeProduto": "Soda 350ml",
        "quantidade": 1,
        "precoUnitario": "6.50",
        "subtotal": "6.50"
      }
    ]
  }
}
```

### Update order status

`PUT /api/orders/10/status`

```json
{ "status": "confirmed" }
```

## Error Format

All errors follow the same shape:

```json
{
  "success": false,
  "message": "Product not found"
}
```

Validation errors additionally include an `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "preco", "message": "preco must be a positive number" }
  ]
}
```

## Security Notes

- **Helmet** sets sensible security-related HTTP headers.
- **CORS** is restricted to the origins listed in `CORS_ORIGIN`.
- **Rate limiting** is applied to all `/api` routes.
- **Prisma** parameterizes all queries, preventing SQL injection.
- **Validation** (express-validator) runs on every write endpoint before it reaches business logic.
- Stack traces are never returned to the client; unexpected errors are logged server-side only.
- Management routes are already wired through an `adminAuth` middleware (currently a no-op) so real authentication can be added later — see `src/middlewares/adminAuth.js` — without changing routes or controllers.
- Order totals are **always** computed server-side from the current product prices in the database, never from client input.
