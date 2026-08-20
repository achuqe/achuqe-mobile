CREATE TABLE `business_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`orderId` int NOT NULL,
	`amountInTetri` int NOT NULL,
	`status` enum('available','processing','paid','on_hold','refunded') NOT NULL DEFAULT 'available',
	`provider` enum('test','tbc','bog') NOT NULL DEFAULT 'test',
	`bankReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_payouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_payouts_order_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `platform_fee_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`amountInTetri` int NOT NULL,
	`status` enum('available','settled','refunded') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`settledAt` timestamp,
	CONSTRAINT `platform_fee_ledger_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_fee_ledger_order_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE INDEX `business_payouts_business_status_created_idx` ON `business_payouts` (`businessId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `platform_fee_ledger_status_created_idx` ON `platform_fee_ledger` (`status`,`createdAt`);