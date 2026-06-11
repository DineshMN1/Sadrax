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
    brand: varchar("brand", { length: 100 }),
    veg: varchar("veg", { length: 10 }), // "veg" | "nonveg" | null (not applicable)
    // products sharing a variantGroup are sizes/weights of the same item (legacy)
    variantGroup: varchar("variant_group", { length: 100 }),
    // embedded variants: [{unit, price, mrp, stock}] — Blinkit/Zepto style
    variants: json("variants").$type<{ unit: string; price: number; mrp: number | null; stock: number; image?: string | null }[]>().default([]).notNull(),
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
    index("products_variant_group_idx").on(t.variantGroup),
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
    freeNote: text("free_note"),                            // set when staff marks the order free (on the house)
    // Staff edited the order after placement (customer call). originalItems is a
    // snapshot of the line items at the first edit, used to render the struck/added diff.
    edited: boolean("edited").default(false).notNull(),
    editedAt: timestamp("edited_at"),
    originalItems: json("original_items"),                  // [{ productId, productName, productUnit, price, quantity }]
    tip: integer("tip").default(0).notNull(),               // rider tip in paise
    deliveryInstructions: text("delivery_instructions"),    // "leave at door" etc.
    deliverySlot: varchar("delivery_slot", { length: 60 }), // chosen time slot label
    deliveryPersonId: integer("delivery_person_id"),
    rejectionReason: text("rejection_reason"),
    // live GPS location captured at checkout (optional — customer may decline)
    deliveryLat: real("delivery_lat"),
    deliveryLng: real("delivery_lng"),
    // live rider location while out for delivery
    riderLat: real("rider_lat"),
    riderLng: real("rider_lng"),
    riderUpdatedAt: timestamp("rider_updated_at"),
    deliveredAt: timestamp("delivered_at"), // set when status first becomes delivered
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
  // Index into products.variants[] for embedded-variant products; null = flat
  // product (top-level price/stock). Needed so stock is released against the
  // exact variant on cancel/reject/edit.
  variantIdx: integer("variant_idx"),
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

// Recurring order subscriptions — auto-create an order every period.
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    addressId: integer("address_id").references(() => addresses.id),
    items: json("items").$type<{ productId: number; quantity: number }[]>().notNull(),
    frequency: varchar("frequency", { length: 12 }).notNull(), // weekly | biweekly | monthly
    nextRunAt: timestamp("next_run_at").notNull(),
    active: boolean("active").default(true).notNull(),
    lastOrderId: integer("last_order_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("subscriptions_next_run_idx").on(t.nextRunAt)]
);

// Suppliers / vendors stock is purchased from.
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stock-in / purchase receipts — each increments product stock.
export const purchases = pgTable(
  "purchases",
  {
    id: serial("id").primaryKey(),
    supplierId: integer("supplier_id").references(() => suppliers.id),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    costPrice: integer("cost_price"), // per-unit cost in paise
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("purchases_created_idx").on(t.createdAt), index("purchases_product_idx").on(t.productId)]
);

// Promotional offers — auto-applied promos + display-only bank offers.
export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    // cart_percent | category_percent | bank
    type: varchar("type", { length: 20 }).notNull(),
    categoryId: integer("category_id").references(() => categories.id), // for category_percent
    percent: integer("percent").default(0),         // % off
    maxDiscount: integer("max_discount"),           // paise cap
    minOrder: integer("min_order").default(0),      // paise threshold
    bankName: varchar("bank_name", { length: 60 }), // for bank offers
    code: varchar("code", { length: 50 }),          // optional shown code (bank)
    active: boolean("active").default(true).notNull(),
    order: integer("order").default(0).notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("offers_order_idx").on(t.order)]
);

// "Notify me when back in stock" requests. One per product per user.
export const stockAlerts = pgTable(
  "stock_alerts",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    notified: boolean("notified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("stock_alerts_product_user_idx").on(t.productId, t.userId)]
);

// Admin/staff action audit trail — who changed what, from what, when, and from where.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id"),                       // actor (admin/staff)
    userName: varchar("user_name", { length: 120 }), // denormalized for display
    action: varchar("action", { length: 30 }).notNull(), // create | update | delete | status
    entity: varchar("entity", { length: 40 }).notNull(),  // product | category | order | setting | coupon | banner
    entityId: varchar("entity_id", { length: 60 }),
    summary: text("summary"),                      // human-readable "stock 50 → 30"
    ip: varchar("ip", { length: 60 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_created_idx").on(t.createdAt),
    index("audit_logs_entity_idx").on(t.entity),
  ]
);

// key-value store for all store configuration
export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer return / refund requests against a delivered order. Eligibility
// (delivered, within window, allowed reasons) is enforced in the API per the
// published Refund & Cancellation policy.
export const returnRequests = pgTable(
  "return_requests",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // wrong_item | damaged | expired | missing
    reason: varchar("reason", { length: 20 }).notNull(),
    description: text("description"),
    photos: json("photos").$type<string[]>().default([]),
    // affected line items: [{ name, quantity }]
    items: json("items").$type<{ name: string; quantity: number }[]>().default([]),
    // pending | approved | rejected
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    // refund | replacement (set by admin on approval)
    resolution: varchar("resolution", { length: 20 }),
    refundAmount: integer("refund_amount"), // paise, optional
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("return_requests_order_idx").on(t.orderId),
    index("return_requests_user_idx").on(t.userId),
    index("return_requests_status_idx").on(t.status),
  ]
);

// Post-delivery feedback — one rating per delivered order.
export const orderFeedback = pgTable(
  "order_feedback",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1–5 stars
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("order_feedback_order_idx").on(t.orderId),
    index("order_feedback_rating_idx").on(t.rating),
  ]
);

// Home-screen promotional banners (admin managed, max 5, ordered by priority)
export const banners = pgTable(
  "banners",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 120 }),        // main heading
    subtitle: varchar("subtitle", { length: 200 }),  // supporting line
    badge: varchar("badge", { length: 60 }),          // e.g. "10-min local delivery"
    image: text("image"),                             // optional background image
    ctaText: varchar("cta_text", { length: 40 }),     // button label
    ctaLink: varchar("cta_link", { length: 300 }),    // where the banner links to
    theme: varchar("theme", { length: 20 }).default("green").notNull(), // gradient preset
    order: integer("order").default(0).notNull(),     // lower = shown first
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("banners_order_idx").on(t.order)]
);

// Product requests — customers ask for products not yet in the store.
export const productRequests = pgTable(
  "product_requests",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productName: varchar("product_name", { length: 200 }).notNull(),
    note: text("note"),
    // pending | added | declined
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("product_requests_user_idx").on(t.userId),
    index("product_requests_status_idx").on(t.status),
    index("product_requests_created_idx").on(t.createdAt),
  ]
);

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
export type Banner            = typeof banners.$inferSelect;
export type ReturnRequest     = typeof returnRequests.$inferSelect;
export type OrderFeedback     = typeof orderFeedback.$inferSelect;
export type AuditLog          = typeof auditLogs.$inferSelect;
export type StockAlert        = typeof stockAlerts.$inferSelect;
export type Offer             = typeof offers.$inferSelect;
export type Supplier          = typeof suppliers.$inferSelect;
export type Purchase          = typeof purchases.$inferSelect;
export type Subscription      = typeof subscriptions.$inferSelect;
export type ProductRequest    = typeof productRequests.$inferSelect;
