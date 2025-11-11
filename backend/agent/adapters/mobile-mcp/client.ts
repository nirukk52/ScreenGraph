/**
 * getMobileMcpClient lazily loads the Encore-generated Mobile MCP client.
 * PURPOSE: Avoids circular imports and delays loading until the first call.
 */
export async function getMobileMcpClient() {
  const clients = await import("~encore/clients");
  const client = clients.mobileMcp;
  if (!client) {
    throw new Error("mobileMcp client is not available from ~encore/clients");
  }
  return client;
}
