ALTER TABLE "messages" ADD COLUMN "type" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "audio_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "audio_duration" integer;