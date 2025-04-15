import { json, redirect } from "@remix-run/node";

// ⛔ NO authentication here — it's public
export const loader = async ({ params, context }) => {
  const shortId = params.id;

  // You’ll need access to stored short links here
  // For public access, use a local JSON file, key-value store, or better:
  // Use Shopify Storefront API (not recommended for private metafields)
  //
  // ✅ For now, we’ll simulate with a simple in-memory map (replace with real DB if needed)

  const shortLinks = {
    abc123: "https://example.com/page1",
    xyz789: "https://another.com/page2",
  };

  const url = shortLinks[shortId];

  if (!url) {
    return new Response("Not found", { status: 404 });
  }

  return redirect(url);
};
