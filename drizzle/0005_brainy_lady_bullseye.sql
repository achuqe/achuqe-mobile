CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`type` enum('new_business_registration') NOT NULL DEFAULT 'new_business_registration',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_profiles` MODIFY COLUMN `status` enum('pending','active','rejected','suspended') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `status` enum('draft','active','paused','deleted') NOT NULL DEFAULT 'draft';--> statement-breakpoint
CREATE INDEX `admin_notifications_read_created_idx` ON `admin_notifications` (`isRead`,`createdAt`);