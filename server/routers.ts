import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { rankGiftProducts } from "../shared/recommendations";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

const occasionSchema = z.enum(["birthday", "wedding", "engagement", "anniversary", "housewarming", "newBaby"]);
const interestSchema = z.enum(["technology", "music", "photography", "travel", "wellness", "books", "food", "home", "sports", "art"]);
const ageRangeSchema = z.enum(["0-12", "13-17", "18-24", "25-34", "35-49", "50+"]);
const genderSchema = z.enum(["woman", "man", "any"]);
const relationshipSchema = z.enum(["partner", "friend", "family", "colleague", "child"]);
const productStatusSchema = z.enum(["draft", "active", "paused"]);
const orderStatusSchema = z.enum(["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"]);
const productInputSchema = z.object({
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().min(10).max(5000),
  price: z.number().positive().max(1_000_000),
  imageUrl: z.string().min(1).max(3000),
  occasions: z.array(occasionSchema).min(1),
  interests: z.array(interestSchema).min(1),
  ageRanges: z.array(ageRangeSchema),
  genders: z.array(genderSchema).min(1),
  relationships: z.array(relationshipSchema).min(1),
  deliveryLabel: z.string().trim().min(2).max(255),
  city: z.string().trim().min(2).max(120),
  status: productStatusSchema,
});

const answersSchema = z.object({
  occasion: occasionSchema.optional(),
  gender: genderSchema.optional(),
  ageRange: ageRangeSchema.optional(),
  relationship: relationshipSchema.optional(),
  interests: z.array(interestSchema),
  minBudget: z.number().min(0),
  maxBudget: z.number().positive(),
});

function toProductRecord(input: z.infer<typeof productInputSchema>) {
  return {
    name: input.name,
    description: input.description,
    priceInTetri: Math.round(input.price * 100),
    imageUrl: input.imageUrl,
    occasions: input.occasions,
    interests: input.interests,
    ageRanges: input.ageRanges,
    genders: input.genders,
    relationships: input.relationships,
    deliveryLabel: input.deliveryLabel,
    city: input.city,
    status: input.status,
  };
}

