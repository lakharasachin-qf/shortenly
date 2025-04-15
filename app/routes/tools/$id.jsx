import { redirect } from "@remix-run/node";

// 👇 Helper to call Shopify Admin API directly (no Remix auth)
async function getOriginalUrlFromShopify(shortId) {
  const storeDomain = "queryfinder.myshopify.com"; // e.g., mystore.myshopify.com
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-04";

  const endpoint = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;

  const query = `
    query {
      shop {
        metafield(namespace: "short_links", key: "${shortId}") {
          value
        }
      }
    }
  `;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  console.log("json",json)
  const value = json?.data?.shop?.metafield?.value;

  return value;
}

export const loader = async ({ params }) => {
  const shortId = params.id;

  const originalUrl = await getOriginalUrlFromShopify(shortId);

  if (!originalUrl) {
    return new Response("Short link not found", { status: 404 });
  }

  return redirect(originalUrl);
};
