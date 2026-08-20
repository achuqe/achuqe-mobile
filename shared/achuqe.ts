export type UserRole = "consumer" | "business";

export type OccasionId =
  | "birthday"
  | "wedding"
  | "engagement"
  | "anniversary"
  | "housewarming"
  | "newBaby";

export type InterestId =
  | "technology"
  | "music"
  | "photography"
  | "travel"
  | "wellness"
  | "books"
  | "food"
  | "home"
  | "sports"
  | "art";

export type RecipientGender = "woman" | "man" | "any";

export type RelationshipId =
  | "partner"
  | "friend"
  | "family"
  | "colleague"
  | "child";

export type AgeRangeId = "0-12" | "13-17" | "18-24" | "25-34" | "35-49" | "50+";

export type ProductStatus = "draft" | "active" | "paused" | "deleted";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
export type PaymentProvider = "test" | "tbc" | "bog";
export type PaymentStatus = "awaiting_payment" | "paid" | "failed" | "refunded";

export interface BusinessOrder {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  platformFee: number;
  businessPayout: number;
  paymentProvider: PaymentProvider;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  note: string | null;
  status: OrderStatus;
  createdAt: Date;
}

export interface BusinessNotification {
  id: string;
  orderId: string;
  type: "new_order" | "order_status";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

export interface GiftProduct {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  description: string;
  price: number;
  currency: "₾";
  imageUrl: string;
  occasions: OccasionId[];
  interests: InterestId[];
  ageRanges: AgeRangeId[];
  genders: RecipientGender[];
  relationships: RelationshipId[];
  deliveryLabel: string;
  city: string;
  businessContact?: string;
  featured?: boolean;
  status: ProductStatus;
}

export interface GiftAnswers {
  occasion?: OccasionId;
  gender?: RecipientGender;
  ageRange?: AgeRangeId;
  relationship?: RelationshipId;
  interests: InterestId[];
  minBudget: number;
  maxBudget: number;
}

export interface RankedGift extends GiftProduct {
  score: number;
  matchReasons: string[];
}

export interface BusinessProfile {
  name: string;
  category: string;
  description: string;
  city: string;
  contact: string;
  payoutAccountIban: string;
}

export interface ProductDraft {
  id?: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  occasions: OccasionId[];
  interests: InterestId[];
  ageRanges: AgeRangeId[];
  genders: RecipientGender[];
  relationships: RelationshipId[];
  deliveryLabel: string;
  city: string;
  status: ProductStatus;
}
