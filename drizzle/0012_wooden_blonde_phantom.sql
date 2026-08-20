CREATE TABLE `local_auth_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `local_auth_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_auth_accounts_email_unique` UNIQUE(`email`),
	CONSTRAINT `local_auth_accounts_user_id_unique` UNIQUE(`userId`)
);
