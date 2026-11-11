import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('vi', 'en');
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "my_blocks_locales" (
  	"tree" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_locales" (
  	"name" varchar NOT NULL,
  	"summary" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "testimonials_locales" (
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"quote" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "team_members_locales" (
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_settings_locales" (
  	"site_name" varchar,
  	"site_description" varchar,
  	"maintenance_message" varchar DEFAULT 'Trang web đang được bảo trì, vui lòng quay lại sau.',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "_pages_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_pages_v" ADD COLUMN "published_locale" "enum__pages_v_published_locale";
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "my_blocks_locales" ADD CONSTRAINT "my_blocks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."my_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials_locales" ADD CONSTRAINT "testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_locales" ADD CONSTRAINT "team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "my_blocks_locales_locale_parent_id_unique" ON "my_blocks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "my_blocks_locales_parent_id_idx" ON "my_blocks_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "posts_locales_parent_id_idx" ON "posts_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_locales_parent_id_idx" ON "products_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_locales_parent_id_idx" ON "events_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faqs_locales_parent_id_idx" ON "faqs_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "testimonials_locales_locale_parent_id_unique" ON "testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "testimonials_locales_parent_id_idx" ON "testimonials_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "team_members_locales_locale_parent_id_unique" ON "team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "team_members_locales_parent_id_idx" ON "team_members_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  -- Giữ dữ liệu hiện có: chép các cột localized sang bảng _locales với ngôn ngữ mặc định 'vi'
  INSERT INTO "pages_locales" ("title", "seo_meta_title", "seo_meta_description", "content", "_locale", "_parent_id") SELECT "title", "seo_meta_title", "seo_meta_description", "content", 'vi', "id" FROM "pages";
  INSERT INTO "_pages_v_locales" ("version_title", "version_seo_meta_title", "version_seo_meta_description", "version_content", "_locale", "_parent_id") SELECT "version_title", "version_seo_meta_title", "version_seo_meta_description", "version_content", 'vi', "id" FROM "_pages_v";
  INSERT INTO "my_blocks_locales" ("tree", "_locale", "_parent_id") SELECT "tree", 'vi', "id" FROM "my_blocks";
  INSERT INTO "categories_locales" ("name", "description", "_locale", "_parent_id") SELECT "name", "description", 'vi', "id" FROM "categories";
  INSERT INTO "posts_locales" ("title", "excerpt", "content", "_locale", "_parent_id") SELECT "title", "excerpt", "content", 'vi', "id" FROM "posts";
  INSERT INTO "products_locales" ("name", "summary", "description", "_locale", "_parent_id") SELECT "name", "summary", "description", 'vi', "id" FROM "products";
  INSERT INTO "events_locales" ("title", "summary", "description", "_locale", "_parent_id") SELECT "title", "summary", "description", 'vi', "id" FROM "events";
  INSERT INTO "faqs_locales" ("question", "answer", "_locale", "_parent_id") SELECT "question", "answer", 'vi', "id" FROM "faqs";
  INSERT INTO "testimonials_locales" ("name", "role", "quote", "_locale", "_parent_id") SELECT "name", "role", "quote", 'vi', "id" FROM "testimonials";
  INSERT INTO "team_members_locales" ("role", "bio", "_locale", "_parent_id") SELECT "role", "bio", 'vi', "id" FROM "team_members";
  INSERT INTO "site_settings_locales" ("site_name", "site_description", "maintenance_message", "_locale", "_parent_id") SELECT "site_name", "site_description", "maintenance_message", 'vi', "id" FROM "site_settings";
  ALTER TABLE "pages" DROP COLUMN "title";
  ALTER TABLE "pages" DROP COLUMN "seo_meta_title";
  ALTER TABLE "pages" DROP COLUMN "seo_meta_description";
  ALTER TABLE "pages" DROP COLUMN "content";
  ALTER TABLE "_pages_v" DROP COLUMN "version_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_meta_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_meta_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_content";
  ALTER TABLE "my_blocks" DROP COLUMN "tree";
  ALTER TABLE "categories" DROP COLUMN "name";
  ALTER TABLE "categories" DROP COLUMN "description";
  ALTER TABLE "posts" DROP COLUMN "title";
  ALTER TABLE "posts" DROP COLUMN "excerpt";
  ALTER TABLE "posts" DROP COLUMN "content";
  ALTER TABLE "products" DROP COLUMN "name";
  ALTER TABLE "products" DROP COLUMN "summary";
  ALTER TABLE "products" DROP COLUMN "description";
  ALTER TABLE "events" DROP COLUMN "title";
  ALTER TABLE "events" DROP COLUMN "summary";
  ALTER TABLE "events" DROP COLUMN "description";
  ALTER TABLE "faqs" DROP COLUMN "question";
  ALTER TABLE "faqs" DROP COLUMN "answer";
  ALTER TABLE "testimonials" DROP COLUMN "name";
  ALTER TABLE "testimonials" DROP COLUMN "role";
  ALTER TABLE "testimonials" DROP COLUMN "quote";
  ALTER TABLE "team_members" DROP COLUMN "role";
  ALTER TABLE "team_members" DROP COLUMN "bio";
  ALTER TABLE "site_settings" DROP COLUMN "site_name";
  ALTER TABLE "site_settings" DROP COLUMN "site_description";
  ALTER TABLE "site_settings" DROP COLUMN "maintenance_message";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "my_blocks_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_locales" DISABLE ROW LEVEL SECURITY;
  DROP INDEX "_pages_v_snapshot_idx";
  DROP INDEX "_pages_v_published_locale_idx";
  ALTER TABLE "pages" ADD COLUMN "title" varchar;
  ALTER TABLE "pages" ADD COLUMN "seo_meta_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "seo_meta_description" varchar;
  ALTER TABLE "pages" ADD COLUMN "content" jsonb;
  ALTER TABLE "_pages_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_meta_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_meta_description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_content" jsonb;
  ALTER TABLE "my_blocks" ADD COLUMN "tree" jsonb;
  ALTER TABLE "categories" ADD COLUMN "name" varchar;
  ALTER TABLE "categories" ADD COLUMN "description" varchar;
  ALTER TABLE "posts" ADD COLUMN "title" varchar;
  ALTER TABLE "posts" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "posts" ADD COLUMN "content" jsonb;
  ALTER TABLE "products" ADD COLUMN "name" varchar;
  ALTER TABLE "products" ADD COLUMN "summary" varchar;
  ALTER TABLE "products" ADD COLUMN "description" jsonb;
  ALTER TABLE "events" ADD COLUMN "title" varchar;
  ALTER TABLE "events" ADD COLUMN "summary" varchar;
  ALTER TABLE "events" ADD COLUMN "description" jsonb;
  ALTER TABLE "faqs" ADD COLUMN "question" varchar;
  ALTER TABLE "faqs" ADD COLUMN "answer" jsonb;
  ALTER TABLE "testimonials" ADD COLUMN "name" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "role" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "quote" varchar;
  ALTER TABLE "team_members" ADD COLUMN "role" varchar;
  ALTER TABLE "team_members" ADD COLUMN "bio" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "site_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "site_description" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "maintenance_message" varchar DEFAULT 'Trang web đang được bảo trì, vui lòng quay lại sau.';
  -- Chép dữ liệu ngôn ngữ mặc định 'vi' ngược về cột cũ
  UPDATE "pages" t SET "title" = l."title", "seo_meta_title" = l."seo_meta_title", "seo_meta_description" = l."seo_meta_description", "content" = l."content" FROM "pages_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "_pages_v" t SET "version_title" = l."version_title", "version_seo_meta_title" = l."version_seo_meta_title", "version_seo_meta_description" = l."version_seo_meta_description", "version_content" = l."version_content" FROM "_pages_v_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "my_blocks" t SET "tree" = l."tree" FROM "my_blocks_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "categories" t SET "name" = l."name", "description" = l."description" FROM "categories_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "posts" t SET "title" = l."title", "excerpt" = l."excerpt", "content" = l."content" FROM "posts_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "products" t SET "name" = l."name", "summary" = l."summary", "description" = l."description" FROM "products_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "events" t SET "title" = l."title", "summary" = l."summary", "description" = l."description" FROM "events_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "faqs" t SET "question" = l."question", "answer" = l."answer" FROM "faqs_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "testimonials" t SET "name" = l."name", "role" = l."role", "quote" = l."quote" FROM "testimonials_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "team_members" t SET "role" = l."role", "bio" = l."bio" FROM "team_members_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  UPDATE "site_settings" t SET "site_name" = l."site_name", "site_description" = l."site_description", "maintenance_message" = l."maintenance_message" FROM "site_settings_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'vi';
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "my_blocks_locales" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "testimonials_locales" CASCADE;
  DROP TABLE "team_members_locales" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  ALTER TABLE "_pages_v" DROP COLUMN "snapshot";
  ALTER TABLE "_pages_v" DROP COLUMN "published_locale";
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum__pages_v_published_locale";`)
}
