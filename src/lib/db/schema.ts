import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  json,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Better Auth managed tables ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: boolean("email_verified").default(false),
  phone: varchar("phone", { length: 15 }).unique(),
  phoneVerified: boolean("phone_verified").default(false),
  image: text("image"),
  role: varchar("role", { length: 20 }).default("customer"), // customer | staff | admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Store tables ──────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    image: text("image"),
    order: integer("order").default(0),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("categories_order_idx").on(t.order)]
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    description: text("description"),
    // Prices stored in paise (₹1 = 100 paise)
    price: integer("price").notNull(),
    mrp: integer("mrp"),
    unit: varchar("unit", { length: 50 }), // "500g", "1L", "1 pc"
    stock: integer("stock").default(0).notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    images: json("images").$type<string[]>().default([]),
    active: boolean("active").default(true).notNull(),
    featured: boolean("featured").default(false),
    orderCount: integer("order_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_category_idx").on(t.categoryId),
    index("products_order_count_idx").on(t.orderCount),
  ]
);

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 20 }).default("home"), // home | work | other
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: varchar("city", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  lat: real("lat"),
  lng: real("lng"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 20 }).unique().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    addressId: integer("address_id").references(() => addresses.id),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    // pending | accepted | packed | out_for_delivery | delivered | rejected | cancelled
    paymentMethod: varchar("payment_method", { length: 20 }).notNull(), // cod | upi | card
    paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending | paid | failed | refunded
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").default(0).notNull(),
    discount: integer("discount").default(0).notNull(),
    total: integer("total").notNull(),
    couponCode: varchar("coupon_code", { length: 50 }),
    notes: text("notes"),
    deliveryPersonId: integer("delivery_person_id"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ]
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: varchar("product_name", { length: 200 }).notNull(),
  productImage: text("product_image"),
  productUnit: varchar("product_unit", { length: 50 }),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  total: integer("total").notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  type: varchar("type", { length: 20 }).notNull(), // flat | percent
  value: integer("value").notNull(), // paise for flat, integer % for percent
  minOrder: integer("min_order").default(0), // paise
  maxDiscount: integer("max_discount"), // paise cap for percent coupons
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryPersons = pgTable("delivery_persons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id:        serial("id").primaryKey(),
    userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    endpoint:  text("endpoint").notNull(),
    p256dh:    text("p256dh").notNull(),
    auth:      text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  t => [uniqueIndex("push_sub_endpoint_idx").on(t.endpoint)]
);

// key-value store for all store configuration
export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Type exports ──────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type DeliveryPerson    = typeof deliveryPersons.$inferSelect;
export type PushSubscription  = typeof pushSubscriptions.$inferSelect;
