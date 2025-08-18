-- Rename receipt_code -> case_id and passphrase_hash -> case_key_hash
ALTER TABLE "reports" RENAME COLUMN "receipt_code" TO "case_id";
ALTER TABLE "reports" RENAME COLUMN "passphrase_hash" TO "case_key_hash";

-- Recreate unique index if named (Postgres auto index for unique column keeps working on rename)
-- If your earlier migrations created an explicit index name, ensure it's updated accordingly.