function requireAdmin(user: { role: string }) {
  if (user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  profile: router({
    me: protectedProcedure.query(async ({ ctx }) => ({
      profile: await db.getUserProfile(ctx.user.id),
      business: await db.getBusinessProfileByUserId(ctx.user.id),
    })),
    setAccountType: protectedProcedure
      .input(z.object({ accountType: z.enum(["consumer", "business"]) }))
      .mutation(({ ctx, input }) => db.upsertUserProfile(ctx.user.id, input.accountType)),
    savePersonalDetails: protectedProcedure
      .input(z.object({
        firstName: z.string().trim().min(1).max(120),
        lastName: z.string().trim().min(1).max(120),
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "დაბადების თარიღი მიუთითე ფორმატით YYYY-MM-DD"),
        phone: z.string().trim().min(5, "მიუთითე სწორი ტელეფონის ნომერი").max(40).optional(),
      }).superRefine((input, ctx) => {
        const birthDate = new Date(`${input.birthDate}T00:00:00.000Z`);
        if (Number.isNaN(birthDate.getTime()) || birthDate >= new Date()) {
          ctx.addIssue({ code: "custom", message: "მიუთითე წარსულში არსებული სწორი დაბადების თარიღი", path: ["birthDate"] });
        }
      }))
      .mutation(({ ctx, input }) => db.savePersonalProfileForUser(ctx.user.id, input)),
    uploadAvatar: protectedProcedure
      .input(z.object({
        base64: z.string().min(1).max(5_000_000),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        extension: z.enum(["jpg", "png", "webp"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength > 3_000_000) throw new Error("პროფილის ფოტო 3 MB-ზე ნაკლები უნდა იყოს");
        const upload = await storagePut(`avatars/${ctx.user.id}/profile.${input.extension}`, bytes, input.contentType);
        return db.setProfileAvatarForUser(ctx.user.id, upload.url);
      }),
    clearAvatar: protectedProcedure.mutation(({ ctx }) => db.setProfileAvatarForUser(ctx.user.id, null)),
    saveBusiness: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(180),
        category: z.string().trim().min(2).max(180),
        description: z.string().max(5000),
        city: z.string().trim().min(2).max(120),
        contact: z.string().trim().min(3).max(320),
        payoutAccountIban: z.string().trim().max(34).optional(),
      }))
      .mutation(({ ctx, input }) => db.upsertBusinessProfile(ctx.user.id, input)),
  }),
  businesses: router({
    publicProfile: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => db.getPublicBusinessProfile(input.id)),
  }),
  products: router({
    active: publicProcedure.query(() => db.getActiveProducts()),
    mine: protectedProcedure.query(({ ctx }) => db.getBusinessProducts(ctx.user.id)),
    uploadImage: protectedProcedure
      .input(z.object({
        base64: z.string().min(1).max(10_000_000),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        extension: z.enum(["jpg", "png", "webp"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength > 7_000_000) throw new Error("Image exceeds 7 MB limit");
        return storagePut(
          `products/${ctx.user.id}/${Date.now()}.${input.extension}`,
          bytes,
          input.contentType,
        );
      }),
    create: protectedProcedure
      .input(productInputSchema)
      .mutation(({ ctx, input }) => db.createProductForUser(ctx.user.id, toProductRecord(input))),
    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), product: productInputSchema }))
      .mutation(({ ctx, input }) => db.updateProductForUser(ctx.user.id, input.id, toProductRecord(input.product))),
    setStatus: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: productStatusSchema }))
      .mutation(({ ctx, input }) => db.setProductStatusForUser(ctx.user.id, input.id, input.status)),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => db.deleteProductForUser(ctx.user.id, input.id)),
  }),
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => db.getFavoriteProductIds(ctx.user.id)),
    toggle: protectedProcedure
      .input(z.object({ productId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => db.toggleFavorite(ctx.user.id, input.productId)),
  }),
  orders: router({
    create: protectedProcedure
      .input(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
        customerName: z.string().trim().min(2).max(180),
        customerPhone: z.string().trim().min(5).max(40),
        deliveryAddress: z.string().trim().min(8).max(1000),
        note: z.string().trim().max(1000).optional(),
      }))
      .mutation(({ ctx, input }) => db.createOrderForUser({ ...input, customerUserId: ctx.user.id, paymentProvider: "test" })),
    confirmTestPayment: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => db.confirmTestPaymentForUser(ctx.user.id, input.id)),
    customerList: protectedProcedure.query(({ ctx }) => db.getCustomerOrders(ctx.user.id)),
    businessList: protectedProcedure.query(({ ctx }) => db.getBusinessOrders(ctx.user.id)),
    businessRevenue: protectedProcedure.query(({ ctx }) => db.getBusinessRevenueSummary(ctx.user.id)),
    businessPayouts: protectedProcedure.query(({ ctx }) => db.getBusinessPayouts(ctx.user.id)),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: orderStatusSchema }))
      .mutation(({ ctx, input }) => db.updateOrderStatusForBusiness(ctx.user.id, input.id, input.status)),
  }),
  notifications: router({
    registerPushToken: protectedProcedure
      .input(z.object({ token: z.string().trim().min(10).max(255), platform: z.enum(["ios", "android"]) }))
      .mutation(({ ctx, input }) => db.upsertPushTokenForUser(ctx.user.id, input.token, input.platform)),
    businessList: protectedProcedure.query(({ ctx }) => db.getBusinessNotifications(ctx.user.id)),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => db.markBusinessNotificationRead(ctx.user.id, input.id)),
  }),
  admin: router({
    businesses: protectedProcedure
      .input(z.object({ status: z.enum(["pending", "active", "rejected"]).optional() }).optional())
      .query(({ ctx, input }) => {
        requireAdmin(ctx.user);
        return db.getBusinessesForAdmin(input?.status);
      }),
    pendingBusinesses: protectedProcedure.query(({ ctx }) => {
      requireAdmin(ctx.user);
      return db.getPendingBusinessesForAdmin();
    }),
    setBusinessApproval: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "rejected"]) }))
      .mutation(({ ctx, input }) => {
        requireAdmin(ctx.user);
        return db.setBusinessApprovalForAdmin(input.id, input.status);
      }),
    notifications: protectedProcedure.query(({ ctx }) => {
      requireAdmin(ctx.user);
      return db.getAdminNotifications();
    }),
    markNotificationRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => {
        requireAdmin(ctx.user);
        return db.markAdminNotificationRead(input.id);
      }),
  }),
  recommendations: router({
    rank: publicProcedure.input(answersSchema).query(async ({ ctx, input }) => {
      const ranked = rankGiftProducts(await db.getActiveProducts(), input);
      await db.saveGiftSearch(ctx.user?.id ?? null, input, ranked.map((item) => Number(item.id)).filter(Number.isFinite));
      return ranked;
    }),
  }),
});

export type AppRouter = typeof appRouter;
