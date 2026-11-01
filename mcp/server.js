#!/usr/bin/env node
// Dealpuffin MCP server. Speaks stdio JSON-RPC and calls the Dealpuffin HTTP API.
// Search never returns a code. reveal_offer does, and it counts as a claim.

const API = (process.env.DEALPUFFIN_API_BASE || "https://dealpuffin.com").replace(/\/$/, "");
const TOKEN = process.env.DEALPUFFIN_TOKEN || "";

const tools = [
  {
    name: "search_offers",
    description: "Search listed Dealpuffin offers. Does not return promotion codes.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Product, description, or category text." },
        category: { type: "string", description: "Category slug." },
      },
    },
  },
  {
    name: "get_offer",
    description: "Get one listed offer by id. Does not return the promotion code.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "reveal_offer",
    description: "Read the promotion code for an offer. Counts as this user's one claim. A repeat call returns the same code.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_my_coupons",
    description: "List coupons synced from the signed-in provider's Stripe account, with the code and why each is listed or held back.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "submit_product",
    description: "Create a product listing. stripe_product_ids are Stripe ids like prod_123.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        url: { type: "string" },
        category: { type: "string" },
        description: { type: "string" },
        stripe_product_ids: { type: "array", items: { type: "string" } },
      },
      required: ["name", "url", "category"],
    },
  },
  {
    name: "connect_stripe",
    description: "Store a restricted Stripe read key (rk_) and import coupons. Never send a secret key. Import does not publish coupons.",
    inputSchema: {
      type: "object",
      properties: { restricted_key: { type: "string" } },
      required: ["restricted_key"],
    },
  },
  {
    name: "sync_coupons",
    description: "Fetch coupons from Stripe again with the stored restricted key. Does not publish them.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "publish_coupon",
    description: "Publish one imported coupon so seekers can claim it. product is the listing slug. A coupon Stripe limited to product ids can only be published on a listing that carries one of those ids. Omit product only when every matching listing should get it.",
    inputSchema: {
      type: "object",
      properties: {
        coupon_id: { type: "string" },
        product: { type: "string", description: "Product slug." },
      },
      required: ["coupon_id"],
    },
  },
  {
    name: "list_wishes",
    description: "List wishes for a product slug or a category slug.",
    inputSchema: {
      type: "object",
      properties: { product: { type: "string" }, category: { type: "string" } },
    },
  },
  {
    name: "create_wish",
    description: "File a wish on a product or an open wish in a category.",
    inputSchema: {
      type: "object",
      properties: {
        body: { type: "string" },
        product: { type: "string" },
        category: { type: "string" },
        target_percent: { type: "number" },
        target_months: { type: "number" },
      },
      required: ["body"],
    },
  },
  {
    name: "list_categories",
    description: "List category slugs a product or an open wish can use.",
    inputSchema: { type: "object", properties: {} },
  },
];

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "content-type": "application/json" };
  if (auth) {
    if (!TOKEN) {
      const error = new Error("DEALPUFFIN_TOKEN is not set.");
      error.status = 401;
      throw error;
    }
    headers.authorization = `Bearer ${TOKEN}`;
  }
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Dealpuffin returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

const publicTools = new Set(["search_offers", "get_offer", "list_wishes", "list_categories"]);
let allowedNames;

async function visibleTools() {
  if (!TOKEN) return tools.filter((tool) => publicTools.has(tool.name));
  if (!allowedNames) {
    const payload = await api("/api/v1/tools", { auth: true });
    allowedNames = new Set(payload.tools || []);
  }
  return tools.filter((tool) => allowedNames.has(tool.name));
}

async function callTool(name, args) {
  switch (name) {
    case "search_offers": {
      const params = new URLSearchParams();
      if (args.q) params.set("q", args.q);
      if (args.category) params.set("category", args.category);
      return api(`/api/v1/offers?${params}`);
    }
    case "get_offer":
      return api(`/api/v1/offers/${encodeURIComponent(args.id)}`);
    case "reveal_offer":
      return api(`/api/v1/offers/${encodeURIComponent(args.id)}/reveal`, { method: "POST", auth: true, body: {} });
    case "list_my_coupons":
      return api("/api/v1/stripe", { auth: true });
    case "submit_product":
      return api("/api/v1/products", { method: "POST", auth: true, body: args });
    case "connect_stripe":
      return api("/api/v1/stripe", { method: "POST", auth: true, body: { restricted_key: args.restricted_key } });
    case "sync_coupons":
      return api("/api/v1/stripe", { method: "POST", auth: true, body: {} });
    case "publish_coupon":
      return api("/api/v1/stripe/publish", { method: "POST", auth: true, body: args });
    case "list_wishes": {
      const params = new URLSearchParams();
      if (args.product) params.set("product", args.product);
      if (args.category) params.set("category", args.category);
      return api(`/api/v1/wishes?${params}`);
    }
    case "create_wish":
      return api("/api/v1/wishes", { method: "POST", auth: true, body: args });
    case "list_categories":
      return api("/api/v1/categories");
    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

function send(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function failure(id, message) {
  send({ jsonrpc: "2.0", id, error: { code: -32000, message } });
}

async function handle(message) {
  if (!message || message.jsonrpc !== "2.0" || message.id == null) return;
  const { id, method, params } = message;
  if (method === "initialize") {
    result(id, {
      protocolVersion: params?.protocolVersion || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "dealpuffin", version: "0.1.0" },
    });
    return;
  }
  if (method === "ping") {
    result(id, {});
    return;
  }
  if (method === "tools/list") {
    visibleTools()
      .then((allowed) => result(id, { tools: allowed }))
      .catch((error) => failure(id, error.message));
    return;
  }
  if (method === "tools/call") {
    try {
      const allowed = await visibleTools();
      if (!allowed.some((tool) => tool.name === params?.name)) {
        result(id, { content: [{ type: "text", text: "This API key cannot use that tool." }], isError: true });
        return;
      }
      const payload = await callTool(params?.name, params?.arguments || {});
      result(id, { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] });
    } catch (error) {
      result(id, { content: [{ type: "text", text: error.message }], isError: true });
    }
    return;
  }
  failure(id, `Unsupported method ${method}`);
}

let buffer = Buffer.alloc(0);
process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }
    const length = Number(match[1]);
    const start = headerEnd + 4;
    if (buffer.length < start + length) return;
    const body = buffer.subarray(start, start + length).toString("utf8");
    buffer = buffer.subarray(start + length);
    handle(JSON.parse(body)).catch((error) => {
      process.stderr.write(`${error.message}\n`);
    });
  }
});
