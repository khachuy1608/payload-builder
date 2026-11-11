import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_my_blocks_scope" AS ENUM('private', 'shared');
  CREATE TABLE "my_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"scope" "enum_my_blocks_scope" DEFAULT 'private' NOT NULL,
  	"owner_id" integer,
  	"thumbnail_id" integer,
  	"tree" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "my_blocks_id" integer;
  ALTER TABLE "my_blocks" ADD CONSTRAINT "my_blocks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "my_blocks" ADD CONSTRAINT "my_blocks_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "my_blocks_owner_idx" ON "my_blocks" USING btree ("owner_id");
  CREATE INDEX "my_blocks_thumbnail_idx" ON "my_blocks" USING btree ("thumbnail_id");
  CREATE INDEX "my_blocks_updated_at_idx" ON "my_blocks" USING btree ("updated_at");
  CREATE INDEX "my_blocks_created_at_idx" ON "my_blocks" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_my_blocks_fk" FOREIGN KEY ("my_blocks_id") REFERENCES "public"."my_blocks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_my_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("my_blocks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "my_blocks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "my_blocks" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_my_blocks_fk";
  
  DROP INDEX "payload_locked_documents_rels_my_blocks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "my_blocks_id";
  DROP TYPE "public"."enum_my_blocks_scope";`)
}
