CREATE TYPE "public"."av_status" AS ENUM('PENDING', 'CLEAN', 'INFECTED', 'QUARANTINED');--> statement-breakpoint
CREATE TYPE "public"."message_sender" AS ENUM('REPORTER', 'HANDLER');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'FEEDBACK_GIVEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."reporter_mode" AS ENUM('ANON', 'IDENTIFIED');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"message_id" uuid,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"size" integer NOT NULL,
	"content_hash" text NOT NULL,
	"av_status" "av_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"sender" "message_sender" NOT NULL,
	"body_encrypted" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"status" "report_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	"feedback_due_at" timestamp,
	"reporter_mode" "reporter_mode" DEFAULT 'ANON' NOT NULL,
	"reporter_contact_encrypted" text,
	"receipt_code" text NOT NULL,
	"passphrase_hash" text NOT NULL,
	CONSTRAINT "reports_receipt_code_unique" UNIQUE("receipt_code")
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_report_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."report_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_categories" ADD CONSTRAINT "report_categories_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_report_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."report_categories"("id") ON DELETE restrict ON UPDATE no action;