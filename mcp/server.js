#!/usr/bin/env node
// Dealpuffin MCP over stdio. Proxies the Dealpuffin HTTP API for clients that cannot use the remote URL.
// Prefer https://mcp.dealpuffin.com/mcp when the host supports remote MCP.

const API = (process.env.DEALPUFFIN_API_BASE || "https://dealpuffin.com").replace(/\/$/, "");
const TOKEN = process.env.DEALPUFFIN_TOKEN || "";

function readOnly(title) {
  return { title, readOnlyHint: true };
}
function destructive(title) {
  return { title, destructiveHint: true };
}

const tools = [
  {
    name: "search_offers",
    description: "Search listed Dealpuffin offers by query and/or category, or pass id for one offer. Omits promotion codes.",
    annotations: readOnly("Search offers"),
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        category: { type: "string" },
        id: { type: "string" },
      },
    },
  },
  {
    name: "reveal_offer",
    description: "Reveal the promotion code for one listed offer. One claim per user per coupon.",
    annotations: destructive("Reveal offer code"),
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "get_product",
    description: "Read one product listing including media, public proof points, and reviews.",
    annotations: readOnly("Get product"),
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
  },
  {
    name: "list_categories",
    description: "List categories and subcategories.",
    annotations: readOnly("List categories"),
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_wishes",
    description: "List wishes for demand signal. Pass category, product, and/or mine.",
    annotations: readOnly("List wishes"),
    inputSchema: {
      type: "object",
      properties: { category: { type: "string" }, product: { type: "string" }, mine: { type: "boolean" } },
    },
  },
  {
    name: "list_my_coupons",
    description: "List coupons imported for one of your products.",
    annotations: readOnly("List my coupons"),
    inputSchema: { type: "object", properties: { product: { type: "string" } }, required: ["product"] },
  },
  {
    name: "submit_product",
    description: "Create a product listing from its URL and a subcategory.",
    annotations: destructive("Submit product"),
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        category: { type: "string" },
        categories: { type: "array", items: { type: "string" } },
        name: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        logo_url: { type: "string" },
      },
      required: ["url", "category"],
    },
  },
  {
    name: "update_product",
    description: "Update one of your listings. Omit fields to leave them unchanged.",
    annotations: destructive("Update product"),
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string" },
        name: { type: "string" },
        title: { type: "string" },
        url: { type: "string" },
        category: { type: "string" },
        categories: { type: "array", items: { type: "string" } },
        description: { type: "string" },
        logo_url: { type: "string" },
        video_url: { type: "string" },
        screenshots: { type: "array", items: { type: "object" } },
        hidden: { type: "boolean" },
        verify: { type: "boolean" },
      },
      required: ["product"],
    },
  },
  {
    name: "connect_coupon_provider",
    description: "Connect or replace a billing read key and import, or omit token to sync.",
    annotations: destructive("Connect coupon provider"),
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string" },
        provider: { type: "string" },
        token: { type: "string" },
        product_ids: { type: "array", items: { type: "string" } },
      },
      required: ["product"],
    },
  },
  {
    name: "publish_coupon",
    description: "Publish or unpublish one imported coupon.",
    annotations: destructive("Publish coupon"),
    inputSchema: {
      type: "object",
      properties: { coupon_id: { type: "string" }, published: { type: "boolean" }, claim_limit: { type: "number" } },
      required: ["coupon_id"],
    },
  },
  {
    name: "connect_proof_point",
    description: "Connect a proof-point provider and run the first read.",
    annotations: destructive("Connect proof point"),
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string" },
        provider: { type: "string" },
        token: { type: "string" },
        cadence: { type: "string" },
        points: { type: "array", items: { type: "object" } },
        monitor_id: { type: "string" },
        region: { type: "string" },
        canary_name: { type: "string" },
        check_id: { type: "string" },
        property_id: { type: "string" },
      },
      required: ["product", "provider", "token", "cadence", "points"],
    },
  },
  {
    name: "update_proof_config",
    description: "Change proof config: sync, disconnect, cadence, mode, or order.",
    annotations: destructive("Update proof config"),
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string" },
        action: { type: "string" },
        provider: { type: "string" },
        cadence: { type: "string" },
        point_id: { type: "string" },
        display_mode: { type: "string" },
        direction: { type: "string" },
      },
      required: ["product", "action"],
    },
  },
  {
    name: "create_review",
    description: "Post a review or a reply (pass review_id).",
    annotations: destructive("Create review"),
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string" },
        stars: { type: "number" },
        body: { type: "string" },
        review_id: { type: "string" },
      },
      required: ["product", "body"],
    },
  },
  {
    name: "submit_feedback",
    description: "Send a feature, issue, or friction report.",
    annotations: destructive("Submit feedback"),
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string" },
        body: { type: "string" },
        context: { type: "string" },
      },
      required: ["kind", "body"],
    },
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

const publicTools = new Set(["search_offers", "list_categories", "list_wishes"]);
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
      if (args.id) return api(`/api/v1/offers/${encodeURIComponent(args.id)}`);
      const params = new URLSearchParams();
      if (args.q) params.set("q", args.q);
      if (args.category) params.set("category", args.category);
      return api(`/api/v1/offers?${params}`);
    }
    case "reveal_offer":
      return api(`/api/v1/offers/${encodeURIComponent(args.id)}/reveal`, { method: "POST", auth: true, body: {} });
    case "get_product":
      return api(`/api/v1/products/${encodeURIComponent(args.slug)}`, { auth: true });
    case "list_categories":
      return api("/api/v1/categories");
    case "list_wishes": {
      const params = new URLSearchParams();
      if (args.product) params.set("product", args.product);
      if (args.category) params.set("category", args.category);
      if (args.mine) params.set("mine", "1");
      return api(`/api/v1/wishes?${params}`, { auth: Boolean(args.mine) });
    }
    case "list_my_coupons":
      return api(`/api/v1/products/${encodeURIComponent(args.product)}/coupons`, { auth: true });
    case "submit_product":
      return api("/api/v1/products", { method: "POST", auth: true, body: args });
    case "update_product": {
      const { product, ...body } = args;
      return api(`/api/v1/products/${encodeURIComponent(product)}`, { method: "PATCH", auth: true, body });
    }
    case "connect_coupon_provider": {
      const { product, ...body } = args;
      return api(`/api/v1/products/${encodeURIComponent(product)}/coupons`, { method: "POST", auth: true, body });
    }
    case "publish_coupon":
      return api("/api/v1/coupons/publish", { method: "POST", auth: true, body: args });
    case "connect_proof_point": {
      const { product, ...body } = args;
      return api(`/api/v1/products/${encodeURIComponent(product)}/proof-points`, { method: "POST", auth: true, body });
    }
    case "update_proof_config": {
      const { product, ...body } = args;
      return api(`/api/v1/products/${encodeURIComponent(product)}/proof-points`, { method: "POST", auth: true, body });
    }
    case "create_review":
      return api("/api/v1/reviews", { method: "POST", auth: true, body: args });
    case "submit_feedback":
      return api("/api/v1/feedback", { method: "POST", auth: true, body: args });
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
      protocolVersion: params?.protocolVersion || "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "dealpuffin", version: "0.2.0" },
      instructions:
        "Prefer the remote MCP at https://mcp.dealpuffin.com/mcp. This stdio server proxies /api/v1. search_offers never returns a code; reveal_offer does and is one claim.",
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
