ALTER TABLE "reports" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "assignee_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;