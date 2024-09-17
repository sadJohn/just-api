// import { db, DB } from "@/db";
// import { comment } from "@/db/schema";
// import { CommentSchema } from "@/db/schema/comment";
import { faker } from "@faker-js/faker";
import { commentsTable } from "../schema";
import { DB, db } from "..";

const parentCommentsMock = async () => {
  const [postsData, usersData] = await Promise.all([
    db.query.postsTable.findMany(),
    db.query.usersTable.findMany(),
  ]);

  const randomPosts = faker.helpers.arrayElements(postsData);

  const data = randomPosts.map((post) => ({
    content: faker.lorem.sentence({ min: 1, max: 20 }),
    postId: post.id,
    userId: faker.helpers.arrayElement(usersData).id,
  }));

  return data;
};

const childCommentsMock = async () => {
  const [commentsData, usersData] = await Promise.all([
    db.query.commentsTable.findMany(),
    db.query.usersTable.findMany(),
  ]);

  const randomComments = faker.helpers.arrayElements(commentsData);

  const data = randomComments.map((comment) => ({
    content: faker.lorem.sentence({ min: 1, max: 20 }),
    postId: comment.postId,
    userId: faker.helpers.arrayElement(usersData).id,
    parentId: comment.id,
  }));
  return data;
};

export async function seed(db: DB) {
  const parentCommentsData = await parentCommentsMock();
  await db.insert(commentsTable).values(parentCommentsData);

  const childCommentsData = await childCommentsMock();
  await db.insert(commentsTable).values(childCommentsData);
}
