ALTER TABLE "reporting_channels" ADD COLUMN "created_by_org_member_id" uuid;

ALTER TABLE "reporting_channels"
  ADD CONSTRAINT "reporting_channels_created_by_org_member_id_org_members_id_fk"
  FOREIGN KEY ("created_by_org_member_id")
  REFERENCES "public"."org_members"("id")
  ON DELETE set null
  ON UPDATE no action;


