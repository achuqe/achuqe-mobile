ALTER TABLE `orders` ADD `platformFeeBps` int DEFAULT 600 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `platformFeeInTetri` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `businessPayoutInTetri` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentProvider` enum('test','tbc','bog') DEFAULT 'test' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentStatus` enum('awaiting_payment','paid','failed','refunded') DEFAULT 'awaiting_payment' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentReference` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `paidAt` timestamp;--> statement-breakpoint
CREATE INDEX `orders_business_payment_created_idx` ON `orders` (`businessId`,`paymentStatus`,`createdAt`);