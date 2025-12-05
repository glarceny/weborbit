import type { PakasirQrisResponse } from "@shared/schema";

const PAKASIR_API_URL = "https://app.pakasir.com/api/transactioncreate/qris";

interface PakasirConfig {
  apiKey: string;
  projectSlug: string;
}

function getConfig(): PakasirConfig | null {
  const apiKey = process.env.PAKASIR_API_KEY;
  const projectSlug = process.env.PAKASIR_PROJECT_SLUG;

  if (!apiKey || !projectSlug) {
    return null;
  }

  return { apiKey, projectSlug };
}

export function isPakasirConfigured(): boolean {
  return getConfig() !== null;
}

export async function createQrisPayment(orderId: string, amount: number): Promise<PakasirQrisResponse> {
  const config = getConfig();

  if (!config) {
    console.log("Pakasir not configured, using demo QR code");
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 15);
    
    return {
      success: true,
      payment_number: `DEMO-${orderId.slice(0, 8)}`,
      qr_string: `00020101021226660014ID.CO.QRIS.WWW011893600914300000000020211${orderId.slice(0, 12)}0303UMI51470015ID.OR.GPNQR.WWW0215ID20200000000000303UMI5204541153033605802ID5913OrbitCloud6013Jakarta Pusat61051034062180714${orderId.slice(0, 8)}63046B9A`,
      amount: amount,
      expired_at: expiredAt.toISOString(),
    };
  }

  const requestBody = {
    project_slug: config.projectSlug,
    order_id: orderId,
    amount: amount,
    customer_name: "Customer",
    customer_email: "customer@example.com",
    customer_phone: "08000000000",
    description: `Payment for Order #${orderId}`,
  };

  try {
    const response = await fetch(PAKASIR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pakasir API error:", response.status, errorText);
      throw new Error(`Pakasir API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success && !data.payment_number) {
      throw new Error(data.message || "Failed to create QRIS payment");
    }

    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 15);

    return {
      success: true,
      payment_number: data.payment_number || data.data?.payment_number || orderId,
      qr_string: data.qr_string || data.data?.qr_string || data.qr_code || "",
      amount: amount,
      expired_at: expiredAt.toISOString(),
    };
  } catch (error) {
    console.error("Pakasir createQrisPayment error:", error);
    throw error;
  }
}

export function validateWebhookPayload(payload: unknown): { orderId: string; status: string; amount: number } | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;

  const orderId = data.order_id || data.orderId || data.external_id;
  const status = data.status || data.payment_status;
  const amount = data.amount || data.paid_amount;

  if (!orderId || !status) {
    return null;
  }

  return {
    orderId: String(orderId),
    status: String(status).toLowerCase(),
    amount: Number(amount) || 0,
  };
}

export function isPaymentCompleted(status: string): boolean {
  const completedStatuses = ["completed", "paid", "success", "settlement", "capture"];
  return completedStatuses.includes(status.toLowerCase());
}
