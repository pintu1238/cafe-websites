export const roles = ['CUSTOMER', 'SHOPKEEPER', 'SUPER_ADMIN'] as const;
export type Role = (typeof roles)[number];

export const authProviders = ['PASSWORD', 'GOOGLE'] as const;
export type AuthProvider = (typeof authProviders)[number];

export const orderStatuses = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const shopStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'CLOSED'] as const;
export type ShopStatus = (typeof shopStatuses)[number];

export type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  authProvider: AuthProvider;
  googleSubject: string | null;
  role: Role;
  profileImageUrl: string | null;
  universityId: string | null;
  studentId: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

export type SafeUser = Omit<UserRecord, 'passwordHash'>;

export type CreateUserInput = {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: Role;
  universityId?: string;
  studentId?: string;
  authProvider?: AuthProvider;
  googleSubject?: string;
  profileImageUrl?: string;
};

export type CreateGoogleUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
  googleSubject: string;
  profileImageUrl?: string | null;
};

export type PasswordResetRecord = {
  id: string;
  userId: string;
  linkTokenHash: string;
  codeHash: string;
  codeResetTokenHash: string | null;
  expiresAt: Date;
  codeVerifiedAt: Date | null;
  usedAt: Date | null;
  createdAt: Date;
};

export type EmailVerificationRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type UserRepository = {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findByGoogleSubject(subject: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
  createGoogleUser(input: CreateGoogleUserInput): Promise<UserRecord>;
  linkGoogleAccount(id: string, googleSubject: string, profileImageUrl?: string | null): Promise<void>;
  touchLastLogin(id: string): Promise<void>;
  createPasswordReset(input: { userId: string; linkTokenHash: string; codeHash: string; expiresAt: Date }): Promise<PasswordResetRecord>;
  findPasswordResetByLinkHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  findPasswordResetByCode(email: string, codeHash: string): Promise<PasswordResetRecord | null>;
  findPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  attachCodeResetToken(id: string, tokenHash: string): Promise<void>;
  markCodeVerified(id: string): Promise<void>;
  consumePasswordReset(id: string, passwordHash: string): Promise<boolean>;
  createEmailVerification(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<EmailVerificationRecord>;
  consumeEmailVerification(tokenHash: string): Promise<UserRecord | null>;
};

export type ShopRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  location: string;
  status: ShopStatus;
  isOpen: boolean;
  rating: number;
  totalReviews: number;
  estimatedPreparationTime: number;
};

export type MenuVariant = {
  id: string;
  name: string;
  priceModifierPaise: number;
  isAvailable: boolean;
};

export type AddonRecord = {
  id: string;
  name: string;
  pricePaise: number;
  isAvailable: boolean;
};

export type MenuItemRecord = {
  id: string;
  shopId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string | null;
  preparationTime: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  calories: number | null;
  variants: MenuVariant[];
  addons: AddonRecord[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ShopListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  openOnly?: boolean;
  category?: string;
  sort?: 'popular' | 'rating' | 'preparation' | 'newest';
  status?: 'APPROVED';
};

export type MenuFilters = {
  search?: string;
  category?: string;
  vegetarian?: boolean;
  spicy?: boolean;
};

export type ShopRepository = {
  list(filters: ShopListFilters): Promise<{ items: ShopRecord[]; pagination: Pagination }>;
  findPublicBySlug(slug: string): Promise<ShopRecord | null>;
};

export type MenuRepository = {
  listByShopSlug(slug: string, filters: MenuFilters): Promise<MenuItemRecord[]>;
};

export type CartSelection = {
  shopId: string;
  shopName: string;
  menuItemId: string;
  itemName: string;
  basePricePaise: number;
  variant: MenuVariant | null;
  addons: AddonRecord[];
  unitPricePaise: number;
};

export type CartItemRecord = CartSelection & {
  id: string;
  quantity: number;
  totalPricePaise: number;
};

export type CartRecord = {
  id: string;
  customerId: string;
  shopId: string | null;
  shopName: string | null;
  items: CartItemRecord[];
  subtotalPaise: number;
};

export type AddCartItemInput = {
  menuItemId: string;
  quantity: number;
  variantId?: string;
  addonIds?: string[];
  replaceCart?: boolean;
  pricePaise?: unknown;
};

export type CartRepository = {
  getByCustomer(customerId: string): Promise<CartRecord>;
  getSelection(input: { menuItemId: string; variantId?: string; addonIds?: string[] }): Promise<CartSelection | null>;
  addItem(customerId: string, selection: CartSelection, quantity: number): Promise<CartRecord>;
  updateQuantity(customerId: string, itemId: string, quantity: number): Promise<CartRecord>;
  removeItem(customerId: string, itemId: string): Promise<CartRecord>;
  clear(customerId: string): Promise<void>;
};

export type OrderRecord = {
  id: string;
  customerId: string;
  shopId: string;
  shopName: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalPaise: number;
  taxPaise: number;
  discountPaise: number;
  deliveryFeePaise: number;
  totalAmountPaise: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'CASH_ON_PICKUP' | 'RAZORPAY' | 'STRIPE';
  specialInstructions: string | null;
  pickupTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    menuItemId: string | null;
    itemNameSnapshot: string;
    quantity: number;
    unitPricePaise: number;
    totalPricePaise: number;
    selectedVariant: MenuVariant | null;
    selectedAddons: AddonRecord[];
    specialInstruction: string | null;
  }>;
};

export type PlaceOrderInput = {
  paymentMethod: 'CASH_ON_PICKUP' | 'RAZORPAY' | 'STRIPE';
  pickupTime?: string;
  specialInstructions?: string;
  subtotalPaise?: unknown;
  taxPaise?: unknown;
  totalAmountPaise?: unknown;
};

export type CreateOrderFromCartInput = {
  customerId: string;
  paymentMethod: 'CASH_ON_PICKUP';
  pickupTime?: string;
  specialInstructions?: string;
  taxRateBps: number;
};

export type OrderRepository = {
  createFromCart(input: CreateOrderFromCartInput): Promise<OrderRecord>;
  listForCustomer(customerId: string): Promise<OrderRecord[]>;
  findForCustomer(customerId: string, orderId: string): Promise<OrderRecord | null>;
  cancelForCustomer(customerId: string, orderId: string): Promise<OrderRecord>;
  listForShopkeeper(shopkeeperId: string): Promise<OrderRecord[]>;
  findForShopkeeper(shopkeeperId: string, orderId: string): Promise<OrderRecord | null>;
  updateStatusForShopkeeper(shopkeeperId: string, orderId: string, status: OrderStatus): Promise<OrderRecord>;
};
