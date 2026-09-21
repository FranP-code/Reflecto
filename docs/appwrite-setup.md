# Appwrite setup for tldraw persistence

This app stores each space's tldraw document snapshot in Appwrite Databases.

## 1) Create resources in Appwrite Console

- Create a Database (e.g. Reflecto)
- Create a Collection (e.g. SpaceSnapshots)
- Add attributes:
  - `spaceId` (string, size 64)
  - `userId` (string, size 64)
  - `snapshot` (string, size 32767) — contains a JSON string with `{ document }`
  - `title` (string, size 64) — optional display name
  - `color` (string, size 7-9) — hex color like `#3b82f6`
- Indexes:
  - Composite index on `spaceId` and `userId` for fast lookups
- Permissions (default):
  - Disable All / Any roles
  - Documents are created with permissions for the owner only (read/update/delete). See code in `apps/web/src/lib/appwrite-db.ts`.

## 2) Configure the web app

Copy `.env.example` to `.env` inside `apps/web/` and fill the values:

- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DB_ID`
- `VITE_APPWRITE_COLLECTION_ID`

## 3) How persistence works

- On `/space?id=<SPACE_ID>`, the app loads the latest snapshot for the current user and that space, then initializes the tldraw store.
- As you edit, changes are debounced (~1.2s) and the current `document` snapshot is upserted to Appwrite.
- Only the `document` is shared; user-specific `session` state is not persisted.

## 4) Notes and next steps

- If documents become large, consider storing snapshots in Appwrite Storage and saving a reference in the collection document.
- To support version history, change the upsert to `createDocument` always and query the latest by `$createdAt`.
- For collaboration, you would stream incremental updates and merge via `editor.store.mergeRemoteChanges`.

## 5) Creating spaces

From the Dashboard, the "New Space" dialog creates a document in the same collection with fields:

- `spaceId`, `userId`, `snapshot` (minimal empty document)
- Optional `title` and `color` from the form

Make sure the collection includes the `title` and `color` attributes as above.
