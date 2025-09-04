import type { Models } from "appwrite";
import { Databases, ID, Permission, Query, Role } from "appwrite";
import type { TLEditorSnapshot } from "tldraw";
import { account, appwriteClient } from "@/lib/auth-client";

// Environment-configured IDs for Appwrite
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID as string;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID as string;

// Initialize TablesDB once per app
const databases = new Databases(appwriteClient);

export type SpaceSnapshotRow = {
  $id: string;
  $databaseId: string;
  $tableId: string;
  spaceId: string;
  userId: string;
  snapshot: string; // JSON string containing { schema, document }
  $createdAt?: string;
  $updatedAt?: string;
};

export type RemoteSnapshot = Partial<TLEditorSnapshot>;

function ensureEnv() {
  if (!(DATABASE_ID && COLLECTION_ID)) {
    throw new Error(
      "Missing Appwrite DB config. Please set VITE_APPWRITE_DB_ID and VITE_APPWRITE_COLLECTION_ID."
    );
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const me = await account.get();
    return me.$id ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch latest snapshot for a given space (scoped to the current user).
 */
export async function getLatestSpaceSnapshot(
  spaceId: string,
  userId?: string
): Promise<RemoteSnapshot | null> {
  ensureEnv();
  const uid = userId ?? (await getCurrentUserId());
  if (!uid) {
    return null;
  }

  const res = (await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal("spaceId", spaceId),
    Query.equal("userId", uid),
  ])) as Models.DocumentList<Models.Document>;

  const row = res.documents?.[0] as unknown as SpaceSnapshotRow | undefined;
  if (!row) {
    return null;
  }

  try {
    const parsed = JSON.parse(row.snapshot) as RemoteSnapshot;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Create or update a snapshot row for the space (per user).
 */
export async function upsertSpaceSnapshot(
  spaceId: string,
  payload: RemoteSnapshot,
  userId?: string
): Promise<void> {
  ensureEnv();
  const uid = userId ?? (await getCurrentUserId());
  if (!uid) {
    throw new Error("Not authenticated");
  }

  const res = (await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal("spaceId", spaceId),
    Query.equal("userId", uid),
  ])) as Models.DocumentList<Models.Document>;
  const existing = res.documents?.[0] as unknown as
    | SpaceSnapshotRow
    | undefined;

  const data = {
    spaceId,
    userId: uid,
    snapshot: JSON.stringify(payload),
  } as const;

  if (existing) {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      existing.$id,
      data
    );
  } else {
    // Limit access to the owner by default
    const permissions = [
      Permission.read(Role.user(uid)),
      Permission.update(Role.user(uid)),
      Permission.delete(Role.user(uid)),
    ];
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      data,
      permissions
    );
  }
}
