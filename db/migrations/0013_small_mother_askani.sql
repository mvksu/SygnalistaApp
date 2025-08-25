ALTER TYPE "public"."report_status" ADD VALUE 'RESOLVED';--> statement-breakpoint
ALTER TYPE "public"."report_status" ADD VALUE 'NEW';--> statement-breakpoint
ALTER TYPE "public"."report_status" ADD VALUE 'ACTIVE';--> statement-breakpoint
CREATE TABLE "report_assignees" (
	"report_id" uuid NOT NULL,
	"org_member_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by_org_member_id" uuid,
	CONSTRAINT "report_assignees_report_id_org_member_id_pk" PRIMARY KEY("report_id","org_member_id")
);
--> statement-breakpoint
CREATE TABLE "report_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"org_member_id" uuid,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_assignees" ADD CONSTRAINT "report_assignees_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_assignees" ADD CONSTRAINT "report_assignees_org_member_id_org_members_id_fk" FOREIGN KEY ("org_member_id") REFERENCES "public"."org_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_assignees" ADD CONSTRAINT "report_assignees_added_by_org_member_id_org_members_id_fk" FOREIGN KEY ("added_by_org_member_id") REFERENCES "public"."org_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_logs" ADD CONSTRAINT "report_logs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_logs" ADD CONSTRAINT "report_logs_org_member_id_org_members_id_fk" FOREIGN KEY ("org_member_id") REFERENCES "public"."org_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_assignees_report_idx" ON "report_assignees" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_assignees_member_idx" ON "report_assignees" USING btree ("org_member_id");--> statement-breakpoint
CREATE INDEX "report_logs_report_time_idx" ON "report_logs" USING btree ("report_id","created_at");