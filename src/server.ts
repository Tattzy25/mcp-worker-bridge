import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const UCP_AGENT_PROFILE =
  "https://ucp-agent-profile.facetimefy.com/ucp/agent-profiles/2026-08-25/valid-with-capabilities.json";

function createServer() {
  const server = new McpServer({
    name: "MCP-Agents",
    version: "1.0.0",
  });

  server.registerTool(
    "search_catalog",
    {
      description: `Search for products in the merchant storefront catalog for the domain passed in domain. Use this tool when buyers are searching for products in that specific store. Returns products with up to 3 available variants matching the filters, along with available filter refinements and pagination info. Do not use to get all variants of a single product (use get_product) or to fetch known product/variant IDs (use lookup_catalog). Input and response conform to the UCP catalog search capability (dev.ucp.shopping.catalog.search) and the Storefront Catalog extension (dev.shopify.catalog). When the extension is active, responses include product-level gift_card and collections fields, plus variant-level requires_shipping, requires_selling_plan, and checkout_url fields. Filter filters.available defaults to true (only available items returned); set to false to include unavailable items. Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
        domain: z
          .string()
          .describe("The merchant storefront domain (e.g., example.myshopify.com)."),

        catalog: z
          .object({
            query: z
              .string()
              .describe(
                'Natural-language search query. Pass "" to browse without a text filter.'
              ),

            context: z
              .object({
                address_country: z.string().optional(),
                address_region: z.string().optional(),
                postal_code: z.string().optional(),
                language: z.string().optional(),
                currency: z.string().optional(),
                intent: z.string().optional(),
              })
              .optional()
              .describe(
                "Buyer context for localization and pricing (for example, address_country, currency, language)."
              ),

            signals: z.record(z.string(), z.unknown()).optional(),

            filters: z
              .object({
                categories: z.array(z.string()).optional(),

                price: z
                  .object({
                    min: z.number().int().optional(),
                    max: z.number().int().optional(),
                  })
                  .optional(),

                attributes: z
                  .array(
                    z.object({
                      name: z.string(),
                      values: z.array(z.string()),
                    })
                  )
                  .optional(),

                available: z
                  .boolean()
                  .optional()
                  .describe(
                    "When true (default), only available items are returned. Set to false to include unavailable items."
                  ),
              })
              .passthrough()
              .optional()
              .describe("Filter refinements (price range, categories, attributes, availability)."),

            pagination: z
              .object({
                cursor: z.string().optional(),
                limit: z.number().int().min(1).max(250).optional(),
              })
              .optional()
              .describe(
                "Cursor-based pagination: limit (1-250, default 10) and cursor from a previous response's pagination.end_cursor."
              ),
          })
          .passthrough(),
      }),
    },
    async ({ domain, catalog }) => {
      const SHOPIFY_MCP_URL = `https://${domain}/api/ucp/mcp`;

      const shopifyRequest = {
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: {
          name: "search_catalog",
          arguments: {
            meta: {
              "ucp-agent": {
                profile: UCP_AGENT_PROFILE,
              },
            },
            catalog,
          },
        },
      };

      const shopifyResponse = await fetch(SHOPIFY_MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
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
    }
  );

  server.registerTool(
    "get_product",
    {
      description: `Retrieve details about a specific product in the merchant storefront catalog for the domain passed in domain. Use this tool when buyers are interested in a particular product from that specific store, including all variants, options, and availability matrix. Do not use for keyword search (use search_catalog) or batch lookup of multiple products (use lookup_catalog). Input and response conform to the UCP product details capability (dev.ucp.shopping.product.details) and the Storefront Catalog extension (dev.shopify.catalog). When the extension is active, responses include product-level gift_card and collections fields, plus variant-level requires_shipping, requires_selling_plan, checkout_url, and selling_plans (subscription/purchase options, returned only on get_product). Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
        domain: z
          .string()
          .describe("The merchant storefront domain (e.g., example.myshopify.com)."),

        catalog: z
          .object({
            id: z
              .string()
              .describe(
                "Product ID (gid://shopify/p/{id}) or Variant ID (gid://shopify/ProductVariant/{id})."
              ),

            selected: z
              .array(
                z.object({
                  name: z.string(),
                  label: z.string(),
                })
              )
              .optional()
              .describe(
                'Option selections to narrow variants (for example, [{"name": "Size", "label": "M"}]).'
              ),

            preferences: z.array(z.string()).optional(),

            context: z
              .object({
                address_country: z.string().optional(),
                address_region: z.string().optional(),
                postal_code: z.string().optional(),
                language: z.string().optional(),
                currency: z.string().optional(),
                intent: z.string().optional(),
              })
              .optional()
              .describe(
                "Buyer context for localization and pricing (for example, address_country, currency, language)."
              ),

            signals: z.record(z.string(), z.unknown()).optional(),

            filters: z
              .object({
                categories: z.array(z.string()).optional(),

                price: z
                  .object({
                    min: z.number().int().optional(),
                    max: z.number().int().optional(),
                  })
                  .optional(),

                attributes: z
                  .array(
                    z.object({
                      name: z.string(),
                      values: z.array(z.string()),
                    })
                  )
                  .optional(),

                available: z
                  .boolean()
                  .optional()
                  .describe(
                    "When true (default), only available items are returned. Set to false to include unavailable items."
                  ),
              })
              .passthrough()
              .optional(),
          })
          .passthrough(),
      }),
    },
    async ({ domain, catalog }) => {
      const SHOPIFY_MCP_URL = `https://${domain}/api/ucp/mcp`;

      const shopifyRequest = {
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: {
          name: "get_product",
          arguments: {
            meta: {
              "ucp-agent": {
                profile: UCP_AGENT_PROFILE,
              },
            },
            catalog,
          },
        },
      };

      const shopifyResponse = await fetch(SHOPIFY_MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
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
    }
  );

  server.registerTool(
    "lookup_catalog",
    {
      description: `Look up multiple products or variants by identifier in the merchant storefront catalog for the domain passed in domain. Use this tool to resolve multiple product/variant IDs in a single request for that specific store. Do not use when you need all variants of a single product (use get_product) or for keyword search (use search_catalog). Supports: - Product IDs (gid://shopify/p/{id}): Returns product with one featured variant - Variant IDs (gid://shopify/ProductVariant/{id}): Returns parent product with the exact variant. Results are grouped by product. Each variant includes an input array showing which request ID resolved to it and whether the match was exact or featured. Examples: - Resolving a list of product IDs from search results - Validating multiple cart items in one call - Looking up products from deep links or saved lists. Input and response conform to the UCP catalog lookup capability (dev.ucp.shopping.catalog.lookup) and the Storefront Catalog extension (dev.shopify.catalog). When the extension is active, responses include product-level gift_card and collections fields, plus variant-level requires_shipping, requires_selling_plan, and checkout_url fields. Filter filters.available defaults to true (only available items returned); set to false to include unavailable items. Prices in the response are integers in the currency's ISO 4217 minor units, paired with a currency code: {"amount": 600, "currency": "USD"} is $6.00 and {"amount": 2500, "currency": "USD"} is $25.00. Convert to major units before quoting a price to a buyer (divide by 100 for two-decimal currencies such as USD and EUR; zero-decimal currencies such as JPY are already whole units).`,
      inputSchema: z.object({
        domain: z
          .string()
          .describe("The merchant storefront domain (e.g., example.myshopify.com)."),

        catalog: z
          .object({
            ids: z
              .array(z.string())
              .min(1)
              .max(10)
              .describe(
                "1 to 10 product IDs (gid://shopify/p/{id}) or variant IDs (gid://shopify/ProductVariant/{id})."
              ),

            context: z
              .object({
                address_country: z.string().optional(),
                address_region: z.string().optional(),
                postal_code: z.string().optional(),
                language: z.string().optional(),
                currency: z.string().optional(),
                intent: z.string().optional(),
              })
              .optional()
              .describe(
                "Buyer context for localization and pricing (for example, address_country, currency, language)."
              ),

            signals: z.record(z.string(), z.unknown()).optional(),

            filters: z
              .object({
                categories: z.array(z.string()).optional(),

                price: z
                  .object({
                    min: z.number().int().optional(),
                    max: z.number().int().optional(),
                  })
                  .optional(),

                attributes: z
                  .array(
                    z.object({
                      name: z.string(),
                      values: z.array(z.string()),
                    })
                  )
                  .optional(),

                available: z
                  .boolean()
                  .optional()
                  .describe(
                    "When true (default), only available items are returned. Set to false to include unavailable items."
                  ),
              })
              .passthrough()
              .optional()
              .describe("Filter refinements (price range, categories, attributes, availability)."),
          })
          .passthrough(),
      }),
    },
    async ({ domain, catalog }) => {
      const SHOPIFY_MCP_URL = `https://${domain}/api/ucp/mcp`;

      const shopifyRequest = {
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: {
          name: "lookup_catalog",
          arguments: {
            meta: {
              "ucp-agent": {
                profile: UCP_AGENT_PROFILE,
              },
            },
            catalog,
          },
        },
      };

      const shopifyResponse = await fetch(SHOPIFY_MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
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
    }
  );

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
