CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"parent_id" text NOT NULL,
	"parent_type" text NOT NULL,
	"is_thumbnail" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "project_font" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"client_id" text NOT NULL,
	"source" text NOT NULL,
	"family" text NOT NULL,
	"css_family" text,
	"role" text,
	"order" integer DEFAULT 0 NOT NULL,
	"category" text,
	"variants" jsonb,
	"subsets" jsonb,
	"axes" jsonb,
	"version" text,
	"last_modified" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_font_face" (
	"id" text PRIMARY KEY NOT NULL,
	"project_font_id" text NOT NULL,
	"file_id" text,
	"client_id" text NOT NULL,
	"file_key" text,
	"file_url" text,
	"file_name" text NOT NULL,
	"size" integer NOT NULL,
	"size_label" text NOT NULL,
	"format" text NOT NULL,
	"kind" text NOT NULL,
	"weight" integer NOT NULL,
	"weight_range" jsonb,
	"axes" jsonb,
	"style" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_font" ADD CONSTRAINT "project_font_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_font_face" ADD CONSTRAINT "project_font_face_project_font_id_project_font_id_fk" FOREIGN KEY ("project_font_id") REFERENCES "public"."project_font"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_font_face" ADD CONSTRAINT "project_font_face_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "file_owner_id_idx" ON "file" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "file_parent_idx" ON "file" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "project_font_project_id_idx" ON "project_font" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_font_project_order_idx" ON "project_font" USING btree ("project_id","order");--> statement-breakpoint
CREATE INDEX "project_font_face_project_font_id_idx" ON "project_font_face" USING btree ("project_font_id");--> statement-breakpoint
CREATE INDEX "project_font_face_file_id_idx" ON "project_font_face" USING btree ("file_id");