import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_my_blocks_kind" AS ENUM('block', 'page');
  ALTER TABLE "pages" ADD COLUMN "layout_hide_header" boolean DEFAULT false;
  ALTER TABLE "pages" ADD COLUMN "layout_hide_footer" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_layout_hide_header" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_layout_hide_footer" boolean DEFAULT false;
  ALTER TABLE "my_blocks" ADD COLUMN "kind" "enum_my_blocks_kind" DEFAULT 'block' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "header_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "footer_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_header_id_my_blocks_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."my_blocks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_footer_id_my_blocks_id_fk" FOREIGN KEY ("footer_id") REFERENCES "public"."my_blocks"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_header_idx" ON "site_settings" USING btree ("header_id");
  CREATE INDEX "site_settings_footer_idx" ON "site_settings" USING btree ("footer_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_header_id_my_blocks_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_footer_id_my_blocks_id_fk";
  
  DROP INDEX "site_settings_header_idx";
  DROP INDEX "site_settings_footer_idx";
  ALTER TABLE "pages" DROP COLUMN "layout_hide_header";
  ALTER TABLE "pages" DROP COLUMN "layout_hide_footer";
  ALTER TABLE "_pages_v" DROP COLUMN "version_layout_hide_header";
  ALTER TABLE "_pages_v" DROP COLUMN "version_layout_hide_footer";
  ALTER TABLE "my_blocks" DROP COLUMN "kind";
  ALTER TABLE "site_settings" DROP COLUMN "header_id";
  ALTER TABLE "site_settings" DROP COLUMN "footer_id";
  DROP TYPE "public"."enum_my_blocks_kind";`)
}
