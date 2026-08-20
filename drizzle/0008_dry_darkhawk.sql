ALTER TABLE `orders` ADD `customerPaymentFeeBps` int DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerPaymentFeeInTetri` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerTotalInTetri` int DEFAULT 0 NOT NULL;