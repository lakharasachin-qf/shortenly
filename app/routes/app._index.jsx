import { useState } from "react";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  Link,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useFetcher, useLoaderData } from "@remix-run/react";
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      shop {
        metafields(first: 100, namespace: "short_links") {
          edges {
            node {
              key
              value
            }
          }
        }
      }
    }
  `);

  const jsonData = await response.json();
  const links =
    jsonData?.data?.shop?.metafields?.edges?.map((edge) => ({
      key: edge.node.key,
      originalUrl: edge.node.value,
    })) || [];

  return json({ links });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const originalUrl = formData.get("originalUrl");

  if (!originalUrl) return json({ error: "No URL provided" }, { status: 400 });

  const shortId = Math.random().toString(36).substring(2, 8);
  const storeUrl = "https://queryfinder.myshopify.com"; // Replace with your store domain
  const shortUrl = `${storeUrl}/redirect/${shortId}`;

  // Get the Shop ID
  const shopResponse = await admin.graphql(`
    query {
      shop {
        id
      }
    }
  `);
  const shopJson = await shopResponse.json();
  console.log("Shop JSON:", JSON.stringify(shopJson, null, 2));

  const shopId = shopJson?.data?.shop?.id;

  if (!shopId) {
    return json({ error: "Unable to retrieve shop ID" }, { status: 500 });
  }

  // Save short link as a shop metafield
  const saveResponse = await admin.graphql(`
    mutation {
      metafieldsSet(metafields: [
        {
          namespace: "short_links",
          key: "${shortId}",
          type: "single_line_text_field",
          value: "${originalUrl}",
          ownerId: "${shopId}"
        }
      ]) {
        metafields {
          id
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `);

  const saveJson = await saveResponse.json();
  const errors = saveJson.data?.metafieldsSet?.userErrors;

  if (errors?.length) {
    return json({ error: errors }, { status: 500 });
  }

  return json({ shortUrl });
};

export default function Index() {
  const fetcher = useFetcher();
  const [originalUrl, setOriginalUrl] = useState("");
  const { links } = useLoaderData();

  const handleGenerate = () => {
    const formData = new FormData();
    formData.append("originalUrl", originalUrl);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Page>
      <TitleBar title="URL Shortener" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">Generate Short Link</Text>
              <input
                type="text"
                placeholder="Enter full URL"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  width: "100%",
                }}
              />
              <Button onClick={handleGenerate}>Generate</Button>

              {fetcher.data?.shortUrl && (
                <Box padding="200" background="bg-surface-active">
                  <Text as="p" variant="bodyMd">
                    Short Link:{" "}
                    <Link url={fetcher.data.shortUrl}>
                      {fetcher.data.shortUrl}
                    </Link>
                  </Text>
                </Box>
              )}
            </BlockStack>
          </Card>
          {/* Show all short links */}
          {links?.length > 0 && (
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">All Short Links</Text>
                {links.map((link) => {
                  const shortUrl = `https://queryfinder.myshopify.com/tools/${link.key}`;
                  return (
                    <Box key={link.key} padding="200" background="bg-surface-active">
                      <Text as="p" variant="bodyMd">
                        🔗 <Link url={shortUrl}>{shortUrl}</Link><br />
                        ↪️ {link.originalUrl}
                      </Text>
                    </Box>
                  );
                })}
              </BlockStack>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
