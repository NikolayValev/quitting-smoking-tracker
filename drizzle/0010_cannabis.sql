ALTER TABLE "smoke_logs" ALTER COLUMN "cigarettes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cravings" ADD COLUMN "substance" text DEFAULT 'cigarettes' NOT NULL;--> statement-breakpoint
ALTER TABLE "smoke_logs" ADD COLUMN "sessions" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quitting" text DEFAULT 'cigarettes' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sessions_per_day" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "price_per_session" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "smoke_logs" ADD CONSTRAINT "smoke_logs_has_count" CHECK ("smoke_logs"."cigarettes" IS NOT NULL OR "smoke_logs"."sessions" IS NOT NULL);