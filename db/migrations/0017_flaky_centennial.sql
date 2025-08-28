ALTER TABLE "reports" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'NEW'::text;--> statement-breakpoint
DROP TYPE "public"."report_status";--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('NEW', 'OPEN', 'CLOSED');--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'NEW'::"public"."report_status";--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DATA TYPE "public"."report_status" USING "status"::"public"."report_status";