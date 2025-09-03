-- Drop the foreign key constraints first
ALTER TABLE "account" DROP CONSTRAINT "account_user_id_user_id_fk";
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";

-- Drop the tables
DROP TABLE IF EXISTS "verification";
DROP TABLE IF EXISTS "account";
DROP TABLE IF EXISTS "session";
DROP TABLE IF EXISTS "user";
