import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "comments" ADD COLUMN "anchor_x" numeric;
  ALTER TABLE "comments" ADD COLUMN "anchor_y" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "comments" DROP COLUMN "anchor_x";
  ALTER TABLE "comments" DROP COLUMN "anchor_y";`)
}
