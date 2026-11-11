import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "template_collection" varchar;
  ALTER TABLE "pages" ADD COLUMN "template_field" varchar DEFAULT 'id';
  ALTER TABLE "_pages_v" ADD COLUMN "version_template_collection" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_template_field" varchar DEFAULT 'id';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "template_collection";
  ALTER TABLE "pages" DROP COLUMN "template_field";
  ALTER TABLE "_pages_v" DROP COLUMN "version_template_collection";
  ALTER TABLE "_pages_v" DROP COLUMN "version_template_field";`)
}
