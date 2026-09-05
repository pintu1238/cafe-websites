export type Role = 'CUSTOMER' | 'SHOPKEEPER' | 'SUPER_ADMIN';

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  profileImageUrl: string | null;
  universityId: string | null;
  studentId: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string | null;
  bannerUrl: string | null;
  location: string;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'CLOSED';
  isOpen: boolean;
  rating: number;
  totalReviews: number;
  estimatedPreparationTime: number;
  openingTime?: string;
  closingTime?: string;
  distanceKm?: number;
  priceRange?: 'BUDGET' | 'MID' | 'PREMIUM';
  cuisineCategories?: string[];
  activeOffersCount?: number;
  isFavorite?: boolean;
};

export type Review = { id: string; shopId: string; userId: string; userName: string; rating: number; comment: string; createdAt: string };
export type Offer = { id: string; shopId: string; shopSlug: string; shopName: string; title: string; description: string; discountPercent: number | null; code: string | null; startsAt: string; endsAt: string | null };
export type Favorite = { shopId: string; shopSlug: string; shopName: string; createdAt: string };

export type MenuVariant = { id: string; name: string; priceModifierPaise: number; isAvailable: boolean };
export type Addon = { id: string; name: string; pricePaise: number; isAvailable: boolean };
export type MenuItem = {
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
  addons: Addon[];
};

export type CartItem = {
  id: string;
  menuItemId: string;
  itemName: string;
  shopId: string;
  shopName: string;
  basePricePaise: number;
  variant: MenuVariant | null;
  addons: Addon[];
  unitPricePaise: number;
  quantity: number;
  totalPricePaise: number;
};

export type Cart = { id: string; customerId: string; shopId: string | null; shopName: string | null; items: CartItem[]; subtotalPaise: number };

export type OrderItem = {
  id: string;
  menuItemId: string | null;
  itemNameSnapshot: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
  selectedVariant: MenuVariant | null;
  selectedAddons: Addon[];
  specialInstruction: string | null;
};

export type Order = {
  id: string;
  customerId: string;
  shopId: string;
  shopName: string;
  orderNumber: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  subtotalPaise: number;
  taxPaise: number;
  discountPaise: number;
  deliveryFeePaise: number;
  totalAmountPaise: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'CASH_ON_PICKUP' | 'RAZORPAY' | 'STRIPE';
  specialInstructions: string | null;
  pickupTime: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type ContentSection = { heading: string; paragraphs: string[]; items?: string[] };
export type ContentPage = { slug: string; eyebrow: string; title: string; intro: string; sections: ContentSection[] };
