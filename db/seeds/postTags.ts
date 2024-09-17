// import { DB, db } from "@/db";
// import { postTags } from "@/db/schema";
// import { PostTagsSchema } from "@/db/schema/postTags";
import { faker } from "@faker-js/faker";
import { DB, db } from "..";
import { postTagsTable } from "../schema";

const mock = async () => {
  const [postsData, tagsData] = await Promise.all([
    db.query.postsTable.findMany(),
    db.query.tagsTable.findMany(),
  ]);

  const randomPosts = faker.helpers.arrayElements(postsData);

  const data = randomPosts.flatMap((post) => {
    const randomTags = faker.helpers.arrayElements(tagsData);
    return randomTags.map((tag) => ({ postId: post.id, tagId: tag.id }));
  });

  return data;
};

export async function seed(db: DB) {
  const insertData = await mock();
  await db.insert(postTagsTable).values(insertData);
}
