-- Add explicit ordering for featured products.
ALTER TABLE `products`
    ADD COLUMN `ordem_destaque` INTEGER NOT NULL DEFAULT 0 AFTER `destaque`;

CREATE INDEX `products_destaque_ordem_destaque_idx`
    ON `products`(`destaque`, `ordem_destaque`);
