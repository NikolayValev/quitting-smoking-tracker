-- Adds the day a check-in is about, and makes it one per person per day.
--
-- Written by hand rather than left as generated. The generated version was a
-- single `ADD COLUMN ... NOT NULL`, which fails outright on a table that
-- already has rows, and a unique index that fails if any day was logged twice —
-- which the old UI allowed, since it only ever wrote "today" and never checked
-- whether today was already there.

ALTER TABLE "smoke_logs" ADD COLUMN "log_date" date;--> statement-breakpoint

-- Existing rows predate the column, so UTC is the only day they can be given.
-- Going forward the client sends its own local date.
UPDATE "smoke_logs" SET "log_date" = ("ts" AT TIME ZONE 'UTC')::date WHERE "log_date" IS NULL;--> statement-breakpoint

-- DESTRUCTIVE, deliberately: reconciles old data to the new one-per-day model
-- by keeping the most recent check-in for each day and dropping the earlier
-- ones. That is the same resolution the application now applies when you log a
-- day twice — the later entry replaces the earlier — so this is the existing
-- rule applied backwards. Any note on a superseded duplicate goes with it.
DELETE FROM "smoke_logs" a
USING "smoke_logs" b
WHERE a."user_id" = b."user_id"
  AND a."log_date" = b."log_date"
  AND (a."ts" < b."ts" OR (a."ts" = b."ts" AND a."id" < b."id"));--> statement-breakpoint

ALTER TABLE "smoke_logs" ALTER COLUMN "log_date" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "smoke_logs_user_day_idx" ON "smoke_logs" USING btree ("user_id","log_date");
