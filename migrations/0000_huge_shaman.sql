CREATE TABLE "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"filename" text NOT NULL,
	"filesize" integer NOT NULL,
	"format" text,
	"created" text NOT NULL,
	"source_system" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;