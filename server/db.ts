import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  businessProfiles,
  businessNotifications,
  adminNotifications,
  businessPayouts,
  favorites,
  giftSearches,
  type InsertBusinessProfile,
  type InsertProduct,
  type InsertUser,
  products,
  orders,
  platformFeeLedger,
  pushTokens,
  userProfiles,
  users,
} from "../drizzle/schema";
import type { GiftAnswers, GiftProduct, OrderStatus, ProductStatus, UserRole } from "../shared/achuqe";
import { calculatePaymentAmounts, CUSTOMER_PAYMENT_FEE_BPS, PLATFORM_FEE_BPS, type PaymentProvider } from "../shared/payment";
import { ENV } from "./_core/env";
import { sendOrderStatusPush } from "./push";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserProfile(userId: number, accountType: UserRole) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userProfiles).values({ userId, accountType }).onDuplicateKeyUpdate({
    set: { accountType },
  });
  return getUserProfile(userId);
}

export async function savePersonalProfileForUser(userId: number, input: { firstName: string; lastName: string; birthDate: string; phone?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserProfile(userId);
  const now = new Date();
  const birthDate = new Date(`${input.birthDate}T00:00:00.000Z`);
  await db.insert(userProfiles).values({
    userId,
    accountType: existing?.accountType ?? "consumer",
    city: existing?.city ?? null,
    language: existing?.language ?? "ka",
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate,
    phone: input.phone?.trim() || existing?.phone || null,
    profileConsentAt: now,
  }).onDuplicateKeyUpdate({
    set: {
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate,
      phone: input.phone?.trim() || existing?.phone || null,
      profileConsentAt: now,
    },
  });
  return getUserProfile(userId);
}

export async function setProfileAvatarForUser(userId: number, avatarUrl: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserProfile(userId);
  await db.insert(userProfiles).values({
    userId,
    accountType: existing?.accountType ?? "consumer",
    city: existing?.city ?? null,
    language: existing?.language ?? "ka",
    avatarUrl,
  }).onDuplicateKeyUpdate({ set: { avatarUrl } });
  return getUserProfile(userId);
}

export async function getBusinessProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertBusinessProfile(userId: number, input: Omit<InsertBusinessProfile, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const payoutAccountIban = input.payoutAccountIban
    ? input.payoutAccountIban.replace(/\s/g, "").toUpperCase()
    : null;
  if (payoutAccountIban && !/^GE\d{2}[A-Z]{2}\d{16}$/.test(payoutAccountIban)) {
    throw new Error("მიუთითე სწორი ქართული IBAN ანგარიში, მაგალითად GE29NB0000000101904917");
  }
  const existing = await getBusinessProfileByUserId(userId);
  if (existing) {
    await db.update(businessProfiles).set({
      name: input.name,
      category: input.category,
      description: input.description,
      city: input.city,
      contact: input.contact,
      payoutAccountIban,
    }).where(eq(businessProfiles.id, existing.id));
  } else {
    const result = await db.insert(businessProfiles).values({ ...input, payoutAccountIban, userId, status: "pending" });
    const businessId = Number(result[0].insertId);
    await db.insert(adminNotifications).values({
      businessId,
      type: "new_business_registration",
      title: "ახალი ბიზნესის დასამტკიცებელი განაცხადი",
      body: `${input.name} · ${input.category} · ${input.city ?? "ქალაქი მიუთითებელი არ არის"}`,
      isRead: false,
    });
  }
  await upsertUserProfile(userId, "business");
  return getBusinessProfileByUserId(userId);
}

async function requireOwnedBusiness(userId: number) {
  const business = await getBusinessProfileByUserId(userId);
  if (!business) throw new Error("Business profile required");
  return business;
}

export async function getBusinessProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const business = await getBusinessProfileByUserId(userId);
  if (!business) return [];
  const result = await db.select().from(products).where(eq(products.businessId, business.id)).orderBy(desc(products.createdAt));
  return result.filter((product) => product.status !== "deleted");
}

export async function createProductForUser(userId: number, input: Omit<InsertProduct, "businessId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const business = await requireOwnedBusiness(userId);
  const result = await db.insert(products).values({ ...input, businessId: business.id });
  return result[0].insertId;
}

