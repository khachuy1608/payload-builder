import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_style_presets_scope" AS ENUM('private', 'shared');
  CREATE TABLE "style_presets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"block_type" varchar NOT NULL,
  	"scope" "enum_style_presets_scope" DEFAULT 'private' NOT NULL,
  	"owner_id" integer,
  	"props" jsonb,
  	"styles" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "style_presets_id" integer;
  ALTER TABLE "style_presets" ADD CONSTRAINT "style_presets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "style_presets_block_type_idx" ON "style_presets" USING btree ("block_type");
  CREATE INDEX "style_presets_owner_idx" ON "style_presets" USING btree ("owner_id");
  CREATE INDEX "style_presets_updated_at_idx" ON "style_presets" USING btree ("updated_at");
  CREATE INDEX "style_presets_created_at_idx" ON "style_presets" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_style_presets_fk" FOREIGN KEY ("style_presets_id") REFERENCES "public"."style_presets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_style_presets_id_idx" ON "payload_locked_documents_rels" USING btree ("style_presets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "style_presets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "style_presets" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_style_presets_fk";
  
  DROP INDEX "payload_locked_documents_rels_style_presets_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "style_presets_id";
  DROP TYPE "public"."enum_style_presets_scope";`)
}
