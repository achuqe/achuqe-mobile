ALTER TABLE `user_profiles` ADD `firstName` varchar(120);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `lastName` varchar(120);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `birthDate` date;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `profileConsentAt` timestamp;