export async function updateProductForUser(userId: number, productId: number, input: Partial<Omit<InsertProduct, "businessId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const business = await requireOwnedBusiness(userId);
  const owned = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.businessId, business.id)))
    .limit(1);
  if (!owned[0]) throw new Error("Product not found or not owned by user");
  await db.update(products).set(input).where(eq(products.id, productId));
  return { success: true } as const;
}

export async function setProductStatusForUser(userId: number, productId: number, status: ProductStatus) {
  return updateProductForUser(userId, productId, { status });
}

export async function deleteProductForUser(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const business = await requireOwnedBusiness(userId);
  const owned = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.businessId, business.id)))
    .limit(1);
  if (!owned[0]) throw new Error("Product not found or not owned by user");
  await db.update(products).set({ status: "deleted" }).where(eq(products.id, productId));
  return { success: true } as const;
}

function mapProduct(record: typeof products.$inferSelect, businessName: string): GiftProduct {
  return {
    id: String(record.id),
    businessId: String(record.businessId),
    businessName,
    name: record.name,
    description: record.description,
    price: record.priceInTetri / 100,
    currency: "₾",
    imageUrl: record.imageUrl,
    occasions: record.occasions as GiftProduct["occasions"],
    interests: record.interests as GiftProduct["interests"],
    ageRanges: record.ageRanges as GiftProduct["ageRanges"],
    genders: record.genders as GiftProduct["genders"],
    relationships: record.relationships as GiftProduct["relationships"],
    deliveryLabel: record.deliveryLabel,
    city: record.city,
    status: record.status,
  };
}

export async function getActiveProducts(): Promise<GiftProduct[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ product: products, businessName: businessProfiles.name })
    .from(products)
    .innerJoin(businessProfiles, eq(products.businessId, businessProfiles.id))
    .where(and(eq(products.status, "active"), eq(businessProfiles.status, "active")))
    .orderBy(desc(products.createdAt));
  return rows.map((row) => mapProduct(row.product, row.businessName));
}

export async function getPublicBusinessProfile(businessId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const businesses = await db
    .select({
      id: businessProfiles.id,
      name: businessProfiles.name,
      category: businessProfiles.category,
      description: businessProfiles.description,
      city: businessProfiles.city,
      contact: businessProfiles.contact,
      createdAt: businessProfiles.createdAt,
    })
    .from(businessProfiles)
    .where(and(eq(businessProfiles.id, businessId), eq(businessProfiles.status, "active")))
    .limit(1);
  const business = businesses[0];
  if (!business) return undefined;

  const rows = await db
    .select({ product: products })
    .from(products)
    .where(and(eq(products.businessId, business.id), eq(products.status, "active")))
    .orderBy(desc(products.createdAt));

  return {
    business,
    products: rows.map((row) => mapProduct(row.product, business.name)),
  };
}

export async function getFavoriteProductIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ productId: favorites.productId }).from(favorites).where(eq(favorites.userId, userId));
  return rows.map((row) => row.productId);
}

export async function toggleFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);
  if (existing[0]) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return { favorite: false } as const;
  }
  await db.insert(favorites).values({ userId, productId });
  return { favorite: true } as const;
}

export async function saveGiftSearch(userId: number | null, answers: GiftAnswers, resultProductIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(giftSearches).values({
    userId,
    answers: answers as unknown as Record<string, unknown>,
    resultProductIds,
  });
}

