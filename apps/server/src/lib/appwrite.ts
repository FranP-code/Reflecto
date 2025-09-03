import { Account, Client } from "node-appwrite";

// Admin client for server-side operations
const adminClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "")
  .setKey(process.env.APPWRITE_API_KEY || "");

// Session client factory for user-specific operations
export const createSessionClient = (sessionToken?: string) => {
  const client = new Client()
    .setEndpoint(
      process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1"
    )
    .setProject(process.env.APPWRITE_PROJECT_ID || "");

  if (sessionToken) {
    client.setSession(sessionToken);
  }

  return new Account(client);
};

export const adminAccount = new Account(adminClient);
