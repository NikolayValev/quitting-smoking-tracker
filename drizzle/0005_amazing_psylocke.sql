ALTER TABLE "users" ADD COLUMN "baseline_per_day" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "price_per_pack" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cigarettes_per_pack" integer DEFAULT 20;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "currency" text;