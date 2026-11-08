CREATE TABLE "cravings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trigger" text NOT NULL,
	"strength" integer NOT NULL,
	"outcome" text NOT NULL,
	"local_hour" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cravings" ADD CONSTRAINT "cravings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cravings_user_created_idx" ON "cravings" USING btree ("user_id","created_at");