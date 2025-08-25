ALTER TABLE "organizations" ADD COLUMN "ack_days" integer NOT NULL DEFAULT 7;
ALTER TABLE "organizations" ADD COLUMN "feedback_months" integer NOT NULL DEFAULT 3;

