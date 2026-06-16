export type UserRole = "CUSTOMER" | "ADMIN";

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";

export interface ProductWithCategory {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface OrderWithItems {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  items: {
    id: string;
    productName: string;
    productPrice: number;
    quantity: number;
    subtotal: number;
    productId: string;
  }[];
}