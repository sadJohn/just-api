import { sql, Table } from "drizzle-orm";

import { db, DB } from "./index";
import * as schema from "./schema";
import * as seeds from "./seeds";

async function resetTable(db: DB, table: Table) {
  return db.execute(sql`truncate table ${table} restart identity cascade`);
}

async function main() {
  for (const table of [
    schema.categoriesTable,
    schema.usersTable,
    schema.tagsTable,
    schema.postsTable,
    schema.postTagsTable,
    schema.commentsTable,
  ]) {
    await resetTable(db, table);
  }
  await seeds.category(db);
  await seeds.user(db);
  await seeds.tag(db);
  await seeds.post(db);
  await seeds.postTags(db);
  await seeds.comment(db);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Seeding done!");
    process.exit(0);
  });
