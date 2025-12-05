import type { Product, ServerCredentials, PterodactylUser, PterodactylAllocation, PterodactylServer } from "@shared/schema";
import crypto from "crypto";

const PTERODACTYL_URL = "https://orbitcloud-mifx1large.vyuxn.xyz";
const DEFAULT_NODE_ID = 1;

interface PterodactylConfig {
  apiKey: string;
  panelUrl: string;
}

function getConfig(): PterodactylConfig | null {
  const apiKey = process.env.PTERODACTYL_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    panelUrl: PTERODACTYL_URL,
  };
}

export function isPterodactylConfigured(): boolean {
  return getConfig() !== null;
}

function generatePassword(): string {
  return crypto.randomBytes(12).toString("base64").replace(/[+/=]/g, "").slice(0, 16);
}

async function pterodactylRequest(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<Response> {
  const config = getConfig();
  
  if (!config) {
    throw new Error("Pterodactyl API not configured");
  }
  
  const response = await fetch(`${config.panelUrl}/api/application${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

export async function findUserByEmail(email: string): Promise<PterodactylUser | null> {
  try {
    const response = await pterodactylRequest(`/users?filter[email]=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      console.error("Failed to search user:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const user = data.data[0].attributes;
      return {
        id: user.id,
        username: user.username,
        email: user.email,
      };
    }

    return null;
  } catch (error) {
    console.error("findUserByEmail error:", error);
    return null;
  }
}

export async function createUser(email: string, username: string): Promise<{ user: PterodactylUser; password: string }> {
  const password = generatePassword();
  
  const userData = {
    email,
    username,
    first_name: username,
    last_name: "User",
    password,
  };

  try {
    const response = await pterodactylRequest("/users", "POST", userData);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create user:", response.status, errorText);
      throw new Error(`Failed to create user: ${response.status}`);
    }

    const data = await response.json();
    const user = data.attributes;

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      password,
    };
  } catch (error) {
    console.error("createUser error:", error);
    throw error;
  }
}

export async function findOrCreateUser(email: string, username: string): Promise<{ user: PterodactylUser; password: string | null; isNew: boolean }> {
  const existingUser = await findUserByEmail(email);
  
  if (existingUser) {
    return {
      user: existingUser,
      password: null,
      isNew: false,
    };
  }

  const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
  const uniqueUsername = `${safeUsername}_${Date.now().toString(36)}`;
  
  const { user, password } = await createUser(email, uniqueUsername);
  
  return {
    user,
    password,
    isNew: true,
  };
}

export async function findAvailableAllocation(nodeId: number = DEFAULT_NODE_ID): Promise<PterodactylAllocation | null> {
  try {
    let page = 1;
    const maxPages = 10;

    while (page <= maxPages) {
      const response = await pterodactylRequest(`/nodes/${nodeId}/allocations?page=${page}`);
      
      if (!response.ok) {
        console.error("Failed to fetch allocations:", response.status);
        return null;
      }

      const data = await response.json();
      
      for (const item of data.data) {
        const alloc = item.attributes;
        if (!alloc.assigned) {
          return {
            id: alloc.id,
            ip: alloc.ip,
            port: alloc.port,
            assigned: alloc.assigned,
          };
        }
      }

      if (!data.meta?.pagination || page >= data.meta.pagination.total_pages) {
        break;
      }
      
      page++;
    }

    return null;
  } catch (error) {
    console.error("findAvailableAllocation error:", error);
    return null;
  }
}

export async function createServer(
  userId: number,
  allocationId: number,
  serverName: string,
  product: Product
): Promise<PterodactylServer> {
  const { eggConfig } = product;

  const serverData = {
    name: serverName,
    user: userId,
    egg: eggConfig.eggId,
    docker_image: eggConfig.dockerImage,
    startup: eggConfig.startup,
    environment: {
      MAX_PLAYERS: String(product.maxPlayers || 50),
      RCON_PASSWORD: generatePassword(),
      SERVER_NAME: serverName,
    },
    limits: {
      memory: product.ram,
      swap: 0,
      disk: product.disk,
      io: 500,
      cpu: product.cpu,
    },
    feature_limits: {
      databases: 1,
      backups: 2,
      allocations: 1,
    },
    allocation: {
      default: allocationId,
    },
  };

  try {
    const response = await pterodactylRequest("/servers", "POST", serverData);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create server:", response.status, errorText);
      throw new Error(`Failed to create server: ${response.status}`);
    }

    const data = await response.json();
    const server = data.attributes;

    return {
      id: server.id,
      uuid: server.uuid,
      name: server.name,
      allocation: allocationId,
    };
  } catch (error) {
    console.error("createServer error:", error);
    throw error;
  }
}

export async function provisionServer(
  email: string,
  username: string,
  serverName: string,
  product: Product
): Promise<ServerCredentials> {
  const config = getConfig();
  
  if (!config) {
    console.log("Pterodactyl not configured, returning demo credentials");
    return {
      panelUrl: PTERODACTYL_URL,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      password: "demo_" + Math.random().toString(36).slice(2, 14),
      serverId: Math.floor(Math.random() * 1000) + 1,
      serverIp: "103.150.60." + Math.floor(Math.random() * 255),
      serverPort: 7777 + Math.floor(Math.random() * 100),
    };
  }
  
  console.log(`Starting server provisioning for ${email}...`);

  const { user, password, isNew } = await findOrCreateUser(email, username);
  console.log(`User ${isNew ? "created" : "found"}: ${user.id}`);

  const allocation = await findAvailableAllocation();
  if (!allocation) {
    throw new Error("No available port allocation found. Please try again later.");
  }
  console.log(`Found allocation: ${allocation.ip}:${allocation.port}`);

  const server = await createServer(user.id, allocation.id, serverName, product);
  console.log(`Server created: ${server.id}`);
  
  return {
    panelUrl: config.panelUrl,
    username: user.username,
    password: password || "(Use your existing password)",
    serverId: server.id,
    serverIp: allocation.ip,
    serverPort: allocation.port,
  };
}

export async function testConnection(): Promise<boolean> {
  try {
    const response = await pterodactylRequest("/nodes");
    return response.ok;
  } catch {
    return false;
  }
}
