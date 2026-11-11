import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "form_uploads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "themes" ALTER COLUMN "colors_muted" SET DEFAULT '#5b6472';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_uploads_id" integer;
  CREATE INDEX "form_uploads_updated_at_idx" ON "form_uploads" USING btree ("updated_at");
  CREATE INDEX "form_uploads_created_at_idx" ON "form_uploads" USING btree ("created_at");
  CREATE UNIQUE INDEX "form_uploads_filename_idx" ON "form_uploads" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_uploads_fk" FOREIGN KEY ("form_uploads_id") REFERENCES "public"."form_uploads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_form_uploads_id_idx" ON "payload_locked_documents_rels" USING btree ("form_uploads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_uploads" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "form_uploads" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_form_uploads_fk";
  
  DROP INDEX "payload_locked_documents_rels_form_uploads_id_idx";
  ALTER TABLE "themes" ALTER COLUMN "colors_muted" SET DEFAULT '#6b7280';
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_uploads_id";`)
}
