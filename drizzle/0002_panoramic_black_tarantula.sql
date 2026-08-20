CREATE TABLE `business_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`orderId` int NOT NULL,
	`type` enum('new_order','order_status') NOT NULL DEFAULT 'new_order',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `business_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerUserId` int NOT NULL,
	`businessId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`productImageUrl` text NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceInTetri` int NOT NULL,
	`totalPriceInTetri` int NOT NULL,
	`customerName` varchar(180) NOT NULL,
	`customerPhone` varchar(40) NOT NULL,
	`deliveryAddress` text NOT NULL,
	`note` text,
	`status` enum('pending','confirmed','preparing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `business_notifications_business_read_created_idx` ON `business_notifications` (`businessId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `orders_business_status_created_idx` ON `orders` (`businessId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `orders_customer_created_idx` ON `orders` (`customerUserId`,`createdAt`);