CREATE TABLE "message_deletions" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"deleted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_deletions_unique" UNIQUE("message_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "message_deletions" ADD CONSTRAINT "message_deletions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deletions" ADD CONSTRAINT "message_deletions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_deletions_user_message_idx" ON "message_deletions" USING btree ("user_id","message_id");