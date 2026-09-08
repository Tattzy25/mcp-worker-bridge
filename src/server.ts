import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const SHOPIFY_MCP_URL =
  "https://catalog.shopify.com/api/ucp/mcp";

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
			description: `Search for products across multiple Shopify stores in the global catalog. Use this tool when buyers are searching for products without specifying a particular store. Examples: - "I'm looking for a pair of running shoes" - "Find me some wireless headphones under $100" - "Search for organic coffee beans" Input and response conform to the UCP catalog search capability (dev.ucp.shopping.catalog.search). Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
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
      limit: z.number().int().min(1).max(50).optional(),
    }).optional(),
  }).passthrough(),
      }),
		},
		async ({ meta, catalog }) => {
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
      "Accept": "application/json",
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
			description: `Retrieve details about a specific product across multiple Shopify stores. Use this tool when buyers are interested in a particular product. Examples: - "What are the details of the iPhone 12?" - "Tell me about the Sony WH-1000XM4 headphones" Input and response conform to the UCP product details capability (dev.ucp.shopping.product.details). Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
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
		async ({ meta, catalog }) => {
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
      "Accept": "application/json",
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
			description: `Look up multiple products or variants by identifier from the global catalog. Use this tool to resolve multiple product/variant IDs in a single request. Supports: - Product IDs (gid://shopify/p/{id}): Returns product with one featured variant - Variant IDs (gid://shopify/ProductVariant/{id}): Returns parent product with the exact variant Results are grouped by product. Each variant includes an input array showing which request ID resolved to it and whether the match was exact or featured. Examples: - Resolving a list of product IDs from search results - Validating multiple cart items in one call - Looking up products from deep links or saved lists Input and response conform to the UCP catalog lookup capability (dev.ucp.shopping.catalog.lookup). Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
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
		async ({ meta, catalog }) => {
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
      "Accept": "application/json",
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

