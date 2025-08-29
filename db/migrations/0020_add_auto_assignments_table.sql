CREATE TABLE "reporting_channel_auto_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"org_member_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "reporting_channels_org_type_idx";--> statement-breakpoint
ALTER TABLE "reporting_channel_auto_assignments" ADD CONSTRAINT "reporting_channel_auto_assignments_channel_id_reporting_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."reporting_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_channel_auto_assignments" ADD CONSTRAINT "reporting_channel_auto_assignments_org_member_id_org_members_id_fk" FOREIGN KEY ("org_member_id") REFERENCES "public"."org_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reporting_channel_auto_assignments_channel_member_idx" ON "reporting_channel_auto_assignments" USING btree ("channel_id","org_member_id");--> statement-breakpoint
ALTER TABLE "survey_questions" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "survey_questions" DROP COLUMN "config";--> statement-breakpoint
ALTER TABLE "surveys" DROP COLUMN "meta";