import { z } from "zod";

export const productTypes = ["samp-linux", "samp-windows", "nodejs"] as const;
export type ProductType = (typeof productTypes)[number];

export interface ProductEggConfig {
  nestId: number;
  eggId: number;
  dockerImage: string;
  startup: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  price: number;
  ram: number;
  disk: number;
  cpu: number;
  maxPlayers: number;
  features: string[];
  eggConfig: ProductEggConfig;
}

export const orderStatuses = ["pending", "processing", "completed", "failed", "expired"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export interface ServerCredentials {
  panelUrl: string;
  username: string;
  password: string;
  serverId: number;
  serverIp: string;
  serverPort: number;
}

export interface Order {
  id: string;
  productId: string;
  customerEmail: string;
  customerUsername: string;
  serverName: string;
  status: OrderStatus;
  amount: number;
  qrCode: string | null;
  paymentNumber: string | null;
  serverCredentials: ServerCredentials | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export const createOrderSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerUsername: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  serverName: z.string().min(3, "Server name must be at least 3 characters").max(30, "Server name must be at most 30 characters"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface PakasirQrisResponse {
  success: boolean;
  payment_number: string;
  qr_string: string;
  amount: number;
  expired_at: string;
}

export interface PakasirWebhookPayload {
  order_id: string;
  status: string;
  amount: number;
  payment_number: string;
}

export interface PterodactylUser {
  id: number;
  username: string;
  email: string;
}

export interface PterodactylAllocation {
  id: number;
  ip: string;
  port: number;
  assigned: boolean;
}

export interface PterodactylServer {
  id: number;
  uuid: string;
  name: string;
  allocation: number;
}
