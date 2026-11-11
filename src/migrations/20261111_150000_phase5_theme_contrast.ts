import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Màu chữ mờ của theme preset đậm hơn để đạt tương phản WCAG AA (≥ 4.5:1) trên nền và nền phụ */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "themes" SET "colors_muted" = '#5b6472' WHERE "is_preset" = true AND "colors_muted" = '#6b7280';
   UPDATE "themes" SET "colors_muted" = '#526275' WHERE "is_preset" = true AND "colors_muted" = '#64748b';
   UPDATE "themes" SET "colors_muted" = '#6b625b' WHERE "is_preset" = true AND "colors_muted" = '#78716c';
   UPDATE "themes" SET "colors_muted" = '#616161' WHERE "is_preset" = true AND "colors_muted" = '#737373';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "themes" SET "colors_muted" = '#6b7280' WHERE "is_preset" = true AND "colors_muted" = '#5b6472';
   UPDATE "themes" SET "colors_muted" = '#64748b' WHERE "is_preset" = true AND "colors_muted" = '#526275';
   UPDATE "themes" SET "colors_muted" = '#78716c' WHERE "is_preset" = true AND "colors_muted" = '#6b625b';
   UPDATE "themes" SET "colors_muted" = '#737373' WHERE "is_preset" = true AND "colors_muted" = '#616161';`)
}
