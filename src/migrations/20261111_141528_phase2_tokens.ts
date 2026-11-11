import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "themes" ADD COLUMN "spacing_xs" varchar DEFAULT '4px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "spacing_sm" varchar DEFAULT '8px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "spacing_md" varchar DEFAULT '16px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "spacing_lg" varchar DEFAULT '24px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "spacing_xl" varchar DEFAULT '40px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "spacing_2xl" varchar DEFAULT '64px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_xs" varchar DEFAULT '12px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_sm" varchar DEFAULT '14px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_base" varchar DEFAULT '16px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_lg" varchar DEFAULT '18px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_xl" varchar DEFAULT '20px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_2xl" varchar DEFAULT '24px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_3xl" varchar DEFAULT '32px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_4xl" varchar DEFAULT '48px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "shadow_sm" varchar DEFAULT '0 1px 2px rgba(0,0,0,.06)' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "shadow_md" varchar DEFAULT '0 4px 12px rgba(0,0,0,.08)' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "shadow_lg" varchar DEFAULT '0 16px 40px rgba(0,0,0,.14)' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "layout_container" varchar DEFAULT '1120px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "layout_narrow" varchar DEFAULT '760px' NOT NULL;
  ALTER TABLE "themes" ADD COLUMN "text_styles" jsonb DEFAULT '[{"name":"display","label":"Display","fontFamily":"var(--font-heading)","fontSize":"var(--text-4xl)","fontWeight":"800","lineHeight":"1.1","letterSpacing":"-0.02em"},{"name":"h1","label":"Tiêu đề 1","fontFamily":"var(--font-heading)","fontSize":"var(--text-3xl)","fontWeight":"700","lineHeight":"1.2"},{"name":"h2","label":"Tiêu đề 2","fontFamily":"var(--font-heading)","fontSize":"var(--text-2xl)","fontWeight":"700","lineHeight":"1.25"},{"name":"h3","label":"Tiêu đề 3","fontFamily":"var(--font-heading)","fontSize":"var(--text-xl)","fontWeight":"600","lineHeight":"1.3"},{"name":"lead","label":"Mở đầu","fontSize":"var(--text-lg)","fontWeight":"400","lineHeight":"1.6","color":"var(--color-muted)"},{"name":"body","label":"Nội dung","fontSize":"var(--text-base)","fontWeight":"400","lineHeight":"1.6"},{"name":"small","label":"Nhỏ","fontSize":"var(--text-sm)","fontWeight":"400","lineHeight":"1.5","color":"var(--color-muted)"},{"name":"caption","label":"Chú thích","fontSize":"var(--text-xs)","fontWeight":"500","lineHeight":"1.4","letterSpacing":"0.04em","textTransform":"uppercase","color":"var(--color-muted)"}]'::jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "themes" DROP COLUMN "spacing_xs";
  ALTER TABLE "themes" DROP COLUMN "spacing_sm";
  ALTER TABLE "themes" DROP COLUMN "spacing_md";
  ALTER TABLE "themes" DROP COLUMN "spacing_lg";
  ALTER TABLE "themes" DROP COLUMN "spacing_xl";
  ALTER TABLE "themes" DROP COLUMN "spacing_2xl";
  ALTER TABLE "themes" DROP COLUMN "text_xs";
  ALTER TABLE "themes" DROP COLUMN "text_sm";
  ALTER TABLE "themes" DROP COLUMN "text_base";
  ALTER TABLE "themes" DROP COLUMN "text_lg";
  ALTER TABLE "themes" DROP COLUMN "text_xl";
  ALTER TABLE "themes" DROP COLUMN "text_2xl";
  ALTER TABLE "themes" DROP COLUMN "text_3xl";
  ALTER TABLE "themes" DROP COLUMN "text_4xl";
  ALTER TABLE "themes" DROP COLUMN "shadow_sm";
  ALTER TABLE "themes" DROP COLUMN "shadow_md";
  ALTER TABLE "themes" DROP COLUMN "shadow_lg";
  ALTER TABLE "themes" DROP COLUMN "layout_container";
  ALTER TABLE "themes" DROP COLUMN "layout_narrow";
  ALTER TABLE "themes" DROP COLUMN "text_styles";`)
}