export async function createOrderForUser(input: {
  customerUserId: number;
  productId: number;
  quantity: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  note?: string;
  paymentProvider?: PaymentProvider;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const matchingProduct = await db
    .select({ product: products, business: businessProfiles })
    .from(products)
    .innerJoin(businessProfiles, eq(products.businessId, businessProfiles.id))
    .where(and(eq(products.id, input.productId), eq(products.status, "active"), eq(businessProfiles.status, "active")))
    .limit(1);
  const found = matchingProduct[0];
  if (!found) throw new Error("Product is not available for ordering");

  const totalPriceInTetri = found.product.priceInTetri * input.quantity;
  const amounts = calculatePaymentAmounts(totalPriceInTetri);
  const result = await db.insert(orders).values({
    customerUserId: input.customerUserId,
    businessId: found.business.id,
    productId: found.product.id,
    productName: found.product.name,
    productImageUrl: found.product.imageUrl,
    quantity: input.quantity,
    unitPriceInTetri: found.product.priceInTetri,
    totalPriceInTetri,
    platformFeeBps: PLATFORM_FEE_BPS,
    platformFeeInTetri: amounts.platformFeeInTetri,
    customerPaymentFeeBps: CUSTOMER_PAYMENT_FEE_BPS,
    customerPaymentFeeInTetri: amounts.customerPaymentFeeInTetri,
    customerTotalInTetri: amounts.customerTotalInTetri,
    businessPayoutInTetri: amounts.businessPayoutInTetri,
    paymentProvider: input.paymentProvider ?? "test",
    paymentStatus: "awaiting_payment",
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    deliveryAddress: input.deliveryAddress,
    note: input.note?.trim() || null,
    status: "pending",
  });
  const orderId = Number(result[0].insertId);

  return {
    orderId,
    ...amounts,
    paymentProvider: input.paymentProvider ?? "test",
    paymentStatus: "awaiting_payment" as const,
  };
}

export async function confirmTestPaymentForUser(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerUserId, userId), eq(orders.paymentProvider, "test")))
    .limit(1);
  const order = result[0];
  if (!order) throw new Error("Test order not found or not owned by user");
  if (order.paymentStatus === "paid") return { orderId: order.id, alreadyPaid: true as const };
  if (order.paymentStatus !== "awaiting_payment") throw new Error("Order payment cannot be confirmed");

  const reference = `TEST-${order.id}-${Date.now()}`;
  const business = await getBusinessProfileByUserId(order.businessId);
  const destinationAccountIban = business?.payoutAccountIban ?? null;
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ paymentStatus: "paid", paymentReference: reference, paidAt: new Date() })
      .where(eq(orders.id, order.id));
    await tx.insert(platformFeeLedger).values({
      orderId: order.id,
      amountInTetri: order.platformFeeInTetri + order.customerPaymentFeeInTetri,
      status: "available",
    });
    await tx.insert(businessPayouts).values({
      businessId: order.businessId,
      orderId: order.id,
      amountInTetri: order.businessPayoutInTetri,
      status: destinationAccountIban ? "available" : "on_hold",
      provider: order.paymentProvider,
      destinationAccountIban,
    });
    await tx.insert(businessNotifications).values({
      businessId: order.businessId,
      orderId: order.id,
      type: "new_order",
      title: "ახალი გადახდილი შეკვეთა",
      body: `${order.productName} · ${order.quantity} ერთეული · ${(order.totalPriceInTetri / 100).toFixed(2)} ₾`,
      isRead: false,
    });
  });
  return { orderId: order.id, paymentReference: reference, alreadyPaid: false as const };
}

export async function getBusinessOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const business = await getBusinessProfileByUserId(userId);
  if (!business) return [];
  const rows = await db
    .select({ order: orders, payout: businessPayouts })
    .from(orders)
    .innerJoin(businessPayouts, eq(businessPayouts.orderId, orders.id))
    .where(and(eq(orders.businessId, business.id), eq(orders.paymentStatus, "paid")))
    .orderBy(desc(orders.createdAt));
  return rows.map((row) => ({
    ...row.order,
    payoutStatus: row.payout.status,
    payoutReference: row.payout.bankReference,
  }));
}

export async function getCustomerOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ order: orders, businessName: businessProfiles.name, businessCity: businessProfiles.city })
    .from(orders)
    .innerJoin(businessProfiles, eq(businessProfiles.id, orders.businessId))
    .where(and(eq(orders.customerUserId, userId), eq(orders.paymentStatus, "paid")))
    .orderBy(desc(orders.createdAt));
  return rows.map((row) => ({ ...row.order, businessName: row.businessName, businessCity: row.businessCity }));
}

export async function upsertPushTokenForUser(userId: number, token: string, platform: "ios" | "android") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ id: pushTokens.id }).from(pushTokens).where(eq(pushTokens.token, token)).limit(1);
  if (existing[0]) {
    await db.update(pushTokens).set({ userId, platform, isActive: true }).where(eq(pushTokens.id, existing[0].id));
  } else {
    await db.insert(pushTokens).values({ userId, token, platform, isActive: true });
  }
  return { success: true } as const;
}

export async function getActivePushTokensForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ token: pushTokens.token, platform: pushTokens.platform }).from(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));
}

