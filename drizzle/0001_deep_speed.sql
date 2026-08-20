CREATE TABLE `business_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(180) NOT NULL,
	`description` text,
	`city` varchar(120),
	`contact` varchar(320) NOT NULL,
	`status` enum('draft','active','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_profiles_user_id_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_product_unique` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `gift_searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`answers` json NOT NULL,
	`resultProductIds` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gift_searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priceInTetri` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'GEL',
	`imageUrl` text NOT NULL,
	`deliveryLabel` varchar(255) NOT NULL,
	`city` varchar(120) NOT NULL,
	`occasions` json NOT NULL,
	`interests` json NOT NULL,
	`ageRanges` json NOT NULL,
	`genders` json NOT NULL,
	`relationships` json NOT NULL,
	`status` enum('draft','active','paused') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountType` enum('consumer','business') NOT NULL DEFAULT 'consumer',
	`city` varchar(120),
	`language` varchar(10) NOT NULL DEFAULT 'ka',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_user_id_unique` UNIQUE(`userId`)
);
