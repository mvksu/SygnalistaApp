ALTER TABLE "reports" RENAME COLUMN "receipt_code" TO "case_id";--> statement-breakpoint
ALTER TABLE "reports" RENAME COLUMN "passphrase_hash" TO "case_key_hash";--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_receipt_code_unique";--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "type" text DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "meta" jsonb;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_case_id_unique" UNIQUE("case_id");