export async function updateOrderStatusForBusiness(userId: number, orderId: number, status: OrderStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const business = await requireOwnedBusiness(userId);
  const ownedOrder = await db
    .select({ id: orders.id, customerUserId: orders.customerUserId, productName: orders.productName })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.businessId, business.id), eq(orders.paymentStatus, "paid")))
    .limit(1);
  if (!ownedOrder[0]) throw new Error("Order not found or not owned by user");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
  void sendOrderStatusPush(ownedOrder[0].customerUserId, orderId, ownedOrder[0].productName, status);
  return { success: true } as const;
}

export async function getBusinessRevenueSummary(userId: number) {
  const db = await getDb();
  const empty = { paidOrderCount: 0, availableInTetri: 0, processingInTetri: 0, paidOutInTetri: 0 };
  if (!db) return empty;
  const business = await getBusinessProfileByUserId(userId);
  if (!business) return empty;
  const payouts = await db
    .select()
    .from(businessPayouts)
    .where(eq(businessPayouts.businessId, business.id));
  return payouts.reduce(
    (summary, payout) => ({
      paidOrderCount: summary.paidOrderCount + 1,
      availableInTetri: summary.availableInTetri + (payout.status === "available" ? payout.amountInTetri : 0),
      processingInTetri: summary.processingInTetri + (payout.status === "processing" ? payout.amountInTetri : 0),
      paidOutInTetri: summary.paidOutInTetri + (payout.status === "paid" ? payout.amountInTetri : 0),
    }),
    empty,
  );
}

export async function getBusinessPayouts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const business = await getBusinessProfileByUserId(userId);
  if (!business) return [];
  const rows = await db
    .select({ payout: businessPayouts, productName: orders.productName, productImageUrl: orders.productImageUrl })
    .from(businessPayouts)
    .innerJoin(orders, eq(orders.id, businessPayouts.orderId))
    .where(eq(businessPayouts.businessId, business.id))
    .orderBy(desc(businessPayouts.createdAt));
  return rows.map((row) => ({ ...row.payout, productName: row.productName, productImageUrl: row.productImageUrl }));
}

export async function getBusinessNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const business = await getBusinessProfileByUserId(userId);
  if (!business) return [];
  return db
    .select()
    .from(businessNotifications)
    .where(eq(businessNotifications.businessId, business.id))
    .orderBy(desc(businessNotifications.createdAt));
}

export async function markBusinessNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const business = await requireOwnedBusiness(userId);
  const ownedNotification = await db
    .select({ id: businessNotifications.id })
    .from(businessNotifications)
    .where(and(eq(businessNotifications.id, notificationId), eq(businessNotifications.businessId, business.id)))
    .limit(1);
  if (!ownedNotification[0]) throw new Error("Notification not found or not owned by user");
  await db.update(businessNotifications).set({ isRead: true, readAt: new Date() }).where(eq(businessNotifications.id, notificationId));
  return { success: true } as const;
}

export async function getPendingBusinessesForAdmin() {
  return getBusinessesForAdmin("pending");
}

export async function getBusinessesForAdmin(status?: "pending" | "active" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({
      id: businessProfiles.id,
      userId: businessProfiles.userId,
      name: businessProfiles.name,
      category: businessProfiles.category,
      description: businessProfiles.description,
      city: businessProfiles.city,
      contact: businessProfiles.contact,
      status: businessProfiles.status,
      createdAt: businessProfiles.createdAt,
      updatedAt: businessProfiles.updatedAt,
    })
    .from(businessProfiles);
  return status
    ? query.where(eq(businessProfiles.status, status)).orderBy(desc(businessProfiles.createdAt))
    : query.orderBy(desc(businessProfiles.createdAt));
}

export async function setBusinessApprovalForAdmin(businessId: number, status: "active" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const business = await db.select({ id: businessProfiles.id }).from(businessProfiles).where(eq(businessProfiles.id, businessId)).limit(1);
  if (!business[0]) throw new Error("Business not found");
  await db.update(businessProfiles).set({ status }).where(eq(businessProfiles.id, businessId));
  return { success: true } as const;
}

export async function getAdminNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminNotifications).orderBy(desc(adminNotifications.createdAt));
}

export async function markAdminNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminNotifications).set({ isRead: true, readAt: new Date() }).where(eq(adminNotifications.id, notificationId));
  return { success: true } as const;
}
