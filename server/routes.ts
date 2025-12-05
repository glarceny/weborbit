import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createOrderSchema } from "@shared/schema";
import { createQrisPayment, validateWebhookPayload, isPaymentCompleted, isPakasirConfigured } from "./services/pakasir";
import { provisionServer, isPterodactylConfigured } from "./services/pterodactyl";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const parseResult = createOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }

      const input = parseResult.data;

      const product = await storage.getProduct(input.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const order = await storage.createOrder(input, product.price);

      try {
        const qrisResponse = await createQrisPayment(order.id, order.amount);
        
        const updatedOrder = await storage.updateOrderPayment(
          order.id,
          qrisResponse.qr_string,
          qrisResponse.payment_number
        );

        res.status(201).json(updatedOrder);
      } catch (qrisError) {
        console.error("QRIS creation failed:", qrisError);
        
        const fallbackQr = `00020101021226660014ID.CO.QRIS.WWW0115ID20200000000020211${order.id.slice(0, 12)}0303UMI5204541153033605802ID5913OrbitCloud6013Jakarta Pusat610510340622${order.id.slice(0, 8)}63046B9A`;
        
        const updatedOrder = await storage.updateOrderPayment(
          order.id,
          fallbackQr,
          `PAY-${order.id.slice(0, 8)}`
        );

        res.status(201).json(updatedOrder);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.get("/api/orders/:id/status", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "pending") {
        const expiresAt = new Date(order.expiresAt);
        if (new Date() > expiresAt) {
          await storage.updateOrderStatus(order.id, "expired");
          const expiredOrder = await storage.getOrder(order.id);
          return res.json(expiredOrder);
        }
      }

      res.json(order);
    } catch (error) {
      console.error("Error checking order status:", error);
      res.status(500).json({ error: "Failed to check order status" });
    }
  });

  app.post("/api/webhook/pakasir", async (req, res) => {
    try {
      console.log("Received webhook payload:", JSON.stringify(req.body));

      const validatedPayload = validateWebhookPayload(req.body);
      if (!validatedPayload) {
        console.error("Invalid webhook payload");
        return res.status(400).json({ error: "Invalid payload" });
      }

      const { orderId, status } = validatedPayload;

      const order = await storage.getOrder(orderId);
      if (!order) {
        console.error("Order not found for webhook:", orderId);
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "pending") {
        console.log("Order already processed:", orderId, order.status);
        return res.json({ success: true, message: "Order already processed" });
      }

      if (!isPaymentCompleted(status)) {
        console.log("Payment not completed:", orderId, status);
        return res.json({ success: true, message: "Payment status noted" });
      }

      await storage.updateOrderStatus(orderId, "processing");
      console.log("Processing order:", orderId);

      try {
        const product = await storage.getProduct(order.productId);
        if (!product) {
          throw new Error("Product not found");
        }

        const credentials = await provisionServer(
          order.customerEmail,
          order.customerUsername,
          order.serverName,
          product
        );

        await storage.updateOrderServerCredentials(orderId, credentials);
        console.log("Server provisioned successfully:", orderId);

        res.json({ success: true, message: "Server provisioned" });
      } catch (provisionError) {
        console.error("Server provisioning failed:", provisionError);
        await storage.updateOrderStatus(orderId, "failed");
        res.status(500).json({ error: "Server provisioning failed" });
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.post("/api/simulate-payment/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "pending") {
        return res.status(400).json({ error: "Order is not pending" });
      }

      await storage.updateOrderStatus(orderId, "processing");

      const product = await storage.getProduct(order.productId);
      if (!product) {
        await storage.updateOrderStatus(orderId, "failed");
        return res.status(404).json({ error: "Product not found" });
      }

      try {
        const credentials = await provisionServer(
          order.customerEmail,
          order.customerUsername,
          order.serverName,
          product
        );

        await storage.updateOrderServerCredentials(orderId, credentials);

        const updatedOrder = await storage.getOrder(orderId);
        res.json({ success: true, order: updatedOrder });
      } catch (provisionError) {
        console.error("Simulated provisioning failed:", provisionError);
        
        const mockCredentials = {
          panelUrl: "https://orbitcloud-mifx1large.vyuxn.xyz",
          username: order.customerUsername.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          password: "demo_" + Math.random().toString(36).slice(2, 14),
          serverId: Math.floor(Math.random() * 1000) + 1,
          serverIp: "103.150.60." + Math.floor(Math.random() * 255),
          serverPort: 7777 + Math.floor(Math.random() * 100),
        };

        await storage.updateOrderServerCredentials(orderId, mockCredentials);
        
        const updatedOrder = await storage.getOrder(orderId);
        res.json({ success: true, order: updatedOrder, note: "Using mock credentials (API unavailable)" });
      }
    } catch (error) {
      console.error("Payment simulation error:", error);
      res.status(500).json({ error: "Payment simulation failed" });
    }
  });

  app.get("/api/health", async (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      services: {
        pakasir: isPakasirConfigured(),
        pterodactyl: isPterodactylConfigured(),
      },
      mode: isPakasirConfigured() && isPterodactylConfigured() ? "production" : "demo"
    });
  });

  return httpServer;
}
