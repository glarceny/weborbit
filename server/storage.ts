import type { Product, Order, CreateOrderInput, ServerCredentials } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(input: CreateOrderInput, amount: number): Promise<Order>;
  updateOrderPayment(orderId: string, qrCode: string, paymentNumber: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | undefined>;
  updateOrderServerCredentials(orderId: string, credentials: ServerCredentials): Promise<Order | undefined>;
}

const PRODUCTS: Product[] = [
  {
    id: "samp-linux-basic",
    name: "SAMP Hemat",
    type: "samp-linux",
    description: "Server SAMP Linux ekonomis untuk pemula dengan performa stabil",
    price: 15000,
    ram: 512,
    disk: 2048,
    cpu: 50,
    maxPlayers: 50,
    features: [
      "Panel Pterodactyl Full Access",
      "Auto Backup Harian",
      "DDoS Protection Basic",
      "Support 24/7 via Discord",
      "Free MySQL Database",
    ],
    eggConfig: {
      nestId: 6,
      eggId: 16,
      dockerImage: "ghcr.io/parkervcp/games:samp",
      startup: "./samp03svr",
    },
  },
  {
    id: "samp-windows-pro",
    name: "SAMP Sultan",
    type: "samp-windows",
    description: "Server SAMP Windows premium dengan resource besar dan performa maksimal",
    price: 35000,
    ram: 1024,
    disk: 5120,
    cpu: 100,
    maxPlayers: 100,
    features: [
      "Panel Pterodactyl Full Access",
      "Auto Backup 2x Sehari",
      "DDoS Protection Advanced",
      "Priority Support 24/7",
      "Free MySQL + Redis",
      "Windows Native Performance",
    ],
    eggConfig: {
      nestId: 6,
      eggId: 17,
      dockerImage: "hcgcloud/pterodactyl-images:ubuntu-wine",
      startup: "wine64 ./samp-server.exe",
    },
  },
  {
    id: "nodejs-bot",
    name: "Bot NodeJS",
    type: "nodejs",
    description: "Hosting NodeJS untuk bot Discord, Telegram, atau aplikasi web",
    price: 20000,
    ram: 512,
    disk: 3072,
    cpu: 75,
    maxPlayers: 0,
    features: [
      "Panel Pterodactyl Full Access",
      "Node.js 21 LTS",
      "NPM & Yarn Support",
      "Auto Restart on Crash",
      "Free MongoDB Access",
      "Git Integration",
    ],
    eggConfig: {
      nestId: 5,
      eggId: 15,
      dockerImage: "ghcr.io/parkervcp/yolks:nodejs_21",
      startup: "npm start",
    },
  },
];

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private orders: Map<string, Order>;

  constructor() {
    this.products = new Map();
    this.orders = new Map();

    PRODUCTS.forEach((product) => {
      this.products.set(product.id, product);
    });
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(input: CreateOrderInput, amount: number): Promise<Order> {
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const order: Order = {
      id,
      productId: input.productId,
      customerEmail: input.customerEmail,
      customerUsername: input.customerUsername,
      serverName: input.serverName,
      status: "pending",
      amount,
      qrCode: null,
      paymentNumber: null,
      serverCredentials: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.orders.set(id, order);
    return order;
  }

  async updateOrderPayment(orderId: string, qrCode: string, paymentNumber: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.qrCode = qrCode;
    order.paymentNumber = paymentNumber;
    order.updatedAt = new Date().toISOString();
    this.orders.set(orderId, order);
    return order;
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.orders.set(orderId, order);
    return order;
  }

  async updateOrderServerCredentials(orderId: string, credentials: ServerCredentials): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.serverCredentials = credentials;
    order.status = "completed";
    order.updatedAt = new Date().toISOString();
    this.orders.set(orderId, order);
    return order;
  }
}

export const storage = new MemStorage();
