CREATE TABLE "buddy_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buddy_links" ADD COLUMN "role" text DEFAULT 'buddy' NOT NULL;--> statement-breakpoint
ALTER TABLE "buddy_signals" ADD CONSTRAINT "buddy_signals_link_id_buddy_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."buddy_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_signals" ADD CONSTRAINT "buddy_signals_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buddy_signals_link_created_idx" ON "buddy_signals" USING btree ("link_id","created_at");