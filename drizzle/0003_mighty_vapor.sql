CREATE TABLE "buddy_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"buddy_user_id" uuid,
	"code_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "buddy_links_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "buddy_links" ADD CONSTRAINT "buddy_links_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_links" ADD CONSTRAINT "buddy_links_buddy_user_id_users_id_fk" FOREIGN KEY ("buddy_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buddy_links_owner_idx" ON "buddy_links" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "buddy_links_buddy_idx" ON "buddy_links" USING btree ("buddy_user_id");