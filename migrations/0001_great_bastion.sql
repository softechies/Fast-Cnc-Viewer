CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_pl" text NOT NULL,
	"name_de" text NOT NULL,
	"name_fr" text NOT NULL,
	"name_cs" text NOT NULL,
	"slug" text NOT NULL,
	"description_en" text,
	"description_pl" text,
	"description_de" text,
	"description_fr" text,
	"description_cs" text,
	"icon" text,
	"color" text DEFAULT '#3B82F6',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "model_descriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"description_en" text,
	"description_pl" text,
	"description_cs" text,
	"description_de" text,
	"description_fr" text,
	"description_es" text,
	"original_language" text NOT NULL,
	"original_description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"filesize" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_thumbnail" boolean DEFAULT false NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"s3_key" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "model_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"share_id" text,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"authenticated" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_pl" text NOT NULL,
	"name_de" text NOT NULL,
	"name_fr" text NOT NULL,
	"name_cs" text NOT NULL,
	"name_es" text NOT NULL,
	"slug" text NOT NULL,
	"category_id" integer,
	"color" text DEFAULT '#6B7280',
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "public_id" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_id" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_password" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_expiry_date" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_delete_token" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_email" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_notification_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "share_last_accessed" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_client" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "model_descriptions" ADD CONSTRAINT "model_descriptions_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_gallery" ADD CONSTRAINT "model_gallery_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_tags" ADD CONSTRAINT "model_tags_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_tags" ADD CONSTRAINT "model_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_views" ADD CONSTRAINT "model_views_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_share_id_unique" UNIQUE("share_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");