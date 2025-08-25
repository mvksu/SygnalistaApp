CREATE TABLE "organization_subscriptions" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"membership" "membership" DEFAULT 'pro' NOT NULL,
	"stripe_organization_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "organization_subscriptions_stripe_organization_id_unique" UNIQUE("stripe_organization_id"),
	CONSTRAINT "organization_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_assignee_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "ack_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "feedback_months" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "anonymous_allowed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "assignee_id";