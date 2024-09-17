DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('Admin', 'Basic');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "role" DEFAULT 'Basic' NOT NULL;