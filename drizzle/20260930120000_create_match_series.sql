CREATE TABLE IF NOT EXISTS "match_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"rrule_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "match_series" ADD CONSTRAINT "match_series_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_series_group_id_idx" ON "match_series" USING btree ("group_id");
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_series_id_match_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."match_series"("id") ON DELETE set null ON UPDATE no action;
