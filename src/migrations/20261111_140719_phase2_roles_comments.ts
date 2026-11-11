import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'viewer');
  CREATE TABLE "comments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_id" integer NOT NULL,
  	"node_id" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"author_id" integer,
  	"resolved" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "comments_id" integer;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "comments_page_idx" ON "comments" USING btree ("page_id");
  CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_id");
  CREATE INDEX "comments_updated_at_idx" ON "comments" USING btree ("updated_at");
  CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk" FOREIGN KEY ("comments_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("comments_id");
  -- DB có sẵn: người dùng đầu tiên thành admin (DB mới: seed xử lý)
  UPDATE "users" SET "role" = 'admin' WHERE "id" = (SELECT MIN("id") FROM "users");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "comments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "comments" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_comments_fk";
  
  DROP INDEX "payload_locked_documents_rels_comments_id_idx";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "comments_id";
  DROP TYPE "public"."enum_users_role";`)
}
