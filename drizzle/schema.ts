import { boolean, date, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const localAuthAccounts = mysqlTable(
  "local_auth_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("local_auth_accounts_email_unique").on(table.email),
    uniqueIndex("local_auth_accounts_user_id_unique").on(table.userId),
  ],
);

export const userProfiles = mysqlTable(
  "user_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    accountType: mysqlEnum("accountType", ["consumer", "business"]).default("consumer").notNull(),
    city: varchar("city", { length: 120 }),
    language: varchar("language", { length: 10 }).default("ka").notNull(),
    firstName: varchar("firstName", { length: 120 }),
    lastName: varchar("lastName", { length: 120 }),
    birthDate: date("birthDate"),
    phone: varchar("phone", { length: 40 }),
    avatarUrl: text("avatarUrl"),
    profileConsentAt: timestamp("profileConsentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("user_profiles_user_id_unique").on(table.userId)],
);

export const businessProfiles = mysqlTable(
  "business_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    category: varchar("category", { length: 180 }).notNull(),
    description: text("description"),
    city: varchar("city", { length: 120 }),
    contact: varchar("contact", { length: 320 }).notNull(),
    payoutAccountIban: varchar("payoutAccountIban", { length: 34 }),
    status: mysqlEnum("status", ["pending", "active", "rejected", "suspended"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("business_profiles_user_id_unique").on(table.userId)],
);

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priceInTetri: int("priceInTetri").notNull(),
  currency: varchar("currency", { length: 3 }).default("GEL").notNull(),
  imageUrl: text("imageUrl").notNull(),
  deliveryLabel: varchar("deliveryLabel", { length: 255 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  occasions: json("occasions").$type<string[]>().notNull(),
  interests: json("interests").$type<string[]>().notNull(),
  ageRanges: json("ageRanges").$type<string[]>().notNull(),
  genders: json("genders").$type<string[]>().notNull(),
  relationships: json("relationships").$type<string[]>().notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "deleted"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: int("productId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("favorites_user_product_unique").on(table.userId, table.productId)],
);

export const giftSearches = mysqlTable("gift_searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  answers: json("answers").$type<Record<string, unknown>>().notNull(),
  resultProductIds: json("resultProductIds").$type<number[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    customerUserId: int("customerUserId").notNull(),
    businessId: int("businessId").notNull(),
    productId: int("productId").notNull(),
    productName: varchar("productName", { length: 255 }).notNull(),
    productImageUrl: text("productImageUrl").notNull(),
    quantity: int("quantity").notNull(),
    unitPriceInTetri: int("unitPriceInTetri").notNull(),
    totalPriceInTetri: int("totalPriceInTetri").notNull(),
    platformFeeBps: int("platformFeeBps").default(600).notNull(),
    platformFeeInTetri: int("platformFeeInTetri").default(0).notNull(),
    customerPaymentFeeBps: int("customerPaymentFeeBps").default(300).notNull(),
    customerPaymentFeeInTetri: int("customerPaymentFeeInTetri").default(0).notNull(),
    customerTotalInTetri: int("customerTotalInTetri").default(0).notNull(),
    businessPayoutInTetri: int("businessPayoutInTetri").default(0).notNull(),
    paymentProvider: mysqlEnum("paymentProvider", ["test", "tbc", "bog"]).default("test").notNull(),
    paymentStatus: mysqlEnum("paymentStatus", ["awaiting_payment", "paid", "failed", "refunded"]).default("awaiting_payment").notNull(),
    paymentReference: varchar("paymentReference", { length: 255 }),
    paidAt: timestamp("paidAt"),
    customerName: varchar("customerName", { length: 180 }).notNull(),
    customerPhone: varchar("customerPhone", { length: 40 }).notNull(),
    deliveryAddress: text("deliveryAddress").notNull(),
    note: text("note"),
    status: mysqlEnum("status", ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("orders_business_status_created_idx").on(table.businessId, table.status, table.createdAt),
    index("orders_business_payment_created_idx").on(table.businessId, table.paymentStatus, table.createdAt),
    index("orders_customer_created_idx").on(table.customerUserId, table.createdAt),
  ],
);

export const businessNotifications = mysqlTable(
  "business_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId").notNull(),
    orderId: int("orderId").notNull(),
    type: mysqlEnum("type", ["new_order", "order_status"]).default("new_order").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    readAt: timestamp("readAt"),
  },
  (table) => [
    index("business_notifications_business_read_created_idx").on(table.businessId, table.isRead, table.createdAt),
  ],
);

export const pushTokens = mysqlTable(
  "push_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    platform: mysqlEnum("platform", ["ios", "android"]).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("push_tokens_token_unique").on(table.token), index("push_tokens_user_active_idx").on(table.userId, table.isActive)],
);

export const adminNotifications = mysqlTable(
  "admin_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId").notNull(),
    type: mysqlEnum("type", ["new_business_registration"]).default("new_business_registration").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    readAt: timestamp("readAt"),
  },
  (table) => [index("admin_notifications_read_created_idx").on(table.isRead, table.createdAt)],
);

export const platformFeeLedger = mysqlTable(
  "platform_fee_ledger",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    amountInTetri: int("amountInTetri").notNull(),
    status: mysqlEnum("status", ["available", "settled", "refunded"]).default("available").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    settledAt: timestamp("settledAt"),
  },
  (table) => [uniqueIndex("platform_fee_ledger_order_unique").on(table.orderId), index("platform_fee_ledger_status_created_idx").on(table.status, table.createdAt)],
);

export const businessPayouts = mysqlTable(
  "business_payouts",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId").notNull(),
    orderId: int("orderId").notNull(),
    amountInTetri: int("amountInTetri").notNull(),
    status: mysqlEnum("status", ["available", "processing", "paid", "on_hold", "refunded"]).default("available").notNull(),
    provider: mysqlEnum("provider", ["test", "tbc", "bog"]).default("test").notNull(),
    bankReference: varchar("bankReference", { length: 255 }),
    destinationAccountIban: varchar("destinationAccountIban", { length: 34 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    paidAt: timestamp("paidAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("business_payouts_order_unique").on(table.orderId),
    index("business_payouts_business_status_created_idx").on(table.businessId, table.status, table.createdAt),
  ],
);

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type BusinessProfileRecord = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;
export type ProductRecord = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type FavoriteRecord = typeof favorites.$inferSelect;
export type OrderRecord = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type BusinessNotificationRecord = typeof businessNotifications.$inferSelect;
export type PushTokenRecord = typeof pushTokens.$inferSelect;
export type AdminNotificationRecord = typeof adminNotifications.$inferSelect;
export type PlatformFeeLedgerRecord = typeof platformFeeLedger.$inferSelect;
export type BusinessPayoutRecord = typeof businessPayouts.$inferSelect;
