-- Remove customer contact fields that are no longer part of the order contract.
ALTER TABLE `orders`
    DROP COLUMN `telefone`,
    DROP COLUMN `cidade`;
