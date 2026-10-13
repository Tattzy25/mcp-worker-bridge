import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const SHOPIFY_USER_AGENT =
  "ShoppingTools/1.0";

function createServer() {
const server = new McpServer({
name: "MCP-Agents",
version: "1.0.0",
});

server.registerTool(
"search_catalog",
{
description: `Search for products in a merchant's storefront catalog after discovery. Use this tool when buyers are searching for products within a specific merchant's store. Input and response conform to the UCP catalog search capability (dev.ucp.shopping.catalog.search). Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
  domain: z.string(),

  meta: z.object({
    "ucp-agent": z.object({
      profile: z.string().url(),
    }),
  }),

  catalog: z.object({
    query: z.string(),

    context: z.object({
      address_country: z.string().optional(),
      address_region: z.string().optional(),
      postal_code: z.string().optional(),
      language: z.string().optional(),
      currency: z.string().optional(),
      intent: z.string().optional(),
    }).optional(),

    signals: z.record(z.string(), z.unknown()).optional(),

    filters: z.object({
      categories: z.array(z.string()).optional(),

      price: z.object({
        min: z.number().int().optional(),
        max: z.number().int().optional(),
      }).optional(),

      attributes: z.array(
        z.object({
          name: z.string(),
          values: z.array(z.string()),
        })
      ).optional(),

      available: z.boolean().optional(),
    }).passthrough().optional(),

    pagination: z.object({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(250).optional(),
    }).optional(),
  }).passthrough(),
      }),
},
async ({ domain, meta, catalog }) => {
  const SHOPIFY_MCP_URL = `https://${domain}/api/ucp/mcp`;

  const shopifyRequest = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "tools/call",
    params: {
      name: "search_catalog",
      arguments: {
        meta,
        catalog,
      },
    },
  };

  const shopifyResponse = await fetch(SHOPIFY_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "User-Agent": SHOPIFY_USER_AGENT,
    },
    body: JSON.stringify(shopifyRequest),
  });

  const shopifyReply = await shopifyResponse.json();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(shopifyReply),
      },
    ],
  };
});

  server.registerTool(
"get_product",
{
description: `Retrieve details about a specific product in a merchant's storefront catalog after discovery. Use this tool when buyers are interested in a particular product from a specific merchant store. Input and response conform to the UCP product details capability (dev.ucp.shopping.product.details). Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
  domain: z.string(),

  meta: z.object({
    "ucp-agent": z.object({
      profile: z.string().url(),
    }),
  }),

  catalog: z.object({
    id: z.string(),

    selected: z.array(
      z.object({
        name: z.string(),
        label: z.string(),
      })
    ).optional(),

    preferences: z.array(z.string()).optional(),

    context: z.object({
      address_country: z.string().optional(),
      address_region: z.string().optional(),
      postal_code: z.string().optional(),
      language: z.string().optional(),
      currency: z.string().optional(),
      intent: z.string().optional(),
    }).optional(),

    signals: z.record(z.string(), z.unknown()).optional(),

    filters: z.object({
      categories: z.array(z.string()).optional(),

      price: z.object({
        min: z.number().int().optional(),
        max: z.number().int().optional(),
      }).optional(),
    }).passthrough().optional(),
  }).passthrough(),
      }),
},
async ({ domain, meta, catalog }) => {
  const SHOPIFY_MCP_URL = `https://${domain}/api/ucp/mcp`;

  const shopifyRequest = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "tools/call",
    params: {
      name: "get_product",
      arguments: {
        meta,
        catalog,
      },
    },
  };

  const shopifyResponse = await fetch(SHOPIFY_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "User-Agent": SHOPIFY_USER_AGENT,
    },
    body: JSON.stringify(shopifyRequest),
  });

  const shopifyReply = await shopifyResponse.json();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(shopifyReply),
      },
    ],
  };
});

  server.registerTool(
"lookup_catalog",
{
description: `Look up multiple products or variants by identifier from a merchant's storefront catalog after discovery. Use this tool to resolve multiple product/variant IDs in a single request for a specific merchant store. Supports: - Product IDs (gid://shopify/p/{id}) - Variant IDs (gid://shopify/ProductVariant/{id}) Input and response conform to the UCP catalog lookup capability (dev.ucp.shopping.catalog.lookup). Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
  domain: z.string(),

  meta: z.object({
    "ucp-agent": z.object({
      profile: z.string().url(),
    }),
  }),

  catalog: z.object({
    ids: z.array(z.string()).min(1).max(10),

    context: z.object({
      address_country: z.string().optional(),
      address_region: z.string().optional(),
      postal_code: z.string().optional(),
      language: z.string().optional(),
      currency: z.string().optional(),
      intent: z.string().optional(),
    }).optional(),

    signals: z.record(z.string(), z.unknown()).optional(),

    filters: z.object({
      categories: z.array(z.string()).optional(),

      price: z.object({
        min: z.number().int().optional(),
        max: z.number().int().optional(),
      }).optional(),
    }).passthrough().optional(),
  }).passthrough(),
      }),
},
async ({ domain, meta, catalog }) => {
  const SHOPIFY_MCP_URL = `https://${domain}/api/ucp/mcp`;

  const shopifyRequest = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "tools/call",
    params: {
      name: "lookup_catalog",
      arguments: {
        meta,
        catalog,
      },
    },
  };

  const shopifyResponse = await fetch(SHOPIFY_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "User-Agent": SHOPIFY_USER_AGENT,
    },
    body: JSON.stringify(shopifyRequest),
  });

  const shopifyReply = await shopifyResponse.json();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(shopifyReply),
      },
    ],
  };
});

return server;
}

export default {
fetch(request, env, ctx) {
return createMcpHandler(createServer, {
allowedOriginHostnames: "*",
corsOptions: { origin: "*" },
})(request, env, ctx);
},
} satisfies ExportedHandler;
