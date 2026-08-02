import { beforeAll, describe, expect, it } from "vitest";
import { connectTenantConnector, disconnectTenantConnector, getTenant, listTenants } from "./api";

/**
 * Tenants API flow tests
 * PURPOSE: Verify seeded tenants and connector connect/disconnect behavior.
 */
describe("tenants api", () => {
  beforeAll(async () => {
    // Ensure module under test is loaded in the encore test runtime.
    await Promise.resolve();
  });

  it("lists venkat.ag first and shoploop second", async () => {
    const response = await listTenants();
    expect(response.tenants.length).toBeGreaterThanOrEqual(2);

    const [first, second] = response.tenants;
    expect(first.slug).toBe("venkat-ag");
    expect(first.displayName).toBe("venkat.ag");
    expect(second.slug).toBe("shoploop");
    expect(second.displayName).toBe("ShopLoop");
  });

  it("seeds github, slack, and perplexity connectors for venkat", async () => {
    const response = await getTenant({ slug: "venkat-ag" });
    const providers = response.tenant.connectors.map((connector) => connector.provider).sort();
    expect(providers).toEqual(["github", "perplexity", "slack"]);
    for (const connector of response.tenant.connectors) {
      expect(["pending", "connected", "disconnected", "error"]).toContain(connector.status);
    }
  });

  it("connects and disconnects the github connector for venkat", async () => {
    const connected = await connectTenantConnector({
      slug: "venkat-ag",
      provider: "github",
      externalAccountLabel: "venkat-ag/github",
    });
    expect(connected.connector.status).toBe("connected");
    expect(connected.connector.externalAccountLabel).toBe("venkat-ag/github");
    expect(connected.connector.connectedAt).toBeTruthy();

    const disconnected = await disconnectTenantConnector({
      slug: "venkat-ag",
      provider: "github",
    });
    expect(disconnected.connector.status).toBe("disconnected");
    expect(disconnected.connector.connectedAt).toBeNull();
  });
});
