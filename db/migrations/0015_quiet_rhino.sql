ALTER TABLE "organizations" ADD COLUMN "clerk_org_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "ack_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id");