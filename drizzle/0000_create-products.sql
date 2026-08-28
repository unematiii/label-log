CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`basis_amount` real NOT NULL,
	`basis_unit` text NOT NULL,
	`serving_amount` real NOT NULL,
	`serving_unit` text NOT NULL,
	`energy_kj` real NOT NULL,
	`energy_kcal` real NOT NULL,
	`fat_g` real NOT NULL,
	`saturated_fat_g` real NOT NULL,
	`carbohydrates_g` real NOT NULL,
	`sugars_g` real NOT NULL,
	`fibre_g` real NOT NULL,
	`protein_g` real NOT NULL,
	`salt_g` real NOT NULL,
	`sodium_mg` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);