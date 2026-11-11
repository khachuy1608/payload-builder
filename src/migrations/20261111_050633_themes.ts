import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_themes_button_weight" AS ENUM('400', '500', '600', '700', '800');
  CREATE TYPE "public"."enum_themes_button_transform" AS ENUM('none', 'uppercase', 'capitalize');
  CREATE TABLE "themes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"is_preset" boolean DEFAULT false,
  	"owner_id" integer,
  	"colors_primary" varchar DEFAULT '#4f46e5' NOT NULL,
  	"colors_secondary" varchar DEFAULT '#0f172a' NOT NULL,
  	"colors_accent" varchar DEFAULT '#f59e0b' NOT NULL,
  	"colors_text" varchar DEFAULT '#1f2937' NOT NULL,
  	"colors_muted" varchar DEFAULT '#6b7280' NOT NULL,
  	"colors_background" varchar DEFAULT '#ffffff' NOT NULL,
  	"colors_surface" varchar DEFAULT '#f3f4f6' NOT NULL,
  	"colors_border" varchar DEFAULT '#e5e7eb' NOT NULL,
  	"fonts_heading" varchar DEFAULT 'ui-sans-serif, system-ui, -apple-system, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif' NOT NULL,
  	"fonts_body" varchar DEFAULT 'ui-sans-serif, system-ui, -apple-system, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif' NOT NULL,
  	"fonts_mono" varchar DEFAULT 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' NOT NULL,
  	"font_url" varchar,
  	"radius_sm" varchar DEFAULT '4px' NOT NULL,
  	"radius_md" varchar DEFAULT '8px' NOT NULL,
  	"radius_lg" varchar DEFAULT '16px' NOT NULL,
  	"button_radius" varchar DEFAULT '8px' NOT NULL,
  	"button_weight" "enum_themes_button_weight" DEFAULT '600' NOT NULL,
  	"button_transform" "enum_themes_button_transform" DEFAULT 'none' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages" ADD COLUMN "theme_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_theme_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "themes_id" integer;
  ALTER TABLE "themes" ADD CONSTRAINT "themes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "themes_owner_idx" ON "themes" USING btree ("owner_id");
  CREATE INDEX "themes_updated_at_idx" ON "themes" USING btree ("updated_at");
  CREATE INDEX "themes_created_at_idx" ON "themes" USING btree ("created_at");
  CREATE INDEX "site_settings_theme_idx" ON "site_settings" USING btree ("theme_id");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_theme_id_themes_id_fk" FOREIGN KEY ("version_theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_themes_fk" FOREIGN KEY ("themes_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_theme_idx" ON "pages" USING btree ("theme_id");
  CREATE INDEX "_pages_v_version_version_theme_idx" ON "_pages_v" USING btree ("version_theme_id");
  CREATE INDEX "payload_locked_documents_rels_themes_id_idx" ON "payload_locked_documents_rels" USING btree ("themes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "themes" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_theme_id_themes_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_theme_id_themes_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_themes_fk";
  
  DROP INDEX "pages_theme_idx";
  DROP INDEX "_pages_v_version_version_theme_idx";
  DROP INDEX "payload_locked_documents_rels_themes_id_idx";
  ALTER TABLE "pages" DROP COLUMN "theme_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_theme_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "themes_id";
  DROP TYPE "public"."enum_themes_button_weight";
  DROP TYPE "public"."enum_themes_button_transform";`)
}
